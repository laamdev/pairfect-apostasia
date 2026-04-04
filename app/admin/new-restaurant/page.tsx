'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewRestaurantPage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRestaurant = useMutation(api.restaurants.createRestaurant);
  const router = useRouter();

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(
      value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const id = await createRestaurant({ name: name.trim(), slug: slug.trim(), description: description.trim() || undefined });
      router.push(`/admin/restaurant/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create restaurant');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="p-8 max-w-xl mx-auto flex flex-col gap-6">
      <div>
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">New Restaurant</h1>

      <form onSubmit={handleSubmit} className="border border-border rounded-lg p-5 bg-surface flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full border border-border rounded px-3 py-2 bg-surface text-foreground font-mono text-sm focus:border-accent outline-none" required />
          <p className="text-xs text-muted-foreground mt-1">Used in the URL: /restaurant/{slug || '...'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none" rows={3} />
        </div>
        <button type="submit" disabled={saving || !name.trim() || !slug.trim()} className="bg-accent text-background px-4 py-2 rounded-md font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors">
          {saving ? 'Creating...' : 'Create restaurant'}
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
    </main>
  );
}
