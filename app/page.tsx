'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { RestaurantList } from '@/components/RestaurantList';

export default function Home() {
  const currentUser = useQuery(api.users.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.isRestaurantMember) {
      router.replace('/admin');
    }
  }, [currentUser, router]);

  if (currentUser?.role === 'admin' || currentUser?.isRestaurantMember) return null;

  return (
    <PageWrapper>
      <div>
        <h1 className="text-4xl font-bold">Pairfect</h1>
        <p className="text-muted-foreground mt-2">Discover the perfect pairings for you at every restaurant</p>
      </div>
      <RestaurantList />
    </PageWrapper>
  );
}
