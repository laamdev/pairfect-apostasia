'use client';

import { useEffect, useState } from 'react';
import { useAction, useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DietAllergenIcons } from '@/components/menu/DietAllergenIcons';
import { Sparkles, Loader2, UtensilsCrossed, Utensils } from 'lucide-react';
import { FormSkeleton } from '@/components/skeletons';

const TASTE_OPTIONS = ['sweet', 'sour', 'salty', 'bitter', 'umami'] as const;
const SPICE_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
const DIET_OPTIONS = ['vegan', 'vegetarian', 'pescatarian', 'poultry', 'meaty', 'celiac', 'none'] as const;
const ALCOHOL_OPTIONS = ['none', 'low', 'mid', 'high'] as const;

type Taste = (typeof TASTE_OPTIONS)[number];
type Spice = (typeof SPICE_OPTIONS)[number];
type Diet = (typeof DIET_OPTIONS)[number];
type Alcohol = (typeof ALCOHOL_OPTIONS)[number];

const TASTE_LABELS: Record<Taste, string> = {
  sweet: 'Sweet',
  sour: 'Sour',
  salty: 'Salty',
  bitter: 'Bitter',
  umami: 'Umami',
};
const DIET_LABELS: Record<Diet, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  pescatarian: 'Pescatarian',
  poultry: 'Poultry',
  meaty: 'Meaty',
  celiac: 'Celiac (gluten-free)',
  none: 'No preference',
};
const ALCOHOL_LABELS: Record<Alcohol, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };
const SPICE_LABELS: Record<Spice, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };

export const PreferencesForm = ({
  restaurantId,
  allergens,
}: {
  restaurantId: Id<'restaurants'>;
  allergens: Array<{ _id: Id<'allergens'>; name: string }>;
}) => {
  const [tasteProfile, setTasteProfile] = useState<Taste[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<Spice>('none');
  const [allergenIdsToAvoid, setAllergenIdsToAvoid] = useState<Id<'allergens'>[]>([]);
  const [dietPreference, setDietPreference] = useState<Diet>('none');
  const [alcoholTolerance, setAlcoholTolerance] = useState<Alcohol>('none');
  const [sweetTooth, setSweetTooth] = useState(false);
  const [useGlobal, setUseGlobal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Array<{
    name: string;
    matchPercentage: number;
    reason?: string;
    items: Array<{ menuItemName: string; type: string }>;
  }> | null>(null);

  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const generateRecommendations = useAction(api.recommendations.generateRecommendations);
  const existingRecommendation = useQuery(api.recommendationsClient.getLatestForRestaurant, { restaurantId });
  const profileData = useQuery(api.clientProfiles.getRestaurantProfile, { restaurantId });
  const menuItems = useQuery(api.menuItems.listAvailableByRestaurant, { restaurantId });
  const allAllergens = useQuery(api.allergens.listAllergens);

  const selectedItem = selectedItemName
    ? menuItems?.find((m) => m.name.toLowerCase() === selectedItemName.toLowerCase())
    : null;
  const selectedAllergens = selectedItem
    ? (selectedItem.allergenIds.map((id) => allAllergens?.find((a) => a._id === id)).filter(Boolean) as Array<{
        _id: Id<'allergens'>;
        name: string;
        slug: string;
      }>)
    : [];
  const saveRestaurantProfile = useMutation(api.clientProfiles.upsertRestaurantProfile);
  const saveGlobalProfile = useMutation(api.clientProfiles.upsertGlobalProfile);

  useEffect(() => {
    if (!profileData) return;
    const { restaurantProfile, globalProfile } = profileData as any;
    const p = restaurantProfile ?? globalProfile;
    if (restaurantProfile) setUseGlobal(false);
    else if (globalProfile) setUseGlobal(true);
    if (p) {
      setTasteProfile(p.tasteProfile as Taste[]);
      setSpiceLevel(p.spiceLevel as Spice);
      setAllergenIdsToAvoid(p.allergenIdsToAvoid as Id<'allergens'>[]);
      setDietPreference(p.dietPreference as Diet);
      setAlcoholTolerance(p.alcoholTolerance as Alcohol);
      setSweetTooth(!!p.sweetTooth);
    }
  }, [profileData]);

  const toggle = <T,>(arr: T[], val: T) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const prefs = { tasteProfile, spiceLevel, allergenIdsToAvoid, dietPreference, alcoholTolerance, sweetTooth };
      if (useGlobal) {
        await saveGlobalProfile({ ...prefs, displayName: undefined });
        await saveRestaurantProfile({ restaurantId, useGlobal: true, ...prefs });
      } else {
        await saveRestaurantProfile({ restaurantId, useGlobal: false, ...prefs });
      }
      const pairings = await generateRecommendations({ restaurantId, preferences: prefs });
      setResult(pairings);
      setShowFormDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isLoadingExisting = existingRecommendation === undefined && result === null;
  const pairings = result ?? existingRecommendation?.pairings;
  const hasPairings = pairings && pairings.length > 0;

  if (isLoadingExisting) {
    return <FormSkeleton />;
  }

  const formJsx = (
    <form
      onSubmit={handleSubmit}
      className={
        hasPairings ? 'flex flex-col gap-5' : 'border border-border rounded-lg p-5 bg-surface flex flex-col gap-5'
      }
    >
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Preference source</Label>
        <RadioGroup
          value={useGlobal ? 'global' : 'custom'}
          onValueChange={(val) => setUseGlobal(val === 'global')}
          className="flex flex-row gap-4"
        >
          <Label className="font-normal text-sm">
            <RadioGroupItem value="global" />
            Use my global preferences
          </Label>
          <Label className="font-normal text-sm">
            <RadioGroupItem value="custom" />
            Customize for this restaurant
          </Label>
        </RadioGroup>
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Taste profile</Label>
        <div className="flex flex-wrap gap-3">
          {TASTE_OPTIONS.map((t) => (
            <Label key={t} className="font-normal text-sm">
              <Checkbox
                checked={tasteProfile.includes(t)}
                onCheckedChange={() => setTasteProfile(toggle(tasteProfile, t))}
              />
              {TASTE_LABELS[t]}
            </Label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 text-xs text-muted-foreground">Spice level</Label>
          <Select value={spiceLevel} onValueChange={(val) => setSpiceLevel(val as Spice)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPICE_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {SPICE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-xs text-muted-foreground">Diet preference</Label>
          <Select value={dietPreference} onValueChange={(val) => setDietPreference(val as Diet)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIET_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {DIET_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 text-xs text-muted-foreground">Alcohol tolerance</Label>
          <Select value={alcoholTolerance} onValueChange={(val) => setAlcoholTolerance(val as Alcohol)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALCOHOL_OPTIONS.map((a) => (
                <SelectItem key={a} value={a}>
                  {ALCOHOL_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1 text-xs text-muted-foreground">Include dessert</Label>
          <Select value={sweetTooth ? 'yes' : 'no'} onValueChange={(val) => setSweetTooth(val === 'yes')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Allergens to avoid</Label>
        <div className="flex flex-wrap gap-3">
          {allergens.map((a) => (
            <Label key={a._id} className="font-normal text-sm">
              <Checkbox
                checked={allergenIdsToAvoid.includes(a._id)}
                onCheckedChange={() => setAllergenIdsToAvoid(toggle(allergenIdsToAvoid, a._id))}
              />
              {a.name}
            </Label>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Finding your pairings...
          </>
        ) : (
          <>
            <Sparkles className="size-4" /> {hasPairings ? 'Regenerate pairings' : 'Get my pairings'}
          </>
        )}
      </Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );

  const pairingsJsx = hasPairings ? (
    <div className="border border-accent/30 rounded-xl bg-accent/5 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Utensils className="size-5 text-accent" />
          Your pairings
        </h3>
        <Button variant="outline" size="sm" onClick={() => setShowFormDialog(true)}>
          <Sparkles className="size-3.5" />
          Regenerate
        </Button>
      </div>
      <div className="flex flex-col gap-4">
        {pairings.map((pairing, i) => (
          <div key={i} className="border border-border rounded-lg p-3 sm:p-4 bg-surface">
            <div className="flex items-center gap-2 mb-3">
              <span className="shrink-0 size-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                {i + 1}
              </span>
              <span className="font-semibold">{pairing.name}</span>
              <Badge variant="accent">{pairing.matchPercentage}%</Badge>
            </div>
            <div className="flex flex-col gap-1.5 ml-6 sm:ml-9">
              {pairing.items.map((item, j) => (
                <div key={j} className="flex items-center gap-2 text-sm">
                  {'type' in item && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {(item as { type: string }).type}
                    </Badge>
                  )}
                  <button
                    type="button"
                    className="text-left hover:text-accent transition-colors cursor-pointer underline underline-offset-2 decoration-muted-foreground/30 hover:decoration-accent"
                    onClick={() => setSelectedItemName(item.menuItemName)}
                  >
                    {item.menuItemName}
                  </button>
                </div>
              ))}
            </div>
            {pairing.reason && <p className="text-sm text-muted-foreground mt-2 ml-6 sm:ml-9">{pairing.reason}</p>}
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* If pairings exist, show results. Otherwise show the form inline. */}
      {hasPairings ? pairingsJsx : formJsx}

      {/* Regenerate dialog — form inside a dialog when pairings already exist */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Regenerate pairings</DialogTitle>
          </DialogHeader>
          {formJsx}
        </DialogContent>
      </Dialog>

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
                    <p className="text-xs text-muted-foreground mb-1">Ingredients</p>
                    <p className="text-sm">{selectedItem.ingredients.join(', ')}</p>
                  </div>
                )}
                {selectedItem.pairingNotes && selectedItem.pairingNotes.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pairs well with</p>
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
