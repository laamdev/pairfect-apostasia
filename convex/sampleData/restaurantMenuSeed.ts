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
  ingredients?: string[];
  pairingNotes?: string[];
  dietTags?: DietTag[];
  alcoholLevel?: "none" | "low" | "mid" | "high";
};

const RESTAURANT_NAME = "La Apostasía";
const RESTAURANT_SLUG = "la-apostasia";
const RESTAURANT_DESCRIPTION =
  "Coctelería y cocina de maridaje. Innovación, tecnología y sostenibilidad.";

const seedItems: SeedItem[] = [
  // ── Beverages (alcoholic cocktails) ──────────────────────────────────
  {
    name: "Innovación y Tecnología",
    category: "Beverages",
    description:
      "Mezcla que refleja la luz ultravioleta, con notas cítricas, herbáceas y refrescantes.",
    ingredients: ["gin", "tónica", "cítricos", "hierbas"],
    pairingNotes: [
      "Embutidos",
      "Pescados",
      "Quesos curados",
      "Verduras con especias",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Estilo de Vida y Gastronomía Sana",
    category: "Beverages",
    description:
      "Un plato convertido en líquido. Notas dulces, ahumadas y amargas, sabor curioso y salino.",
    ingredients: ["whisky", "ingredientes ahumados", "amargos"],
    pairingNotes: [
      "Pescado ahumado",
      "Carne a la brasa o de caza",
      "Verduras y ensaladas complejas",
    ],
    allergenSlugs: [],

    alcoholLevel: "high",
  },
  {
    name: "Sostenibilidad y Transición Verde",
    category: "Beverages",
    description:
      "Drink eco-sostenible con productos de temporada. Sabor equilibrado, notas dulces, cítricas y salinas.",
    ingredients: ["ron", "ingredientes de temporada", "cítricos"],
    pairingNotes: [
      "Pescados",
      "Mariscos",
      "Cocina tailandesa o mexicana",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Individualismo y Social Network",
    category: "Beverages",
    description:
      "Juego de sabores entre dulce, salino, cítrico y amargo. Se bebe con gafas individualistas y mezclado por el cliente.",
    ingredients: ["vodka", "rosolio casero", "cerveza"],
    pairingNotes: [
      "Embutidos delicados",
      "Pescado blanco",
      "Frutos secos",
      "Chocolate negro amargo",
      "Postres cítricos",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Diversidad Cultural y Talento Humano",
    category: "Beverages",
    description:
      "Ingredientes de todo el mundo: notas ahumadas, cítricas y picantes, equilibrado con grillos secos.",
    ingredients: ["mezcal", "pisco", "fermentado de arroz", "grillos secos"],
    pairingNotes: [
      "Sabores exóticos",
      "Ensaladas asiáticas",
      "Tartar de pescados",
      "Pollo marinado",
    ],
    allergenSlugs: [],

    alcoholLevel: "high",
  },
  {
    name: "Frida Mex",
    category: "Beverages",
    description:
      "Trago contundente con cítricos y picante con notas amargas de cacao.",
    ingredients: ["tequila", "cítricos", "picante", "cacao"],
    pairingNotes: [
      "Mariscos",
      "Fritura vegetal o de pescado",
      "Cocina mexicana",
    ],
    allergenSlugs: [],

    alcoholLevel: "high",
  },
  {
    name: "Lisa Mona",
    category: "Beverages",
    description:
      "Sabor dulce y amargo con toque ácido. Arándanos frescos y secos.",
    ingredients: ["gin", "vino tinto Ribera del Duero", "arándanos"],
    pairingNotes: ["Embutidos", "Pescados", "Todo tipo de quesos"],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Apostasía",
    category: "Beverages",
    description: "Drink fresco y equilibrado con notas dulces de coco.",
    ingredients: ["ron", "coco"],
    pairingNotes: [
      "Ensaladas",
      "Pescados",
      "Frutas",
      "Tarta de queso",
      "Comidas ácidas",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Pathos",
    category: "Beverages",
    description: "Sabor cítrico y jengibre refrescante.",
    ingredients: ["ron", "cítricos", "jengibre"],
    pairingNotes: [
      "Pollo con especias",
      "Mariscos",
      "Ensaladas exóticas",
      "Comida agridulce y picante",
      "Quesos frescos o ahumados",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "No Music No Life",
    category: "Beverages",
    description:
      "Mezcla contundente con notas cítricas y amargas de almendras y naranja amarga.",
    ingredients: ["ron blanco", "ron oscuro", "almendras amargas", "naranja amarga"],
    pairingNotes: [
      "Comida asiática",
      "Aguacate",
      "Paella",
      "Pollo al curry",
      "Platos picantes y agridulces",
    ],
    allergenSlugs: [],

    alcoholLevel: "high",
  },
  {
    name: "Perro Campero",
    category: "Beverages",
    description: "Sabor herbáceo y cítrico con notas de aceitunas.",
    ingredients: ["gin", "licor de caléndula", "flor de alfalfa", "manzanilla"],
    pairingNotes: [
      "Quesos suaves y frescos",
      "Verduras a la plancha",
      "Arroz meloso",
      "Pescados blancos suaves",
    ],
    allergenSlugs: [],

    alcoholLevel: "mid",
  },
  {
    name: "Grant Wood",
    category: "Beverages",
    description: "Whisky infusionado con pimienta negra. Sabor dulce-amargo.",
    ingredients: ["whisky", "pimienta negra", "amargos"],
    pairingNotes: [
      "Aperitivos salados",
      "Embutidos suaves",
      "Cremas",
      "Quesos semicurados",
      "Mariscos",
    ],
    allergenSlugs: [],

    alcoholLevel: "high",
  },

  // ── Beverages (non-alcoholic) ────────────────────────────────────────
  {
    name: "Analgésica",
    category: "Beverages",
    description: "Drink dulce y refrescante pensado para conductores.",
    ingredients: ["zumos", "frutas", "soda"],
    pairingNotes: [
      "Aperitivos salados",
      "Embutidos suaves",
      "Cremas",
      "Quesos semicurados",
      "Mariscos",
    ],
    allergenSlugs: [],

  },
  {
    name: "Cítrica",
    category: "Beverages",
    description: "Mezcla cítrica y amarga sin alcohol.",
    ingredients: ["cítricos", "amargos", "soda"],
    pairingNotes: [
      "Pollo con especias",
      "Mariscos",
      "Ensaladas exóticas",
      "Comida agridulce y picante",
    ],
    allergenSlugs: [],

  },
  {
    name: "Rosita",
    category: "Beverages",
    description: "Equilibrio de sabores entre dulce, cítrico y amargo.",
    ingredients: ["frutas", "cítricos", "amargos"],
    pairingNotes: [
      "Comida asiática",
      "Aguacate",
      "Paella",
      "Pollo al curry",
      "Platos picantes y agridulces",
    ],
    allergenSlugs: [],

  },
  {
    name: "Gardenia",
    category: "Beverages",
    description: "Bebida dulcemente ácida, de sabor curioso, sin alcohol.",
    ingredients: ["frutas", "ácidos", "flores"],
    pairingNotes: [
      "Ensaladas",
      "Pescados",
      "Frutas",
      "Tarta de queso",
      "Comidas ácidas",
    ],
    allergenSlugs: [],

  },

  // ── Appetizers ───────────────────────────────────────────────────────
  {
    name: "Patatas gratinadas con camembert",
    category: "Appetizers",
    description: "Plato cremoso, salado-dulce y reconfortante.",
    ingredients: [
      "patata cocida",
      "compota de manzana",
      "mantequilla",
      "pimienta",
      "camembert",
      "mozzarella",
      "miel de flores",
      "nueces",
    ],
    pairingNotes: ["Cócteles cítricos o herbáceos", "Cócteles con notas amargas"],
    allergenSlugs: ["milk", "nuts"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Embutidos ibéricos con queso",
    category: "Appetizers",
    description: "Tabla clásica ibérica.",
    ingredients: ["lomo", "salchichón", "chorizo", "queso"],
    pairingNotes: ["Gin-tonic cítrico", "Cócteles con amargo suave"],
    allergenSlugs: ["milk"],
    dietTags: ["celiac"],
  },
  {
    name: "Croquetas sin gluten",
    category: "Appetizers",
    description:
      "Croquetas elaboradas sin gluten, con interior cremoso y exterior crujiente. Opciones según disponibilidad.",
    ingredients: [
      "harina sin gluten",
      "leche",
      "huevo",
      "provolone / cecina / jamón ibérico / setas y trufa",
    ],
    pairingNotes: ["Cócteles con notas cítricas", "Cócteles especiados"],
    allergenSlugs: ["milk", "eggs"],
    dietTags: ["celiac"],
  },
  {
    name: "Provolone",
    category: "Appetizers",
    description: "Queso provolone fundido. Sabor intenso y textura cremosa.",
    ingredients: ["queso provolone"],
    pairingNotes: ["Cócteles amargos", "Cócteles con jengibre"],
    allergenSlugs: ["milk"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Cecina",
    category: "Appetizers",
    description: "Cecina curada en finas lonchas. Sabor intenso y ligeramente ahumado.",
    ingredients: ["cecina curada"],
    pairingNotes: ["Whisky ahumado", "Ron equilibrado"],
    allergenSlugs: [],
    dietTags: ["celiac"],
  },
  {
    name: "Jamón ibérico",
    category: "Appetizers",
    description: "Jamón ibérico cortado a mano. Sabor profundo y prolongado.",
    ingredients: ["jamón ibérico"],
    pairingNotes: ["Gin-tonic cítrico", "Cócteles herbáceos"],
    allergenSlugs: [],
    dietTags: ["celiac"],
  },
  {
    name: "Setas y trufa",
    category: "Appetizers",
    description: "Setas salteadas y trufa según temporada. Aromático y sabroso.",
    ingredients: ["setas", "trufa"],
    pairingNotes: ["Cócteles con amargo suave", "Ron con cítrico"],
    allergenSlugs: [],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Gyozas de pollo y verduras",
    category: "Appetizers",
    description: "Bocado jugoso con toques umami y picantes.",
    ingredients: ["gyozas de pollo", "verduras", "salsa yakiniku", "sriracha"],
    pairingNotes: ["Cócteles cítricos", "Cócteles con jengibre"],
    allergenSlugs: ["cereals_gluten", "soybeans"],
  },
  {
    name: "Gyozas de pato",
    category: "Appetizers",
    description: "Dulce-salado con toque picante.",
    ingredients: ["gyozas de pato", "salsa hoisin", "sriracha"],
    pairingNotes: ["Ron cítrico", "Cócteles con amargo"],
    allergenSlugs: ["cereals_gluten", "soybeans", "sesame_seeds"],
  },
  {
    name: "Fingers de pollo",
    category: "Appetizers",
    description:
      "Pechuga de pollo con especias, maicena y harina de garbanzo. Salsa yakiniku aparte.",
    ingredients: [
      "pechuga de pollo",
      "pimienta",
      "perejil",
      "ajo",
      "pimentón",
      "orégano",
      "romero",
      "maicena",
      "harina de garbanzo",
      "mayonesa sin lactosa/sin gluten",
      "yakiniku",
    ],
    pairingNotes: ["Pathos", "Cócteles cítricos"],
    allergenSlugs: ["soybeans"],
    dietTags: ["celiac"],
  },
  {
    name: "Gildas de anchoa",
    category: "Appetizers",
    description: "Bocado salino y ácido.",
    ingredients: ["anchoa", "aceituna verde", "cebolleta", "piparra"],
    pairingNotes: ["Gin-tonic cítrico", "Cócteles herbáceos"],
    allergenSlugs: ["fish"],
    dietTags: ["celiac"],
  },
  {
    name: "Setas en falsa tempura con salsa gorgonzola",
    category: "Appetizers",
    description: "Setas de cardo en falsa tempura con salsa gorgonzola cremosa.",
    ingredients: [
      "setas de cardo",
      "harina sin gluten",
      "sidra",
      "comino",
      "nata",
      "gorgonzola",
    ],
    pairingNotes: ["Cócteles con amargo suave", "Cócteles cítricos"],
    allergenSlugs: ["milk"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Bravas con salsa casera",
    category: "Appetizers",
    description: "Patatas con salsa brava casera. Picante amable.",
    ingredients: [
      "patatas",
      "cebolla",
      "pimentón dulce",
      "pimentón picante",
      "caldo de verduras",
      "ajo",
      "sriracha",
    ],
    pairingNotes: ["Frida Mex", "Cócteles cítricos"],
    allergenSlugs: [],
  },
  {
    name: "Bolas de morcilla crujiente con demiglace y confitura de piquillo",
    category: "Appetizers",
    description:
      "Morcilla de cebolla crujiente con demiglace de carrillera y confitura de piquillo.",
    ingredients: [
      "morcilla de cebolla",
      "harina sin gluten",
      "pan sin gluten",
      "huevo",
      "jugo de carrillera",
      "vino tinto",
      "confitura de piquillo",
    ],
    pairingNotes: ["Whisky ahumado", "Cócteles con amargo"],
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
  },

  // ── Tortillas (appetizers) ───────────────────────────────────────────
  {
    name: "Tortilla tradicional",
    category: "Appetizers",
    description: "Clásica y jugosa.",
    ingredients: ["huevos", "patata", "cebolla (opcional)", "sal"],
    pairingNotes: ["Gin-tonic cítrico", "Cócteles herbáceos"],
    allergenSlugs: ["eggs"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Tortilla trufada",
    category: "Appetizers",
    description: "Tortilla con tartufato y cebolla caramelizada.",
    ingredients: [
      "huevos",
      "patata",
      "tartufato",
      "cebolla caramelizada",
      "miel",
      "azúcar",
      "vino tinto",
      "pimienta",
    ],
    pairingNotes: ["Whisky", "Cócteles con notas amargas"],
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Tortilla cabrita",
    category: "Appetizers",
    description: "Tortilla con cebolla caramelizada y queso de cabra.",
    ingredients: ["huevos", "patata", "cebolla caramelizada", "queso de cabra"],
    pairingNotes: ["Cócteles cítricos", "Ron equilibrado"],
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Tortilla carrillada",
    category: "Appetizers",
    description: "Tortilla con carrillada guisada con verduras y especias.",
    ingredients: [
      "huevos",
      "patata",
      "carrillada",
      "verduras",
      "especias",
      "vino tinto",
    ],
    pairingNotes: ["Whisky", "Ron con cítrico"],
    allergenSlugs: ["eggs", "sulphur_dioxide_sulphites"],
  },
  {
    name: "Tortilla ahumada",
    category: "Appetizers",
    description: "Tortilla con pimiento rojo asado y sardina ahumada.",
    ingredients: ["huevos", "patata", "pimiento rojo asado", "sardina ahumada"],
    pairingNotes: ["Cócteles cítricos", "Cócteles herbáceos"],
    allergenSlugs: ["eggs", "fish"],
  },
  {
    name: "Tortilla de Burgos",
    category: "Appetizers",
    description: "Tortilla con morcilla de cebolla y confitura de piquillo.",
    ingredients: [
      "huevos",
      "patata",
      "morcilla de cebolla",
      "confitura de piquillo",
    ],
    pairingNotes: ["Cócteles con amargo", "Whisky"],
    allergenSlugs: ["eggs"],
  },
  {
    name: "Tortilla gorgonzola",
    category: "Appetizers",
    description: "Tortilla con salsa gorgonzola y setas confitadas.",
    ingredients: ["huevos", "patata", "nata", "gorgonzola", "setas confitadas"],
    pairingNotes: ["Cócteles cítricos", "Cócteles con jengibre"],
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Tortilla 3 quesos",
    category: "Appetizers",
    description:
      "Tortilla con emmental, mozzarella y queso curado. Cremosa e intensa.",
    ingredients: ["huevos", "patata", "emmental", "mozzarella", "queso curado"],
    pairingNotes: ["Cócteles amargos", "Cócteles cítricos"],
    allergenSlugs: ["eggs", "milk"],
    dietTags: ["vegetarian", "celiac"],
  },
  {
    name: "Tortilla nonna",
    category: "Appetizers",
    description: "Tortilla con guanciale y pesto casero.",
    ingredients: [
      "huevos",
      "patata",
      "guanciale",
      "ajo",
      "almendra tostada",
      "parmesano",
      "albahaca",
    ],
    pairingNotes: ["Ron cítrico", "Cócteles herbáceos"],
    allergenSlugs: ["eggs", "nuts", "milk"],
  },

  // ── Main Dishes ──────────────────────────────────────────────────────
  {
    name: "Ensalada de tomate con ventresca y tapenade",
    category: "Main Dishes",
    description: "Fresca y salina.",
    ingredients: [
      "tomate",
      "ventresca",
      "cebolla encurtida",
      "lima",
      "vinagre",
      "aceituna verde",
      "alcaparra",
      "anchoa",
      "ajo",
    ],
    pairingNotes: ["Innovación y Tecnología", "Bebidas cítricas"],
    allergenSlugs: ["fish"],
  },
  {
    name: "Lomo bajo con mantequilla de tomillo y ajo",
    category: "Main Dishes",
    description:
      "Lomo bajo de ternera con mantequilla infusionada y patatas. Sabor intenso y graso.",
    ingredients: [
      "lomo bajo de ternera",
      "mantequilla",
      "tomillo",
      "ajo",
      "patatas",
    ],
    pairingNotes: [
      "Estilo de Vida y Gastronomía Sana",
      "Cócteles con amargo",
    ],
    allergenSlugs: ["milk"],
  },
  {
    name: "Tosta de salmón, aguacate y queso crema con lima",
    category: "Main Dishes",
    description:
      "Pan con salmón curado, crema de aguacate, queso crema y ralladura de lima.",
    ingredients: [
      "pan",
      "salmón curado",
      "crema de aguacate",
      "queso crema",
      "ralladura de lima",
    ],
    pairingNotes: ["Cócteles cítricos", "Cócteles herbáceos"],
    allergenSlugs: ["cereals_gluten", "fish", "milk"],
  },

  // ── Desserts ─────────────────────────────────────────────────────────
  {
    name: "Tarta de queso",
    category: "Desserts",
    description: "Cremosa y equilibrada.",
    ingredients: ["queso", "crema", "huevo", "azúcar", "nata", "maicena"],
    pairingNotes: ["Apostasía", "Bebidas cítricas"],
    allergenSlugs: ["milk", "eggs"],
  },
  {
    name: "Brownie con helado de vainilla",
    category: "Desserts",
    description: "Intenso y goloso.",
    ingredients: [
      "chocolate 72%",
      "mantequilla",
      "harina sin gluten",
      "azúcar",
      "nueces",
      "vainilla",
      "helado",
      "huevo",
    ],
    pairingNotes: ["Cócteles con cacao o amargo"],
    allergenSlugs: ["milk", "eggs", "nuts"],
  },
  {
    name: "Lotus",
    category: "Desserts",
    description: "Dulce, cremoso y especiado.",
    ingredients: ["turrón de chocolate", "azúcar glas", "nata", "galleta Lotus"],
    pairingNotes: ["Cócteles cítricos", "Bebidas dulces y frescas"],
    allergenSlugs: ["cereals_gluten", "milk"],
  },
  {
    name: "Helados (varios)",
    category: "Desserts",
    description: "Selección de helados según temporada. Pregunta por sabores.",
    ingredients: ["leche", "azúcar", "sabores variados"],
    pairingNotes: ["Bebidas cítricas", "Cócteles ligeros"],
    allergenSlugs: ["milk"],
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
        ingredients: item.ingredients,
        pairingNotes: item.pairingNotes,
        dietTags: item.dietTags,
        alcoholLevel: item.alcoholLevel,
        tasteProfile: undefined,
        spiceLevel: undefined,
        price: undefined,
        imageStorageId: undefined,
        sortOrder: sortOrder++,
        isAvailable: true,
        isSpecial: false,
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
