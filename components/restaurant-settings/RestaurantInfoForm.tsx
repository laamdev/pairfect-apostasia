'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export const RestaurantInfoForm = ({
  restaurantId,
  restaurant,
}: {
  restaurantId: Id<'restaurants'>;
  restaurant: { name: string; description?: string; logoUrl?: string | null };
}) => {
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const updateRestaurant = useMutation(api.restaurants.updateRestaurant);
  const generateUploadUrl = useMutation(api.restaurants.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logoUrl ?? null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await updateRestaurant({ restaurantId, name: name.trim(), description: description.trim() || undefined });
      setMessage('Saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const uploadUrl = await generateUploadUrl({ restaurantId });
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateRestaurant({ restaurantId, logoStorageId: storageId });
      setLogoPreview(URL.createObjectURL(file));
      setMessage('Logo updated.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-5 bg-surface flex flex-col gap-5">
      <h2 className="text-lg font-medium">Info</h2>
      <div className="flex items-start gap-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative shrink-0 w-24 h-24 rounded-lg border border-dashed border-border bg-surface hover:bg-surface-hover transition-colors flex items-center justify-center overflow-hidden group"
        >
          {logoPreview ? (
            <>
              <Image src={logoPreview} alt="Restaurant logo" fill className="object-cover" sizes="96px" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white">{uploading ? 'Uploading...' : 'Change'}</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-muted-foreground text-center px-1">
              {uploading ? 'Uploading...' : 'Add logo'}
            </span>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        <div className="flex flex-col gap-3 flex-1">
          <div>
            <Label htmlFor="restaurant-name" className="mb-1">Name</Label>
            <Input
              id="restaurant-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="restaurant-description" className="mb-1">Description</Label>
            <Textarea
              id="restaurant-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </form>
  );
};
