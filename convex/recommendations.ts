'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import {
  alcoholToleranceValidator,
  dietPreferenceValidator,
  spiceLevelValidator,
  tasteProfileValidator,
} from './validators';

const preferencesValidator = v.object({
  tasteProfile: v.array(tasteProfileValidator),
  spiceLevel: spiceLevelValidator,
  allergenIdsToAvoid: v.array(v.id('allergens')),
  dietPreference: dietPreferenceValidator,
  alcoholTolerance: alcoholToleranceValidator,
  sweetTooth: v.optional(v.boolean()),
});

type PairingResult = { name: string; matchPercentage: number; reason?: string };
export const generateRecommendations = action({
  args: {
    restaurantId: v.id('restaurants'),
    preferences: preferencesValidator,
  },
  handler: async (ctx, args): Promise<PairingResult[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Sign in required to get recommendations');

    const userId: Id<'users'> = await ctx.runMutation(internal.users.getOrCreateUser, {
      subject: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
    });

    const [menuItems, allergens] = await Promise.all([
      ctx.runQuery(api.menuItems.listByRestaurant, { restaurantId: args.restaurantId }),
      ctx.runQuery(api.allergens.listAllergens, {}),
    ]);

    const allergenMap = new Map(allergens.map((a: Doc<'allergens'>) => [a._id, a.name]));
    const menuText = menuItems
      .map(
        (m: Doc<'menuItems'>) =>
          `- ${m.name} (category: ${m.category}): ${m.description}. Allergens: ${(m.allergenIds ?? []).map((id: Id<'allergens'>) => allergenMap.get(id) ?? id).join(', ') || 'none'}. Diet: ${(m.dietTags ?? []).join(', ') || 'any'}. Alcohol: ${m.containsAlcohol ? 'yes' : 'no'}.`,
      )
      .join('\n');

    const prefs = args.preferences;
    const allergenNames = prefs.allergenIdsToAvoid.map((id) => allergenMap.get(id) ?? id).join(', ');
    const userPrompt = `User preferences:
- Taste profile: ${prefs.tasteProfile.join(', ') || 'any'}
- Spice level: ${prefs.spiceLevel}
- Allergens to avoid: ${allergenNames || 'none'}
- Diet: ${prefs.dietPreference}
- Alcohol tolerance: ${prefs.alcoholTolerance}
 - Sweet tooth (wants dessert): ${prefs.sweetTooth ? 'yes' : 'no'}

Menu:
${menuText}

Return exactly 3 menu item recommendations (from the list above) that best match the user's preferences. Respond with a single JSON object with key "recommendations" containing an array of 3 objects. Each object must have: "menuItemName" (exact name from the menu), "matchPercentage" (0-100), "reason" (short explanation). No other text.`;

    const model =
      process.env.OPENROUTER_MODEL ??
      process.env.OPENAI_MODEL ??
      process.env.LLM_MODEL ??
      // current default, kept for backwards compatibility
      'gpt-4o-mini';

    const systemPrompt =
      "You are a food and drink pairing expert. Given a user's taste and dietary preferences and a restaurant menu, recommend pairings that best match.\n\nRules:\n- Always choose exactly ONE main dish (category 'Comida' or similar).\n- Always choose exactly ONE drink (category 'Coctelería' or 'Bebidas para conductores').\n- If the user has a sweet tooth (sweetTooth = true), also choose exactly ONE dessert (category 'Postres' or similar).\n- If sweetTooth = false, DO NOT include a dessert — only dish + drink.\n\nOutput format:\nRespond with a single JSON object with key 'recommendations' containing an array of 2 or 3 objects (2 = dish + drink, 3 = dish + drink + dessert). Each object must have: menuItemName (exact name from the menu), matchPercentage (0-100), reason (short explanation), and type ('dish' | 'drink' | 'dessert'). No other text.";

    const raw = await (async () => {
      const baseURL = process.env.OPENROUTER_BASE_URL;
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('Missing API key (set OPENROUTER_API_KEY)');

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey,
        baseURL,
      });

      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: userPrompt },
        ],
        // Cap tokens to stay within free-tier OpenRouter limits.
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      });

      return completion.choices[0]?.message?.content ?? null;
    })();

    if (!raw) throw new Error('No response from LLM');

    let recommendations: Array<{ menuItemName: string; matchPercentage: number; reason?: string }>;
    try {
      const parsed = JSON.parse(raw) as
        | { recommendations?: Array<{ menuItemName: string; matchPercentage: number; reason?: string }> }
        | Array<{ menuItemName: string; matchPercentage: number; reason?: string }>;
      recommendations = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.recommendations)
          ? parsed.recommendations
          : [];
    } catch {
      recommendations = [];
    }

    const nameToItem = new Map(menuItems.map((m: Doc<'menuItems'>) => [m.name.trim().toLowerCase(), m]));
    const items: Array<{ menuItemId: Id<'menuItems'>; matchPercentage: number; reason?: string }> = [];

    for (const rec of recommendations.slice(0, 3)) {
      const name = (rec.menuItemName ?? '').trim();
      const key = name.toLowerCase();
      const menuItem =
        nameToItem.get(key) ??
        menuItems.find(
          (m: Doc<'menuItems'>) => m.name.toLowerCase().includes(key) || key.includes(m.name.toLowerCase()),
        );
      if (menuItem) {
        items.push({
          menuItemId: menuItem._id,
          matchPercentage: Math.min(100, Math.max(0, Number(rec.matchPercentage) || 0)),
          reason: rec.reason,
        });
      }
    }

    if (items.length === 0) throw new Error('Could not match any recommendations to menu items');

    await ctx.runMutation(internal.recommendationsInternal.insertRecommendation, {
      userId,
      restaurantId: args.restaurantId,
      items,
      preferenceSnapshot: prefs,
    });

    const names = new Map(menuItems.map((m: Doc<'menuItems'>) => [m._id, m.name]));
    return items.map(
      (it): PairingResult => ({
        name: names.get(it.menuItemId) ?? 'Unknown',
        matchPercentage: it.matchPercentage,
        reason: it.reason,
      }),
    );
  },
});
