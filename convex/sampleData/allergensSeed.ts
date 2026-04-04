import { internalMutation } from "../_generated/server";

/**
 * EU 14 allergens of mandatory declaration (Regulation (EU) No 1169/2011).
 * @see https://www.eufic.org/en/healthy-eating/article/food-allergens
 */
const EU_14_ALLERGENS: Array<{
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    slug: "cereals_gluten",
    name: "Gluten",
    description:
      "Wheat, rye, barley, oats, spelt, kamut, triticale and their derivatives.",
    sortOrder: 1,
  },
  {
    slug: "crustaceans",
    name: "Crustaceans",
    description:
      "Crabs, lobsters, shrimp, prawns, crayfish and crustacean-based products.",
    sortOrder: 2,
  },
  {
    slug: "eggs",
    name: "Eggs",
    description: "Eggs and egg-based products.",
    sortOrder: 3,
  },
  {
    slug: "fish",
    name: "Fish",
    description: "Fish and fish-based products.",
    sortOrder: 4,
  },
  {
    slug: "peanuts",
    name: "Peanuts",
    description: "Peanuts and peanut-based products.",
    sortOrder: 5,
  },
  {
    slug: "soybeans",
    name: "Soybeans",
    description: "Soybeans and soybean-based products.",
    sortOrder: 6,
  },
  {
    slug: "milk",
    name: "Milk",
    description: "Milk and dairy products (including lactose).",
    sortOrder: 7,
  },
  {
    slug: "nuts",
    name: "Tree nuts",
    description:
      "Almonds, hazelnuts, walnuts, cashews, pecans, Brazil nuts, pistachios, macadamia nuts and their derivatives.",
    sortOrder: 8,
  },
  {
    slug: "celery",
    name: "Celery",
    description: "Celery and celery-based products (stalks, leaves, seeds, roots).",
    sortOrder: 9,
  },
  {
    slug: "mustard",
    name: "Mustard",
    description: "Mustard and mustard-based products (seeds, powder, liquid).",
    sortOrder: 10,
  },
  {
    slug: "sesame_seeds",
    name: "Sesame",
    description: "Sesame seeds and sesame-based products.",
    sortOrder: 11,
  },
  {
    slug: "sulphur_dioxide_sulphites",
    name: "Sulphites",
    description:
      "Sulphur dioxide and sulphites at concentrations above 10 mg/kg or 10 mg/l expressed as SO₂.",
    sortOrder: 12,
  },
  {
    slug: "lupin",
    name: "Lupin",
    description: "Lupin and lupin-based products.",
    sortOrder: 13,
  },
  {
    slug: "molluscs",
    name: "Molluscs",
    description:
      "Mussels, clams, oysters, squid, octopus, snails and mollusc-based products.",
    sortOrder: 14,
  },
];

export const seedAllergens = internalMutation({
  args: {},
  handler: async (ctx) => {
    for (const row of EU_14_ALLERGENS) {
      const existing = await ctx.db
        .query("allergens")
        .withIndex("by_slug", (q) => q.eq("slug", row.slug))
        .unique();
      if (existing) {
        // Update name/description to English if it was previously in Spanish
        await ctx.db.patch(existing._id, {
          name: row.name,
          description: row.description,
        });
        continue;
      }
      await ctx.db.insert("allergens", {
        slug: row.slug,
        name: row.name,
        description: row.description,
        sortOrder: row.sortOrder,
      });
    }
  },
});
