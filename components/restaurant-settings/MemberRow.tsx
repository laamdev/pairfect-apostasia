'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';

export function MemberRow({
  member,
  canManage,
}: {
  member: { _id: Id<'restaurantMembers'>; role: string; email: string | null; name: string | null };
  canManage: boolean;
}) {
  const removeMember = useMutation(api.restaurantMembers.removeMember);
  const [removing, setRemoving] = useState(false);

  return (
    <li className="flex items-center justify-between border border-border rounded-lg p-3 bg-surface">
      <div>
        <span className="text-sm font-medium">{member.email ?? member.name ?? 'Unknown'}</span>
        <span className="ml-2 text-xs bg-surface-hover px-2 py-0.5 rounded text-muted-foreground">{member.role}</span>
      </div>
      {canManage && member.role !== 'owner' && (
        <button
          type="button"
          disabled={removing}
          onClick={async () => {
            if (!confirm('Remove this member?')) return;
            setRemoving(true);
            await removeMember({ membershipId: member._id });
          }}
          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          Remove
        </button>
      )}
    </li>
  );
}
