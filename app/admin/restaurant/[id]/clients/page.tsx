'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { ArrowLeft } from 'lucide-react';
import { CardListSkeleton } from '@/components/skeletons';

export default function RestaurantClientsPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const clients = useQuery(api.recommendationsClient.listClientsForRestaurant, { restaurantId });

  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (clients === undefined) {
    return (
      <PageWrapper>
        <CardListSkeleton count={3} />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div>
        <Link
          href={`/admin/restaurant/${restaurantId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back to {restaurant?.name ?? 'restaurant'}
        </Link>
      </div>

      <h1 className="text-2xl font-semibold">Clients</h1>

      {clients.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg p-4">
          <p className="text-muted-foreground">No clients have created pairings at this restaurant yet.</p>
        </div>
      )}

      {clients.length > 0 && (
        <ul className="flex flex-col gap-3">
          {clients.map((client) => (
            <li key={client.userId} className="border border-border rounded-lg p-4 bg-surface">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{client.email ?? client.name ?? 'Anonymous'}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(client.recommendedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Latest pairing: {client.latestItems.map((item) => item.name).join(' + ')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
