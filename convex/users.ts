import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getCurrentUser } from "./authHelpers";

/**
 * Shared helper: find or create a user record by tokenIdentifier.
 * Falls back to subject lookup to backfill old records.
 */
async function getOrCreateUserFromIdentity(
  ctx: MutationCtx,
  rawIdentity: { tokenIdentifier: string; subject: string; email?: string; name?: string; pictureUrl?: string },
): Promise<Id<"users">> {
  // Normalize email to lowercase so it matches how every `by_email` lookup
  // (addMember, bootstrapOwnerByEmail, …) queries it.
  const identity = {
    ...rawIdentity,
    email: rawIdentity.email?.toLowerCase(),
  };

  // Try tokenIdentifier first (new records)
  const byToken = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (byToken) {
    // Sync profile fields from the identity provider
    const updates: Record<string, string | undefined> = {};
    if (identity.email !== undefined && identity.email !== byToken.email)
      updates.email = identity.email;
    if (identity.name !== undefined && identity.name !== byToken.name)
      updates.name = identity.name;
    // Only update WorkOS picture if user hasn't uploaded a custom one
    if (identity.pictureUrl && !byToken.profileImageStorageId && identity.pictureUrl !== byToken.profileImageUrl)
      updates.profileImageUrl = identity.pictureUrl;
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(byToken._id, updates);
    }
    return byToken._id;
  }

  // Fallback: old records that only have subject
  const bySubject = await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
  if (bySubject) {
    // Backfill tokenIdentifier + sync profile
    await ctx.db.patch(bySubject._id, {
      tokenIdentifier: identity.tokenIdentifier,
      ...(identity.email !== undefined && identity.email !== bySubject.email
        ? { email: identity.email }
        : {}),
      ...(identity.name !== undefined && identity.name !== bySubject.name
        ? { name: identity.name }
        : {}),
      ...(identity.pictureUrl && !bySubject.profileImageStorageId
        ? { profileImageUrl: identity.pictureUrl }
        : {}),
    });
    return bySubject._id;
  }

  // New user
  return await ctx.db.insert("users", {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
    profileImageUrl: identity.pictureUrl,
  });
}

/**
 * Internal mutation for actions that need to get-or-create a user.
 * Actions can't use ctx.db directly, so they call this via ctx.runMutation.
 */
export const getOrCreateUser = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await getOrCreateUserFromIdentity(ctx, args);
  },
});

/**
 * Public mutation: ensures a user record exists for the current auth session.
 * Called by the client on every page load via useEnsureUser hook.
 * Optionally sets initial role for first-time users.
 */
export const ensureUser = mutation({
  args: {
    role: v.optional(v.union(v.literal("diner"), v.literal("admin"))),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Debes iniciar sesión");

    const userId = await getOrCreateUserFromIdentity(ctx, {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      email: identity.email ?? args.email,
      name: identity.name ?? args.name,
      pictureUrl: identity.pictureUrl,
    });

    // Set initial role only if not already assigned (don't override admin)
    if (args.role) {
      const user = await ctx.db.get(userId);
      if (user && !user.role) {
        await ctx.db.patch(userId, { role: args.role });
      }
    }

    // Claim any pending invitations for this email
    const email = identity.email?.toLowerCase();
    if (email) {
      const invitations = await ctx.db
        .query("pendingInvitations")
        .withIndex("by_email", (q) => q.eq("email", email))
        .take(20);

      for (const invite of invitations) {
        // Avoid duplicate memberships
        const existing = await ctx.db
          .query("restaurantMembers")
          .withIndex("by_restaurantId_and_userId", (q) =>
            q.eq("restaurantId", invite.restaurantId).eq("userId", userId),
          )
          .unique();
        if (!existing) {
          await ctx.db.insert("restaurantMembers", {
            restaurantId: invite.restaurantId,
            userId,
            role: invite.role,
          });
        }
        await ctx.db.delete(invite._id);
      }
    }

    return userId;
  },
});

/** Generate an upload URL for profile image. */
export const generateProfileImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Debes iniciar sesión");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Update the current user's profile (name, profile image). */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    profileImageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Debes iniciar sesión");

    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.profileImageStorageId !== undefined) patch.profileImageStorageId = args.profileImageStorageId;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(user._id, patch);
    }
  },
});

/** Get the current user's info (role, email, name, restaurant membership). */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    // Convex-uploaded image takes priority, then WorkOS profile picture
    const avatarUrl = user.profileImageStorageId
      ? await ctx.storage.getUrl(user.profileImageStorageId)
      : user.profileImageUrl ?? null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role ?? "diner",
      isRestaurantMember: !!membership,
      // Membership role within the restaurant: "owner" (employee admin),
      // "staff" (read-only employee), or null (diner / not a member).
      membershipRole: membership?.role ?? null,
      avatarUrl,
    };
  },
});
