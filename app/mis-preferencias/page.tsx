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

export default function MisPreferenciasPage() {
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
    if (profile === null) {
      // No prefs yet: start directly in edit mode with defaults.
      setIsEditing(true);
      return;
    }
    setIsEditing(false);
    setTasteProfile(profile.tasteProfile as Taste[]);
    setSpiceLevel(profile.spiceLevel as Spice);
    setAllergenIdsToAvoid(profile.allergenIdsToAvoid as Id<'allergens'>[]);
    setDietPreference(profile.dietPreference as Diet);
    setAlcoholTolerance(profile.alcoholTolerance as Alcohol);
    setSweetTooth(!!profile.sweetTooth);
  }, [profile]);

  const toggleTaste = (t: Taste) => {
    setTasteProfile((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const toggleAllergen = (id: Id<'allergens'>) => {
    setAllergenIdsToAvoid((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await save({
        tasteProfile,
        spiceLevel,
        allergenIdsToAvoid,
        dietPreference,
        alcoholTolerance,
        sweetTooth,
        displayName: undefined,
      });
      setMessage('Preferencias guardadas.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const allergenNames =
    allergens?.filter((a) => allergenIdsToAvoid.includes(a._id)).map((a) => a.name) ?? [];

  return (
    <main className="p-8 max-w-2xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis preferencias</h1>
        <a href="/" className="text-sm underline">
          Volver
        </a>
      </header>

      {profile === undefined && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">Cargando preferencias…</p>
      )}

      {profile !== undefined && profile !== null && !isEditing && (
        <section
          className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
          aria-label="Preferencias actuales"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Tus preferencias actuales</h2>
            <button
              type="button"
              className="text-sm underline"
              onClick={() => setIsEditing(true)}
            >
              Editar
            </button>
          </div>
          <dl className="grid gap-2 text-sm">
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Perfil de sabor</dt>
              <dd>
                {tasteProfile.length === 0
                  ? 'Ninguno elegido'
                  : tasteProfile.map((t) => TASTE_LABELS[t]).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Nivel de picante</dt>
              <dd>
                {spiceLevel === 'none' ? 'Nada' : spiceLevel === 'low' ? 'Bajo' : spiceLevel === 'mid' ? 'Medio' : 'Alto'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Alérgenos a evitar</dt>
              <dd>{allergenNames.length === 0 ? 'Ninguno' : allergenNames.join(', ')}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Preferencia de dieta</dt>
              <dd>{DIET_LABELS[dietPreference]}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Tolerancia al alcohol</dt>
              <dd>{ALCOHOL_LABELS[alcoholTolerance]}</dd>
            </div>
            <div>
              <dt className="text-slate-600 dark:text-slate-400">Incluir postre en maridajes</dt>
              <dd>{sweetTooth ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
        </section>
      )}

      {profile !== undefined && profile === null && !isEditing && (
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          Aún no tienes preferencias guardadas. Rellena el formulario y pulsa Guardar.
        </p>
      )}

      {(profile === null || isEditing) && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Editar preferencias</h2>
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
            {(allergens ?? []).map((a) => (
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
            id="sweetTooth"
            type="checkbox"
            checked={sweetTooth}
            onChange={(e) => setSweetTooth(e.target.checked)}
          />
          <label htmlFor="sweetTooth" className="text-sm">
            Me apetece postre (incluir postre en mis maridajes)
          </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-foreground text-background px-4 py-2 rounded-md font-medium disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar preferencias'}
          </button>

          {message && <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>}
        </form>
      )}
    </main>
  );
}

