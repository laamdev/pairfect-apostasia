import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getOrCreateUser = internalMutation({
  args: {
    subject: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", args.subject))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("users", {
      subject: args.subject,
      email: args.email,
      name: args.name,
    });
  },
});

/** Get the current user's info (role, email, name). */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) return null;

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role ?? "client",
    };
  },
});
