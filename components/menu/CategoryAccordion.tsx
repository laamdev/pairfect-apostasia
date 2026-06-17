'use client';

import { useState, type ReactNode } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const slugForCat = (cat: string) => `menu-cat-${cat.replace(/\s+/g, '-').toLowerCase()}`;

/**
 * Category chip nav + controlled accordion. The chips above the list open/close
 * the matching accordion drawer and scroll it into view. Shared by the client
 * menu (MenuByCategory) and the admin menu page.
 */
export const CategoryAccordion = ({
  categories,
  countFor,
  renderItems,
}: {
  categories: string[];
  countFor: (cat: string) => number;
  renderItems: (cat: string) => ReactNode;
}) => {
  const [open, setOpen] = useState<string[]>(categories.length > 0 ? [categories[0]] : []);

  const handleChip = (cat: string) => {
    const willOpen = !open.includes(cat);
    setOpen((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
    if (willOpen) {
      // Wait for the panel to start expanding before scrolling to it.
      requestAnimationFrame(() => {
        document.getElementById(slugForCat(cat))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = open.includes(cat);
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleChip(cat)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
                active
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              {cat}
              <span className={`ml-1.5 text-xs ${active ? 'text-accent-foreground/70' : 'text-muted-foreground/70'}`}>
                {countFor(cat)}
              </span>
            </button>
          );
        })}
      </div>

      <Accordion value={open} onValueChange={(value) => setOpen(value as string[])}>
        {categories.map((cat) => (
          <AccordionItem key={cat} id={slugForCat(cat)} value={cat} className="scroll-mt-20">
            <AccordionTrigger className="text-lg font-medium text-foreground flex items-baseline">
              <span>{cat}</span>
              <span className="ml-4 text-xs font-normal text-muted-foreground font-sans">
                {countFor(cat)} {countFor(cat) === 1 ? 'plato' : 'platos'}
              </span>
            </AccordionTrigger>
            <AccordionContent>{renderItems(cat)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};
