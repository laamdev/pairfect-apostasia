'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Link from 'next/link';

export default function AdminRestaurantPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const menuItems = useQuery(api.menuItems.listByRestaurant, { restaurantId });

  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (restaurants === undefined) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p className="text-muted">Loading...</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="p-8 max-w-3xl mx-auto">
        <p>Restaurant not found or you don't have access.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm text-accent hover:text-accent-hover">
          Back to dashboard
        </Link>
      </main>
    );
  }

  const itemCount = menuItems?.length ?? 0;
  const categories = menuItems ? [...new Set(menuItems.map((m) => m.category))].sort() : [];

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-foreground transition-colors">
          Back to dashboard
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
        {restaurant.description && <p className="text-muted mt-1">{restaurant.description}</p>}
        <p className="text-xs text-muted mt-2">Role: {restaurant.role}</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/admin/restaurant/${restaurantId}/menu`} className="border border-border rounded-lg p-6 bg-surface hover:bg-surface-hover transition-colors">
          <h2 className="font-medium text-lg mb-1">Menu</h2>
          <p className="text-sm text-muted">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {categories.length > 0 && ` in ${categories.length} categories`}
          </p>
        </Link>
        <Link href={`/admin/restaurant/${restaurantId}/settings`} className="border border-border rounded-lg p-6 bg-surface hover:bg-surface-hover transition-colors">
          <h2 className="font-medium text-lg mb-1">Settings</h2>
          <p className="text-sm text-muted">Restaurant info and team</p>
        </Link>
      </div>

      {restaurant.slug && (
        <p className="text-sm text-muted">
          Public page:{' '}
          <Link href={`/restaurant/${restaurant.slug}`} className="text-accent hover:text-accent-hover">
            /restaurant/{restaurant.slug}
          </Link>
        </p>
      )}
    </main>
  );
}
