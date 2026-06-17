'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import Link from 'next/link';
import { RestaurantInfoForm } from '@/components/restaurant-settings/RestaurantInfoForm';
import { MemberRow } from '@/components/restaurant-settings/MemberRow';
import { PendingInvitationRow } from '@/components/restaurant-settings/PendingInvitationRow';
import { AddMemberForm } from '@/components/restaurant-settings/AddMemberForm';
import { PageWrapper } from '@/components/PageWrapper';
import { ArrowLeft } from 'lucide-react';
import { CardListSkeleton } from '@/components/skeletons';
import { useRestaurant } from '@/hooks/useRestaurant';

export default function RestaurantSettingsPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurant = useRestaurant();
  const user = useQuery(api.users.currentUser);
  const members = useQuery(api.restaurantMembers.listMembers, { restaurantId });
  const pendingInvitations = useQuery(api.restaurantMembers.listPendingInvitations, {
    restaurantId,
  });

  if (restaurant === undefined || user === undefined)
    return (
      <PageWrapper>
        <CardListSkeleton count={3} />
      </PageWrapper>
    );

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p>El restaurante aún no está configurado.</p>
        <Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
          <ArrowLeft className="size-3.5" />
          Volver
        </Link>
      </PageWrapper>
    );
  }

  const canManage = user?.membershipRole === 'owner';

  return (
    <PageWrapper>
      <div>
        <Link
          href={`/admin/restaurant/${restaurantId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Volver a {restaurant.name}
        </Link>
      </div>
      <h1 className="text-3xl font-semibold">Ajustes</h1>
      {canManage && <RestaurantInfoForm restaurantId={restaurantId} restaurant={restaurant} />}
      <section>
        <h2 className="text-lg font-medium mb-4">Equipo</h2>
        {members === undefined && <CardListSkeleton count={2} />}
        {members && members.length > 0 && (
          <ul className="flex flex-col gap-2 mb-4">
            {members.map(
              (m: {
                _id: Id<'restaurantMembers'>;
                userId: Id<'users'>;
                role: string;
                email: string | null;
                name: string | null;
              }) => (
                <MemberRow key={m._id} member={m} canManage={canManage} />
              ),
            )}
          </ul>
        )}
        {canManage && pendingInvitations && pendingInvitations.length > 0 && (
          <>
            <h3 className="text-sm font-medium text-muted-foreground mt-2 mb-2">
              Invitaciones pendientes
            </h3>
            <ul className="flex flex-col gap-2 mb-4">
              {pendingInvitations.map((inv) => (
                <PendingInvitationRow key={inv._id} invitation={inv} />
              ))}
            </ul>
          </>
        )}
        {canManage && <AddMemberForm restaurantId={restaurantId} />}
      </section>
    </PageWrapper>
  );
}
