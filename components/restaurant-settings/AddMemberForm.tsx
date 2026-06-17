'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roleLabel, type MembershipRole } from '@/lib/roles';

export function AddMemberForm({ restaurantId }: { restaurantId: Id<'restaurants'> }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MembershipRole>('staff');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const addMember = useMutation(api.restaurantMembers.addMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await addMember({ restaurantId, email: email.trim(), role });
      setEmail('');
      setMessage(
        result === 'invited'
          ? 'Invitación enviada. Se incorporará cuando cree su cuenta.'
          : 'Empleado añadido.',
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo añadir al empleado');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-6 bg-surface flex flex-wrap items-end gap-4">
      <div>
        <Label htmlFor="member-email" className="mb-2">Añadir empleado (correo)</Label>
        <Input
          id="member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="empleado@correo.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="member-role" className="mb-2">Rol</Label>
        <Select
          items={{ owner: roleLabel('owner'), staff: roleLabel('staff') }}
          value={role}
          onValueChange={(val) => setRole(val as MembershipRole)}
        >
          <SelectTrigger id="member-role" className="min-w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="staff">{roleLabel('staff')} (solo ver)</SelectItem>
            <SelectItem value="owner">{roleLabel('owner')} (edita)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? 'Añadiendo…' : 'Añadir'}
      </Button>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </form>
  );
}
