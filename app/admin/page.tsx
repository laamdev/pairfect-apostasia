'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/PageWrapper';
import { CardListSkeleton } from '@/components/skeletons';
import { useRestaurant } from '@/hooks/useRestaurant';

export default function AdminDashboard() {
  const user = useQuery(api.users.currentUser);
  const restaurant = useRestaurant();
  const router = useRouter();

  // Only restaurant members and admins can access the dashboard.
  const hasAccess = user && (user.role === 'admin' || user.isRestaurantMember);

  useEffect(() => {
    if (user && !hasAccess) {
      router.replace('/');
    }
  }, [user, hasAccess, router]);

  // Single-tenant: go straight to the restaurant management page.
  useEffect(() => {
    if (hasAccess && restaurant) {
      router.replace(`/admin/restaurant/${restaurant._id}`);
    }
  }, [hasAccess, restaurant, router]);

  if (user === undefined || (hasAccess && restaurant === undefined)) {
    return (
      <PageWrapper>
        <CardListSkeleton />
      </PageWrapper>
    );
  }

  if (!hasAccess) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">Redirigiendo…</p>
      </PageWrapper>
    );
  }

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">
          El restaurante aún no está configurado. Ejecuta el seed para crearlo.
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <CardListSkeleton />
    </PageWrapper>
  );
}
