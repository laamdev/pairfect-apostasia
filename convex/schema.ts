import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  spiceLevelValidator,
  tasteProfileValidator,
} from "./validators";

export default defineSchema({
  /** EU 14 allergens of mandatory declaration (Regulation (EU) No 1169/2011). Seeded once; menu items and client preferences reference by id. */
  allergens: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),

  users: defineTable({
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("client"), v.literal("staff"))),
  }).index("by_subject", ["subject"]),

  restaurants: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  }).index("by_slug", ["slug"]),

  restaurantMembers: defineTable({
    restaurantId: v.id("restaurants"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("editor"),
    ),
  })
    .index("by_restaurantId", ["restaurantId"])
    .index("by_userId", ["userId"])
    .index("by_restaurantId_and_userId", ["restaurantId", "userId"]),

  menuItems: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    description: v.string(),
    category: v.string(),
    allergenIds: v.array(v.id("allergens")),
    dietTags: v.optional(v.array(dietPreferenceValidator)),
    containsAlcohol: v.boolean(),
    alcoholLevel: v.optional(alcoholToleranceValidator),
    tasteProfile: v.optional(v.array(tasteProfileValidator)),
    spiceLevel: v.optional(spiceLevelValidator),
    price: v.optional(v.number()),
    imageStorageId: v.optional(v.id("_storage")),
    sortOrder: v.optional(v.number()),
  })
    .index("by_restaurantId", ["restaurantId"])
    .index("by_restaurantId_and_category", ["restaurantId", "category"]),

  clientProfiles: defineTable({
    userId: v.id("users"),
    tasteProfile: v.array(tasteProfileValidator),
    spiceLevel: spiceLevelValidator,
    allergenIdsToAvoid: v.array(v.id("allergens")),
    dietPreference: dietPreferenceValidator,
    alcoholTolerance: alcoholToleranceValidator,
    sweetTooth: v.optional(v.boolean()),
    displayName: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  restaurantClientProfiles: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    tasteProfile: v.array(tasteProfileValidator),
    spiceLevel: spiceLevelValidator,
    allergenIdsToAvoid: v.array(v.id("allergens")),
    dietPreference: dietPreferenceValidator,
    alcoholTolerance: alcoholToleranceValidator,
    sweetTooth: v.optional(v.boolean()),
  })
    .index("by_userId", ["userId"])
    .index("by_restaurantId_and_userId", ["restaurantId", "userId"]),

  recommendations: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    items: v.array(
      v.object({
        menuItemId: v.id("menuItems"),
        matchPercentage: v.number(),
        reason: v.optional(v.string()),
      }),
    ),
    clientProfileId: v.optional(v.id("clientProfiles")),
    // Preferences snapshot can be stored for historical context if desired.
    preferenceSnapshot: v.optional(
      v.object({
        tasteProfile: v.array(tasteProfileValidator),
        spiceLevel: spiceLevelValidator,
        allergenIdsToAvoid: v.array(v.id("allergens")),
        dietPreference: dietPreferenceValidator,
        alcoholTolerance: alcoholToleranceValidator,
        sweetTooth: v.optional(v.boolean()),
      }),
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_restaurantId", ["userId", "restaurantId"])
    .index("by_restaurantId", ["restaurantId"]),
});
