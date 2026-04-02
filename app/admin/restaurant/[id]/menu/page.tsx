'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { useState } from 'react';

const TASTE_OPTIONS = ['sweet', 'sour', 'salty', 'bitter', 'umami'] as const;
const SPICE_OPTIONS = ['none', 'low', 'mid', 'high'] as const;
const DIET_OPTIONS = ['vegan', 'vegetarian', 'pescatarian', 'poultry', 'meaty', 'celiac', 'none'] as const;
const ALCOHOL_OPTIONS = ['teetotal', 'low', 'mid', 'high', 'boozy'] as const;

type Taste = (typeof TASTE_OPTIONS)[number];
type Spice = (typeof SPICE_OPTIONS)[number];
type Diet = (typeof DIET_OPTIONS)[number];
type Alcohol = (typeof ALCOHOL_OPTIONS)[number];

const TASTE_LABELS: Record<Taste, string> = { sweet: 'Sweet', sour: 'Sour', salty: 'Salty', bitter: 'Bitter', umami: 'Umami' };
const DIET_LABELS: Record<Diet, string> = { vegan: 'Vegan', vegetarian: 'Vegetarian', pescatarian: 'Pescatarian', poultry: 'Poultry', meaty: 'Meaty', celiac: 'Celiac', none: 'No restriction' };
const SPICE_LABELS: Record<Spice, string> = { none: 'None', low: 'Low', mid: 'Medium', high: 'High' };

export default function MenuEditorPage() {
  const params = useParams();
  const restaurantId = params.id as Id<'restaurants'>;
  const menuItems = useQuery(api.menuItems.listByRestaurant, { restaurantId });
  const allergens = useQuery(api.allergens.listAllergens);
  const restaurants = useQuery(api.restaurants.listMyRestaurants);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<Id<'menuItems'> | null>(null);
  const restaurant = restaurants?.find((r) => r._id === restaurantId);

  if (menuItems === undefined || allergens === undefined) return <main className="p-8 max-w-3xl mx-auto"><p className="text-muted">Loading...</p></main>;

  const byCategory = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => { const cat = item.category || 'Other'; if (!acc[cat]) acc[cat] = []; acc[cat].push(item); return acc; }, {});
  const categories = Object.keys(byCategory).sort();

  return (
    <main className="p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Link href={`/admin/restaurant/${restaurantId}`} className="text-sm text-muted hover:text-foreground transition-colors">
          Back to {restaurant?.name ?? 'restaurant'}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <button type="button" onClick={() => { setEditingId(null); setShowForm(true); }} className="bg-accent text-background px-4 py-2 rounded-md text-sm hover:bg-accent-hover transition-colors">
          + Add item
        </button>
      </div>

      {showForm && <MenuItemForm restaurantId={restaurantId} allergens={allergens} editingId={editingId} existingItems={menuItems} onDone={() => { setShowForm(false); setEditingId(null); }} />}

      {menuItems.length === 0 && !showForm && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted mb-4">Your menu is empty. Add your first item.</p>
        </div>
      )}

      {categories.map((cat) => (
        <section key={cat}>
          <h2 className="text-lg font-medium text-foreground mb-3">{cat}</h2>
          <ul className="flex flex-col gap-2">
            {byCategory[cat].map((item) => (
              <MenuItemRow key={item._id} item={item} allergens={allergens} onEdit={() => { setEditingId(item._id); setShowForm(true); }} />
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}

function MenuItemRow({ item, allergens, onEdit }: { item: { _id: Id<'menuItems'>; name: string; description: string; category: string; allergenIds: Id<'allergens'>[]; containsAlcohol: boolean; price?: number }; allergens: Array<{ _id: Id<'allergens'>; name: string }>; onEdit: () => void }) {
  const deleteItem = useMutation(api.menuItems.deleteMenuItem);
  const [deleting, setDeleting] = useState(false);
  const allergenNames = item.allergenIds.map((id) => allergens.find((a) => a._id === id)?.name).filter(Boolean);

  return (
    <li className="border border-border rounded-lg p-3 bg-surface flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted mt-0.5">{item.description}</p>
        <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted">
          {item.price != null && <span>{item.price.toFixed(2)} €</span>}
          {item.containsAlcohol && <span className="text-accent">Alcohol</span>}
          {allergenNames.length > 0 && <span>Allergens: {allergenNames.join(', ')}</span>}
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button type="button" onClick={onEdit} className="text-xs border border-border px-2 py-1 rounded text-muted hover:text-foreground hover:border-foreground transition-colors">Edit</button>
        <button type="button" disabled={deleting} onClick={async () => { if (!confirm('Delete this item?')) return; setDeleting(true); await deleteItem({ menuItemId: item._id }); }} className="text-xs border border-red-400/30 text-red-400 px-2 py-1 rounded hover:bg-red-400/10 disabled:opacity-50 transition-colors">
          {deleting ? '...' : 'Delete'}
        </button>
      </div>
    </li>
  );
}

function MenuItemForm({ restaurantId, allergens, editingId, existingItems, onDone }: { restaurantId: Id<'restaurants'>; allergens: Array<{ _id: Id<'allergens'>; name: string }>; editingId: Id<'menuItems'> | null; existingItems: Array<{ _id: Id<'menuItems'>; name: string; description: string; category: string; allergenIds: Id<'allergens'>[]; dietTags?: Diet[]; containsAlcohol: boolean; alcoholLevel?: Alcohol; tasteProfile?: Taste[]; spiceLevel?: Spice; price?: number; sortOrder?: number }>; onDone: () => void }) {
  const existing = editingId ? existingItems.find((i) => i._id === editingId) : null;
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [allergenIds, setAllergenIds] = useState<Id<'allergens'>[]>(existing?.allergenIds ?? []);
  const [dietTags, setDietTags] = useState<Diet[]>((existing?.dietTags as Diet[]) ?? []);
  const [containsAlcohol, setContainsAlcohol] = useState(existing?.containsAlcohol ?? false);
  const [alcoholLevel, setAlcoholLevel] = useState<Alcohol | ''>((existing?.alcoholLevel as Alcohol) ?? '');
  const [tasteProfile, setTasteProfile] = useState<Taste[]>((existing?.tasteProfile as Taste[]) ?? []);
  const [spiceLevel, setSpiceLevel] = useState<Spice>((existing?.spiceLevel as Spice) ?? 'none');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createItem = useMutation(api.menuItems.createMenuItem);
  const updateItem = useMutation(api.menuItems.updateMenuItem);

  const toggle = <T,>(arr: T[], val: T) => arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const priceNum = price ? parseFloat(price) : undefined;
      const sortNum = sortOrder ? parseInt(sortOrder, 10) : undefined;
      const common = { name, description, category, allergenIds, dietTags: dietTags.length > 0 ? dietTags : undefined, containsAlcohol, alcoholLevel: containsAlcohol && alcoholLevel ? alcoholLevel : undefined, tasteProfile: tasteProfile.length > 0 ? tasteProfile : undefined, spiceLevel, price: priceNum, sortOrder: sortNum };
      if (editingId) await updateItem({ menuItemId: editingId, ...common });
      else await createItem({ restaurantId, ...common });
      onDone();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  const existingCategories = [...new Set(existingItems.map((i) => i.category))].sort();
  const inputCls = "w-full border border-border rounded px-3 py-2 bg-surface text-foreground text-sm focus:border-accent outline-none";
  const selectCls = "border border-border rounded px-3 py-2 bg-surface text-foreground text-sm focus:border-accent outline-none";

  return (
    <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 bg-surface flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{editingId ? 'Edit item' : 'New item'}</h3>
        <button type="button" onClick={onDone} className="text-sm text-muted hover:text-foreground transition-colors">Cancel</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required /></div>
        <div><label className="block text-sm font-medium mb-1">Category *</label><input type="text" value={category} onChange={(e) => setCategory(e.target.value)} list="categories" className={inputCls} required /><datalist id="categories">{existingCategories.map((c) => (<option key={c} value={c} />))}</datalist></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} rows={2} required /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="block text-sm font-medium mb-1">Price</label><input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></div>
        <div><label className="block text-sm font-medium mb-1">Sort order</label><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={inputCls} /></div>
      </div>
      <div><label className="block text-sm font-medium mb-1">Taste profile</label><div className="flex flex-wrap gap-2">{TASTE_OPTIONS.map((t) => (<label key={t} className="inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={tasteProfile.includes(t)} onChange={() => setTasteProfile(toggle(tasteProfile, t))} className="accent-accent" /><span>{TASTE_LABELS[t]}</span></label>))}</div></div>
      <div><label className="block text-sm font-medium mb-1">Spice level</label><select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value as Spice)} className={selectCls}>{SPICE_OPTIONS.map((s) => (<option key={s} value={s}>{SPICE_LABELS[s]}</option>))}</select></div>
      <div><label className="block text-sm font-medium mb-1">Allergens</label><div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">{allergens.map((a) => (<label key={a._id} className="inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={allergenIds.includes(a._id)} onChange={() => setAllergenIds(toggle(allergenIds, a._id))} className="accent-accent" /><span>{a.name}</span></label>))}</div></div>
      <div><label className="block text-sm font-medium mb-1">Diet tags</label><div className="flex flex-wrap gap-2">{DIET_OPTIONS.filter((d) => d !== 'none').map((d) => (<label key={d} className="inline-flex items-center gap-1 text-sm"><input type="checkbox" checked={dietTags.includes(d)} onChange={() => setDietTags(toggle(dietTags, d))} className="accent-accent" /><span>{DIET_LABELS[d]}</span></label>))}</div></div>
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={containsAlcohol} onChange={(e) => setContainsAlcohol(e.target.checked)} className="accent-accent" /><span>Contains alcohol</span></label>
        {containsAlcohol && <select value={alcoholLevel} onChange={(e) => setAlcoholLevel(e.target.value as Alcohol)} className={selectCls}><option value="">Level...</option><option value="low">Low</option><option value="mid">Medium</option><option value="high">High</option><option value="boozy">Very high</option></select>}
      </div>
      <button type="submit" disabled={saving || !name.trim() || !description.trim() || !category.trim()} className="bg-accent text-background px-4 py-2 rounded-md font-medium text-sm disabled:opacity-50 hover:bg-accent-hover transition-colors">
        {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add item'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
