import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireRestaurantMember, requireUser, getCurrentUser } from "./authHelpers";

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

/** Add a staff member to a restaurant by email. Owner or app admin. Creates pending invitation if user doesn't exist yet. */
export const addMember = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    email: v.string(),
  },
  handler: async (ctx, args): Promise<"added" | "invited"> => {
    const caller = await requireUser(ctx);
    const email = args.email.toLowerCase();

    // Owner or app admin can invite
    if (caller.role !== "admin") {
      await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);
    }

    // Find user by email
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (targetUser) {
      // User exists — add immediately
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
        role: "staff",
      });
      return "added";
    }

    // User doesn't exist — create pending invitation
    const existingInvite = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existingInvite && existingInvite.restaurantId === args.restaurantId) {
      throw new Error("An invitation for this email is already pending");
    }

    await ctx.db.insert("pendingInvitations", {
      restaurantId: args.restaurantId,
      email,
      role: "staff",
      invitedBy: caller._id,
    });
    return "invited";
  },
});

/** List pending invitations for a restaurant. Owner only. */
export const listPendingInvitations = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    await requireRestaurantMember(ctx, args.restaurantId, ["owner"]);

    const invitations = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_restaurantId", (q) =>
        q.eq("restaurantId", args.restaurantId),
      )
      .take(50);

    return invitations.map((inv) => ({
      _id: inv._id,
      email: inv.email,
      role: inv.role,
      _creationTime: inv._creationTime,
    }));
  },
});

/** Cancel a pending invitation. Owner only. */
export const cancelInvitation = mutation({
  args: {
    invitationId: v.id("pendingInvitations"),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    await requireRestaurantMember(ctx, invitation.restaurantId, ["owner"]);

    await ctx.db.delete(args.invitationId);
  },
});

/** Remove a staff member from a restaurant. Owner only. Cannot remove the owner. */
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

    await requireRestaurantMember(ctx, membership.restaurantId, ["owner"]);

    await ctx.db.delete(args.membershipId);
  },
});
