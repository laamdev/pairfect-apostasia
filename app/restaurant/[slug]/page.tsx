'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MenuByCategory } from '@/components/menu/MenuByCategory';
import { PreferencesForm } from '@/components/PreferencesForm';
import { PageWrapper } from '@/components/PageWrapper';
import { ArrowLeft } from 'lucide-react';
import { PageHeaderSkeleton, CardListSkeleton } from '@/components/skeletons';

export default function RestaurantPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const restaurant = useQuery(api.restaurants.getBySlug, { slug });
  const menuItems = useQuery(
    api.menuItems.listAvailableByRestaurant,
    restaurant?._id ? { restaurantId: restaurant._id } : 'skip',
  );
  const allergens = useQuery(api.allergens.listAllergens);
  const { user } = useAuth();

  if (restaurant === undefined)
    return (
      <PageWrapper>
        <PageHeaderSkeleton />
        <CardListSkeleton count={4} />
      </PageWrapper>
    );

  if (restaurant === null) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">Restaurant not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent">
          Back to restaurants
        </Link>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div>
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back to restaurants
        </Link>
      </div>
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.description && <p className="text-muted-foreground mt-1">{restaurant.description}</p>}
      </header>

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-6">
          {menuItems !== undefined ? (
            <MenuByCategory items={menuItems} allergens={allergens ?? []} />
          ) : (
            <CardListSkeleton count={4} />
          )}
        </TabsContent>

        <TabsContent value="pairings" className="mt-6">
          {user ? (
            <PreferencesForm restaurantId={restaurant._id} allergens={allergens ?? []} />
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground">Sign in to get personalized food and drink pairings</p>
              <a href="/sign-in">
                <Button>Sign in</Button>
              </a>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
