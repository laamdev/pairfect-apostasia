'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { CardListSkeleton } from '@/components/skeletons';

export const RestaurantList = () => {
  const restaurants = useQuery(api.restaurants.listRestaurants);

  if (restaurants === undefined) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
        <CardListSkeleton count={3} />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
      {restaurants.length === 0 ? (
        <p className="text-muted-foreground">No restaurants available yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li key={r._id}>
              <Link
                href={`/restaurant/${r.slug ?? r._id}`}
                className="border border-border rounded-lg p-4 bg-surface hover:bg-surface-hover transition-colors flex items-center gap-4"
              >
                {r.logoUrl ? (
                  <img src={r.logoUrl} alt={r.name} className="size-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Store className="size-5 text-muted-foreground/40" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && <p className="text-sm text-muted-foreground mt-1">{r.description}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
