'use client';

import { useState } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DietAllergenIcons } from '@/components/menu/DietAllergenIcons';
import { Sparkles, Loader2, UtensilsCrossed, Utensils, RefreshCw } from 'lucide-react';
import { FormSkeleton } from '@/components/skeletons';

type SlotType = 'dish' | 'drink' | 'dessert';
type Role = 'safe' | 'adventurous' | 'wildcard';
type Scope = 'all' | Role;

const TYPE_LABELS: Record<SlotType, string> = { dish: 'Plato', drink: 'Bebida', dessert: 'Postre' };
const SLOT_ORDER: SlotType[] = ['dish', 'drink', 'dessert'];
// Display name + short tagline per personality, used as a fallback when the
// model didn't name the pairing and for the role chip.
const ROLE_LABELS: Record<Role, string> = {
  safe: 'La apuesta segura',
  adventurous: 'El atrevido',
  wildcard: 'Comodín del chef',
};
const ROLE_TAGLINES: Record<Role, string> = {
  safe: 'Máxima compatibilidad',
  adventurous: 'Contraste e innovación',
  wildcard: 'Una sorpresa',
};

/**
 * "Maridaje" tab: generate a single pairing (dish + drink + optional dessert)
 * when none exists, or regenerate the whole set / a single slot when one does.
 * Preferences are resolved server-side from the diner's stored profile.
 */
export const PairingPanel = ({ restaurantId }: { restaurantId: Id<'restaurants'> }) => {
  const generate = useAction(api.recommendations.generateRecommendations);
  const existing = useQuery(api.recommendationsClient.getLatestForRestaurant, { restaurantId });
  const profileData = useQuery(api.clientProfiles.getRestaurantProfile, { restaurantId });
  const menuItems = useQuery(api.menuItems.listAvailableByRestaurant, { restaurantId });
  const allAllergens = useQuery(api.allergens.listAllergens);

  const [busyScope, setBusyScope] = useState<Scope | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const hasProfile =
    profileData !== undefined && (profileData.restaurantProfile != null || profileData.globalProfile != null);

  const pairings = (existing?.pairings ?? []) as Array<{
    role?: Role;
    name: string;
    matchPercentage: number;
    reason?: string;
    items: Array<{ menuItemName: string; type?: SlotType }>;
  }>;

  const selectedItem = selectedItemName
    ? menuItems?.find((m) => m.name.toLowerCase() === selectedItemName.toLowerCase())
    : null;
  const selectedAllergens = selectedItem
    ? (selectedItem.allergenIds
        .map((id) => allAllergens?.find((a) => a._id === id))
        .filter(Boolean) as Array<{ _id: Id<'allergens'>; name: string; slug: string }>)
    : [];

  const runGenerate = async (scope: Scope) => {
    setError(null);
    setBusyScope(scope);
    try {
      await generate({ restaurantId, scope });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal');
    } finally {
      setBusyScope(null);
    }
  };

  if (existing === undefined || profileData === undefined) {
    return <FormSkeleton />;
  }

  if (!hasProfile) {
    return (
      <div className="border border-border rounded-lg p-6 bg-surface flex flex-col gap-3">
        <p className="text-muted-foreground">
          Antes de generar un maridaje, configura tus gustos en la pestaña <strong>Preferencias</strong>.
        </p>
      </div>
    );
  }

  // No pairings yet — show the generate call to action.
  if (pairings.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 bg-surface flex flex-col items-start gap-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Utensils className="size-5 text-accent" />
            Tus maridajes
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Genera tres maridajes a tu medida (la apuesta segura, el atrevido y el comodín del chef) basados en tus
            preferencias.
          </p>
        </div>
        <Button onClick={() => runGenerate('all')} disabled={busyScope !== null}>
          {busyScope === 'all' ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Generando tus maridajes…
            </>
          ) : (
            <>
              <Sparkles className="size-4" /> Generar maridajes
            </>
          )}
        </Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Utensils className="size-5 text-accent" />
          Tus maridajes
        </h3>
        <Button size="sm" onClick={() => runGenerate('all')} disabled={busyScope !== null}>
          {busyScope === 'all' ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Regenerar todo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {pairings.map((pairing, i) => {
          const role = (pairing.role as Role) ?? 'safe';
          const items = [...pairing.items].sort(
            (a, b) =>
              SLOT_ORDER.indexOf((a.type as SlotType) ?? 'dish') -
              SLOT_ORDER.indexOf((b.type as SlotType) ?? 'dish'),
          );
          const busy = busyScope === role;
          return (
            <div key={pairing.role ?? i} className="border border-accent/30 rounded-xl bg-accent/5 p-4 sm:p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <Badge variant="outline" className="text-[11px]">
                  {ROLE_LABELS[role]}
                </Badge>
                <Badge variant="accent" className="shrink-0">
                  {pairing.matchPercentage}% confianza
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{ROLE_TAGLINES[role]}</p>
              <h4 className="font-semibold mb-3">{pairing.name}</h4>

              <div className="flex flex-col gap-2">
                {items.map((item, j) => {
                  const type = (item.type as SlotType) ?? 'dish';
                  return (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {TYPE_LABELS[type]}
                      </Badge>
                      <button
                        type="button"
                        className="text-left hover:text-accent transition-colors cursor-pointer underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-accent"
                        onClick={() => setSelectedItemName(item.menuItemName)}
                      >
                        {item.menuItemName}
                      </button>
                    </div>
                  );
                })}
              </div>

              {pairing.reason ? (
                <p className="text-sm text-muted-foreground mt-3">{pairing.reason}</p>
              ) : null}

              <div className="mt-auto pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runGenerate(role)}
                  disabled={busyScope !== null}
                >
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                  Regenerar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {/* Menu item detail dialog */}
      <Dialog
        open={!!selectedItemName}
        onOpenChange={(open) => {
          if (!open) setSelectedItemName(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedItem ? (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {selectedItem.imageUrl ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.name}
                    className="w-full rounded-lg object-cover max-h-56"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                    <UtensilsCrossed className="size-8 text-muted-foreground/40" />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Ingredientes</p>
                    <p className="text-sm">{selectedItem.ingredients.join(', ')}</p>
                  </div>
                )}
                {selectedItem.pairingNotes && selectedItem.pairingNotes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Marida bien con</p>
                    <p className="text-sm">{selectedItem.pairingNotes.join(', ')}</p>
                  </div>
                )}
                <DietAllergenIcons
                  dietTags={selectedItem.dietTags}
                  category={selectedItem.category}
                  alcoholLevel={selectedItem.alcoholLevel}
                  allergens={selectedAllergens}
                />
                {selectedItem.price != null && (
                  <p className="text-sm font-medium">{selectedItem.price.toFixed(2)} &euro;</p>
                )}
              </div>
            </>
          ) : (
            <DialogHeader>
              <DialogTitle>{selectedItemName}</DialogTitle>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
