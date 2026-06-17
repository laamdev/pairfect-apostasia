import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config';
import { defineApp } from 'convex/server';
import { v } from 'convex/values';

const app = defineApp({
  env: {
    WORKOS_CLIENT_ID: v.string(),
    WORKOS_API_KEY: v.string(),
    WORKOS_COOKIE_PASSWORD: v.string(),
    NEXT_PUBLIC_WORKOS_REDIRECT_URI: v.string(),
    CONVEX_DEPLOYMENT: v.string(),
    NEXT_PUBLIC_CONVEX_URL: v.string(),
    NEXT_PUBLIC_CONVEX_SITE_URL: v.string(),
    OPENROUTER_API_KEY: v.string(),
    OPENROUTER_BASE_URL: v.string(),
    OPENROUTER_MODEL: v.string(),
  },
});

app.use(persistentTextStreaming);

export default app;
