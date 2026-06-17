'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { roleLabel, type MembershipRole } from '@/lib/roles';

export function MemberRow({
  member,
  canManage,
}: {
  member: { _id: Id<'restaurantMembers'>; role: string; email: string | null; name: string | null };
  canManage: boolean;
}) {
  const removeMember = useMutation(api.restaurantMembers.removeMember);
  const updateMemberRole = useMutation(api.restaurantMembers.updateMemberRole);
  const [removing, setRemoving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = async (role: MembershipRole) => {
    if (role === member.role) return;
    setUpdating(true);
    setError(null);
    try {
      await updateMemberRole({ membershipId: member._id, role });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el rol');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <li className="flex items-center justify-between border border-border rounded-lg p-3 bg-surface gap-3">
      <div className="min-w-0">
        <span className="text-sm font-medium">{member.email ?? member.name ?? 'Desconocido'}</span>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {canManage ? (
          <Select
            items={{ owner: roleLabel('owner'), staff: roleLabel('staff') }}
            value={member.role}
            onValueChange={(val) => handleRoleChange(val as MembershipRole)}
            disabled={updating}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">{roleLabel('owner')}</SelectItem>
              <SelectItem value="staff">{roleLabel('staff')}</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs bg-surface-hover px-2 py-0.5 rounded text-muted-foreground">
            {roleLabel(member.role)}
          </span>
        )}
        {canManage && member.role !== 'owner' && (
          <button
            type="button"
            disabled={removing}
            onClick={async () => {
              if (!confirm('¿Eliminar a este empleado?')) return;
              setRemoving(true);
              await removeMember({ membershipId: member._id });
            }}
            className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
          >
            Eliminar
          </button>
        )}
      </div>
    </li>
  );
}
