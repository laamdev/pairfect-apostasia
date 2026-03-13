import { internalMutation } from "../_generated/server";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** Slug must match allergens table (run seedAllergens first). */
type AllergenSlug = string;

type DietTag =
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "poultry"
  | "meaty"
  | "celiac"
  | "none";

type SeedItem = {
  name: string;
  description: string;
  category: string;
  allergenSlugs: AllergenSlug[];
  dietTags?: DietTag[];
  containsAlcohol: boolean;
  alcoholLevel?: string;
  sortOrder?: number;
};

const RESTAURANT_NAME = "La Apostasía";
const RESTAURANT_SLUG = "la-apostasia";
const RESTAURANT_DESCRIPTION =
  "Coctelería y cocina de maridaje. Innovación, tecnología y sostenibilidad.";

const seedItems: SeedItem[] = [
  // Coctelería (alcoholic)
  {
    name: "INNOVACIÓN Y TECNOLOGÍA",
    category: "Coctelería",
    description:
      "Mezcla que refleja la luz ultravioleta, con base de gin y tónica. Notas cítricas, herbáceas y refrescantes. Recomendado con comida salada, fresca y especias: embutidos, pescados, quesos curados y verduras con especias.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "ESTILO DE VIDA Y GASTRONOMÍA SANA",
    category: "Coctelería",
    description:
      "Un plato convertido en líquido con base whisky. Notas dulces, ahumadas y amargas, sabor curioso y salino. Recomendado con pescado ahumado y carne a la brasa o de caza, verduras y ensaladas complejas con sabores fuertes (como camembert, carne o pescados ahumados).",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "SOSTENIBILIDAD Y TRANSICIÓN VERDE",
    category: "Coctelería",
    description:
      "Drink eco-sostenible con productos que cambian según la temporada. Base de ron con sabor equilibrado, notas dulces, cítricas y salinas. Recomendado con pescados, mariscos o cocina de estilo tailandés o mexicana.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "INDIVIDUALISMO Y SOCIAL NETWORK",
    category: "Coctelería",
    description:
      "Juego de sabores entre dulce, salino, cítrico y amargo. Base de vodka, rosolio casero y cerveza. Se bebe con gafas individualistas y mezclado por parte del cliente. Recomendado con embutidos delicados, pescado blanco, frutos secos, chocolate negro amargo o postres cítricos.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "DIVERSIDAD CULTURAL Y TALENTO HUMANO",
    category: "Coctelería",
    description:
      "Mezcla a base de mezcal, pisco y fermentado de arroz. Drink con ingredientes de todo el mundo: notas ahumadas, cítricas y picantes, equilibrado con grillos secos. Recomendado con sabores exóticos, ensaladas asiáticas, tartar de pescados y pollo marinado.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "FRIDA MEX",
    category: "Coctelería",
    description:
      "Trago contundente a base de tequila, cítricos y picante con notas amargas de cacao. Recomendado con mariscos, fritura vegetal o de pescado y cocina mexicana.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "LISA MONA",
    category: "Coctelería",
    description:
      "Coctel a base de gin, vino tinto Ribera del Duero y arándanos frescos y secos. Sabor dulce y amargo con toque ácido. Recomendado con embutidos, pescados y todo tipo de quesos.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "APOSTASÍA",
    category: "Coctelería",
    description:
      "Drink fresco y equilibrado con notas dulces a base de ron y coco. Recomendado con ensaladas, pescados, frutas, tarta de queso o comidas ácidas.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "PATHOS",
    category: "Coctelería",
    description:
      "Base de ron con sabor cítrico y jengibre refrescante. Recomendado con pollo con especias, mariscos, ensaladas exóticas, comida agridulce y picante, quesos frescos o ahumados, frutos secos y tartas de mermeladas.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "NO MUSIC NO LIFE",
    category: "Coctelería",
    description:
      "Mezcla contundente con dos tipos de ron, con notas cítricas y amargas por la combinación de almendras amargas y naranja amarga. Recomendado con comida asiática, aguacate, paella, pollo al curry, platos picantes, patatas y platos agridulces.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "PERRO CAMPERO",
    category: "Coctelería",
    description:
      "Base de gin y licor casero de caléndula, flor de alfalfa y manzanilla con notas de aceitunas. Sabor herbáceo y cítrico. Recomendado con quesos suaves y frescos, verduras a la plancha, arroz meloso, pescados blancos suaves, alcachofas y ensaladas frescas.",
    allergenSlugs: [],
    containsAlcohol: true,
  },
  {
    name: "GRANT WOOD",
    category: "Coctelería",
    description:
      "Whisky infusionado con pimienta negra y sabor dulce-amargo. Recomendado con aperitivos salados, embutidos suaves, cremas, ensaladilla, tartas saladas, quesos semicurados, mariscos, platos frescos y picantes.",
    allergenSlugs: [],
    containsAlcohol: true,
  },

  // Bebidas para conductores (sin alcohol)
  {
    name: "ANALGÉSICA",
    category: "Bebidas para conductores",
    description:
      "Drink dulce y refrescante pensado para conductores. Recomendado con aperitivos salados, embutidos suaves, cremas, ensaladilla, tartas saladas, quesos semicurados, mariscos, platos frescos y picantes.",
    allergenSlugs: [],
    containsAlcohol: false,
  },
  {
    name: "CÍTRICA",
    category: "Bebidas para conductores",
    description:
      "Mezcla cítrica y amarga sin alcohol. Recomendado con pollo con especias, mariscos, ensaladas exóticas, comida agridulce y picante, quesos frescos o ahumados, frutos secos y tartas de mermeladas.",
    allergenSlugs: [],
    containsAlcohol: false,
  },
  {
    name: "ROSITA",
    category: "Bebidas para conductores",
    description:
      "Equilibrio de sabores entre dulce, cítrico y amargo. Recomendado con comida asiática, aguacate, paella, pollo al curry, platos picantes, patatas y platos agridulces.",
    allergenSlugs: [],
    containsAlcohol: false,
  },
  {
    name: "GARDENIA",
    category: "Bebidas para conductores",
    description:
      "Bebida dulcemente ácida, de sabor curioso, sin alcohol. Recomendado con ensaladas, pescados, frutas, tarta de queso o comidas ácidas.",
    allergenSlugs: [],
    containsAlcohol: false,
  },

  // Comida
  {
    name: "Patatas gratinadas con camembert",
    category: "Comida",
    description:
      "Ingredientes: patata cocida, compota de manzana (manzana, mantequilla, pimienta), camembert, mozzarella, miel de flores y nueces. Plato cremoso, salado-dulce y reconfortante. Maridaje: muy bien con cócteles cítricos/herbáceos o con notas amargas.",
    allergenSlugs: ["milk", "nuts"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Embutidos ibéricos con queso",
    category: "Comida",
    description:
      "Ingredientes: lomo, salchichón, chorizo y queso. Tabla clásica ibérica. Maridaje: excelente con gin-tonic cítrico o cócteles con amargo suave.",
    allergenSlugs: ["milk"],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Croquetas sin gluten",
    category: "Comida",
    description:
      "Croquetas elaboradas sin gluten, con interior cremoso y exterior crujiente. Opciones: provolone, cecina, jamón ibérico o setas y trufa (según disponibilidad). Maridaje: cócteles con notas cítricas o especiadas.",
    allergenSlugs: ["milk", "eggs"],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Provolone",
    category: "Comida",
    description:
      "Ingredientes: queso provolone fundido. Sabor intenso y textura cremosa. Maridaje: cócteles amargos o con jengibre.",
    allergenSlugs: ["milk"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Cecina",
    category: "Comida",
    description:
      "Ingredientes: cecina curada en finas lonchas. Sabor intenso y ligeramente ahumado. Maridaje: whisky ahumado o ron equilibrado.",
    allergenSlugs: [],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Jamón ibérico",
    category: "Comida",
    description:
      "Ingredientes: jamón ibérico cortado a mano. Sabor profundo y prolongado. Maridaje: gin-tonic cítrico o cócteles herbáceos.",
    allergenSlugs: [],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Setas y trufa",
    category: "Comida",
    description:
      "Ingredientes: setas salteadas y trufa (según temporada). Aromático y sabroso. Maridaje: cócteles con amargo suave o ron con cítrico.",
    allergenSlugs: [],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Gyozas de pollo y verduras",
    category: "Comida",
    description:
      "Ingredientes: gyozas de pollo y verduras con salsa yakiniku y sriracha. Bocado jugoso con toques umami y picantes. Maridaje: cócteles cítricos o con jengibre.",
    allergenSlugs: ["cereals_gluten", "soybeans"],
    dietTags: [],
    containsAlcohol: false,
  },
  {
    name: "Gyozas de pato (hoisin + sriracha)",
    category: "Comida",
    description:
      "Ingredientes: gyozas de pato con salsa hoisin y sriracha. Dulce-salado con toque picante. Maridaje: ron cítrico o cócteles con amargo.",
    allergenSlugs: ["cereals_gluten", "soybeans", "sesame_seeds"],
    containsAlcohol: false,
  },
  {
    name: "Fingers de pollo (salsa yakiniku aparte)",
    category: "Comida",
    description:
      "Ingredientes: pechuga de pollo con especias (pimienta, perejil, ajo, pimentón, orégano, romero), maicena y harina de garbanzo. Salsa aparte: mayonesa sin lactosa/sin gluten + yakiniku (soja, jengibre, lima). Maridaje: PATHOS o cócteles cítricos.",
    allergenSlugs: ["soybeans"],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Gildas de anchoa",
    category: "Comida",
    description:
      "Ingredientes: anchoa, aceituna verde, cebolleta y piparra. Bocado salino y ácido. Maridaje: gin-tonic cítrico o cócteles herbáceos.",
    allergenSlugs: ["fish"],
    dietTags: ["celiac"],
    containsAlcohol: false,
  },
  {
    name: "Setas en falsa tempura con salsa gorgonzola",
    category: "Comida",
    description:
      "Ingredientes: setas de cardo en falsa tempura (harina sin gluten, sidra, comino) con salsa gorgonzola (nata y gorgonzola). Maridaje: cócteles con amargo suave o con notas cítricas.",
    allergenSlugs: ["milk"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Bravas con salsa casera",
    category: "Comida",
    description:
      "Ingredientes: patatas y salsa brava casera (cebolla, pimentón dulce y picante, caldo de verduras, ajo, sriracha). Picante amable. Maridaje: FRIDA MEX o cócteles cítricos.",
    allergenSlugs: [],
    containsAlcohol: false,
  },
  {
    name: "Bolas de morcilla crujiente con demiglace y confitura de piquillo",
    category: "Comida",
    description:
      "Ingredientes: morcilla de cebolla, harina/pan sin gluten, huevo. Salsa: jugo de carrillera con verduras y especias + vino tinto. Confitura de piquillo. Maridaje: whisky ahumado o cócteles con amargo.",
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
    containsAlcohol: false,
  },
  {
    name: "Ensalada de tomate con ventresca y tapenade",
    category: "Comida",
    description:
      "Ingredientes: tomate, ventresca, cebolla encurtida (lima/vinagre) y tapenade (aceituna verde, alcaparra, anchoa, ajo). Fresca y salina. Maridaje: INNOVACIÓN Y TECNOLOGÍA o bebidas cítricas.",
    allergenSlugs: ["fish"],
    containsAlcohol: false,
  },
  {
    name: "Lomo bajo con mantequilla de tomillo y ajo + patatas",
    category: "Comida",
    description:
      "Ingredientes: lomo bajo de ternera, mantequilla infusionada en tomillo y ajo, patatas. Sabor intenso y graso. Maridaje: ESTILO DE VIDA Y GASTRONOMÍA SANA o cócteles con amargo.",
    allergenSlugs: ["milk"],
    containsAlcohol: false,
  },
  {
    name: "Tosta de salmón, aguacate y queso crema con lima",
    category: "Comida",
    description:
      "Ingredientes: pan, salmón curado, crema de aguacate, queso crema y ralladura de lima. Maridaje: cócteles cítricos o herbáceos.",
    allergenSlugs: ["cereals_gluten", "fish", "milk"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla (tradicional)",
    category: "Comida",
    description:
      "Ingredientes: huevos, patata (y opcional cebolla), sal. Clásica y jugosa. Maridaje: gin-tonic cítrico o cócteles herbáceos.",
    allergenSlugs: ["eggs"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla trufada",
    category: "Comida",
    description:
      "Ingredientes: tortilla + tartufato y cebolla caramelizada (miel, azúcar, vino tinto, pimienta). Maridaje: whisky o cócteles con notas amargas.",
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla cabrita",
    category: "Comida",
    description:
      "Ingredientes: tortilla + cebolla caramelizada y queso de cabra. Maridaje: cócteles cítricos o ron equilibrado.",
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla carrillada",
    category: "Comida",
    description:
      "Ingredientes: tortilla + carrillada guisada con verduras y especias (y vino tinto). Maridaje: whisky o ron con cítrico.",
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla ahumada (pimiento asado y sardinas)",
    category: "Comida",
    description:
      "Ingredientes: tortilla + pimiento rojo asado y sardina ahumada. Maridaje: cócteles cítricos o herbáceos.",
    allergenSlugs: ["eggs", "fish"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla de Burgos (morcilla y piquillo)",
    category: "Comida",
    description:
      "Ingredientes: tortilla + morcilla de cebolla y confitura de piquillo. Maridaje: cócteles con amargo o whisky.",
    allergenSlugs: ["eggs"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla gorgonzola",
    category: "Comida",
    description:
      "Ingredientes: tortilla + salsa gorgonzola (nata y gorgonzola) y setas confitadas. Maridaje: cócteles cítricos o con jengibre.",
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla 3 quesos",
    category: "Comida",
    description:
      "Ingredientes: tortilla + emmental, mozzarella y queso curado. Cremosa e intensa. Maridaje: cócteles amargos o cítricos.",
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
    containsAlcohol: false,
  },
  {
    name: "Tortilla nonna (guanciale + pesto)",
    category: "Comida",
    description:
      "Ingredientes: tortilla + guanciale y pesto (ajo, almendra tostada, parmesano, sal, albahaca). Maridaje: ron cítrico o cócteles herbáceos.",
    allergenSlugs: ["eggs", "nuts", "milk"],
    containsAlcohol: false,
  },
  {
    name: "Tarta de queso",
    category: "Postres",
    description:
      "Ingredientes: queso, crema, huevo, azúcar, nata y maicena. Cremosa y equilibrada. Maridaje: APOSTASÍA o bebidas cítricas.",
    allergenSlugs: ["milk", "eggs"],
    containsAlcohol: false,
  },
  {
    name: "Brownie con helado de vainilla",
    category: "Postres",
    description:
      "Ingredientes: chocolate 72%, mantequilla, harina sin gluten, azúcar, nueces, vainilla, helado y huevo. Intenso y goloso. Maridaje: cócteles con cacao/amargo.",
    allergenSlugs: ["milk", "eggs", "nuts"],
    containsAlcohol: false,
  },
  {
    name: "Lotus (postre)",
    category: "Postres",
    description:
      "Ingredientes: turrón de chocolate, azúcar glas, nata y galleta Lotus. Dulce, cremoso y especiado. Maridaje: cócteles cítricos o bebidas dulces y frescas.",
    allergenSlugs: ["cereals_gluten", "milk"],
    containsAlcohol: false,
  },
  {
    name: "Helados (varios)",
    category: "Postres",
    description:
      "Selección de helados según temporada. Pregunta por sabores. Maridaje: bebidas cítricas o cócteles ligeros.",
    allergenSlugs: ["milk"],
    containsAlcohol: false,
  },
];

export const seedRestaurantAndMenu = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allergens = await ctx.db.query("allergens").collect();
    if (allergens.length === 0) {
      throw new Error(
        "Run internal.sampleData.allergensSeed.seedAllergens first to seed the 14 EU allergens.",
      );
    }
    const slugToId = new Map(
      allergens.map((a) => [a.slug, a._id]),
    ) as Map<string, Id<"allergens">>;

    const restaurantId = await getOrCreateRestaurant(ctx);

    // Clear existing menu items for idempotent seeding
    const existing = ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", restaurantId));

    for await (const item of existing) {
      await ctx.db.delete(item._id);
    }

    let sortOrder = 0;
    for (const item of seedItems) {
      const allergenIds = item.allergenSlugs
        .map((slug) => slugToId.get(slug))
        .filter((id): id is Id<"allergens"> => id != null);
      await ctx.db.insert("menuItems", {
        restaurantId,
        name: item.name,
        description: item.description,
        category: item.category,
        allergenIds,
        dietTags: item.dietTags,
        containsAlcohol: item.containsAlcohol,
        alcoholLevel: item.containsAlcohol ? "boozy" : "teetotal",
        tasteProfile: undefined,
        spiceLevel: undefined,
        price: undefined,
        imageStorageId: undefined,
        sortOrder: sortOrder++,
      });
    }
  },
});

async function getOrCreateRestaurant(
  ctx: MutationCtx,
): Promise<Id<"restaurants">> {
  const existing = await ctx.db
    .query("restaurants")
    .withIndex("by_slug", (q: any) => q.eq("slug", RESTAURANT_SLUG))
    .unique();

  if (existing) {
    return existing._id;
  }

  const restaurantId = await ctx.db.insert("restaurants", {
    name: RESTAURANT_NAME,
    slug: RESTAURANT_SLUG,
    description: RESTAURANT_DESCRIPTION,
    logoStorageId: undefined,
  });

  return restaurantId;
}
