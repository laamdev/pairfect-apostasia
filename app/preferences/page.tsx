'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormSkeleton } from '@/components/skeletons';

const TASTE_OPTIONS = ['sweet', 'sour', 'salty', 'bitter', 'umami'] as const;
const SPICE_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
const DIET_OPTIONS = ['vegan', 'vegetarian', 'pescatarian', 'poultry', 'meaty', 'celiac', 'none'] as const;
const ALCOHOL_OPTIONS = ['none', 'low', 'mid', 'high'] as const;

type Taste = (typeof TASTE_OPTIONS)[number];
type Spice = (typeof SPICE_OPTIONS)[number];
type Diet = (typeof DIET_OPTIONS)[number];
type Alcohol = (typeof ALCOHOL_OPTIONS)[number];

const TASTE_LABELS: Record<Taste, string> = { sweet: 'Sweet', sour: 'Sour', salty: 'Salty', bitter: 'Bitter', umami: 'Umami' };
const DIET_LABELS: Record<Diet, string> = { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', poultry: 'Poultry', meaty: 'Meaty', celiac: 'Celiac (gluten-free)', none: 'No preference' };
const ALCOHOL_LABELS: Record<Alcohol, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };
const SPICE_LABELS: Record<Spice, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };

export default function PreferencesPage() {
  const profile = useQuery(api.clientProfiles.getGlobalProfile);
  const allergens = useQuery(api.allergens.listAllergens);
  const save = useMutation(api.clientProfiles.upsertGlobalProfile);

  const [tasteProfile, setTasteProfile] = useState<Taste[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<Spice>('none');
  const [allergenIdsToAvoid, setAllergenIdsToAvoid] = useState<Id<'allergens'>[]>([]);
  const [dietPreference, setDietPreference] = useState<Diet>('none');
  const [alcoholTolerance, setAlcoholTolerance] = useState<Alcohol>('none');
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

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Preferences</h1>
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Back</a>
      </header>

      {profile === undefined && <FormSkeleton />}

      {profile !== undefined && profile !== null && !isEditing && (
        <section className="p-4 rounded-lg border border-border bg-surface" aria-label="Current preferences">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Your current preferences</h2>
            <Button variant="link" onClick={() => setIsEditing(true)}>Edit</Button>
          </div>
          <dl className="grid gap-2 text-sm">
            <div><dt className="text-muted-foreground">Taste profile</dt><dd>{tasteProfile.length === 0 ? 'None selected' : tasteProfile.map((t) => TASTE_LABELS[t]).join(', ')}</dd></div>
            <div><dt className="text-muted-foreground">Spice level</dt><dd>{SPICE_LABELS[spiceLevel]}</dd></div>
            <div><dt className="text-muted-foreground">Allergens to avoid</dt><dd>{allergenNames.length === 0 ? 'None' : allergenNames.join(', ')}</dd></div>
            <div><dt className="text-muted-foreground">Diet preference</dt><dd>{DIET_LABELS[dietPreference]}</dd></div>
            <div><dt className="text-muted-foreground">Alcohol tolerance</dt><dd>{ALCOHOL_LABELS[alcoholTolerance]}</dd></div>
            <div><dt className="text-muted-foreground">Include dessert in pairings</dt><dd>{sweetTooth ? 'Yes' : 'No'}</dd></div>
          </dl>
        </section>
      )}

      {profile !== undefined && profile === null && !isEditing && (
        <p className="text-muted-foreground text-sm">You haven&apos;t saved any preferences yet. Fill out the form and click Save.</p>
      )}

      {(profile === null || isEditing) && (
        <form onSubmit={handleSave} className="border border-border rounded-lg p-5 bg-surface flex flex-col gap-5">
          <h2 className="text-lg font-medium">Edit preferences</h2>
          <div>
            <Label className="mb-2">Taste profile (select all that apply)</Label>
            <div className="flex flex-wrap gap-3">
              {TASTE_OPTIONS.map((t) => (
                <Label key={t} className="font-normal">
                  <Checkbox checked={tasteProfile.includes(t)} onCheckedChange={() => setTasteProfile(toggle(tasteProfile, t))} />
                  {TASTE_LABELS[t]}
                </Label>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2">Spice level</Label>
            <Select value={spiceLevel} onValueChange={(val) => setSpiceLevel(val as Spice)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPICE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{SPICE_LABELS[s]}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2">Allergens to avoid</Label>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
              {(allergens ?? []).map((a) => (
                <Label key={a._id} className="font-normal">
                  <Checkbox checked={allergenIdsToAvoid.includes(a._id)} onCheckedChange={() => setAllergenIdsToAvoid(toggle(allergenIdsToAvoid, a._id))} />
                  {a.name}
                </Label>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2">Diet preference</Label>
            <Select value={dietPreference} onValueChange={(val) => setDietPreference(val as Diet)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIET_OPTIONS.map((d) => (<SelectItem key={d} value={d}>{DIET_LABELS[d]}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2">Alcohol tolerance</Label>
            <Select value={alcoholTolerance} onValueChange={(val) => setAlcoholTolerance(val as Alcohol)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALCOHOL_OPTIONS.map((a) => (<SelectItem key={a} value={a}>{ALCOHOL_LABELS[a]}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Label className="font-normal">
            <Checkbox checked={sweetTooth} onCheckedChange={(checked) => setSweetTooth(checked === true)} />
            I want dessert (include dessert in my pairings)
          </Label>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save preferences'}
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      )}
    </main>
  );
}
