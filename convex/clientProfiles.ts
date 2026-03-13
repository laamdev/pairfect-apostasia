import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  spiceLevelValidator,
  tasteProfileValidator,
} from "./validators";

export const getGlobalProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) return null;

    const profile = await ctx.db
      .query("clientProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
    return profile;
  },
});

export const upsertGlobalProfile = mutation({
  args: {
    tasteProfile: v.array(tasteProfileValidator),
    spiceLevel: spiceLevelValidator,
    allergenIdsToAvoid: v.array(v.id("allergens")),
    dietPreference: dietPreferenceValidator,
    alcoholTolerance: alcoholToleranceValidator,
    sweetTooth: v.optional(v.boolean()),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"clientProfiles">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in required");

    const userId: Id<"users"> = await ctx.runMutation(internal.users.getOrCreateUser, {
      subject: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
    });

    const existing: Doc<"clientProfiles"> | null = await ctx.db
      .query("clientProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const base = {
      userId,
      tasteProfile: args.tasteProfile,
      spiceLevel: args.spiceLevel,
      allergenIdsToAvoid: args.allergenIdsToAvoid,
      dietPreference: args.dietPreference,
      alcoholTolerance: args.alcoholTolerance,
      sweetTooth: args.sweetTooth ?? false,
      displayName: args.displayName,
    };

    if (existing) {
      await ctx.db.patch(existing._id, base);
      return existing._id;
    }

    return await ctx.db.insert("clientProfiles", base);
  },
});

export const getRestaurantProfile = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { restaurantProfile: null, globalProfile: null };

    const user = await ctx.db
      .query("users")
      .withIndex("by_subject", (q) => q.eq("subject", identity.subject))
      .unique();
    if (!user) return { restaurantProfile: null, globalProfile: null };

    const [restaurantProfile, globalProfile] = await Promise.all([
      ctx.db
        .query("restaurantClientProfiles")
        .withIndex("by_restaurantId_and_userId", (q) =>
          q.eq("restaurantId", args.restaurantId).eq("userId", user._id),
        )
        .unique(),
      ctx.db
        .query("clientProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique(),
    ]);

    return { restaurantProfile, globalProfile };
  },
});

export const upsertRestaurantProfile = mutation({
  args: {
    restaurantId: v.id("restaurants"),
    useGlobal: v.boolean(),
    tasteProfile: v.array(tasteProfileValidator),
    spiceLevel: spiceLevelValidator,
    allergenIdsToAvoid: v.array(v.id("allergens")),
    dietPreference: dietPreferenceValidator,
    alcoholTolerance: alcoholToleranceValidator,
    sweetTooth: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Id<"restaurantClientProfiles"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in required");

    const userId: Id<"users"> = await ctx.runMutation(internal.users.getOrCreateUser, {
      subject: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
    });

    const existing: Doc<"restaurantClientProfiles"> | null = await ctx.db
      .query("restaurantClientProfiles")
      .withIndex("by_restaurantId_and_userId", (q) =>
        q.eq("restaurantId", args.restaurantId).eq("userId", userId),
      )
      .unique();

    if (args.useGlobal) {
      // If user chooses to use global preferences, remove any restaurant-specific override.
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    const base = {
      userId,
      restaurantId: args.restaurantId,
      tasteProfile: args.tasteProfile,
      spiceLevel: args.spiceLevel,
      allergenIdsToAvoid: args.allergenIdsToAvoid,
      dietPreference: args.dietPreference,
      alcoholTolerance: args.alcoholTolerance,
      sweetTooth: args.sweetTooth ?? false,
    };

    if (existing) {
      await ctx.db.patch(existing._id, base);
      return existing._id;
    }

    return await ctx.db.insert("restaurantClientProfiles", base);
  },
});

