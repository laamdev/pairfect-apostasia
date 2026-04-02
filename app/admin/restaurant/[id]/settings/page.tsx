'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { useState } from 'react';

export default function RestaurantSettingsPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const members = useQuery(api.restaurantMembers.listMembers, { restaurantId });
  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (restaurants === undefined) return <main className="p-8 max-w-3xl mx-auto"><p className="text-muted">Loading...</p></main>;

  if (!restaurant) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p>Restaurant not found or you don't have access.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-accent">Back to dashboard</Link>
      </main>
    );
  }

  const canManage = restaurant.role === 'owner' || restaurant.role === 'admin';

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <Link href={`/admin/restaurant/${restaurantId}`} className="text-sm text-muted hover:text-foreground transition-colors">
          Back to {restaurant.name}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      {canManage && <RestaurantInfoForm restaurantId={restaurantId} restaurant={restaurant} />}
      <section>
        <h2 className="text-lg font-medium mb-4">Team</h2>
        {members === undefined && <p className="text-muted text-sm">Loading members...</p>}
        {members && members.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {members.map((m: { _id: Id<'restaurantMembers'>; userId: Id<'users'>; role: string; email: string | null; name: string | null }) => (
              <MemberRow key={m._id} member={m} canManage={canManage} />
            ))}
          </ul>
        )}
        {canManage && <AddMemberForm restaurantId={restaurantId} />}
      </section>
    </main>
  );
}

function RestaurantInfoForm({ restaurantId, restaurant }: { restaurantId: Id<'restaurants'>; restaurant: { name: string; description?: string } }) {
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const updateRestaurant = useMutation(api.restaurants.updateRestaurant);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setMessage(null);
    try { await updateRestaurant({ restaurantId, name: name.trim(), description: description.trim() || undefined }); setMessage('Saved.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Info</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none" rows={3} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || !name.trim()} className="bg-accent text-background px-4 py-2 rounded-md text-sm disabled:opacity-50 hover:bg-accent-hover transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
        {message && <span className="text-sm text-muted">{message}</span>}
      </div>
    </form>
  );
}

function MemberRow({ member, canManage }: { member: { _id: Id<'restaurantMembers'>; role: string; email: string | null; name: string | null }; canManage: boolean }) {
  const removeMember = useMutation(api.restaurantMembers.removeMember);
  const [removing, setRemoving] = useState(false);

  return (
    <li className="flex items-center justify-between border border-border rounded-lg p-3 bg-surface">
      <div>
        <span className="text-sm font-medium">{member.email ?? member.name ?? 'Unknown'}</span>
        <span className="ml-2 text-xs bg-surface-hover px-2 py-0.5 rounded text-muted">{member.role}</span>
      </div>
      {canManage && member.role !== 'owner' && (
        <button type="button" disabled={removing} onClick={async () => { if (!confirm('Remove this member?')) return; setRemoving(true); await removeMember({ membershipId: member._id }); }} className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
          Remove
        </button>
      )}
    </li>
  );
}

function AddMemberForm({ restaurantId }: { restaurantId: Id<'restaurants'> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'editor'>('editor');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const addMember = useMutation(api.restaurantMembers.addMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true); setMessage(null);
    try { await addMember({ restaurantId, email: email.trim(), role }); setEmail(''); setMessage('Member added.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Failed to add member'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-sm font-medium mb-1">Add member (email)</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@email.com" className="border border-border rounded px-3 py-2 bg-surface text-foreground text-sm focus:border-accent outline-none" required />
      </div>
      <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'editor')} className="border border-border rounded px-3 py-2 bg-surface text-foreground text-sm">
        <option value="editor">Editor</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit" disabled={saving} className="bg-accent text-background px-4 py-2 rounded-md text-sm disabled:opacity-50 hover:bg-accent-hover transition-colors">
        {saving ? 'Adding...' : 'Add'}
      </button>
      {message && <span className="text-sm text-muted">{message}</span>}
    </form>
  );
}
