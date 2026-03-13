import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getLatestForRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) return null;

    const [rec] = await ctx.db
      .query("recommendations")
      .withIndex("by_userId_and_restaurantId", (q) =>
        q.eq("userId", user._id).eq("restaurantId", args.restaurantId),
      )
      .order("desc")
      .take(1);

    if (!rec) return null;

    const items = await Promise.all(
      rec.items.map(async (it) => {
        const menuItem = await ctx.db.get("menuItems", it.menuItemId);
        if (!menuItem) return null;
        return {
          name: menuItem.name,
          matchPercentage: it.matchPercentage,
          reason: it.reason,
        };
      }),
    );

    return {
      _id: rec._id,
      items: items.filter((i) => i !== null),
    };
  },
});

export const deleteRecommendation = mutation({
  args: {
    recommendationId: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in required");

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const rec = await ctx.db.get("recommendations", args.recommendationId);
    if (!rec || rec.userId !== user._id) {
      throw new Error("Recommendation not found");
    }

    await ctx.db.delete(rec._id);
  },
});

