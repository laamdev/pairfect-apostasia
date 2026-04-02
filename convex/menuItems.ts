import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { requireRestaurantMember } from "./authHelpers";
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  spiceLevelValidator,
  tasteProfileValidator,
} from "./validators";

export const listByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .order("asc")
      .take(200);
  },
});

export const getById = query({
  args: { menuItemId: v.id("menuItems") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.menuItemId);
  },
});

/** Create a menu item. Requires editor+ role on the restaurant. */
export const createMenuItem = mutation({
  args: {
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
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"menuItems">> => {
    await requireRestaurantMember(ctx, args.restaurantId);

    return await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      name: args.name,
      description: args.description,
      category: args.category,
      allergenIds: args.allergenIds,
      dietTags: args.dietTags,
      containsAlcohol: args.containsAlcohol,
      alcoholLevel: args.alcoholLevel,
      tasteProfile: args.tasteProfile,
      spiceLevel: args.spiceLevel,
      price: args.price,
      sortOrder: args.sortOrder,
    });
  },
});

/** Update a menu item. Requires editor+ role on the restaurant. */
export const updateMenuItem = mutation({
  args: {
    menuItemId: v.id("menuItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    allergenIds: v.optional(v.array(v.id("allergens"))),
    dietTags: v.optional(v.array(dietPreferenceValidator)),
    containsAlcohol: v.optional(v.boolean()),
    alcoholLevel: v.optional(alcoholToleranceValidator),
    tasteProfile: v.optional(v.array(tasteProfileValidator)),
    spiceLevel: v.optional(spiceLevelValidator),
    price: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.menuItemId);
    if (!item) throw new Error("Menu item not found");

    await requireRestaurantMember(ctx, item.restaurantId);

    const { menuItemId, ...updates } = args;
    // Filter out undefined values
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(menuItemId, patch);
    }
  },
});

/** Delete a menu item. Requires editor+ role on the restaurant. */
export const deleteMenuItem = mutation({
  args: { menuItemId: v.id("menuItems") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.menuItemId);
    if (!item) throw new Error("Menu item not found");

    await requireRestaurantMember(ctx, item.restaurantId);

    await ctx.db.delete(args.menuItemId);
  },
});
