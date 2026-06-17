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

/**
 * Bootstrap the first restaurant admin (owner) for the single-tenant app.
 * Looks up a user by email and links them as "owner" of the restaurant
 * matching the given slug. Run once via the CLI:
 *   npx convex run admin:bootstrapOwnerByEmail '{"email":"you@example.com","slug":"la-apostasia"}'
 * Internal only — never exposed to the public API.
 */
export const bootstrapOwnerByEmail = internalMutation({
  args: {
    email: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) {
      throw new Error(
        `No existe ningún usuario con el correo ${email}. Pídele que inicie sesión una vez y vuelve a ejecutar este comando.`,
      );
    }

    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!restaurant) {
      throw new Error(
        `No existe ningún restaurante con el identificador "${args.slug}". Ejecuta primero el seed.`,
      );
    }

    const existing = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", restaurant._id).eq("userId", user._id),
      )
      .unique();
    if (existing) {
      if (existing.role !== "owner") {
        await ctx.db.patch(existing._id, { role: "owner" });
      }
      return existing._id;
    }

    return await ctx.db.insert("restaurantMembers", {
      restaurantId: restaurant._id,
      userId: user._id,
      role: "owner",
    });
  },
});

/**
 * Reverse bootstrapOwnerByEmail: remove a user's membership of the restaurant
 * so they become a plain diner (comensal) again. Internal only.
 *   npx convex run admin:removeMembershipByEmail '{"email":"you@example.com","slug":"la-apostasia"}'
 */
export const removeMembershipByEmail = internalMutation({
  args: {
    email: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) throw new Error(`No existe ningún usuario con el correo ${email}.`);

    const restaurant = await ctx.db
      .query("restaurants")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!restaurant) {
      throw new Error(`No existe ningún restaurante con el identificador "${args.slug}".`);
    }

    const membership = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", restaurant._id).eq("userId", user._id),
      )
      .unique();

    if (!membership) return "ya-era-comensal";
    await ctx.db.delete(membership._id);
    return "comensal";
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
    if (admin.role !== "admin") throw new Error("Solo los administradores pueden asignar empleados");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new Error("No se encontró el usuario");

    // Check not already linked
    const existing = await ctx.db
      .query("restaurantMembers")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", args.userId),
      )
      .unique();
    if (existing) throw new Error("Este usuario ya está asignado al restaurante");

    await ctx.db.insert("restaurantMembers", {
      restaurantId: args.restaurantId,
      userId: args.userId,
      role: "owner",
    });

  },
});
