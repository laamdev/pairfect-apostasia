import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
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
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .order("asc")
      .take(200);
    return Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: item.imageStorageId
          ? await ctx.storage.getUrl(item.imageStorageId)
          : null,
      })),
    );
  },
});

/** List only available menu items for a restaurant (public-facing). */
export const listAvailableByRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .order("asc")
      .take(200);
    const available = items.filter((item) => item.isAvailable !== false);
    return Promise.all(
      available.map(async (item) => ({
        ...item,
        imageUrl: item.imageStorageId
          ? await ctx.storage.getUrl(item.imageStorageId)
          : null,
      })),
    );
  },
});

/** Lean list of available items for the pairing action — no image URL
 *  resolution (the LLM prompt doesn't use images, so we skip N storage calls). */
export const listAvailableForPairing = internalQuery({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("menuItems")
      .withIndex("by_restaurantId", (q) => q.eq("restaurantId", args.restaurantId))
      .order("asc")
      .take(200);
    return items.filter((item) => item.isAvailable !== false);
  },
});

/** Generate an upload URL for a menu item image. */
export const generateUploadUrl = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);
    return await ctx.storage.generateUploadUrl();
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
    ingredients: v.optional(v.array(v.string())),
    pairingNotes: v.optional(v.array(v.string())),
    dietTags: v.optional(v.array(dietPreferenceValidator)),
    alcoholLevel: v.optional(alcoholToleranceValidator),
    tasteProfile: v.optional(v.array(tasteProfileValidator)),
    spiceLevel: v.optional(spiceLevelValidator),
    price: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    isSpecial: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"menuItems">> => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);

    return await ctx.db.insert("menuItems", {
      restaurantId: args.restaurantId,
      name: args.name,
      description: args.description,
      category: args.category,
      allergenIds: args.allergenIds,
      ingredients: args.ingredients,
      pairingNotes: args.pairingNotes,
      dietTags: args.dietTags,
      alcoholLevel: args.alcoholLevel,
      tasteProfile: args.tasteProfile,
      spiceLevel: args.spiceLevel,
      price: args.price,
      sortOrder: args.sortOrder,
      isAvailable: args.isAvailable ?? true,
      isSpecial: args.isSpecial ?? false,
      imageStorageId: args.imageStorageId,
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
    ingredients: v.optional(v.array(v.string())),
    pairingNotes: v.optional(v.array(v.string())),
    dietTags: v.optional(v.array(dietPreferenceValidator)),
    alcoholLevel: v.optional(alcoholToleranceValidator),
    tasteProfile: v.optional(v.array(tasteProfileValidator)),
    spiceLevel: v.optional(spiceLevelValidator),
    price: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    isAvailable: v.optional(v.boolean()),
    isSpecial: v.optional(v.boolean()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.menuItemId);
    if (!item) throw new Error("No se encontró el plato");

    await requireRestaurantMember(ctx, item.restaurantId, ["owner"]);

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
    if (!item) throw new Error("No se encontró el plato");

    await requireRestaurantMember(ctx, item.restaurantId, ["owner"]);

    await ctx.db.delete(args.menuItemId);
  },
});
