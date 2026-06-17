'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';

export default function ProfilePage() {
  const user = useQuery(api.users.currentUser);
  const isStaffOrAdmin = user?.role === 'admin' || user?.isRestaurantMember;

  if (user === undefined) {
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <ProfileHeader user={user} />
      {isStaffOrAdmin ? <OwnerProfile /> : <DinerProfile />}
    </PageWrapper>
  );
}

function ProfileHeader({ user }: { user: { name?: string; email?: string; avatarUrl?: string | null } | null }) {
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateProfileImageUploadUrl);
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateProfile({ profileImageStorageId: storageId as Id<'_storage'> });
    } finally {
      setUploading(false);
    }
  };

  return (
    <header className="flex items-center gap-6">
      <div className="relative group">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.name ?? 'Perfil'} className="size-20 rounded-full object-cover" />
        ) : (
          <div className="size-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold text-muted-foreground">
            {(user?.name ?? user?.email ?? '?')[0]?.toUpperCase()}
          </div>
        )}
        <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
          <Camera className="size-5 text-white" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
        </label>
      </div>
      <div>
        <h1 className="text-3xl font-semibold">{user?.name ?? 'Usuario'}</h1>
        <p className="text-muted-foreground text-sm">{user?.email}</p>
      </div>
    </header>
  );
}

function OwnerProfile() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    await updateProfile({ name: name.trim() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-sm">
        <Label htmlFor="profile-name" className="mb-2 text-xs text-muted-foreground">
          Nombre visible
        </Label>
        <div className="flex gap-2">
          <Input
            id="profile-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DinerProfile() {
  const recommendations = useQuery(api.recommendationsClient.listMyRecommendations);

  return (
    <>
      <nav className="flex gap-3">
        <Link
          href="/preferences"
          className="border border-border rounded-lg p-4 bg-surface hover:bg-surface-hover transition-colors flex-1"
        >
          <h2 className="font-medium mb-1">Preferencias</h2>
          <p className="text-sm text-muted-foreground">Edita tu perfil de sabor y preferencias dietéticas</p>
        </Link>
      </nav>

      <section>
        <h2 className="text-xl font-semibold mb-4">Mis maridajes</h2>

        {recommendations === undefined && (
          <CardListSkeleton count={2} />
        )}

        {recommendations !== undefined && recommendations.length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <p className="text-muted-foreground mb-4">
              Aún no has creado ningún maridaje.
            </p>
            <Link href="/" className="text-accent hover:text-accent-hover transition-colors text-sm">
              Ver la carta
            </Link>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <ul className="flex flex-col gap-4">
            {recommendations.map((rec) => (
              <li
                key={rec._id}
                className="border border-border rounded-lg p-4 bg-surface"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">
                    {rec.restaurantSlug ? (
                      <Link
                        href={`/restaurant/${rec.restaurantSlug}`}
                        className="text-accent hover:text-accent-hover transition-colors"
                      >
                        {rec.restaurantName}
                      </Link>
                    ) : (
                      rec.restaurantName
                    )}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(rec._creationTime).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <ol className="list-decimal list-inside flex flex-col gap-1">
                  {rec.items.map((item, i) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium">{item.name}</span>{' '}
                      <span className="text-muted-foreground">({item.matchPercentage}% de coincidencia)</span>
                      {item.reason && (
                        <p className="text-xs text-muted-foreground ml-6 mt-0.5">{item.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
