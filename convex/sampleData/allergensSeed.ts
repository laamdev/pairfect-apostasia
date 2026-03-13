import { internalMutation } from "../_generated/server";

/**
 * EU 14 allergens of mandatory declaration (Regulation (EU) No 1169/2011).
 * Names and descriptions aligned with official EU / Spanish sources.
 * @see https://www.eufic.org/es/vida-sana/articulo/lista-de-los-14-alergenos-alimentarios-mas-comunes
 * @see https://mae-innovation.com/es/los-14-alergenos-de-declaracion-obligatoria-en-europa/
 */
const EU_14_ALLERGENS: Array<{
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
}> = [
  {
    slug: "cereals_gluten",
    name: "Cereales que contienen gluten",
    description:
      "Trigo, centeno, cebada, avena, espelta, kamut, triticale y sus derivados.",
    sortOrder: 1,
  },
  {
    slug: "crustaceans",
    name: "Crustáceos",
    description: "Cangrejos, langostas, gambas, langostinos, cigalas y productos a base de crustáceos.",
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
    description: "Cacahuetes y productos a base de cacahuetes.",
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
    name: "Leche",
    description: "Leche y sus derivados (incluida la lactosa).",
    sortOrder: 7,
  },
  {
    slug: "nuts",
    name: "Frutos de cáscara",
    description:
      "Almendras, avellanas, nueces, anacardos, pacanas, nueces de Brasil, pistachos, nueces de macadamia o Queensland y productos derivados.",
    sortOrder: 8,
  },
  {
    slug: "celery",
    name: "Apio",
    description: "Apio y productos derivados (tallo, hojas, semillas, raíces).",
    sortOrder: 9,
  },
  {
    slug: "mustard",
    name: "Mostaza",
    description: "Mostaza y productos derivados (semillas, polvo, líquida).",
    sortOrder: 10,
  },
  {
    slug: "sesame_seeds",
    name: "Semillas de sésamo",
    description: "Granos o semillas de sésamo y productos a base de sésamo.",
    sortOrder: 11,
  },
  {
    slug: "sulphur_dioxide_sulphites",
    name: "Dióxido de azufre y sulfitos",
    description:
      "En concentraciones superiores a 10 mg/kg o 10 mg/l expresado como SO₂.",
    sortOrder: 12,
  },
  {
    slug: "lupin",
    name: "Altramuces",
    description: "Altramuces y productos a base de altramuces.",
    sortOrder: 13,
  },
  {
    slug: "molluscs",
    name: "Moluscos",
    description: "Mejillones, almejas, ostras, calamar, pulpo, caracoles y productos a base de moluscos.",
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
      if (existing) continue;
      await ctx.db.insert("allergens", {
        slug: row.slug,
        name: row.name,
        description: row.description,
        sortOrder: row.sortOrder,
      });
    }
  },
});
