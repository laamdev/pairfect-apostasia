import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { pairingRoleValidator, preferenceSnapshotValidator } from "./validators";

/** Raw recommendation (with item types) for a user at a restaurant. Used by the
 *  generate action to regenerate a single slot of an existing pairing. */
export const getRawForUserRestaurant = internalQuery({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recommendations")
      .withIndex("by_userId_and_restaurantId", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", args.restaurantId),
      )
      .unique();
  },
});

export const insertRecommendation = internalMutation({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    items: v.array(
      v.object({
        menuItemId: v.id("menuItems"),
        menuItemName: v.optional(v.string()),
        pairingName: v.optional(v.string()),
        matchPercentage: v.number(),
        reason: v.optional(v.string()),
        type: v.optional(
          v.union(v.literal("dish"), v.literal("drink"), v.literal("dessert")),
        ),
        role: v.optional(pairingRoleValidator),
      }),
    ),
    preferenceSnapshot: v.optional(preferenceSnapshotValidator),
  },
  handler: async (ctx, args) => {
    // One recommendation per user per restaurant — replace existing
    const existing = await ctx.db
      .query("recommendations")
      .withIndex("by_userId_and_restaurantId", (q) =>
        q.eq("userId", args.userId).eq("restaurantId", args.restaurantId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("recommendations", {
      userId: args.userId,
      restaurantId: args.restaurantId,
      items: args.items,
      preferenceSnapshot: args.preferenceSnapshot,
    });
  },
});
