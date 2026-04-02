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

const TASTE_LABELS: Record<Taste, string> = { sweet: 'Sweet', sour: 'Sour', salty: 'Salty', bitter: 'Bitter', umami: 'Umami' };
const DIET_LABELS: Record<Diet, string> = { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', poultry: 'Poultry', meaty: 'Meaty', celiac: 'Celiac (gluten-free)', none: 'No preference' };
const ALCOHOL_LABELS: Record<Alcohol, string> = { teetotal: 'No alcohol', low: 'Low', mid: 'Medium', high: 'High', boozy: 'Boozy' };
const SPICE_LABELS: Record<Spice, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };

export default function RestaurantPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const restaurant = useQuery(api.restaurants.getBySlug, { slug });
  const menuItems = useQuery(api.menuItems.listByRestaurant, restaurant?._id ? { restaurantId: restaurant._id } : 'skip');
  const allergens = useQuery(api.allergens.listAllergens);
  const { user } = useAuth();
  const [showPairingForm, setShowPairingForm] = useState(false);
  const existingRecommendation = useQuery(api.recommendationsClient.getLatestForRestaurant, restaurant?._id ? { restaurantId: restaurant._id } : 'skip');
  const deleteRecommendation = useMutation(api.recommendationsClient.deleteRecommendation);

  if (restaurant === undefined) return <div className="p-8 max-w-2xl mx-auto"><p className="text-muted">Loading...</p></div>;

  if (restaurant === null) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <p className="text-muted">Restaurant not found.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-accent">Back to restaurants</Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col gap-8">
      <div><Link href="/" className="text-sm text-muted hover:text-foreground transition-colors">Back to restaurants</Link></div>
      <header>
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.description && <p className="text-muted mt-1">{restaurant.description}</p>}
      </header>

      {menuItems !== undefined && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Menu</h2>
          <MenuByCategory items={menuItems} />
        </section>
      )}

      <section className="border-t border-border pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Pairings</h2>
          <button type="button" onClick={() => setShowPairingForm((prev) => !prev)} className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors">
            {showPairingForm ? 'Hide form' : 'Show pairing form'}
          </button>
        </div>

        {user && existingRecommendation && existingRecommendation.items.length > 0 && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-surface">
            <h3 className="font-semibold mb-2">Your saved pairing</h3>
            <ol className="list-decimal list-inside flex flex-col gap-2 mb-4">
              {existingRecommendation.items.map((item, i) => (
                <li key={i}>
                  <span className="font-medium">{item.name}</span>{' '}
                  <span className="text-muted">({item.matchPercentage}% match)</span>
                  {item.reason && <p className="text-sm text-muted ml-6 mt-0.5">{item.reason}</p>}
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowPairingForm(true)} className="bg-accent text-background px-3 py-1.5 rounded-md text-sm hover:bg-accent-hover transition-colors">Edit pairing</button>
              <button type="button" onClick={() => setShowPairingForm(true)} className="border border-border text-sm px-3 py-1.5 rounded-md text-muted hover:text-foreground transition-colors">Create new pairing</button>
              <button type="button" onClick={async () => { if (!existingRecommendation?._id) return; await deleteRecommendation({ recommendationId: existingRecommendation._id }); }} className="text-sm px-3 py-1.5 rounded-md border border-red-400/30 text-red-400 hover:bg-red-400/10 transition-colors">Delete pairing</button>
            </div>
          </div>
        )}

        {showPairingForm && (user ? (
          <PreferencesForm restaurantId={restaurant._id} allergens={allergens ?? []} />
        ) : (
          <>
            <p className="text-muted mb-2">Sign in to get personalized food and drink pairings</p>
            <Link href="/auth/client" className="inline-block bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors">Sign in</Link>
          </>
        ))}
      </section>
    </div>
  );
}

function MenuByCategory({ items }: { items: Array<{ _id: Id<'menuItems'>; name: string; description: string; category: string }> }) {
  const byCategory = items.reduce<Record<string, typeof items>>((acc, item) => { const cat = item.category || 'Other'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {});
  return (
    <div className="flex flex-col gap-6">
      {Object.keys(byCategory).sort().map((cat) => (
        <div key={cat}>
          <h3 className="text-lg font-medium mb-2">{cat}</h3>
          <ul className="flex flex-col gap-3">
            {byCategory[cat].map((item) => (
              <li key={item._id} className="border border-border rounded-lg p-3 bg-surface">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted mt-1">{item.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function PreferencesForm({ restaurantId, allergens }: { restaurantId: Id<'restaurants'>; allergens: Array<{ _id: Id<'allergens'>; name: string }> }) {
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
    const p = restaurantProfile ?? globalProfile;
    if (restaurantProfile) setUseGlobal(false);
    else if (globalProfile) setUseGlobal(true);
    if (p) {
      setTasteProfile(p.tasteProfile as Taste[]); setSpiceLevel(p.spiceLevel as Spice);
      setAllergenIdsToAvoid(p.allergenIdsToAvoid as Id<'allergens'>[]); setDietPreference(p.dietPreference as Diet);
      setAlcoholTolerance(p.alcoholTolerance as Alcohol); setSweetTooth(!!p.sweetTooth);
    }
  }, [profileData]);

  const toggle = <T,>(arr: T[], val: T) => arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setResult(null); setLoading(true);
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
    } catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); }
  };

  const inputCls = "border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-4 items-center flex-wrap">
        <span className="text-sm font-medium">Preference source</span>
        <label className="inline-flex items-center gap-1 text-sm"><input type="radio" name="prefsMode" checked={useGlobal} onChange={() => setUseGlobal(true)} className="accent-accent" /><span>Use my global preferences</span></label>
        <label className="inline-flex items-center gap-1 text-sm"><input type="radio" name="prefsMode" checked={!useGlobal} onChange={() => setUseGlobal(false)} className="accent-accent" /><span>Customize for this restaurant</span></label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Taste profile (select all that apply)</label>
        <div className="flex flex-wrap gap-2">{TASTE_OPTIONS.map((t) => (<label key={t} className="inline-flex items-center gap-1"><input type="checkbox" checked={tasteProfile.includes(t)} onChange={() => setTasteProfile(toggle(tasteProfile, t))} className="accent-accent" /><span>{TASTE_LABELS[t]}</span></label>))}</div>
      </div>
      <div><label className="block text-sm font-medium mb-2">Spice level</label><select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value as Spice)} className={inputCls}>{SPICE_OPTIONS.map((s) => (<option key={s} value={s}>{SPICE_LABELS[s]}</option>))}</select></div>
      <div><label className="block text-sm font-medium mb-2">Allergens to avoid</label><div className="flex flex-col gap-1 max-h-40 overflow-y-auto">{allergens.map((a) => (<label key={a._id} className="inline-flex items-center gap-2"><input type="checkbox" checked={allergenIdsToAvoid.includes(a._id)} onChange={() => setAllergenIdsToAvoid(toggle(allergenIdsToAvoid, a._id))} className="accent-accent" /><span>{a.name}</span></label>))}</div></div>
      <div><label className="block text-sm font-medium mb-2">Diet preference</label><select value={dietPreference} onChange={(e) => setDietPreference(e.target.value as Diet)} className={inputCls}>{DIET_OPTIONS.map((d) => (<option key={d} value={d}>{DIET_LABELS[d]}</option>))}</select></div>
      <div><label className="block text-sm font-medium mb-2">Alcohol tolerance</label><select value={alcoholTolerance} onChange={(e) => setAlcoholTolerance(e.target.value as Alcohol)} className={inputCls}>{ALCOHOL_OPTIONS.map((a) => (<option key={a} value={a}>{ALCOHOL_LABELS[a]}</option>))}</select></div>
      <div className="flex items-center gap-2"><input id="sweetToothRest" type="checkbox" checked={sweetTooth} onChange={(e) => setSweetTooth(e.target.checked)} className="accent-accent" /><label htmlFor="sweetToothRest" className="text-sm">I want dessert right now</label></div>
      <button type="submit" disabled={loading} className="bg-accent text-background px-4 py-2 rounded-md font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors">
        {loading ? 'Finding your pairings...' : 'Get my 3 pairings'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && result.length > 0 && (
        <div className="mt-4 p-4 border border-border rounded-lg bg-surface">
          <h3 className="font-semibold mb-2">Your top 3 pairings</h3>
          <ol className="list-decimal list-inside flex flex-col gap-2">
            {result.map((item, i) => (<li key={i}><span className="font-medium">{item.name}</span>{' '}<span className="text-muted">({item.matchPercentage}% match)</span>{item.reason && <p className="text-sm text-muted ml-6 mt-0.5">{item.reason}</p>}</li>))}
          </ol>
        </div>
      )}
    </form>
  );
}
