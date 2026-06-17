import { v } from "convex/values";

/**
 * Single source of truth for the preference enums.
 *
 * Each set is declared once as a `readonly` tuple and the matching Convex
 * union validator is derived from it. The plain tuples are exported too so
 * runtime code (e.g. the preferences chatbot's `coercePrefs`) validates
 * against the exact same lists instead of re-declaring them and drifting.
 */
const literalUnion = <T extends string>(values: readonly T[]) =>
  v.union(...values.map((value) => v.literal(value)));

export const ALLERGEN_SLUGS = [
  "cereals_gluten",
  "crustaceans",
  "eggs",
  "fish",
  "peanuts",
  "soybeans",
  "milk",
  "nuts",
  "celery",
  "mustard",
  "sesame_seeds",
  "sulphur_dioxide_sulphites",
  "lupin",
  "molluscs",
] as const;

export const TASTE_PROFILES = ["sweet", "sour", "salty", "bitter", "umami"] as const;

export const SPICE_LEVELS = ["none", "low", "mid", "high"] as const;

export const DIET_PREFERENCES = [
  "vegan",
  "vegetarian",
  "pescatarian",
  "poultry",
  "meaty",
  "celiac",
  "none",
] as const;

export const ALCOHOL_LEVELS = ["none", "low", "mid", "high"] as const;

export const ADVENTUROUSNESS_LEVELS = ["classic", "balanced", "innovative"] as const;

export const BASE_SPIRITS = [
  "gin",
  "whiskey",
  "rum",
  "tequila_mezcal",
  "vodka",
  "brandy",
  "other",
  "no_preference",
] as const;

export const OCCASIONS = ["casual", "celebrating", "experimenting", "unwinding"] as const;

export const PAIRING_ROLES = ["safe", "adventurous", "wildcard"] as const;

/**
 * Canonical menu categories the pairing prompt relies on for slot assignment
 * (dish vs. drink vs. dessert). The admin UI still allows free-form category
 * strings, but these are the values the LLM logic in `recommendations.ts`
 * expects to see — keep the seed and prompt in sync via this list.
 */
export const MENU_CATEGORIES = {
  starters: "Entrantes",
  mains: "Platos principales",
  drinks: "Bebidas",
  desserts: "Postres",
} as const;

export const allergenValidator = literalUnion(ALLERGEN_SLUGS);
export const tasteProfileValidator = literalUnion(TASTE_PROFILES);
export const spiceLevelValidator = literalUnion(SPICE_LEVELS);
export const dietPreferenceValidator = literalUnion(DIET_PREFERENCES);
export const alcoholToleranceValidator = literalUnion(ALCOHOL_LEVELS);

/** How adventurous the diner wants the pairing to feel — classic execution vs.
 *  innovative/experimental. Biases the personality of generated pairings. */
export const adventurousnessValidator = literalUnion(ADVENTUROUSNESS_LEVELS);

/** Preferred cocktail base spirits (multi-select). Used to bias drink choice;
 *  inferred against each drink's name/description/ingredients by the LLM. */
export const baseSpiritValidator = literalUnion(BASE_SPIRITS);

/** The occasion/mood, used as intent context for the pairing. */
export const occasionValidator = literalUnion(OCCASIONS);

/** The personality of one of the three generated pairings. */
export const pairingRoleValidator = literalUnion(PAIRING_ROLES);

/**
 * The diner preference fields shared across `clientProfiles`,
 * `restaurantClientProfiles`, the recommendation `preferenceSnapshot`, and the
 * mutations that write them. Declared once here so the shape can't drift.
 */
export const preferenceFields = {
  tasteProfile: v.array(tasteProfileValidator),
  spiceLevel: spiceLevelValidator,
  allergenIdsToAvoid: v.array(v.id("allergens")),
  dietPreference: dietPreferenceValidator,
  alcoholTolerance: alcoholToleranceValidator,
  sweetTooth: v.optional(v.boolean()),
  adventurousness: v.optional(adventurousnessValidator),
  baseSpirits: v.optional(v.array(baseSpiritValidator)),
  occasion: v.optional(occasionValidator),
};

/** Object validator form of {@link preferenceFields}, e.g. for the stored snapshot. */
export const preferenceSnapshotValidator = v.object(preferenceFields);
