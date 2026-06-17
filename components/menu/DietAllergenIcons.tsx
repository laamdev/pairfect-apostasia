'use client';

import { WheatOff, WineOff, Vegan, LeafyGreen } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { AllergenIcon } from './AllergenIcon';
import type { Id } from '../../convex/_generated/dataModel';

export const DietAllergenIcons = ({
  dietTags,
  category,
  alcoholLevel,
  allergens,
}: {
  dietTags?: string[];
  category: string;
  alcoholLevel?: string;
  allergens: Array<{ _id: Id<'allergens'>; name: string; slug: string }>;
}) => {
  const hasIcons =
    dietTags?.includes('vegan') ||
    dietTags?.includes('vegetarian') ||
    dietTags?.includes('celiac') ||
    (category === 'Bebidas' && (!alcoholLevel || alcoholLevel === 'none')) ||
    allergens.length > 0;

  if (!hasIcons) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {dietTags?.includes('vegan') && (
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <Vegan className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Vegano</TooltipContent>
        </Tooltip>
      )}
      {dietTags?.includes('vegetarian') && !dietTags?.includes('vegan') && (
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <LeafyGreen className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Vegetariano</TooltipContent>
        </Tooltip>
      )}
      {dietTags?.includes('celiac') && (
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <WheatOff className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Sin gluten</TooltipContent>
        </Tooltip>
      )}
      {category === 'Bebidas' && (!alcoholLevel || alcoholLevel === 'none') && (
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <WineOff className="size-4 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>Sin alcohol</TooltipContent>
        </Tooltip>
      )}
      {allergens.map((a) => (
        <AllergenIcon key={a._id} slug={a.slug} name={a.name} />
      ))}
    </div>
  );
};
