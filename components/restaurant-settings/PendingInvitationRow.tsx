'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';

export function PendingInvitationRow({
  invitation,
}: {
  invitation: { _id: Id<'pendingInvitations'>; email: string; role: string };
}) {
  const cancelInvitation = useMutation(api.restaurantMembers.cancelInvitation);
  const [cancelling, setCancelling] = useState(false);

  return (
    <li className="flex items-center justify-between border border-dashed border-border rounded-lg p-3 bg-surface">
      <div>
        <span className="text-sm font-medium text-muted-foreground">{invitation.email}</span>
        <span className="ml-2 text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">Pending</span>
      </div>
      <button
        type="button"
        disabled={cancelling}
        onClick={async () => {
          setCancelling(true);
          await cancelInvitation({ invitationId: invitation._id });
        }}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        Cancel
      </button>
    </li>
  );
}
