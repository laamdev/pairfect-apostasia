import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireUser } from "./authHelpers";

/** List all users. Internal only — for admin/debugging. */
export const listUsers = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").take(50);
  },
});

/** Link a user to a restaurant as owner. Internal only. */
export const linkUserToRestaurant = internalMutation({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
    role: v.union(v.literal("owner"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", args.userId),
      )
      .unique();
    if (existing) return existing._id;

    const id = await ctx.db.insert("restaurantMembers", {
      restaurantId: args.restaurantId,
      userId: args.userId,
      role: args.role,
    });

    return id;
  },
});

/** List all users (for admin to assign to restaurants). Admin only. */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role !== "admin") return [];

    const users = await ctx.db.query("users").take(200);
    return users
      .filter((u) => u.role !== "admin")
      .map((u) => ({
        _id: u._id,
        email: u.email,
        name: u.name,
        role: u.role ?? "diner",
      }));
  },
});

/** Assign a staff user to a restaurant. Admin only. */
export const assignStaffToRestaurant = mutation({
  args: {
    userId: v.id("users"),
    restaurantId: v.id("restaurants"),
  },
  handler: async (ctx, args) => {
    const admin = await requireUser(ctx);
    if (admin.role !== "admin") throw new Error("Only admins can assign staff");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("User not found");

    // Check not already linked
    const existing = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", args.userId),
      )
      .unique();
    if (existing) throw new Error("User is already assigned to this restaurant");

    await ctx.db.insert("restaurantMembers", {
      restaurantId: args.restaurantId,
      userId: args.userId,
      role: "owner",
    });

  },
});
