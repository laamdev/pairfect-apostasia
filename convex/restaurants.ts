import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireUser, requireRestaurantMember } from "./authHelpers";

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
    return restaurants.map((r) => ({
      _id: r._id,
      name: r.name,
      slug: r.slug,
      description: r.description,
    }));
  },
});

/** List restaurants the current user is a member of (for admin dashboard). */
export const listMyRestaurants = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) return [];

    const memberships = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(50);

    const restaurants = await Promise.all(
      memberships.map(async (m) => {
        const restaurant = await ctx.db.get(m.restaurantId);
        if (!restaurant) return null;
        return {
          _id: restaurant._id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          role: m.role,
        };
      }),
    );

    return restaurants.filter((r) => r !== null);
  },
});

/** Create a new restaurant. The creator becomes the owner. */
export const createRestaurant = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"restaurants">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in required");

    const userId: Id<"users"> = await ctx.runMutation(
      internal.users.getOrCreateUser,
      {
        subject: identity.subject,
        email: identity.email ?? undefined,
        name: identity.name ?? undefined,
      },
    );

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

    // Make creator the owner
    await ctx.db.insert("restaurantMembers", {
      restaurantId,
      userId,
      role: "owner",
    });

    // Set user role to staff if not already set
    const user = await ctx.db.get(userId);
    if (user && !user.role) {
      await ctx.db.patch(userId, { role: "staff" });
    }

    return restaurantId;
  },
});

/** Update restaurant info. Only owner/admin can do this. */
export const updateRestaurant = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner", "admin"]);

    const updates: Record<string, string> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.restaurantId, updates);
    }
  },
});
