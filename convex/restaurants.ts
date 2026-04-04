import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser, requireUser, requireRestaurantMember } from "./authHelpers";

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
      .take(100);
    return Promise.all(
      restaurants.map(async (r) => ({
        _id: r._id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        logoUrl: r.logoStorageId ? await ctx.storage.getUrl(r.logoStorageId) : null,
      })),
    );
  },
});

/** List restaurants the current user is a member of (for admin dashboard). */
export const listMyRestaurants = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const restaurants = await Promise.all(
      memberships.map(async (m) => {
        const restaurant = await ctx.db.get(m.restaurantId);
        if (!restaurant) return null;
        const logoUrl = restaurant.logoStorageId
          ? await ctx.storage.getUrl(restaurant.logoStorageId)
          : null;
        return {
          _id: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          logoUrl,
          role: m.role,
        };
      }),
    );

    return restaurants.filter((r) => r !== null);
  },
});

/** Create a new restaurant. Admin only. */
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    staffUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args): Promise<Id<"restaurants">> => {
    const user = await requireUser(ctx);
    if (user.role !== "admin") throw new Error("Only admins can create restaurants");

    // Ensure slug is unique
    const existing = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("A restaurant with this slug already exists");

    const restaurantId = await ctx.db.insert("restaurants", {
      name: args.name,
      slug: args.slug,
      description: args.description,
    });

    // If a staff user is specified, link them to the restaurant (avoid duplicates)
    if (args.staffUserId) {
      const existing = await ctx.db
        .query("restaurantMembers")
        .withIndex("by_restaurantId_and_userId", (q) =>
          q.eq("restaurantId", restaurantId).eq("userId", args.staffUserId!),
        )
        .unique();
      if (!existing) {
        await ctx.db.insert("restaurantMembers", {
          restaurantId,
          userId: args.staffUserId,
          role: "owner",
        });
      }
    }

    return restaurantId;
  },
});

/** Generate an upload URL for file storage. Only restaurant owners can upload. */
export const generateUploadUrl = mutation({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Update restaurant info. Only owner/admin can do this. */
export const updateRestaurant = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);

    const updates: Record<string, string | Id<"_storage">> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.logoStorageId !== undefined) updates.logoStorageId = args.logoStorageId;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.restaurantId, updates);
    }
  },
});
