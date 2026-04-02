import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRestaurantMember, getCurrentUser } from "./authHelpers";

/** List members of a restaurant. Requires membership. */
export const listMembers = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", user._id),
      )
      .unique();
    if (!membership) return [];

    const members = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId", (q) =>
        q.eq("restaurantId", args.restaurantId),
      )
      .take(50);

    return await Promise.all(
      members.map(async (m) => {
        const memberUser = await ctx.db.get(m.userId);
        return {
          _id: m._id,
          userId: m.userId,
          role: m.role,
          email: memberUser?.email ?? null,
          name: memberUser?.name ?? null,
        };
      }),
    );
  },
});

/** Add a member to a restaurant by email. Owner/admin only. */
export const addMember = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("editor")),
  },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner", "admin"]);

    // Find user by email
    const users = await ctx.db.query("users").take(500);
    const targetUser = users.find(
      (u) => u.email?.toLowerCase() === args.email.toLowerCase(),
    );
    if (!targetUser) {
      throw new Error("No user found with that email. They must sign up first.");
    }

    // Check if already a member
    const existing = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", targetUser._id),
      )
      .unique();
    if (existing) throw new Error("User is already a member of this restaurant");

    await ctx.db.insert("restaurantMembers", {
      restaurantId: args.restaurantId,
      userId: targetUser._id,
      role: args.role,
    });

    // Set user role to staff if not already
    if (!targetUser.role || targetUser.role === "client") {
      await ctx.db.patch(targetUser._id, { role: "staff" });
    }
  },
});

/** Remove a member from a restaurant. Owner/admin only. Cannot remove the owner. */
export const removeMember = mutation({
  args: {
    membershipId: v.id("restaurantMembers"),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");

    if (membership.role === "owner") {
      throw new Error("Cannot remove the restaurant owner");
    }

    await requireRestaurantMember(ctx, membership.restaurantId, [
      "owner",
      "admin",
    ]);

    await ctx.db.delete(args.membershipId);
  },
});
