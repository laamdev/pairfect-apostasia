'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useState } from 'react';

export function PendingInvitationRow({
  invitation,
}: {
  invitation: { _id: Id<'pendingInvitations'>; email: string; role: string };
  // role: rol con el que se incorporará al aceptar la invitación.
}) {
  const cancelInvitation = useMutation(api.restaurantMembers.cancelInvitation);
  const [cancelling, setCancelling] = useState(false);

  return (
    <li className="flex items-center justify-between border border-dashed border-border rounded-lg p-3 bg-surface">
      <div>
        <span className="text-sm font-medium text-muted-foreground">{invitation.email}</span>
        <span className="ml-2 text-xs bg-ring/10 text-ring px-2 py-0.5 rounded">Pendiente</span>
      </div>
      <button
        type="button"
        disabled={cancelling}
        onClick={async () => {
          setCancelling(true);
          await cancelInvitation({ invitationId: invitation._id });
        }}
        className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
      >
        Cancelar
      </button>
    </li>
  );
}
