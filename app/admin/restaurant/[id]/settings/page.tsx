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

export default function RestaurantSettingsPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const members = useQuery(api.restaurantMembers.listMembers, { restaurantId });
  const pendingInvitations = useQuery(api.restaurantMembers.listPendingInvitations, { restaurantId });
  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (restaurants === undefined)
    return (
      <PageWrapper>
        <CardListSkeleton count={3} />
      </PageWrapper>
    );

  if (!restaurant) {
    return (
      <PageWrapper>
        <p>Restaurant not found or you don't have access.</p>
        <Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-sm text-accent">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </PageWrapper>
    );
  }

  const canManage = restaurant.role === 'owner';

  return (
    <PageWrapper>
      <div>
        <Link
          href={`/admin/restaurant/${restaurantId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back to {restaurant.name}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      {canManage && <RestaurantInfoForm restaurantId={restaurantId} restaurant={restaurant} />}
      <section>
        <h2 className="text-lg font-medium mb-4">Team</h2>
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
            <h3 className="text-sm font-medium text-muted-foreground mt-2 mb-2">Pending invitations</h3>
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
