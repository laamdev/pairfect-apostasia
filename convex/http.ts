import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';

const http = httpRouter();

// Minimal route to enable HTTP actions
http.route({
  path: '/',
  method: 'GET',
  handler: httpAction(async (_ctx, request) => {
    return new Response(`Convex HTTP actions are enabled`);
  }),
});

export default http;
