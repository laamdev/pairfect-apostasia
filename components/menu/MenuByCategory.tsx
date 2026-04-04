'use client';

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { MenuItemCard, type MenuItemData, type AllergenData } from './MenuItemCard';

const CATEGORY_ORDER = ['Appetizers', 'Main Dishes', 'Side Dishes', 'Beverages', 'Desserts'];

export const MenuByCategory = ({
  items,
  allergens,
}: {
  items: MenuItemData[];
  allergens: AllergenData[];
}) => {
  const byCategory = items.reduce<Record<string, MenuItemData[]>>((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});
  const categories = Object.keys(byCategory).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  return (
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
                <MenuItemCard key={item._id} item={item} allergens={allergens} />
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
