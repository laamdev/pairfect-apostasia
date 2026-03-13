import { v } from "convex/values";
import { query } from "./_generated/server";

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});

export const listRestaurants = query({
  args: {},
  handler: async (ctx) => {
    const restaurants = await ctx.db
      .query("restaurants")
      .order("desc")
      .collect();
    return restaurants.map((r) => ({
      _id: r._id,
      name: r.name,
      slug: r.slug,
      description: r.description,
    }));
  },
});
