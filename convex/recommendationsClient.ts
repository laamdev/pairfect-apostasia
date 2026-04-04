import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireRestaurantMember } from "./authHelpers";

export const getLatestForRestaurant = query({
  args: {
    restaurantId: v.id("restaurants"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const [rec] = await ctx.db
      .query("recommendations")
      .withIndex("by_userId_and_restaurantId", (q) =>
        q.eq("userId", user._id).eq("restaurantId", args.restaurantId),
      )
      .order("desc")
      .take(1);

    if (!rec) return null;

    // Reconstruct grouped pairings from flat items.
    // Items from the same pairing share pairingName + reason + matchPercentage.
    const pairingMap = new Map<string, {
      name: string;
      matchPercentage: number;
      reason?: string;
      items: Array<{ menuItemName: string }>;
    }>();

    for (const it of rec.items) {
      const itemName = it.menuItemName ?? (await ctx.db.get(it.menuItemId))?.name;
      if (!itemName) continue;
      const key = it.pairingName ?? `${it.matchPercentage}::${it.reason ?? ''}`;
      const existing = pairingMap.get(key);
      if (existing) {
        existing.items.push({ menuItemName: itemName });
      } else {
        pairingMap.set(key, {
          name: it.pairingName ?? `Pairing ${pairingMap.size + 1}`,
          matchPercentage: it.matchPercentage,
          reason: it.reason,
          items: [{ menuItemName: itemName }],
        });
      }
    }

    const pairings = Array.from(pairingMap.values());

    return {
      _id: rec._id,
      _creationTime: rec._creationTime,
      pairings,
    };
  },
});

export const deleteRecommendation = mutation({
  args: {
    recommendationId: v.id("recommendations"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Sign in required");

    const rec = await ctx.db.get("recommendations", args.recommendationId);
    if (!rec || rec.userId !== user._id) {
      throw new Error("Recommendation not found");
    }

    await ctx.db.delete(rec._id);
  },
});

/** List all recommendations for the current client, grouped by restaurant. */
export const listMyRecommendations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const recs = await ctx.db
      .query("recommendations")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return await Promise.all(
      recs.map(async (rec) => {
        const restaurant = await ctx.db.get(rec.restaurantId);
        const items = await Promise.all(
          rec.items.map(async (it) => {
            const name =
              it.menuItemName ??
              (await ctx.db.get(it.menuItemId))?.name ??
              "Unknown";
            return { name, matchPercentage: it.matchPercentage, reason: it.reason };
          }),
        );
        return {
          _id: rec._id,
          restaurantId: rec.restaurantId,
          restaurantName: restaurant?.name ?? "Unknown",
          restaurantSlug: restaurant?.slug ?? null,
          items,
          _creationTime: rec._creationTime,
        };
      }),
    );
  },
});

/** List clients who have recommendations at a specific restaurant. Staff only. */
export const listClientsForRestaurant = query({
  args: { restaurantId: v.id("restaurants") },
  handler: async (ctx, args) => {
    // Verify caller is a member of this restaurant
    await requireRestaurantMember(ctx, args.restaurantId);

    const recs = await ctx.db
      .query("recommendations")
      .withIndex("by_restaurantId", (q) =>
        q.eq("restaurantId", args.restaurantId),
      )
      .order("desc")
      .take(200);

    // Group by user, keeping the latest recommendation per user
    const userMap = new Map<
      string,
      { userId: typeof recs[0]["userId"]; latestRec: typeof recs[0] }
    >();
    for (const rec of recs) {
      const key = rec.userId;
      if (!userMap.has(key)) {
        userMap.set(key, { userId: rec.userId, latestRec: rec });
      }
    }

    return await Promise.all(
      Array.from(userMap.values()).map(async ({ userId, latestRec }) => {
        const user = await ctx.db.get(userId);
        const items = await Promise.all(
          latestRec.items.map(async (it) => {
            const name =
              it.menuItemName ??
              (await ctx.db.get(it.menuItemId))?.name ??
              "Unknown";
            return { name, matchPercentage: it.matchPercentage };
          }),
        );
        return {
          userId,
          email: user?.email ?? null,
          name: user?.name ?? null,
          latestItems: items,
          recommendedAt: latestRec._creationTime,
        };
      }),
    );
  },
});

