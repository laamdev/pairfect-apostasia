'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { PageWrapper } from '@/components/PageWrapper';
import { Store, UtensilsCrossed, Users, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';
import { useRestaurant } from '@/hooks/useRestaurant';
import { roleLabel } from '@/lib/roles';

export default function AdminRestaurantPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const restaurant = useRestaurant();
  const user = useQuery(api.users.currentUser);
  const menuItems = useQuery(api.menuItems.listByRestaurant, { restaurantId });

  if (restaurant === undefined || user === undefined) {
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
        <CardListSkeleton count={3} />
      </PageWrapper>
    );
  }

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">El restaurante aún no está configurado.</p>
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
            <h1 className="text-3xl sm:text-4xl font-semibold">{restaurant.name}</h1>
            {user?.membershipRole && (
              <Badge variant="accent">{roleLabel(user.membershipRole)}</Badge>
            )}
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
            <h2 className="font-medium text-lg">Carta</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'plato' : 'platos'}
            {categories.length > 0 && ` en ${categories.length} ${categories.length === 1 ? 'categoría' : 'categorías'}`}
          </p>
        </Link>
        <Link
          href={`/admin/restaurant/${restaurantId}/clients`}
          className="group border border-border rounded-lg p-4 sm:p-6 bg-surface hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
            <h2 className="font-medium text-lg">Comensales</h2>
          </div>
          <p className="text-sm text-muted-foreground">Ver los comensales que han creado maridajes</p>
        </Link>
        <Link
          href={`/admin/restaurant/${restaurantId}/settings`}
          className="group border border-border rounded-lg p-4 sm:p-6 bg-surface hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-center gap-2 mb-1">
            <Settings className="size-5 text-muted-foreground group-hover:text-accent transition-colors" />
            <h2 className="font-medium text-lg">Ajustes</h2>
          </div>
          <p className="text-sm text-muted-foreground">Información del restaurante y equipo</p>
        </Link>
      </div>
    </PageWrapper>
  );
}
