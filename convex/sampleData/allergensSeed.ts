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
      "Trigo, centeno, cebada, avena, espelta, kamut, triticale y sus derivados.",
    sortOrder: 1,
  },
  {
    slug: "crustaceans",
    name: "Crustáceos",
    description:
      "Cangrejos, langostas, gambas, langostinos, cigalas y productos a base de crustáceos.",
    sortOrder: 2,
  },
  {
    slug: "eggs",
    name: "Huevos",
    description: "Huevos y productos a base de huevo.",
    sortOrder: 3,
  },
  {
    slug: "fish",
    name: "Pescado",
    description: "Pescado y productos a base de pescado.",
    sortOrder: 4,
  },
  {
    slug: "peanuts",
    name: "Cacahuetes",
    description: "Cacahuetes y productos a base de cacahuete.",
    sortOrder: 5,
  },
  {
    slug: "soybeans",
    name: "Soja",
    description: "Soja y productos a base de soja.",
    sortOrder: 6,
  },
  {
    slug: "milk",
    name: "Lácteos",
    description: "Leche y productos lácteos (incluida la lactosa).",
    sortOrder: 7,
  },
  {
    slug: "nuts",
    name: "Frutos de cáscara",
    description:
      "Almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos, nueces de macadamia y sus derivados.",
    sortOrder: 8,
  },
  {
    slug: "celery",
    name: "Apio",
    description: "Apio y productos a base de apio (tallos, hojas, semillas, raíces).",
    sortOrder: 9,
  },
  {
    slug: "mustard",
    name: "Mostaza",
    description: "Mostaza y productos a base de mostaza (semillas, polvo, líquido).",
    sortOrder: 10,
  },
  {
    slug: "sesame_seeds",
    name: "Sésamo",
    description: "Semillas de sésamo y productos a base de sésamo.",
    sortOrder: 11,
  },
  {
    slug: "sulphur_dioxide_sulphites",
    name: "Sulfitos",
    description:
      "Dióxido de azufre y sulfitos en concentraciones superiores a 10 mg/kg o 10 mg/l expresados como SO₂.",
    sortOrder: 12,
  },
  {
    slug: "lupin",
    name: "Altramuces",
    description: "Altramuces y productos a base de altramuz.",
    sortOrder: 13,
  },
  {
    slug: "molluscs",
    name: "Moluscos",
    description:
      "Mejillones, almejas, ostras, calamares, pulpos, caracoles y productos a base de moluscos.",
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
        // Keep name/description in sync with the (Spanish) source of truth.
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
