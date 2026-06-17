import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  pairingRoleValidator,
  preferenceFields,
  preferenceSnapshotValidator,
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
    tokenIdentifier: v.optional(v.string()),
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("diner"))),
    profileImageStorageId: v.optional(v.id("_storage")),
    profileImageUrl: v.optional(v.string()),
  })
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_subject", ["subject"])
    .index("by_email", ["email"]),

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
      v.literal("staff"),
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
    ingredients: v.optional(v.array(v.string())),
    pairingNotes: v.optional(v.array(v.string())),
    alcoholLevel: v.optional(alcoholToleranceValidator),
    tasteProfile: v.optional(v.array(tasteProfileValidator)),
    spiceLevel: v.optional(spiceLevelValidator),
    price: v.optional(v.number()),
    imageStorageId: v.optional(v.id("_storage")),
    sortOrder: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    isSpecial: v.optional(v.boolean()),
  })
    .index("by_restaurantId", ["restaurantId"])
    .index("by_restaurantId_and_category", ["restaurantId", "category"]),

  clientProfiles: defineTable({
    userId: v.id("users"),
    ...preferenceFields,
    displayName: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  restaurantClientProfiles: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    ...preferenceFields,
  }).index("by_restaurantId_and_userId", ["restaurantId", "userId"]),

  /** A conversational session where the diner builds/edits their preferences
   *  with the assistant. `data` is the partial preferences JSON, grown via
   *  JSON Patch as the conversation progresses. */
  preferenceChatSessions: defineTable({
    userId: v.id("users"),
    restaurantId: v.optional(v.id("restaurants")),
    scope: v.union(v.literal("global"), v.literal("restaurant")),
    data: v.string(),
    status: v.union(v.literal("draft"), v.literal("completed")),
    lastAiTurnStartedAt: v.optional(v.number()),
  }).index("by_userId", ["userId"]),

  preferenceChatMessages: defineTable({
    sessionId: v.id("preferenceChatSessions"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    isStreaming: v.optional(v.boolean()),
    streamId: v.optional(v.string()),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_streamId", ["streamId"]),

  pendingInvitations: defineTable({
    restaurantId: v.id("restaurants"),
    email: v.string(),
    role: v.union(v.literal("owner"), v.literal("staff")),
    invitedBy: v.id("users"),
  })
    .index("by_email", ["email"])
    .index("by_restaurantId", ["restaurantId"])
    .index("by_email_and_restaurantId", ["email", "restaurantId"]),

  recommendations: defineTable({
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    items: v.array(
      v.object({
        menuItemId: v.id("menuItems"),
        menuItemName: v.optional(v.string()),
        pairingName: v.optional(v.string()),
        matchPercentage: v.number(),
        reason: v.optional(v.string()),
        // Which slot of the pairing this item fills. Persisted so we can
        // regenerate a single pairing/slot independently.
        type: v.optional(
          v.union(v.literal("dish"), v.literal("drink"), v.literal("dessert")),
        ),
        // Which of the three personality pairings this item belongs to.
        role: v.optional(pairingRoleValidator),
      }),
    ),
    // Preferences snapshot can be stored for historical context if desired.
    preferenceSnapshot: v.optional(preferenceSnapshotValidator),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_restaurantId", ["userId", "restaurantId"])
    .index("by_restaurantId", ["restaurantId"]),
});
