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

type PairingItemResult = { menuItemName: string; type: 'dish' | 'drink' | 'dessert' };
type PairingResult = { name: string; matchPercentage: number; reason?: string; items: PairingItemResult[] };
export const generateRecommendations = action({
  args: {
    restaurantId: v.id('restaurants'),
    preferences: preferencesValidator,
  },
  handler: async (ctx, args): Promise<PairingResult[]> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Sign in required to get recommendations');

    const userId: Id<'users'> = await ctx.runMutation(internal.users.getOrCreateUser, {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
    });

    const [menuItems, allergens] = await Promise.all([
      ctx.runQuery(api.menuItems.listAvailableByRestaurant, { restaurantId: args.restaurantId }),
      ctx.runQuery(api.allergens.listAllergens, {}),
    ]);

    const allergenMap = new Map(allergens.map((a: Doc<'allergens'>) => [a._id, a.name]));
    const menuText = menuItems
      .map(
        (m: Doc<'menuItems'>) =>
          `- ${m.name} (category: ${m.category}): ${m.description}. Allergens: ${(m.allergenIds ?? []).map((id: Id<'allergens'>) => allergenMap.get(id) ?? id).join(', ') || 'none'}. Diet: ${(m.dietTags ?? []).join(', ') || 'any'}. Alcohol level: ${m.alcoholLevel ?? 'none'}.`,
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
- Include dessert: ${prefs.sweetTooth ? 'yes' : 'no'}

Menu:
${menuText}

Generate exactly 3 different pairings. Each pairing is a complete set: one dish + one beverage${prefs.sweetTooth ? ' + one dessert' : ''}. Use different items across pairings — do not repeat the same dish or beverage.`;

    const model =
      process.env.OPENROUTER_MODEL ??
      process.env.OPENAI_MODEL ??
      process.env.LLM_MODEL ??
      // current default, kept for backwards compatibility
      'google/gemini-3.1-flash-lite';

    const systemPrompt = `You are a food and drink pairing expert. Given a user's taste and dietary preferences and a restaurant menu, recommend 3 complete pairings.

Rules:
- Each pairing is a SET of items meant to be enjoyed together: one dish (from 'Appetizers' or 'Main Dishes') + one beverage (from 'Beverages') + optionally one dessert (from 'Desserts').
- Generate exactly 3 different pairings. Each pairing should use different dishes and beverages — avoid repeating the same item across pairings.
- Respect the user's alcohol tolerance when choosing beverages (alcoholLevel 'none' means pick non-alcoholic beverages only).
- Respect allergen restrictions strictly — never recommend items containing allergens the user wants to avoid.
- Only include a dessert in each pairing if the user wants dessert.

Output format:
Respond with a single JSON object with key "pairings" containing an array of exactly 3 objects. Each pairing object must have:
- "name": a short creative name for this pairing (e.g. "The Mediterranean")
- "matchPercentage": 0-100 overall match score
- "reason": short explanation of why these items go well together
- "items": array of objects, each with "menuItemName" (exact name from the menu) and "type" ("dish" | "drink" | "dessert")

No other text.`;

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

    type LLMPairing = {
      name?: string;
      matchPercentage?: number;
      reason?: string;
      items?: Array<{ menuItemName?: string; type?: string }>;
    };

    let pairings: LLMPairing[];
    try {
      const parsed = JSON.parse(raw) as { pairings?: LLMPairing[] };
      pairings = Array.isArray(parsed.pairings) ? parsed.pairings : [];
    } catch {
      pairings = [];
    }

    const nameToItem = new Map(menuItems.map((m: Doc<'menuItems'>) => [m.name.trim().toLowerCase(), m]));

    const findMenuItem = (itemName: string) => {
      const key = itemName.trim().toLowerCase();
      return (
        nameToItem.get(key) ??
        menuItems.find(
          (m: Doc<'menuItems'>) => m.name.toLowerCase().includes(key) || key.includes(m.name.toLowerCase()),
        )
      );
    };

    // Flatten all items for storage
    const allItems: Array<{ menuItemId: Id<'menuItems'>; menuItemName?: string; pairingName?: string; matchPercentage: number; reason?: string }> = [];

    const results: PairingResult[] = [];

    for (const pairing of pairings.slice(0, 3)) {
      const pairingItems: PairingItemResult[] = [];
      for (const item of pairing.items ?? []) {
        const name = (item.menuItemName ?? '').trim();
        const menuItem = findMenuItem(name);
        if (menuItem) {
          pairingItems.push({
            menuItemName: menuItem.name,
            type: (item.type as 'dish' | 'drink' | 'dessert') ?? 'dish',
          });
          allItems.push({
            menuItemId: menuItem._id,
            menuItemName: menuItem.name,
            pairingName: pairing.name,
            matchPercentage: Math.min(100, Math.max(0, Number(pairing.matchPercentage) || 0)),
            reason: pairing.reason,
          });
        }
      }
      if (pairingItems.length > 0) {
        results.push({
          name: pairing.name ?? `Pairing ${results.length + 1}`,
          matchPercentage: Math.min(100, Math.max(0, Number(pairing.matchPercentage) || 0)),
          reason: pairing.reason,
          items: pairingItems,
        });
      }
    }

    if (results.length === 0) throw new Error('Could not match any recommendations to menu items');

    await ctx.runMutation(internal.recommendationsInternal.insertRecommendation, {
      userId,
      restaurantId: args.restaurantId,
      items: allItems,
      preferenceSnapshot: prefs,
    });

    return results;
  },
});
