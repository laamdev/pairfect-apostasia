import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  spiceLevelValidator,
  tasteProfileValidator,
} from "./validators";

export const insertRecommendation = internalMutation({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    items: v.array(
      v.object({
        menuItemId: v.id("menuItems"),
        menuItemName: v.optional(v.string()),
        matchPercentage: v.number(),
        reason: v.optional(v.string()),
      }),
    ),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("recommendations", {
      userId: args.userId,
      restaurantId: args.restaurantId,
      items: args.items,
      preferenceSnapshot: args.preferenceSnapshot,
    });
  },
});
