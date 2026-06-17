import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { streamPreferencesHttpAction } from './ai/preferencesStreaming';

const http = httpRouter();

// Minimal route to enable HTTP actions
http.route({
  path: '/',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    return new Response(`Convex HTTP actions are enabled`);
  }),
});

// Preferences chatbot streaming endpoint (POST for streaming, OPTIONS for CORS).
http.route({
  path: '/ai/preferences-chat-stream',
  method: 'POST',
  handler: streamPreferencesHttpAction,
});
http.route({
  path: '/ai/preferences-chat-stream',
  method: 'OPTIONS',
  handler: streamPreferencesHttpAction,
});

export default http;
