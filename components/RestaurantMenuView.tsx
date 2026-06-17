'use client';

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MenuByCategory } from '@/components/menu/MenuByCategory';
import { PreferencesEditor } from '@/components/preferences/PreferencesEditor';
import { PairingPanel } from '@/components/PairingPanel';
import { CardListSkeleton } from '@/components/skeletons';

type RestaurantMenuViewProps = {
  restaurant: {
    _id: Id<'restaurants'>;
    name: string;
    description?: string | null;
  };
};

const SignInPrompt = ({ message }: { message: string }) => (
  <div className="flex flex-col gap-2">
    <p className="text-muted-foreground">{message}</p>
    <a href="/sign-in">
      <Button>Iniciar sesión</Button>
    </a>
  </div>
);

/**
 * Carta + preferencias + maridaje de un restaurante. Componente compartido por
 * la página de inicio (single-tenant) y la página pública por slug.
 */
export const RestaurantMenuView = ({ restaurant }: RestaurantMenuViewProps) => {
  const menuItems = useQuery(api.menuItems.listAvailableByRestaurant, {
    restaurantId: restaurant._id,
  });
  const allergens = useQuery(api.allergens.listAllergens);
  const { user } = useAuth();

  return (
    <>
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="text-muted-foreground mt-1">{restaurant.description}</p>
        )}
      </header>

      <Tabs defaultValue="menu">
        <TabsList>
          <TabsTrigger value="menu">Carta</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="pairing">Maridaje</TabsTrigger>
        </TabsList>

        <TabsContent value="menu" className="mt-6">
          {menuItems !== undefined ? (
            <MenuByCategory items={menuItems} allergens={allergens ?? []} />
          ) : (
            <CardListSkeleton count={4} />
          )}
        </TabsContent>

        <TabsContent value="preferences" className="mt-6">
          {user ? (
            <PreferencesEditor mode="restaurant" restaurantId={restaurant._id} />
          ) : (
            <SignInPrompt message="Inicia sesión para guardar tus preferencias de sabor, dieta y alérgenos." />
          )}
        </TabsContent>

        <TabsContent value="pairing" className="mt-6">
          {user ? (
            <PairingPanel restaurantId={restaurant._id} />
          ) : (
            <SignInPrompt message="Inicia sesión para recibir maridajes de comida y bebida personalizados." />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};
