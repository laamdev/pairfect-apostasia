'use node';

import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { MENU_CATEGORIES } from './validators';

type SlotType = 'dish' | 'drink' | 'dessert';
type Role = 'safe' | 'adventurous' | 'wildcard';
type PairingItemResult = { menuItemName: string; type: SlotType };
type PairingResult = {
  role: Role;
  name: string;
  matchPercentage: number;
  reason?: string;
  items: PairingItemResult[];
};

const SLOT_ORDER: SlotType[] = ['dish', 'drink', 'dessert'];
const ROLES: Role[] = ['safe', 'adventurous', 'wildcard'];

/** Default Spanish display names + the personality each pairing should embody. */
const ROLE_META: Record<Role, { name: string; persona: string }> = {
  safe: {
    name: 'La apuesta segura',
    persona:
      'máxima compatibilidad con las preferencias del comensal, ejecución clásica y fiable',
  },
  adventurous: {
    name: 'El atrevido',
    persona:
      'contraste de sabores y coctelería innovadora o creativa, sin dejar de respetar las restricciones',
  },
  wildcard: {
    name: 'Comodín del chef',
    persona:
      'una sorpresa que el comensal quizá no elegiría solo; prioriza un plato o bebida marcado como (especial) si existe',
  },
};

const ALCOHOL_RANK: Record<string, number> = { none: 0, low: 1, mid: 2, high: 3 };

type CleanPrefs = {
  tasteProfile: Doc<'clientProfiles'>['tasteProfile'];
  spiceLevel: Doc<'clientProfiles'>['spiceLevel'];
  allergenIdsToAvoid: Id<'allergens'>[];
  dietPreference: Doc<'clientProfiles'>['dietPreference'];
  alcoholTolerance: Doc<'clientProfiles'>['alcoholTolerance'];
  sweetTooth: boolean;
  adventurousness?: Doc<'clientProfiles'>['adventurousness'];
  baseSpirits?: Doc<'clientProfiles'>['baseSpirits'];
  occasion?: Doc<'clientProfiles'>['occasion'];
};

const clamp = (n: unknown) => Math.min(100, Math.max(0, Number(n) || 0));

const ADVENTUROUSNESS_LABEL: Record<string, string> = {
  classic: 'clásico (prefiere combinaciones tradicionales y seguras)',
  balanced: 'equilibrado',
  innovative: 'innovador (le gusta experimentar y sorprenderse)',
};
const OCCASION_LABEL: Record<string, string> = {
  casual: 'informal',
  celebrating: 'celebración / ocasión especial',
  experimenting: 'con ganas de experimentar',
  unwinding: 'para relajarse y desconectar',
};
const BASE_SPIRIT_LABEL: Record<string, string> = {
  gin: 'ginebra',
  whiskey: 'whisky',
  rum: 'ron',
  tequila_mezcal: 'tequila/mezcal',
  vodka: 'vodka',
  brandy: 'brandy',
  other: 'otros',
  no_preference: 'sin preferencia',
};

/**
 * Generate three distinct personality pairings (scope 'all') — La apuesta
 * segura / El atrevido / Comodín del chef — each a complete set (dish + drink
 * + optional dessert) with a confidence score, or regenerate a single pairing
 * by role, keeping the other two fixed and avoiding their items.
 *
 * Preferences are resolved server-side from the diner's stored profile
 * (restaurant-specific override falling back to global).
 */
export const generateRecommendations = action({
  args: {
    restaurantId: v.id('restaurants'),
    scope: v.optional(
      v.union(
        v.literal('all'),
        v.literal('safe'),
        v.literal('adventurous'),
        v.literal('wildcard'),
      ),
    ),
  },
  handler: async (ctx, args): Promise<PairingResult[]> => {
    const scope = args.scope ?? 'all';
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Debes iniciar sesión para obtener maridajes');

    const userId: Id<'users'> = await ctx.runMutation(internal.users.getOrCreateUser, {
      tokenIdentifier: identity.tokenIdentifier,
      subject: identity.subject,
      email: identity.email ?? undefined,
      name: identity.name ?? undefined,
    });

    // Resolve preferences from the stored profile (restaurant override → global).
    const profileData = await ctx.runQuery(api.clientProfiles.getRestaurantProfile, {
      restaurantId: args.restaurantId,
    });
    const profile = profileData.restaurantProfile ?? profileData.globalProfile;
    if (!profile) {
      throw new Error('Configura tus preferencias antes de generar un maridaje');
    }
    const prefs: CleanPrefs = {
      tasteProfile: profile.tasteProfile,
      spiceLevel: profile.spiceLevel,
      allergenIdsToAvoid: profile.allergenIdsToAvoid,
      dietPreference: profile.dietPreference,
      alcoholTolerance: profile.alcoholTolerance,
      sweetTooth: profile.sweetTooth ?? false,
      adventurousness: profile.adventurousness,
      baseSpirits: profile.baseSpirits,
      occasion: profile.occasion,
    };

    const [menuItems, allergens] = await Promise.all([
      ctx.runQuery(internal.menuItems.listAvailableForPairing, { restaurantId: args.restaurantId }),
      ctx.runQuery(api.allergens.listAllergens, {}),
    ]);

    const allergenMap = new Map(allergens.map((a: Doc<'allergens'>) => [a._id, a.name]));

    // ---- Hard-constraint pre-filter --------------------------------------
    // Drop items the diner can never have (allergens / alcohol tolerance) so
    // the model only sees safe candidates and the confidence score reflects
    // flavor & intent fit rather than safety. Fall back to the full menu if a
    // filter would empty it (better an imperfect pairing than an error).
    const avoid = new Set(prefs.allergenIdsToAvoid.map((id) => String(id)));
    const tolRank = ALCOHOL_RANK[prefs.alcoholTolerance] ?? 3;
    const isSafe = (m: Doc<'menuItems'>) => {
      const hasAvoidedAllergen = (m.allergenIds ?? []).some((id) => avoid.has(String(id)));
      if (hasAvoidedAllergen) return false;
      const level = ALCOHOL_RANK[m.alcoholLevel ?? 'none'] ?? 0;
      if (level > tolRank) return false;
      return true;
    };
    const filtered = menuItems.filter(isSafe);
    const candidates = filtered.length > 0 ? filtered : menuItems;

    const menuLine = (m: Doc<'menuItems'>) => {
      const allergenNames =
        (m.allergenIds ?? []).map((id: Id<'allergens'>) => allergenMap.get(id) ?? id).join(', ') ||
        'ninguno';
      const parts = [
        `- ${m.name}${m.isSpecial ? ' (especial)' : ''} (categoría: ${m.category}): ${m.description}.`,
        `Alérgenos: ${allergenNames}.`,
        `Dieta: ${(m.dietTags ?? []).join(', ') || 'cualquiera'}.`,
        `Nivel de alcohol: ${m.alcoholLevel ?? 'none'}.`,
      ];
      if (m.tasteProfile && m.tasteProfile.length > 0) parts.push(`Sabores: ${m.tasteProfile.join('/')}.`);
      if (m.spiceLevel) parts.push(`Picante: ${m.spiceLevel}.`);
      if (m.ingredients && m.ingredients.length > 0) parts.push(`Ingredientes: ${m.ingredients.join(', ')}.`);
      if (m.pairingNotes && m.pairingNotes.length > 0) parts.push(`Marida con: ${m.pairingNotes.join(', ')}.`);
      return parts.join(' ');
    };
    const menuText = candidates.map(menuLine).join('\n');

    const allergenNames = prefs.allergenIdsToAvoid.map((id) => allergenMap.get(id) ?? id).join(', ');
    const baseSpiritsText =
      prefs.baseSpirits && prefs.baseSpirits.length > 0
        ? prefs.baseSpirits.map((s) => BASE_SPIRIT_LABEL[s] ?? s).join(', ')
        : 'sin preferencia';
    const prefsText = `Preferencias del comensal:
- Perfil de sabor: ${prefs.tasteProfile.join(', ') || 'cualquiera'}
- Nivel de picante: ${prefs.spiceLevel}
- Alérgenos a evitar: ${allergenNames || 'ninguno'}
- Dieta: ${prefs.dietPreference}
- Tolerancia al alcohol: ${prefs.alcoholTolerance}
- Incluir postre: ${prefs.sweetTooth ? 'sí' : 'no'}
- Nivel de atrevimiento: ${prefs.adventurousness ? ADVENTUROUSNESS_LABEL[prefs.adventurousness] : 'equilibrado'}
- Licores base preferidos: ${baseSpiritsText}
- Ocasión: ${prefs.occasion ? OCCASION_LABEL[prefs.occasion] : 'sin especificar'}`;

    // Menu item name matching helpers (resolve LLM names back to real items).
    const nameToItem = new Map(
      candidates.map((m: Doc<'menuItems'>) => [m.name.trim().toLowerCase(), m]),
    );
    const findMenuItem = (itemName: string) => {
      const key = itemName.trim().toLowerCase();
      return (
        nameToItem.get(key) ??
        candidates.find(
          (m: Doc<'menuItems'>) =>
            m.name.toLowerCase().includes(key) || key.includes(m.name.toLowerCase()),
        )
      );
    };

    const callLLM = async (systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> => {
      const baseURL = process.env.OPENROUTER_BASE_URL;
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('Falta la clave de API (define OPENROUTER_API_KEY)');

      const model =
        process.env.OPENROUTER_MODEL ??
        process.env.OPENAI_MODEL ??
        process.env.LLM_MODEL ??
        'google/gemini-3.1-flash-lite';

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey, baseURL });
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      });
      const raw = completion.choices[0]?.message?.content ?? null;
      if (!raw) throw new Error('El modelo no devolvió ninguna respuesta');
      return raw;
    };

    // Shared rule blocks reused across full + single-pairing prompts.
    const dessertClause = prefs.sweetTooth ? ` + un postre (de ${MENU_CATEGORIES.desserts})` : '';
    const sharedRules = `- Cada maridaje es un CONJUNTO para disfrutarse junto: un plato (de '${MENU_CATEGORIES.starters}' o '${MENU_CATEGORIES.mains}') + una bebida (de '${MENU_CATEGORIES.drinks}')${dessertClause}.
- Respeta ESTRICTAMENTE la dieta del comensal y nunca recomiendes elementos con alérgenos que quiere evitar.
- Favorece bebidas cuya base coincida con los licores preferidos del comensal cuando sea posible.
- "matchPercentage" es el NIVEL DE CONFIANZA (0-100) de que el maridaje encaja con las preferencias. Rúbrica: 90-100 encaje excelente en todo; 70-89 fuerte con compromisos menores; 50-69 aceptable con compromisos; menos de 50 débil. Pondera el solape del perfil de sabor, el picante, el licor base y la alineación con el nivel de atrevimiento. Justifica el número en "reason".
- Escribe SIEMPRE "name" y "reason" en español.`;

    // Build the stored/returned representation from a parsed pairing.
    const buildPairing = (
      role: Role,
      parsed: {
        name?: string;
        matchPercentage?: number;
        reason?: string;
        items?: Array<{ menuItemName?: string; type?: string }>;
      },
    ) => {
      const name = parsed.name ?? ROLE_META[role].name;
      const matchPercentage = clamp(parsed.matchPercentage);
      const reason = parsed.reason;
      const stored: Array<{
        menuItemId: Id<'menuItems'>;
        menuItemName?: string;
        pairingName?: string;
        matchPercentage: number;
        reason?: string;
        type: SlotType;
        role: Role;
      }> = [];
      const result: PairingItemResult[] = [];
      for (const item of parsed.items ?? []) {
        const menuItem = findMenuItem((item.menuItemName ?? '').trim());
        if (!menuItem) continue;
        const type = (item.type as SlotType) ?? 'dish';
        if (stored.some((s) => s.menuItemId === menuItem._id)) continue; // no dup within a pairing
        result.push({ menuItemName: menuItem.name, type });
        stored.push({
          menuItemId: menuItem._id,
          menuItemName: menuItem.name,
          pairingName: name,
          matchPercentage,
          reason,
          type,
          role,
        });
      }
      result.sort((a, b) => SLOT_ORDER.indexOf(a.type) - SLOT_ORDER.indexOf(b.type));
      return { role, name, matchPercentage, reason, stored, result };
    };

    // ---- Single-pairing regeneration (scope = a role) --------------------
    if (scope !== 'all') {
      const existing = await ctx.runQuery(internal.recommendationsInternal.getRawForUserRestaurant, {
        userId,
        restaurantId: args.restaurantId,
      });
      if (!existing) {
        throw new Error('No hay maridajes que regenerar. Genera primero un conjunto.');
      }

      // Items used by the OTHER pairings must not be reused.
      const otherItems = existing.items.filter((it) => (it.role as Role) !== scope);
      const keptNames = otherItems.map((it) => it.menuItemName).filter(Boolean);
      const exclusion =
        keptNames.length > 0
          ? `\nNO uses ninguno de estos platos/bebidas (ya están en los otros maridajes): ${keptNames.join(', ')}.`
          : '';

      const systemPrompt = `Eres un experto en maridaje de comida y bebida de un bar de coctelería creativa. Genera UN ÚNICO maridaje con la personalidad "${ROLE_META[scope].name}": ${ROLE_META[scope].persona}.

Reglas:
${sharedRules}
- Debe ser DISTINTO al maridaje anterior y no repetir elementos usados por los otros maridajes.

Formato de salida (solo JSON, sin texto adicional):
{ "name": "nombre creativo en español", "matchPercentage": 0-100, "reason": "por qué encaja", "items": [ { "menuItemName": "nombre exacto de la carta", "type": "dish" | "drink" | "dessert" } ] }`;

      const userPrompt = `${prefsText}

Carta:
${menuText}${exclusion}

Genera el maridaje "${ROLE_META[scope].name}" (un plato + una bebida${prefs.sweetTooth ? ' + un postre' : ''}).`;

      const raw = await callLLM(systemPrompt, userPrompt, 1024);
      let parsed: {
        name?: string;
        matchPercentage?: number;
        reason?: string;
        items?: Array<{ menuItemName?: string; type?: string }>;
      };
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Respuesta del modelo no válida');
      }
      const regenerated = buildPairing(scope, parsed);
      if (regenerated.stored.length === 0) {
        throw new Error('No se pudo asociar el nuevo maridaje con la carta');
      }

      // Keep the other pairings' items, replace this role's items.
      const keptStored = otherItems.map((it) => ({
        menuItemId: it.menuItemId,
        menuItemName: it.menuItemName,
        pairingName: it.pairingName,
        matchPercentage: it.matchPercentage,
        reason: it.reason,
        type: (it.type as SlotType) ?? 'dish',
        role: (it.role as Role) ?? 'safe',
      }));
      const mergedItems = [...keptStored, ...regenerated.stored];

      await ctx.runMutation(internal.recommendationsInternal.insertRecommendation, {
        userId,
        restaurantId: args.restaurantId,
        items: mergedItems,
        preferenceSnapshot: prefs,
      });

      return groupStoredIntoPairings(mergedItems);
    }

    // ---- Full generation: three personality pairings in one call ----------
    const adventurousBias =
      prefs.adventurousness === 'classic'
        ? 'El comensal prefiere lo CLÁSICO: que incluso "El atrevido" y "El comodín" se mantengan razonablemente seguros.'
        : prefs.adventurousness === 'innovative'
          ? 'El comensal quiere EXPERIMENTAR: empuja "El atrevido" y "El comodín" hacia combinaciones audaces e innovadoras.'
          : 'Equilibra entre seguro e innovador.';

    const systemPrompt = `Eres un experto en maridaje de un bar especializado en coctelería (clásica e innovadora) y cocina fusión creativa. Dadas las preferencias del comensal y la carta, propón EXACTAMENTE 3 maridajes distintos, cada uno con una personalidad propia:
1. "${ROLE_META.safe.name}" (role "safe"): ${ROLE_META.safe.persona}.
2. "${ROLE_META.adventurous.name}" (role "adventurous"): ${ROLE_META.adventurous.persona}.
3. "${ROLE_META.wildcard.name}" (role "wildcard"): ${ROLE_META.wildcard.persona}.

Reglas:
${sharedRules}
- NINGÚN elemento de la carta puede repetirse entre los tres maridajes: los 3 platos distintos, las 3 bebidas distintas${prefs.sweetTooth ? ' y los 3 postres distintos' : ''}.
- ${adventurousBias}
- Es esperable y honesto que "El atrevido" y "El comodín" tengan algo menos de confianza que "La apuesta segura".

Formato de salida (solo JSON, sin texto adicional):
{ "pairings": [ { "role": "safe" | "adventurous" | "wildcard", "name": "nombre creativo en español", "matchPercentage": 0-100, "reason": "breve explicación en español", "items": [ { "menuItemName": "nombre exacto de la carta", "type": "dish" | "drink" | "dessert" } ] } ] }`;

    const userPrompt = `${prefsText}

Carta:
${menuText}

Genera exactamente 3 maridajes (safe, adventurous, wildcard). Cada uno: un plato + una bebida${prefs.sweetTooth ? ' + un postre' : ''}. No repitas ningún elemento entre maridajes.`;

    const raw = await callLLM(systemPrompt, userPrompt, 2500);
    let parsed: {
      pairings?: Array<{
        role?: string;
        name?: string;
        matchPercentage?: number;
        reason?: string;
        items?: Array<{ menuItemName?: string; type?: string }>;
      }>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Respuesta del modelo no válida');
    }

    const allStored: Array<{
      menuItemId: Id<'menuItems'>;
      menuItemName?: string;
      pairingName?: string;
      matchPercentage: number;
      reason?: string;
      type: SlotType;
      role: Role;
    }> = [];
    const usedItemIds = new Set<string>();
    const seenRoles = new Set<Role>();

    for (const p of parsed.pairings ?? []) {
      const role: Role = ROLES.includes(p.role as Role) ? (p.role as Role) : ('safe' as Role);
      if (seenRoles.has(role)) continue; // ignore a duplicated role
      const built = buildPairing(role, p);
      // Enforce no-repeat across pairings even if the model slips.
      const deduped = built.stored.filter((s) => !usedItemIds.has(String(s.menuItemId)));
      if (deduped.length === 0) continue;
      deduped.forEach((s) => usedItemIds.add(String(s.menuItemId)));
      seenRoles.add(role);
      allStored.push(...deduped);
    }

    if (allStored.length === 0) {
      throw new Error('No se pudieron asociar los maridajes con platos de la carta');
    }

    await ctx.runMutation(internal.recommendationsInternal.insertRecommendation, {
      userId,
      restaurantId: args.restaurantId,
      items: allStored,
      preferenceSnapshot: prefs,
    });

    return groupStoredIntoPairings(allStored);
  },
});

/** Regroup flat stored items into ordered per-role pairings for the return value. */
function groupStoredIntoPairings(
  items: Array<{
    menuItemName?: string;
    pairingName?: string;
    matchPercentage: number;
    reason?: string;
    type?: SlotType;
    role?: Role;
  }>,
): PairingResult[] {
  const byRole = new Map<Role, PairingResult>();
  for (const it of items) {
    const role = (it.role as Role) ?? 'safe';
    const existing = byRole.get(role);
    const entry: PairingItemResult = {
      menuItemName: it.menuItemName ?? '',
      type: (it.type as SlotType) ?? 'dish',
    };
    if (existing) {
      existing.items.push(entry);
    } else {
      byRole.set(role, {
        role,
        name: it.pairingName ?? ROLE_META[role].name,
        matchPercentage: it.matchPercentage,
        reason: it.reason,
        items: [entry],
      });
    }
  }
  for (const p of byRole.values()) {
    p.items.sort((a, b) => SLOT_ORDER.indexOf(a.type) - SLOT_ORDER.indexOf(b.type));
  }
  return ROLES.filter((r) => byRole.has(r)).map((r) => byRole.get(r)!);
}
