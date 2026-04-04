'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@/components/PageWrapper';
import { CardListSkeleton } from '@/components/skeletons';

export default function AdminDashboard() {
  const user = useQuery(api.users.currentUser);
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const router = useRouter();

  // Only restaurant members and admins can access the dashboard
  useEffect(() => {
    if (user && user.role !== 'admin' && !user.isRestaurantMember) {
      router.replace('/');
    }
  }, [user, router]);

  // Non-admin members with exactly one restaurant: skip the list
  useEffect(() => {
    if (user && user.role !== 'admin' && restaurants && restaurants.length === 1) {
      router.replace(`/admin/restaurant/${restaurants[0]._id}`);
    }
  }, [user, restaurants, router]);

  if (user === undefined) {
    return (
      <PageWrapper>
        <CardListSkeleton />
      </PageWrapper>
    );
  }

  if (!user || (user.role !== 'admin' && !user.isRestaurantMember)) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">Redirecting...</p>
      </PageWrapper>
    );
  }

  const isAdmin = user.role === 'admin';

  // Show loading while redirect is pending
  if (!isAdmin && restaurants && restaurants.length === 1) {
    return (
      <PageWrapper>
        <CardListSkeleton />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {isAdmin ? 'Admin Dashboard' : 'My Restaurant'}
        </h1>
        {isAdmin && (
          <Link
            href="/admin/new-restaurant"
            className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors"
          >
            + New restaurant
          </Link>
        )}
      </div>

      {restaurants === undefined && (
        <CardListSkeleton count={3} />
      )}

      {restaurants !== undefined && restaurants.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {isAdmin
              ? "No restaurants yet. Create one to get started."
              : "You haven't been assigned to a restaurant yet. Contact your admin."}
          </p>
          {isAdmin && (
            <Link
              href="/admin/new-restaurant"
              className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors"
            >
              Create first restaurant
            </Link>
          )}
        </div>
      )}

      {restaurants && restaurants.length > 0 && (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li key={r._id}>
              <Link
                href={`/admin/restaurant/${r._id}`}
                className="block border border-border rounded-lg p-4 bg-surface hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    {r.description && (
                      <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-surface-hover px-2 py-1 rounded text-muted-foreground">
                    {r.role}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
