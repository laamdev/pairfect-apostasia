'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { RestaurantMenuView } from '@/components/RestaurantMenuView';
import { useRestaurant } from '@/hooks/useRestaurant';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';

export default function Home() {
  const currentUser = useQuery(api.users.currentUser);
  const restaurant = useRestaurant();
  const router = useRouter();

  // Employees and admins go straight to the management area.
  const isStaff = currentUser?.role === 'admin' || currentUser?.isRestaurantMember;
  useEffect(() => {
    if (isStaff) {
      router.replace('/admin');
    }
  }, [isStaff, router]);

  if (isStaff) return null;

  if (restaurant === undefined) {
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
        <CardListSkeleton count={4} />
      </PageWrapper>
    );
  }

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">
          El restaurante aún no está configurado. Ejecuta el seed para crear la carta.
        </p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <RestaurantMenuView restaurant={restaurant} />
    </PageWrapper>
  );
}
