'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AddMemberForm({ restaurantId }: { restaurantId: Id<'restaurants'> }) {
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const addMember = useMutation(api.restaurantMembers.addMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await addMember({ restaurantId, email: email.trim() });
      setEmail('');
      setMessage(result === 'invited' ? 'Invitation sent. They will be added when they sign up.' : 'Member added.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-5 bg-surface flex flex-wrap items-end gap-3">
      <div>
        <Label htmlFor="member-email" className="mb-1">Add staff member (email)</Label>
        <Input
          id="member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@email.com"
          required
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'Adding...' : 'Add'}
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </form>
  );
}
