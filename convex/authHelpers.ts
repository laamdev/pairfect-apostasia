import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Get the current authenticated user from the users table.
 * Looks up by tokenIdentifier first, falls back to subject for old records.
 * Returns null if not authenticated or user not found.
 */
export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  // Primary lookup: tokenIdentifier (new records)
  const byToken = await ctx.db
    .query("users")
    .withIndex("by_tokenIdentifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (byToken) return byToken;

  // Fallback: subject (old records before migration)
  return await ctx.db
    .query("users")
    .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
    .unique();
}

/**
 * Get the current authenticated user, throwing if not authenticated.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Debes iniciar sesión");
  return user;
}

/**
 * Verify the current user is a member of a restaurant.
 * Returns the membership doc. Throws if not a member.
 */
export async function requireRestaurantMember(
  ctx: QueryCtx | MutationCtx,
  restaurantId: Id<"restaurants">,
  allowedRoles?: Array<"owner" | "staff">,
): Promise<{ user: Doc<"users">; membership: Doc<"restaurantMembers"> }> {
  const user = await requireUser(ctx);

  const membership = await ctx.db
    .query("restaurantMembers")
    .withIndex("by_restaurantId_and_userId", (q) =>
      q.eq("restaurantId", restaurantId).eq("userId", user._id),
    )
    .unique();

  if (!membership) {
    throw new Error("No tienes acceso a este restaurante");
  }

  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error("No tienes permisos para realizar esta acción");
  }

  return { user, membership };
}
