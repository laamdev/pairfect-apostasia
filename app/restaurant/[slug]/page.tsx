'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useEffect, useState } from 'react';

const TASTE_OPTIONS = ['sweet', 'sour', 'salty', 'bitter', 'umami'] as const;
const SPICE_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
const DIET_OPTIONS = ['vegan', 'vegetarian', 'pescatarian', 'poultry', 'meaty', 'celiac', 'none'] as const;
const ALCOHOL_OPTIONS = ['teetotal', 'low', 'mid', 'high', 'boozy'] as const;

type Taste = (typeof TASTE_OPTIONS)[number];
type Spice = (typeof SPICE_OPTIONS)[number];
type Diet = (typeof DIET_OPTIONS)[number];
type Alcohol = (typeof ALCOHOL_OPTIONS)[number];

const TASTE_LABELS: Record<Taste, string> = {
  sweet: 'Dulce',
  sour: 'Ácido',
  salty: 'Salado',
  bitter: 'Amargo',
  umami: 'Umami',
};

const DIET_LABELS: Record<Diet, string> = {
  vegan: 'Vegana',
  vegetarian: 'Vegetariana',
  pescatarian: 'Pescetariana',
  poultry: 'Con aves',
  meaty: 'Carnívora',
  celiac: 'Celíaca (sin gluten)',
  none: 'Sin preferencia',
};

const ALCOHOL_LABELS: Record<Alcohol, string> = {
  teetotal: 'Sin alcohol',
  low: 'Bajo',
  mid: 'Medio',
  high: 'Alto',
  boozy: 'Cargado',
};

export default function RestaurantPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const restaurant = useQuery(api.restaurants.getBySlug, { slug });
  const menuItems = useQuery(
    api.menuItems.listByRestaurant,
    restaurant?._id ? { restaurantId: restaurant._id } : 'skip',
  );
  const allergens = useQuery(api.allergens.listAllergens);
  const { user } = useAuth();
  const [showPairingForm, setShowPairingForm] = useState(false);
  const existingRecommendation = useQuery(
    api.recommendationsClient.getLatestForRestaurant,
    restaurant?._id ? { restaurantId: restaurant._id } : 'skip',
  );
  const deleteRecommendation = useMutation(api.recommendationsClient.deleteRecommendation);

  if (restaurant === undefined) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-slate-600 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (restaurant === null) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-slate-600 dark:text-slate-400">Restaurant not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-8">
      <div>
        <Link href="/" className="text-sm text-slate-600 dark:text-slate-400 hover:underline">
          Volver a restaurantes
        </Link>
      </div>
      <header>
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.description && <p className="text-slate-600 dark:text-slate-400 mt-1">{restaurant.description}</p>}
      </header>

      {menuItems !== undefined && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <MenuByCategory items={menuItems} />
        </section>
      )}

      <section className="border-t border-slate-200 dark:border-slate-700 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Mis maridajes</h2>
          <button
            type="button"
            onClick={() => setShowPairingForm((prev) => !prev)}
            className="bg-foreground text-background px-4 py-2 rounded-md text-sm"
          >
            {showPairingForm ? 'Ocultar formulario' : 'Ver formulario de maridajes'}
          </button>
        </div>

        {user && existingRecommendation && existingRecommendation.items.length > 0 && (
          <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-semibold mb-2">Tu maridaje guardado</h3>
            <ol className="list-decimal list-inside flex flex-col gap-2 mb-4">
              {existingRecommendation.items.map((item, i) => (
                <li key={i}>
                  <span className="font-medium">{item.name}</span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">
                    ({item.matchPercentage}% match)
                  </span>
                  {item.reason && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-6 mt-0.5">
                      {item.reason}
                    </p>
                  )}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPairingForm(true)}
                className="bg-foreground text-background px-3 py-1.5 rounded-md text-sm"
              >
                Editar maridaje
              </button>
              <button
                type="button"
                onClick={() => setShowPairingForm(true)}
                className="border border-slate-300 dark:border-slate-600 text-sm px-3 py-1.5 rounded-md"
              >
                Crear otro maridaje
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!existingRecommendation?._id) return;
                  await deleteRecommendation({ recommendationId: existingRecommendation._id });
                }}
                className="text-sm px-3 py-1.5 rounded-md border border-red-500 text-red-600"
              >
                Eliminar maridaje
              </button>
            </div>
          </div>
        )}

        {showPairingForm &&
          (user ? (
            <PreferencesForm restaurantId={restaurant._id} allergens={allergens ?? []} />
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Inicia sesión para obtener maridajes personalizados de comida y bebida
              </p>
              <Link
                href="/sign-in"
                className="inline-block bg-foreground text-background px-4 py-2 rounded-md text-sm"
              >
                Sign in
              </Link>
            </>
          ))}
      </section>
    </div>
  );
}

function MenuByCategory({
  items,
}: {
  items: Array<{
    _id: Id<'menuItems'>;
    name: string;
    description: string;
    category: string;
  }>;
}) {
  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categories = Object.keys(byCategory).sort();

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">{cat}</h3>
          <ul className="flex flex-col gap-3">
            {byCategory[cat].map((item) => (
              <li
                key={item._id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-800/50"
              >
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PreferencesForm({
  restaurantId,
  allergens,
}: {
  restaurantId: Id<'restaurants'>;
  allergens: Array<{ _id: Id<'allergens'>; name: string }>;
}) {
  const [tasteProfile, setTasteProfile] = useState<Taste[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<Spice>('none');
  const [allergenIdsToAvoid, setAllergenIdsToAvoid] = useState<Id<'allergens'>[]>([]);
  const [dietPreference, setDietPreference] = useState<Diet>('none');
  const [alcoholTolerance, setAlcoholTolerance] = useState<Alcohol>('teetotal');
  const [sweetTooth, setSweetTooth] = useState(false);
  const [useGlobal, setUseGlobal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Array<{ name: string; matchPercentage: number; reason?: string }> | null>(null);

  const generateRecommendations = useAction(api.recommendations.generateRecommendations);
  const profileData = useQuery(api.clientProfiles.getRestaurantProfile, { restaurantId });
  const saveRestaurantProfile = useMutation(api.clientProfiles.upsertRestaurantProfile);
  const saveGlobalProfile = useMutation(api.clientProfiles.upsertGlobalProfile);

  useEffect(() => {
    if (!profileData) return;
    const { restaurantProfile, globalProfile } = profileData as any;
    if (restaurantProfile) {
      setUseGlobal(false);
      setTasteProfile(restaurantProfile.tasteProfile as Taste[]);
      setSpiceLevel(restaurantProfile.spiceLevel as Spice);
      setAllergenIdsToAvoid(restaurantProfile.allergenIdsToAvoid as Id<'allergens'>[]);
      setDietPreference(restaurantProfile.dietPreference as Diet);
      setAlcoholTolerance(restaurantProfile.alcoholTolerance as Alcohol);
      setSweetTooth(!!restaurantProfile.sweetTooth);
    } else if (globalProfile) {
      setUseGlobal(true);
      setTasteProfile(globalProfile.tasteProfile as Taste[]);
      setSpiceLevel(globalProfile.spiceLevel as Spice);
      setAllergenIdsToAvoid(globalProfile.allergenIdsToAvoid as Id<'allergens'>[]);
      setDietPreference(globalProfile.dietPreference as Diet);
      setAlcoholTolerance(globalProfile.alcoholTolerance as Alcohol);
      setSweetTooth(!!globalProfile.sweetTooth);
    }
  }, [profileData]);

  const toggleTaste = (t: Taste) => {
    setTasteProfile((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleAllergen = (id: Id<'allergens'>) => {
    setAllergenIdsToAvoid((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      // Persist preferences
      if (useGlobal) {
        await saveGlobalProfile({
          tasteProfile,
          spiceLevel,
          allergenIdsToAvoid,
          dietPreference,
          alcoholTolerance,
          sweetTooth,
          displayName: undefined,
        });
        await saveRestaurantProfile({
          restaurantId,
          useGlobal: true,
          tasteProfile,
          spiceLevel,
          allergenIdsToAvoid,
          dietPreference,
          alcoholTolerance,
          sweetTooth,
        });
      } else {
        await saveRestaurantProfile({
          restaurantId,
          useGlobal: false,
          tasteProfile,
          spiceLevel,
          allergenIdsToAvoid,
          dietPreference,
          alcoholTolerance,
          sweetTooth,
        });
      }

      const pairings = await generateRecommendations({
        restaurantId,
        preferences: {
          tasteProfile,
          spiceLevel,
          allergenIdsToAvoid,
          dietPreference,
          alcoholTolerance,
          sweetTooth,
        },
      });
      setResult(pairings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4 items-center">
        <span className="text-sm font-medium">Origen de preferencias</span>
        <label className="inline-flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="prefsMode"
            checked={useGlobal}
            onChange={() => setUseGlobal(true)}
          />
          <span>Usar mis preferencias globales</span>
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          <input
            type="radio"
            name="prefsMode"
            checked={!useGlobal}
            onChange={() => setUseGlobal(false)}
          />
          <span>Personalizar para este restaurante</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Perfil de sabor (elige los que quieras)</label>
        <div className="flex flex-wrap gap-2">
          {TASTE_OPTIONS.map((t) => (
            <label key={t} className="inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={tasteProfile.includes(t)}
                onChange={() => toggleTaste(t)}
              />
              <span>{TASTE_LABELS[t]}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Nivel de picante</label>
        <select
          value={spiceLevel}
          onChange={(e) => setSpiceLevel(e.target.value as Spice)}
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-background"
        >
          {SPICE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === 'none' ? 'Nada' : s === 'low' ? 'Bajo' : s === 'mid' ? 'Medio' : 'Alto'}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Alérgenos a evitar</label>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {allergens.map((a) => (
            <label key={a._id} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allergenIdsToAvoid.includes(a._id)}
                onChange={() => toggleAllergen(a._id)}
              />
              <span>{a.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preferencia de dieta</label>
        <select
          value={dietPreference}
          onChange={(e) => setDietPreference(e.target.value as Diet)}
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-background"
        >
          {DIET_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {DIET_LABELS[d]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tolerancia al alcohol</label>
        <select
          value={alcoholTolerance}
          onChange={(e) => setAlcoholTolerance(e.target.value as Alcohol)}
          className="border border-slate-300 dark:border-slate-600 rounded px-3 py-2 bg-background"
        >
          {ALCOHOL_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {ALCOHOL_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="sweetToothRest"
          type="checkbox"
          checked={sweetTooth}
          onChange={(e) => setSweetTooth(e.target.checked)}
        />
        <label htmlFor="sweetToothRest" className="text-sm">
          Me apetece postre en este momento
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-foreground text-background px-4 py-2 rounded-md font-medium disabled:opacity-50"
      >
        {loading ? 'Buscando tus maridajes…' : 'Ver mis 3 maridajes'}
      </button>

      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      {result && result.length > 0 && (
        <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-semibold mb-2">Your top 3 pairings</h3>
          <ol className="list-decimal list-inside flex flex-col gap-2">
            {result.map((item, i) => (
              <li key={i}>
                <span className="font-medium">{item.name}</span>{' '}
                <span className="text-slate-600 dark:text-slate-400">({item.matchPercentage}% match)</span>
                {item.reason && <p className="text-sm text-slate-600 dark:text-slate-400 ml-6 mt-0.5">{item.reason}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}
    </form>
  );
}
