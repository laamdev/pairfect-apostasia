'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { FormSkeleton } from '@/components/skeletons';
import { PreferencesChatbot } from '@/components/preferences/PreferencesChatbot';
import { ClipboardList, MessageSquare } from 'lucide-react';

export const TASTE_OPTIONS = ['sweet', 'sour', 'salty', 'bitter', 'umami'] as const;
export const SPICE_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
export const DIET_OPTIONS = ['vegan', 'vegetarian', 'pescatarian', 'poultry', 'meaty', 'celiac', 'none'] as const;
export const ALCOHOL_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
export const ADVENTUROUSNESS_OPTIONS = ['classic', 'balanced', 'innovative'] as const;
export const BASE_SPIRIT_OPTIONS = ['gin', 'whiskey', 'rum', 'tequila_mezcal', 'vodka', 'brandy', 'other', 'no_preference'] as const;
export const OCCASION_OPTIONS = ['casual', 'celebrating', 'experimenting', 'unwinding'] as const;

type Taste = (typeof TASTE_OPTIONS)[number];
type Spice = (typeof SPICE_OPTIONS)[number];
type Diet = (typeof DIET_OPTIONS)[number];
type Alcohol = (typeof ALCOHOL_OPTIONS)[number];
type Adventurousness = (typeof ADVENTUROUSNESS_OPTIONS)[number];
type BaseSpirit = (typeof BASE_SPIRIT_OPTIONS)[number];
type Occasion = (typeof OCCASION_OPTIONS)[number];

export const TASTE_LABELS: Record<Taste, string> = {
  sweet: 'Dulce',
  sour: 'Ácido',
  salty: 'Salado',
  bitter: 'Amargo',
  umami: 'Umami',
};
export const DIET_LABELS: Record<Diet, string> = {
  vegan: 'Vegano',
  vegetarian: 'Vegetariano',
  pescatarian: 'Pescetariano',
  poultry: 'Ave',
  meaty: 'Carne',
  celiac: 'Celíaco (sin gluten)',
  none: 'Sin preferencia',
};
export const ALCOHOL_LABELS: Record<Alcohol, string> = { none: 'Ninguno', low: 'Bajo', mid: 'Medio', high: 'Alto' };
export const SPICE_LABELS: Record<Spice, string> = { none: 'Ninguno', low: 'Bajo', mid: 'Medio', high: 'Alto' };
export const ADVENTUROUSNESS_LABELS: Record<Adventurousness, string> = {
  classic: 'Clásico',
  balanced: 'Equilibrado',
  innovative: 'Innovador',
};
export const BASE_SPIRIT_LABELS: Record<BaseSpirit, string> = {
  gin: 'Ginebra',
  whiskey: 'Whisky',
  rum: 'Ron',
  tequila_mezcal: 'Tequila / Mezcal',
  vodka: 'Vodka',
  brandy: 'Brandy',
  other: 'Otros',
  no_preference: 'Sin preferencia',
};
export const OCCASION_LABELS: Record<Occasion, string> = {
  casual: 'Informal',
  celebrating: 'Celebración',
  experimenting: 'Experimentar',
  unwinding: 'Desconectar',
};

type PreferencesEditorProps = {
  /** 'global' edits the diner's global profile; 'restaurant' edits the
   *  per-restaurant override (with a global-vs-custom toggle). */
  mode: 'global' | 'restaurant';
  restaurantId?: Id<'restaurants'>;
};

const toggle = <T,>(arr: T[], val: T) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

/**
 * Single source of truth for editing diner preferences. Offers two ways to set
 * them: a classic form ("Formulario") or a conversational assistant ("Asistente").
 * Reused by the global /preferences page and the restaurant "Preferencias" tab.
 */
export const PreferencesEditor = ({ mode, restaurantId }: PreferencesEditorProps) => {
  const allergens = useQuery(api.allergens.listAllergens);

  const globalProfile = useQuery(api.clientProfiles.getGlobalProfile, mode === 'global' ? {} : 'skip');
  const restaurantProfileData = useQuery(
    api.clientProfiles.getRestaurantProfile,
    mode === 'restaurant' && restaurantId ? { restaurantId } : 'skip',
  );

  const saveGlobal = useMutation(api.clientProfiles.upsertGlobalProfile);
  const saveRestaurant = useMutation(api.clientProfiles.upsertRestaurantProfile);

  const [view, setView] = useState<'form' | 'chat'>('form');
  const [tasteProfile, setTasteProfile] = useState<Taste[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<Spice>('none');
  const [allergenIdsToAvoid, setAllergenIdsToAvoid] = useState<Id<'allergens'>[]>([]);
  const [dietPreference, setDietPreference] = useState<Diet>('none');
  const [alcoholTolerance, setAlcoholTolerance] = useState<Alcohol>('none');
  const [sweetTooth, setSweetTooth] = useState(false);
  const [adventurousness, setAdventurousness] = useState<Adventurousness>('balanced');
  const [baseSpirits, setBaseSpirits] = useState<BaseSpirit[]>([]);
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [useGlobal, setUseGlobal] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isLoading =
    allergens === undefined ||
    (mode === 'global' ? globalProfile === undefined : restaurantProfileData === undefined);

  useEffect(() => {
    if (mode === 'global') {
      if (globalProfile === undefined || globalProfile === null) return;
      applyProfile(globalProfile);
    } else {
      if (!restaurantProfileData) return;
      const { restaurantProfile, globalProfile: gp } = restaurantProfileData;
      if (restaurantProfile) setUseGlobal(false);
      else if (gp) setUseGlobal(true);
      const p = restaurantProfile ?? gp;
      if (p) applyProfile(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalProfile, restaurantProfileData, mode]);

  const applyProfile = (p: {
    tasteProfile: string[];
    spiceLevel: string;
    allergenIdsToAvoid: Id<'allergens'>[];
    dietPreference: string;
    alcoholTolerance: string;
    sweetTooth?: boolean;
    adventurousness?: string;
    baseSpirits?: string[];
    occasion?: string;
  }) => {
    setTasteProfile(p.tasteProfile as Taste[]);
    setSpiceLevel(p.spiceLevel as Spice);
    setAllergenIdsToAvoid(p.allergenIdsToAvoid);
    setDietPreference(p.dietPreference as Diet);
    setAlcoholTolerance(p.alcoholTolerance as Alcohol);
    setSweetTooth(!!p.sweetTooth);
    setAdventurousness((p.adventurousness as Adventurousness) ?? 'balanced');
    setBaseSpirits((p.baseSpirits as BaseSpirit[]) ?? []);
    setOccasion((p.occasion as Occasion) ?? 'casual');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const prefs = {
      tasteProfile,
      spiceLevel,
      allergenIdsToAvoid,
      dietPreference,
      alcoholTolerance,
      sweetTooth,
      adventurousness,
      baseSpirits,
      occasion,
    };
    try {
      if (mode === 'global') {
        await saveGlobal({ ...prefs, displayName: undefined });
      } else if (restaurantId) {
        if (useGlobal) {
          await saveGlobal({ ...prefs, displayName: undefined });
          await saveRestaurant({ restaurantId, useGlobal: true, ...prefs });
        } else {
          await saveRestaurant({ restaurantId, useGlobal: false, ...prefs });
        }
      }
      setMessage('Preferencias guardadas.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Form vs assistant toggle */}
      <div className="inline-flex self-start rounded-lg border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setView('form')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ${
            view === 'form' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ClipboardList className="size-4" />
          Formulario
        </button>
        <button
          type="button"
          onClick={() => setView('chat')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors cursor-pointer ${
            view === 'chat' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="size-4" />
          Asistente
        </button>
      </div>

      {view === 'chat' ? (
        <PreferencesChatbot mode={mode} restaurantId={restaurantId} onSaved={() => setView('form')} />
      ) : (
        <form onSubmit={handleSave} className="border border-border rounded-lg p-6 bg-surface flex flex-col gap-6">
          {mode === 'restaurant' && (
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Origen de las preferencias</Label>
              <RadioGroup
                value={useGlobal ? 'global' : 'custom'}
                onValueChange={(val) => setUseGlobal(val === 'global')}
                className="flex flex-row gap-4"
              >
                <Label className="font-normal text-sm">
                  <RadioGroupItem value="global" />
                  Usar mis preferencias globales
                </Label>
                <Label className="font-normal text-sm">
                  <RadioGroupItem value="custom" />
                  Personalizar para este restaurante
                </Label>
              </RadioGroup>
            </div>
          )}

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Perfil de sabor</Label>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Nivel de picante</Label>
              <Select items={SPICE_LABELS} value={spiceLevel} onValueChange={(val) => setSpiceLevel(val as Spice)}>
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
              <Label className="mb-2 text-xs text-muted-foreground">Preferencia de dieta</Label>
              <Select items={DIET_LABELS} value={dietPreference} onValueChange={(val) => setDietPreference(val as Diet)}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 text-xs text-muted-foreground">Tolerancia al alcohol</Label>
              <Select items={ALCOHOL_LABELS} value={alcoholTolerance} onValueChange={(val) => setAlcoholTolerance(val as Alcohol)}>
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
              <Label className="mb-2 text-xs text-muted-foreground">Incluir postre</Label>
              <Select items={{ yes: 'Sí', no: 'No' }} value={sweetTooth ? 'yes' : 'no'} onValueChange={(val) => setSweetTooth(val === 'yes')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Sí</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Estilo de maridaje</Label>
            <RadioGroup
              value={adventurousness}
              onValueChange={(val) => setAdventurousness(val as Adventurousness)}
              className="flex flex-row flex-wrap gap-4"
            >
              {ADVENTUROUSNESS_OPTIONS.map((a) => (
                <Label key={a} className="font-normal text-sm">
                  <RadioGroupItem value={a} />
                  {ADVENTUROUSNESS_LABELS[a]}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Ocasión</Label>
            <Select items={OCCASION_LABELS} value={occasion} onValueChange={(val) => setOccasion(val as Occasion)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OCCASION_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {OCCASION_LABELS[o]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Licores base preferidos</Label>
            <div className="flex flex-wrap gap-3">
              {BASE_SPIRIT_OPTIONS.map((s) => (
                <Label key={s} className="font-normal text-sm">
                  <Checkbox
                    checked={baseSpirits.includes(s)}
                    onCheckedChange={() => setBaseSpirits(toggle(baseSpirits, s))}
                  />
                  {BASE_SPIRIT_LABELS[s]}
                </Label>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 text-xs text-muted-foreground">Alérgenos a evitar</Label>
            <div className="flex flex-wrap gap-3">
              {(allergens ?? []).map((a) => (
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

          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar preferencias'}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      )}
    </div>
  );
};
