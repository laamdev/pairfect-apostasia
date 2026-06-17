/**
 * Persistent Text Streaming for the schema-driven preferences chatbot.
 *
 * Flow:
 * 1. `createSession` — authenticated; creates a draft session + welcome message.
 * 2. `createUserMessage` — persists the diner's message.
 * 3. `createPreferencesStream` — creates a persistent stream + placeholder
 *    assistant message.
 * 4. `streamPreferencesHttpAction` — streams the LLM reply while persisting
 *    chunks; on completion `finalizePreferences` extracts <patch> blocks,
 *    applies them to the session data, and (on <END_OF_PROCESS />) saves the
 *    preferences to the diner's profile.
 *
 * No "use node" — the httpAction uses dynamic imports for the AI packages.
 */

import {
  PersistentTextStreaming,
  type StreamId,
} from '@convex-dev/persistent-text-streaming';
import { v } from 'convex/values';
import { components, internal } from '../_generated/api';
import type { Doc, Id } from '../_generated/dataModel';
import {
  httpAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from '../_generated/server';
import { getCurrentUser, requireUser } from '../authHelpers';
import { applyPatchesToDocument, extractPatches, stripEndToken, stripPatchBlocks, END_OF_PROCESS_RE } from '../lib/patchUtils';
import {
  ADVENTUROUSNESS_LEVELS as ADVENTUROUSNESS,
  ALCOHOL_LEVELS as ALCOHOL,
  BASE_SPIRITS as BASE_SPIRIT,
  DIET_PREFERENCES as DIET,
  OCCASIONS as OCCASION,
  SPICE_LEVELS as SPICE,
  TASTE_PROFILES as TASTE,
} from '../validators';
import { buildPreferencesSystemPrompt, PREFERENCES_CHAT_WELCOME_MESSAGE } from './preferencesCreatorSchema';

const persistentTextStreaming = new PersistentTextStreaming(components.persistentTextStreaming);

const AI_TURN_THROTTLE_MS = 3_000;

type Prefs = {
  tasteProfile: (typeof TASTE)[number][];
  spiceLevel: (typeof SPICE)[number];
  allergenIdsToAvoid: Id<'allergens'>[];
  dietPreference: (typeof DIET)[number];
  alcoholTolerance: (typeof ALCOHOL)[number];
  sweetTooth: boolean;
  adventurousness?: (typeof ADVENTUROUSNESS)[number];
  baseSpirits?: (typeof BASE_SPIRIT)[number][];
  occasion?: (typeof OCCASION)[number];
};

/** Normalize/validate the loose session data into a saveable preferences object.
 *  Returns null when the required single-choice fields are missing. */
function coercePrefs(data: Record<string, unknown>, validAllergenIds: Set<string>): Prefs | null {
  const spiceLevel = data.spiceLevel as Prefs['spiceLevel'];
  const dietPreference = data.dietPreference as Prefs['dietPreference'];
  const alcoholTolerance = data.alcoholTolerance as Prefs['alcoholTolerance'];

  if (!SPICE.includes(spiceLevel)) return null;
  if (!DIET.includes(dietPreference)) return null;
  if (!ALCOHOL.includes(alcoholTolerance)) return null;

  const tasteProfile = Array.isArray(data.tasteProfile)
    ? (data.tasteProfile.filter((t) => TASTE.includes(t as never)) as Prefs['tasteProfile'])
    : [];
  const allergenIdsToAvoid = Array.isArray(data.allergenIdsToAvoid)
    ? (data.allergenIdsToAvoid.filter((id) => typeof id === 'string' && validAllergenIds.has(id)) as Id<'allergens'>[])
    : [];

  const adventurousness = ADVENTUROUSNESS.includes(data.adventurousness as never)
    ? (data.adventurousness as Prefs['adventurousness'])
    : undefined;
  const occasion = OCCASION.includes(data.occasion as never)
    ? (data.occasion as Prefs['occasion'])
    : undefined;
  const baseSpirits = Array.isArray(data.baseSpirits)
    ? (data.baseSpirits.filter((s) => BASE_SPIRIT.includes(s as never)) as Prefs['baseSpirits'])
    : undefined;

  return {
    tasteProfile,
    spiceLevel,
    allergenIdsToAvoid,
    dietPreference,
    alcoholTolerance,
    sweetTooth: data.sweetTooth === true,
    adventurousness,
    baseSpirits: baseSpirits && baseSpirits.length > 0 ? baseSpirits : undefined,
    occasion,
  };
}

// ─── Mutations / queries used by the client ──────────────────────────────────

export const createSession = mutation({
  args: {
    scope: v.union(v.literal('global'), v.literal('restaurant')),
    restaurantId: v.optional(v.id('restaurants')),
  },
  handler: async (ctx, args): Promise<Id<'preferenceChatSessions'>> => {
    const user = await requireUser(ctx);
    const sessionId = await ctx.db.insert('preferenceChatSessions', {
      userId: user._id,
      restaurantId: args.restaurantId,
      scope: args.scope,
      data: '{}',
      status: 'draft',
    });
    await ctx.db.insert('preferenceChatMessages', {
      sessionId,
      role: 'assistant',
      content: PREFERENCES_CHAT_WELCOME_MESSAGE,
      isStreaming: false,
    });
    return sessionId;
  },
});

export const createUserMessage = mutation({
  args: {
    sessionId: v.id('preferenceChatSessions'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) throw new Error('Sesión no encontrada');
    await ctx.db.insert('preferenceChatMessages', {
      sessionId: args.sessionId,
      role: 'user',
      content: args.content,
      isStreaming: false,
    });
  },
});

export const createPreferencesStream = mutation({
  args: { sessionId: v.id('preferenceChatSessions') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) throw new Error('Sesión no encontrada');
    if (session.status !== 'draft') throw new Error('La sesión ya no es editable');

    if (session.lastAiTurnStartedAt && Date.now() - session.lastAiTurnStartedAt < AI_TURN_THROTTLE_MS) {
      throw new Error('Espera un momento antes de enviar otro mensaje.');
    }

    const streamId = await persistentTextStreaming.createStream(ctx);
    await ctx.db.patch(args.sessionId, { lastAiTurnStartedAt: Date.now() });
    const messageId = await ctx.db.insert('preferenceChatMessages', {
      sessionId: args.sessionId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      streamId: streamId as string,
    });
    return { streamId, messageId };
  },
});

export const getStreamBody = query({
  args: { streamId: v.string() },
  handler: async (ctx, args) => {
    // Only the diner who owns the session this stream belongs to may read it.
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const message = await ctx.db
      .query('preferenceChatMessages')
      .withIndex('by_streamId', (q) => q.eq('streamId', args.streamId))
      .unique();
    if (!message) return null;
    const session = await ctx.db.get(message.sessionId);
    if (!session || session.userId !== user._id) return null;
    return await persistentTextStreaming.getStreamBody(ctx, args.streamId as StreamId);
  },
});

export const listMessagesBySession = query({
  args: { sessionId: v.id('preferenceChatSessions') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) return [];
    // Bound the read — only the most recent slice of the conversation is shown.
    const recent = await ctx.db
      .query('preferenceChatMessages')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .take(100);
    return recent
      .reverse()
      .map((m) => ({
        _id: m._id,
        role: m.role,
        content: m.content,
        isStreaming: m.isStreaming ?? false,
      }));
  },
});

export const getSessionStatus = query({
  args: { sessionId: v.id('preferenceChatSessions') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) return null;
    return session.status;
  },
});

// ─── Internal queries used by the httpAction ─────────────────────────────────

/** Returns the session only if it belongs to the currently-authenticated user.
 *  Auth propagates from the calling httpAction, so `getCurrentUser` resolves
 *  the same identity. Returns null when unauthenticated or not the owner. */
export const getOwnedSessionInternal = internalQuery({
  args: { sessionId: v.id('preferenceChatSessions') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== user._id) return null;
    return session;
  },
});

export const listMessagesInternal = internalQuery({
  args: { sessionId: v.id('preferenceChatSessions') },
  handler: async (ctx, args) => {
    // Bound the read and hand back the most recent slice in chronological order.
    const recent = await ctx.db
      .query('preferenceChatMessages')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .order('desc')
      .take(100);
    return recent.reverse();
  },
});

export const listAllergensInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query('allergens').collect(),
});

// ─── HTTP action: stream from the LLM ────────────────────────────────────────

export const streamPreferencesHttpAction = httpAction(async (ctx, request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const jsonError = (message: string, status: number) =>
    new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  try {
    // Require an authenticated caller. The Convex client sends the access token
    // as a Bearer header; without it this endpoint would let anyone drive LLM
    // calls (cost) and read another diner's chat.
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return jsonError('Unauthorized', 401);

    const body = (await request.json()) as { streamId: string; messageId: string; sessionId: string };
    const { streamId, messageId, sessionId } = body;
    if (!streamId || !messageId || !sessionId) {
      return jsonError('Missing required fields', 400);
    }

    // Resolve the session only if it belongs to the caller.
    const session = await ctx.runQuery(internal.ai.preferencesStreaming.getOwnedSessionInternal, {
      sessionId: sessionId as Id<'preferenceChatSessions'>,
    });
    if (!session) return jsonError('Session not found', 404);

    const [messages, allergens] = await Promise.all([
      ctx.runQuery(internal.ai.preferencesStreaming.listMessagesInternal, {
        sessionId: sessionId as Id<'preferenceChatSessions'>,
      }),
      ctx.runQuery(internal.ai.preferencesStreaming.listAllergensInternal, {}),
    ]);

    let currentData: Record<string, unknown> = {};
    try {
      currentData = session.data ? (JSON.parse(session.data) as Record<string, unknown>) : {};
    } catch {
      // keep {}
    }

    const systemContent = buildPreferencesSystemPrompt({
      currentData,
      allergens: allergens.map((a) => ({ _id: a._id as string, name: a.name })),
    });

    // Build conversation history (skip the empty streaming placeholder).
    const llmMessages = messages
      .filter((m) => !(m.role === 'assistant' && m.isStreaming === true && m.content === ''))
      .slice(-40)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const modelId =
      process.env.OPENROUTER_MODEL ?? process.env.OPENAI_MODEL ?? process.env.LLM_MODEL ?? 'google/gemini-3.1-flash-lite';

    const generateChat = async (
      _ctx: typeof ctx,
      _request: Request,
      _streamId: StreamId,
      chunkAppender: (chunk: string, isFinal?: boolean) => Promise<void>,
    ) => {
      const { streamText } = await import('ai');
      const { createOpenRouter } = await import('@openrouter/ai-sdk-provider');

      let fullText = '';
      try {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error('Falta la clave de API (define OPENROUTER_API_KEY)');
        const baseURL = process.env.OPENROUTER_BASE_URL;
        const openrouter = createOpenRouter(baseURL ? { apiKey, baseURL } : { apiKey });

        const result = streamText({
          model: openrouter(modelId),
          system: systemContent,
          messages: llmMessages,
          // Cap output tokens — without this OpenRouter assumes the model's full
          // context window (65k). Each reply is a short message plus a <patch>
          // block (which can carry several allergen Ids), so 1536 leaves
          // comfortable headroom without paying for verbosity.
          maxOutputTokens: 1536,
          maxRetries: 1,
          // Server-side hard timeout so a stalled upstream can't hang the turn.
          abortSignal: AbortSignal.timeout(45_000),
        });

        for await (const chunk of result.textStream) {
          fullText += chunk;
          await chunkAppender(chunk);
        }
        await chunkAppender('', true);

        await ctx.runMutation(internal.ai.preferencesStreaming.finalizePreferences, {
          sessionId: sessionId as Id<'preferenceChatSessions'>,
          messageId: messageId as Id<'preferenceChatMessages'>,
          rawText: fullText,
        });
      } catch (error) {
        await ctx.runMutation(internal.ai.preferencesStreaming.finalizePreferences, {
          sessionId: sessionId as Id<'preferenceChatSessions'>,
          messageId: messageId as Id<'preferenceChatMessages'>,
          rawText: fullText || 'Hubo un error al generar la respuesta.',
          error: error instanceof Error ? error.message : 'Unknown streaming error',
        });
        throw error;
      }
    };

    const response = await persistentTextStreaming.stream(ctx, request, streamId as StreamId, generateChat);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Vary', 'Origin');
    return response;
  } catch (error) {
    console.error('[Preferences Streaming] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Streaming failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

// ─── Finalize: apply patches + save profile on completion ────────────────────

export const finalizePreferences = internalMutation({
  args: {
    sessionId: v.id('preferenceChatSessions'),
    messageId: v.id('preferenceChatMessages'),
    rawText: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return;

    let currentData: Record<string, unknown> = {};
    try {
      currentData = session.data ? (JSON.parse(session.data) as Record<string, unknown>) : {};
    } catch {
      // keep {}
    }

    const patches = extractPatches(args.rawText, '[PreferencesChat]');
    if (patches.length > 0) {
      currentData = applyPatchesToDocument(currentData, patches, '[PreferencesChat]');
    }

    let assistantText = stripPatchBlocks(args.rawText);
    END_OF_PROCESS_RE.lastIndex = 0;
    const modelSignaledDone = END_OF_PROCESS_RE.test(assistantText);
    assistantText = stripEndToken(assistantText);

    // Persist the grown data before attempting to save.
    await ctx.db.patch(args.sessionId, { data: JSON.stringify(currentData) });

    let finalText = assistantText || (args.error ? 'Hubo un error al generar la respuesta.' : '');

    if (modelSignaledDone && session.status === 'draft') {
      const allergens = await ctx.db.query('allergens').collect();
      const validIds = new Set(allergens.map((a) => a._id as string));
      const prefs = coercePrefs(currentData, validIds);
      if (!prefs) {
        finalText =
          'Aún faltan datos por confirmar (nivel de picante, dieta y tolerancia al alcohol). Dime esos detalles y guardo tus preferencias.';
      } else {
        await savePrefsForUser(ctx, session, prefs);
        await ctx.db.patch(args.sessionId, { status: 'completed' });
        finalText = finalText || 'He guardado tus preferencias. ¡Ya puedes generar tu maridaje!';
      }
    }

    await ctx.db.patch(args.messageId, { content: finalText, isStreaming: false });
  },
});

/** Direct upsert into the diner's profile (global or per-restaurant), keyed by
 *  the session's userId since finalize runs without an auth identity. */
async function savePrefsForUser(ctx: MutationCtx, session: Doc<'preferenceChatSessions'>, prefs: Prefs) {
  if (session.scope === 'restaurant' && session.restaurantId) {
    const restaurantId = session.restaurantId;
    const existing = await ctx.db
      .query('restaurantClientProfiles')
      .withIndex('by_restaurantId_and_userId', (q) =>
        q.eq('restaurantId', restaurantId).eq('userId', session.userId),
      )
      .unique();
    const base = { userId: session.userId, restaurantId, ...prefs };
    if (existing) await ctx.db.patch(existing._id, base);
    else await ctx.db.insert('restaurantClientProfiles', base);
  } else {
    const existing = await ctx.db
      .query('clientProfiles')
      .withIndex('by_userId', (q) => q.eq('userId', session.userId))
      .unique();
    const base = { userId: session.userId, ...prefs };
    if (existing) await ctx.db.patch(existing._id, base);
    else await ctx.db.insert('clientProfiles', base);
  }
}
