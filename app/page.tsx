'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-8 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Pairfect</h1>
        <p className="text-muted mt-2">
          Discover the perfect pairings for you at every restaurant
        </p>
      </div>
      <RestaurantList />
    </main>
  );
}

function RestaurantList() {
  const restaurants = useQuery(api.restaurants.listRestaurants);

  if (restaurants === undefined) {
    return (
      <section className="max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
        <p className="text-muted">Loading...</p>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-semibold mb-4">Restaurants</h2>
      {restaurants.length === 0 ? (
        <p className="text-muted">No restaurants available yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li key={r._id}>
              <Link
                href={`/restaurant/${r.slug ?? r._id}`}
                className="block border border-border rounded-lg p-4 bg-surface hover:bg-surface-hover transition-colors"
              >
                <p className="font-medium">{r.name}</p>
                {r.description && <p className="text-sm text-muted mt-1">{r.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
