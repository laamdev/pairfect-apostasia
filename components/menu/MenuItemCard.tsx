'use client';

import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DietAllergenIcons } from './DietAllergenIcons';
import type { Id } from '../../convex/_generated/dataModel';

export type MenuItemData = {
  _id: Id<'menuItems'>;
  name: string;
  description: string;
  category: string;
  dietTags?: string[];
  alcoholLevel?: string;
  allergenIds: Id<'allergens'>[];
  imageUrl?: string | null;
};

export type AllergenData = {
  _id: Id<'allergens'>;
  name: string;
  slug: string;
};

export const MenuItemCard = ({
  item,
  allergens,
}: {
  item: MenuItemData;
  allergens: AllergenData[];
}) => {
  const [showImage, setShowImage] = useState(false);
  const itemAllergens = item.allergenIds
    .map((id) => allergens.find((a) => a._id === id))
    .filter((a): a is AllergenData => a != null);

  return (
    <li className="border border-border rounded-lg p-3 bg-surface flex flex-col gap-3">
      <div className="flex items-start gap-3">
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
          <span className="font-semibold text-base leading-none">{item.name}</span>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description}</p>
        </div>
      </div>
      <DietAllergenIcons
        dietTags={item.dietTags}
        category={item.category}
        alcoholLevel={item.alcoholLevel}
        allergens={itemAllergens}
      />
    </li>
  );
};
