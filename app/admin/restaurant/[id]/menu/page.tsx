'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { PageWrapper } from '@/components/PageWrapper';
import { CardListSkeleton } from '@/components/skeletons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, UtensilsCrossed, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DietAllergenIcons } from '@/components/menu/DietAllergenIcons';

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
  celiac: 'Celiac',
  none: 'No restriction',
};
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

  if (menuItems === undefined || allergens === undefined)
    return (
      <PageWrapper>
        <CardListSkeleton count={5} />
      </PageWrapper>
    );

  const byCategory = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const CATEGORY_ORDER = ['Appetizers', 'Main Dishes', 'Side Dishes', 'Beverages', 'Desserts'];
  const categories = Object.keys(byCategory).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
    <PageWrapper>
      <div>
        <Link
          href={`/admin/restaurant/${restaurantId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Back to {restaurant?.name ?? 'restaurant'}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Menu</h1>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
        >
          + Add item
        </Button>
      </div>

      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          if (!open) {
            setShowForm(false);
            setEditingId(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingId ? 'Edit item' : 'New item'}</DialogTitle>
          </DialogHeader>
          <MenuItemForm
            restaurantId={restaurantId}
            allergens={allergens}
            editingId={editingId}
            existingItems={menuItems}
            onDone={() => {
              setShowForm(false);
              setEditingId(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {menuItems.length === 0 && !showForm && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-4">Your menu is empty. Add your first item.</p>
        </div>
      )}

      {categories.length > 0 && (
        <Accordion defaultValue={categories.length > 0 ? [categories[0]] : []}>
          {categories.map((cat) => (
            <AccordionItem key={cat} value={cat}>
              <AccordionTrigger className="text-lg font-medium text-foreground flex items-baseline">
                <span>{cat}</span>
                <span className="ml-4 text-xs font-normal text-muted-foreground font-sans">
                  {byCategory[cat].length} {byCategory[cat].length === 1 ? 'item' : 'items'}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-2">
                  {byCategory[cat].map((item) => (
                    <MenuItemRow
                      key={item._id}
                      item={item}
                      allergens={allergens}
                      onEdit={() => {
                        setEditingId(item._id);
                        setShowForm(true);
                      }}
                    />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </PageWrapper>
  );
}

function MenuItemRow({
  item,
  allergens,
  onEdit,
}: {
  item: {
    _id: Id<'menuItems'>;
    name: string;
    description: string;
    category: string;
    allergenIds: Id<'allergens'>[];
    dietTags?: string[];
    alcoholLevel?: string;
    price?: number;
    isAvailable?: boolean;
    isSpecial?: boolean;
    imageUrl?: string | null;
  };
  allergens: Array<{ _id: Id<'allergens'>; name: string; slug: string }>;
  onEdit: () => void;
}) {
  const deleteItem = useMutation(api.menuItems.deleteMenuItem);
  const updateItem = useMutation(api.menuItems.updateMenuItem);
  const [deleting, setDeleting] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const itemAllergens = item.allergenIds
    .map((id) => allergens.find((a) => a._id === id))
    .filter((a): a is { _id: Id<'allergens'>; name: string; slug: string } => a != null);
  const isAvailable = item.isAvailable !== false;

  return (
    <li
      className={`border border-border rounded-lg p-3 bg-surface flex flex-col gap-3 ${!isAvailable ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        {item.imageUrl ? (
          <button type="button" onClick={() => setShowImage(true)} className="shrink-0 cursor-pointer">
            <img src={item.imageUrl} alt={item.name} className="size-14 rounded-md object-cover" />
          </button>
        ) : (
          <div className="size-14 rounded-md bg-muted flex items-center justify-center shrink-0">
            <UtensilsCrossed className="size-6 text-muted-foreground/40" />
          </div>
        )}
        {item.imageUrl && (
          <Dialog open={showImage} onOpenChange={setShowImage}>
            <DialogContent className="sm:max-w-md p-2" showCloseButton>
              <img src={item.imageUrl} alt={item.name} className="w-full rounded-lg object-contain" />
            </DialogContent>
          </Dialog>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base leading-none">{item.name}</span>
            {item.isSpecial && <Badge variant="accent">Special</Badge>}
            {!isAvailable && (
              <Badge variant="muted">
                Unavailable
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
          {item.price != null && <p className="text-xs text-muted-foreground mt-1">{item.price.toFixed(2)} &euro;</p>}
        </div>
        <div className="flex gap-1 shrink-0 items-center">
          <Tooltip>
            <TooltipTrigger
              className="p-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => updateItem({ menuItemId: item._id, isAvailable: !isAvailable })}
            >
              {isAvailable ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent>{isAvailable ? 'Mark unavailable' : 'Mark available'}</TooltipContent>
          </Tooltip>
          <Button variant="outline" size="xs" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant="destructive"
            size="xs"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {deleting ? '...' : 'Delete'}
          </Button>
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Delete item</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{item.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    await deleteItem({ menuItemId: item._id });
                    setShowDeleteConfirm(false);
                  }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="mt-3">
        <DietAllergenIcons
          dietTags={item.dietTags}
          category={item.category}
          alcoholLevel={item.alcoholLevel}
          allergens={itemAllergens}
        />
      </div>
    </li>
  );
}

function MenuItemForm({
  restaurantId,
  allergens,
  editingId,
  existingItems,
  onDone,
}: {
  restaurantId: Id<'restaurants'>;
  allergens: Array<{ _id: Id<'allergens'>; name: string }>;
  editingId: Id<'menuItems'> | null;
  existingItems: Array<{
    _id: Id<'menuItems'>;
    name: string;
    description: string;
    category: string;
    allergenIds: Id<'allergens'>[];
    ingredients?: string[];
    pairingNotes?: string[];
    dietTags?: Diet[];
    alcoholLevel?: Alcohol;
    tasteProfile?: Taste[];
    spiceLevel?: Spice;
    price?: number;
    sortOrder?: number;
    isAvailable?: boolean;
    isSpecial?: boolean;
    imageUrl?: string | null;
    imageStorageId?: Id<'_storage'>;
  }>;
  onDone: () => void;
}) {
  const existing = editingId ? existingItems.find((i) => i._id === editingId) : null;
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [allergenIds, setAllergenIds] = useState<Id<'allergens'>[]>(existing?.allergenIds ?? []);
  const [ingredients, setIngredients] = useState<string[]>(existing?.ingredients ?? []);
  const [ingredientInput, setIngredientInput] = useState('');
  const [pairingNotes, setPairingNotes] = useState<string[]>(existing?.pairingNotes ?? []);
  const [pairingNoteInput, setPairingNoteInput] = useState('');
  const [dietTags, setDietTags] = useState<Diet[]>((existing?.dietTags as Diet[]) ?? []);
  const [alcoholLevel, setAlcoholLevel] = useState<Alcohol>((existing?.alcoholLevel as Alcohol) ?? 'none');
  const [tasteProfile, setTasteProfile] = useState<Taste[]>((existing?.tasteProfile as Taste[]) ?? []);
  const [spiceLevel, setSpiceLevel] = useState<Spice>((existing?.spiceLevel as Spice) ?? 'none');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [sortOrder, setSortOrder] = useState(existing?.sortOrder?.toString() ?? '');
  const [isSpecial, setIsSpecial] = useState(existing?.isSpecial ?? false);
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.imageUrl ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createItem = useMutation(api.menuItems.createMenuItem);
  const updateItem = useMutation(api.menuItems.updateMenuItem);
  const generateUploadUrl = useMutation(api.menuItems.generateUploadUrl);

  const toggle = <T,>(arr: T[], val: T) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const priceNum = price ? parseFloat(price) : undefined;
      const sortNum = sortOrder ? parseInt(sortOrder, 10) : undefined;
      const ingredientsVal = ingredients.length > 0 ? ingredients : undefined;
      const pairingNotesVal = pairingNotes.length > 0 ? pairingNotes : undefined;

      let imageStorageId: Id<'_storage'> | undefined;
      if (imageFile) {
        const uploadUrl = await generateUploadUrl({ restaurantId });
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageStorageId = storageId;
      }

      const common = {
        name,
        description,
        category,
        allergenIds,
        ingredients: ingredientsVal,
        pairingNotes: pairingNotesVal,
        dietTags: dietTags.length > 0 ? dietTags : undefined,
        alcoholLevel: alcoholLevel !== 'none' ? alcoholLevel : undefined,
        tasteProfile: tasteProfile.length > 0 ? tasteProfile : undefined,
        spiceLevel,
        price: priceNum,
        sortOrder: sortNum,
        isSpecial,
        ...(imageStorageId ? { imageStorageId } : {}),
      };
      if (editingId) await updateItem({ menuItemId: editingId, ...common });
      else await createItem({ restaurantId, ...common });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const existingCategories = [...new Set(existingItems.map((i) => i.category))].sort();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="item-name" className="mb-1 text-xs text-muted-foreground">
            Name *
          </Label>
          <Input id="item-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="item-category" className="mb-1 text-xs text-muted-foreground">
            Category *
          </Label>
          <Input
            id="item-category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            list="categories"
            required
          />
          <datalist id="categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>
      <div>
        <Label htmlFor="item-description" className="mb-1 text-xs text-muted-foreground">
          Description *
        </Label>
        <Textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
        />
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Image</Label>
        <div className="flex items-center gap-3">
          {imagePreview && <img src={imagePreview} alt="Preview" className="size-16 rounded-md object-cover" />}
          <label className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            {imagePreview ? 'Change image' : 'Upload image'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
          {imagePreview && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="item-price" className="mb-1 text-xs text-muted-foreground">
            Price
          </Label>
          <Input id="item-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="item-sort" className="mb-1 text-xs text-muted-foreground">
            Sort order
          </Label>
          <Input id="item-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
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
        <Label className="mb-1 text-xs text-muted-foreground">Allergens</Label>
        <div className="flex flex-wrap gap-3">
          {allergens.map((a) => (
            <Label key={a._id} className="font-normal text-sm">
              <Checkbox
                checked={allergenIds.includes(a._id)}
                onCheckedChange={() => setAllergenIds(toggle(allergenIds, a._id))}
              />
              {a.name}
            </Label>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Diet tags</Label>
        <div className="flex flex-wrap gap-3">
          {DIET_OPTIONS.filter((d) => d !== 'none').map((d) => (
            <Label key={d} className="font-normal text-sm">
              <Checkbox checked={dietTags.includes(d)} onCheckedChange={() => setDietTags(toggle(dietTags, d))} />
              {DIET_LABELS[d]}
            </Label>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Ingredients</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {ing}
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <Input
          value={ingredientInput}
          onChange={(e) => setIngredientInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && ingredientInput.trim()) {
              e.preventDefault();
              setIngredients([...ingredients, ingredientInput.trim()]);
              setIngredientInput('');
            }
          }}
          placeholder="Type and press Enter"
        />
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Pairing notes</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {pairingNotes.map((note, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              {note}
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => setPairingNotes(pairingNotes.filter((_, j) => j !== i))}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        <Input
          value={pairingNoteInput}
          onChange={(e) => setPairingNoteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && pairingNoteInput.trim()) {
              e.preventDefault();
              setPairingNotes([...pairingNotes, pairingNoteInput.trim()]);
              setPairingNoteInput('');
            }
          }}
          placeholder="Type and press Enter"
        />
      </div>
      <div>
        <Label className="mb-1 text-xs text-muted-foreground">Alcohol level</Label>
        <Select value={alcoholLevel} onValueChange={(val) => setAlcoholLevel(val as Alcohol)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="mid">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Label className="font-normal text-sm">
        <Checkbox checked={isSpecial} onCheckedChange={(checked) => setIsSpecial(checked === true)} />
        Mark as special
      </Label>
      <Button type="submit" disabled={saving || !name.trim() || !description.trim() || !category.trim()}>
        {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add item'}
      </Button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  );
}
