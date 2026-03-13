import { query } from "./_generated/server";

export const listAllergens = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("allergens")
      .withIndex("by_sortOrder")
      .order("asc")
      .collect();
  },
});
