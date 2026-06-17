'use client';

import { CategoryAccordion } from './CategoryAccordion';
import { MenuItemCard, type MenuItemData, type AllergenData } from './MenuItemCard';

const CATEGORY_ORDER = ['Entrantes', 'Platos principales', 'Guarniciones', 'Bebidas', 'Postres'];

export const MenuByCategory = ({
  items,
  allergens,
}: {
  items: MenuItemData[];
  allergens: AllergenData[];
}) => {
  const byCategory = items.reduce<Record<string, MenuItemData[]>>((acc, item) => {
    const cat = item.category || 'Otros';
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
    <CategoryAccordion
      categories={categories}
      countFor={(cat) => byCategory[cat].length}
      renderItems={(cat) => (
        <ul className="flex flex-col gap-2">
          {byCategory[cat].map((item) => (
            <MenuItemCard key={item._id} item={item} allergens={allergens} />
          ))}
        </ul>
      )}
    />
  );
};
