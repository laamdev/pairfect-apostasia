'use client';

import {
  Wheat,
  Shrimp,
  Egg,
  Fish,
  Nut,
  Bean,
  Milk,
  Leaf,
  Flower,
  Shell,
  CircleAlert,
  FlaskConical,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const ALLERGEN_ICONS: Record<string, LucideIcon> = {
  cereals_gluten: Wheat,
  crustaceans: Shrimp,
  eggs: Egg,
  fish: Fish,
  peanuts: Nut,
  soybeans: Bean,
  milk: Milk,
  nuts: Nut,
  celery: Leaf,
  mustard: Flower,
  sesame_seeds: CircleAlert,
  sulphur_dioxide_sulphites: FlaskConical,
  lupin: Leaf,
  molluscs: Shell,
};

export const AllergenIcon = ({ slug, name }: { slug: string; name: string }) => {
  const Icon = ALLERGEN_ICONS[slug] ?? CircleAlert;
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">
        <Icon className="size-4 text-muted-foreground" />
      </TooltipTrigger>
      <TooltipContent>{name}</TooltipContent>
    </Tooltip>
  );
};
