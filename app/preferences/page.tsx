'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

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

export default function PreferencesPage() {
  const profile = useQuery(api.clientProfiles.getGlobalProfile);
  const allergens = useQuery(api.allergens.listAllergens);
  const save = useMutation(api.clientProfiles.upsertGlobalProfile);

  const [tasteProfile, setTasteProfile] = useState<Taste[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<Spice>('none');
  const [allergenIdsToAvoid, setAllergenIdsToAvoid] = useState<Id<'allergens'>[]>([]);
  const [dietPreference, setDietPreference] = useState<Diet>('none');
  const [alcoholTolerance, setAlcoholTolerance] = useState<Alcohol>('teetotal');
  const [sweetTooth, setSweetTooth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile === undefined) return;
    if (profile === null) { setIsEditing(true); return; }
    setIsEditing(false);
    setTasteProfile(profile.tasteProfile as Taste[]);
    setSpiceLevel(profile.spiceLevel as Spice);
    setAllergenIdsToAvoid(profile.allergenIdsToAvoid as Id<'allergens'>[]);
    setDietPreference(profile.dietPreference as Diet);
    setAlcoholTolerance(profile.alcoholTolerance as Alcohol);
    setSweetTooth(!!profile.sweetTooth);
  }, [profile]);

  const toggle = <T,>(arr: T[], val: T) => arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMessage(null);
    try { await save({ tasteProfile, spiceLevel, allergenIdsToAvoid, dietPreference, alcoholTolerance, sweetTooth, displayName: undefined }); setMessage('Preferences saved.'); }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Failed to save preferences'); }
    finally { setSaving(false); }
  };

  const allergenNames = allergens?.filter((a) => allergenIdsToAvoid.includes(a._id)).map((a) => a.name) ?? [];
  const inputCls = "border border-border rounded px-3 py-2 bg-surface text-foreground focus:border-accent outline-none";

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Preferences</h1>
        <a href="/" className="text-sm text-muted hover:text-foreground transition-colors">Back</a>
      </header>

      {profile === undefined && <p className="text-muted text-sm">Loading preferences...</p>}

      {profile !== undefined && profile !== null && !isEditing && (
        <section className="p-4 rounded-lg border border-border bg-surface" aria-label="Current preferences">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Your current preferences</h2>
            <button type="button" className="text-sm text-accent hover:text-accent-hover transition-colors" onClick={() => setIsEditing(true)}>Edit</button>
          </div>
          <dl className="grid gap-2 text-sm">
            <div><dt className="text-muted">Taste profile</dt><dd>{tasteProfile.length === 0 ? 'None selected' : tasteProfile.map((t) => TASTE_LABELS[t]).join(', ')}</dd></div>
            <div><dt className="text-muted">Spice level</dt><dd>{SPICE_LABELS[spiceLevel]}</dd></div>
            <div><dt className="text-muted">Allergens to avoid</dt><dd>{allergenNames.length === 0 ? 'None' : allergenNames.join(', ')}</dd></div>
            <div><dt className="text-muted">Diet preference</dt><dd>{DIET_LABELS[dietPreference]}</dd></div>
            <div><dt className="text-muted">Alcohol tolerance</dt><dd>{ALCOHOL_LABELS[alcoholTolerance]}</dd></div>
            <div><dt className="text-muted">Include dessert in pairings</dt><dd>{sweetTooth ? 'Yes' : 'No'}</dd></div>
          </dl>
        </section>
      )}

      {profile !== undefined && profile === null && !isEditing && (
        <p className="text-muted text-sm">You haven't saved any preferences yet. Fill out the form and click Save.</p>
      )}

      {(profile === null || isEditing) && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Edit preferences</h2>
          <div>
            <label className="block text-sm font-medium mb-2">Taste profile (select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {TASTE_OPTIONS.map((t) => (<label key={t} className="inline-flex items-center gap-1"><input type="checkbox" checked={tasteProfile.includes(t)} onChange={() => setTasteProfile(toggle(tasteProfile, t))} className="accent-accent" /><span>{TASTE_LABELS[t]}</span></label>))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Spice level</label>
            <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value as Spice)} className={inputCls}>
              {SPICE_OPTIONS.map((s) => (<option key={s} value={s}>{SPICE_LABELS[s]}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Allergens to avoid</label>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {(allergens ?? []).map((a) => (<label key={a._id} className="inline-flex items-center gap-2"><input type="checkbox" checked={allergenIdsToAvoid.includes(a._id)} onChange={() => setAllergenIdsToAvoid(toggle(allergenIdsToAvoid, a._id))} className="accent-accent" /><span>{a.name}</span></label>))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Diet preference</label>
            <select value={dietPreference} onChange={(e) => setDietPreference(e.target.value as Diet)} className={inputCls}>
              {DIET_OPTIONS.map((d) => (<option key={d} value={d}>{DIET_LABELS[d]}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Alcohol tolerance</label>
            <select value={alcoholTolerance} onChange={(e) => setAlcoholTolerance(e.target.value as Alcohol)} className={inputCls}>
              {ALCOHOL_OPTIONS.map((a) => (<option key={a} value={a}>{ALCOHOL_LABELS[a]}</option>))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="sweetTooth" type="checkbox" checked={sweetTooth} onChange={(e) => setSweetTooth(e.target.checked)} className="accent-accent" />
            <label htmlFor="sweetTooth" className="text-sm">I want dessert (include dessert in my pairings)</label>
          </div>
          <button type="submit" disabled={saving} className="bg-accent text-background px-4 py-2 rounded-md font-medium disabled:opacity-50 hover:bg-accent-hover transition-colors">
            {saving ? 'Saving...' : 'Save preferences'}
          </button>
          {message && <p className="text-sm text-muted">{message}</p>}
        </form>
      )}
    </main>
  );
}
