import { v } from "convex/values";

export const allergenValidator = v.union(
  v.literal("cereals_gluten"),
  v.literal("crustaceans"),
  v.literal("eggs"),
  v.literal("fish"),
  v.literal("peanuts"),
  v.literal("soybeans"),
  v.literal("milk"),
  v.literal("nuts"),
  v.literal("celery"),
  v.literal("mustard"),
  v.literal("sesame_seeds"),
  v.literal("sulphur_dioxide_sulphites"),
  v.literal("lupin"),
  v.literal("molluscs"),
);

export const tasteProfileValidator = v.union(
  v.literal("sweet"),
  v.literal("sour"),
  v.literal("salty"),
  v.literal("bitter"),
  v.literal("umami"),
);

export const spiceLevelValidator = v.union(
  v.literal("none"),
  v.literal("low"),
  v.literal("mid"),
  v.literal("high"),
);

export const dietPreferenceValidator = v.union(
  v.literal("vegan"),
  v.literal("vegetarian"),
  v.literal("pescatarian"),
  v.literal("poultry"),
  v.literal("meaty"),
  v.literal("celiac"),
  v.literal("none"),
);

export const alcoholToleranceValidator = v.union(
  v.literal("none"),
  v.literal("low"),
  v.literal("mid"),
  v.literal("high"),
);

