'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Link from 'next/link';

export default function AdminDashboard() {
  const user = useQuery(api.users.currentUser);
  const restaurants = useQuery(api.restaurants.listMyRestaurants);

  if (user === undefined) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p>Sign in to access the admin dashboard.</p>
        <a href="/sign-in?intent=staff" className="mt-4 inline-block bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors">
          Sign in
        </a>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Link
          href="/admin/new-restaurant"
          className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors"
        >
          + New restaurant
        </Link>
      </div>

      {restaurants === undefined && (
        <p className="text-muted">Loading restaurants...</p>
      )}

      {restaurants !== undefined && restaurants.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted mb-4">
            You don't have any restaurants yet. Create one to get started.
          </p>
          <Link
            href="/admin/new-restaurant"
            className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors"
          >
            Create my first restaurant
          </Link>
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
                      <p className="text-sm text-muted mt-1">{r.description}</p>
                    )}
                  </div>
                  <span className="text-xs bg-surface-hover px-2 py-1 rounded text-muted">
                    {r.role}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
