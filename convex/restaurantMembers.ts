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

/** Add an employee to a restaurant by email, with a role. Owner or app admin. Creates pending invitation if user doesn't exist yet. */
export const addMember = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    email: v.string(),
    role: v.optional(v.union(v.literal("owner"), v.literal("staff"))),
  },
  handler: async (ctx, args): Promise<"added" | "invited"> => {
    const caller = await requireUser(ctx);
    const email = args.email.toLowerCase();
    const role = args.role ?? "staff";

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
      if (existing) throw new Error("Este usuario ya es miembro del restaurante");

      await ctx.db.insert("restaurantMembers", {
        restaurantId: args.restaurantId,
        userId: targetUser._id,
        role,
      });
      return "added";
    }

    // User doesn't exist — create pending invitation. Check for an existing
    // invite for this exact (email, restaurant) pair so a second invite can't
    // slip through when the email already has invites at other restaurants.
    const existingInvite = await ctx.db
      .query("pendingInvitations")
      .withIndex("by_email_and_restaurantId", (q) =>
        q.eq("email", email).eq("restaurantId", args.restaurantId),
      )
      .first();
    if (existingInvite) {
      throw new Error("Ya hay una invitación pendiente para este correo");
    }

    await ctx.db.insert("pendingInvitations", {
      restaurantId: args.restaurantId,
      email,
      role,
      invitedBy: caller._id,
    });
    return "invited";
  },
});

/** Change an employee's role (owner ⇄ staff). Owner only. */
export const updateMemberRole = mutation({
  args: {
    membershipId: v.id("restaurantMembers"),
    role: v.union(v.literal("owner"), v.literal("staff")),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("No se encontró el miembro");

    await requireRestaurantMember(ctx, membership.restaurantId, ["owner"]);

    // Don't allow demoting the last owner — keep at least one admin employee.
    if (membership.role === "owner" && args.role !== "owner") {
      const owners = await ctx.db
        .query("restaurantMembers")
        .withIndex("by_restaurantId", (q) =>
          q.eq("restaurantId", membership.restaurantId),
        )
        .take(50);
      const ownerCount = owners.filter((m) => m.role === "owner").length;
      if (ownerCount <= 1) {
        throw new Error("No puedes quitar el último administrador del restaurante");
      }
    }

    await ctx.db.patch(args.membershipId, { role: args.role });
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
    if (!invitation) throw new Error("No se encontró la invitación");

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
    if (!membership) throw new Error("No se encontró el miembro");

    if (membership.role === "owner") {
      throw new Error("No puedes eliminar a un administrador del restaurante");
    }

    await requireRestaurantMember(ctx, membership.restaurantId, ["owner"]);

    await ctx.db.delete(args.membershipId);
  },
});
