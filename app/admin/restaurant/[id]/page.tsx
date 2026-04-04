'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { Store, UtensilsCrossed, Users, Settings, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';

export default function AdminRestaurantPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const menuItems = useQuery(api.menuItems.listByRestaurant, { restaurantId });

  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (restaurants === undefined) {
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
        <CardListSkeleton count={3} />
      </PageWrapper>
    );
  }

  if (!restaurant) {
    return (
      <PageWrapper>
        <p>Restaurant not found or you don't have access.</p>
        <Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-sm text-accent hover:text-accent-hover">
          <ArrowLeft className="size-3.5" />
          Back to dashboard
        </Link>
      </PageWrapper>
    );
  }

  const itemCount = menuItems?.length ?? 0;
  const categories = menuItems ? [...new Set(menuItems.map((m) => m.category))].sort() : [];

  return (
    <PageWrapper>
      <header className="flex flex-col sm:flex-row sm:items-center gap-4">
        {restaurant.logoUrl ? (
          <img src={restaurant.logoUrl} alt={restaurant.name} className="size-14 sm:size-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="size-14 sm:size-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Store className="size-7 text-muted-foreground/40" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-semibold">{restaurant.name}</h1>
            <Badge variant="accent" className="capitalize">
              {restaurant.role}
            </Badge>
          </div>
          {restaurant.description && <p className="text-muted-foreground mt-1">{restaurant.description}</p>}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/admin/restaurant/${restaurantId}/menu`}
          className="group border border-border rounded-lg p-4 sm:p-6 bg-surface hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
            <h2 className="font-medium text-lg">Menu</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
            {categories.length > 0 && ` in ${categories.length} categories`}
          </p>
        </Link>
        <Link
          href={`/admin/restaurant/${restaurantId}/clients`}
          className="group border border-border rounded-lg p-4 sm:p-6 bg-surface hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
            <h2 className="font-medium text-lg">Clients</h2>
          </div>
          <p className="text-sm text-muted-foreground">View clients who created pairings</p>
        </Link>
        <Link
          href={`/admin/restaurant/${restaurantId}/settings`}
          className="group border border-border rounded-lg p-4 sm:p-6 bg-surface hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Settings className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
            <h2 className="font-medium text-lg">Settings</h2>
          </div>
          <p className="text-sm text-muted-foreground">Restaurant info and team</p>
        </Link>
      </div>
    </PageWrapper>
  );
}
