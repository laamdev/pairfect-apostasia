'use client';

/**
 * React hook for streaming the preferences chatbot's replies. Adapted from
 * kaizente's exercise-creation stream hook.
 *
 * Two layers deliver text in real time:
 * 1. Manual HTTP stream reading — character-by-character from the fetch body.
 * 2. Convex reactive query (getStreamBody) — DB fallback for persistence and
 *    reconnects.
 *
 * <patch> blocks and the END_OF_PROCESS marker are stripped before display.
 */

import { useAccessToken } from '@workos-inc/authkit-nextjs/components';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

export type ChatStreamStatus = 'idle' | 'pending' | 'streaming' | 'done' | 'error';

function getConvexSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (siteUrl) return siteUrl;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) throw new Error('NEXT_PUBLIC_CONVEX_URL no está definido');
  return convexUrl.replace('.convex.cloud', '.convex.site');
}

function stripForDisplay(text: string): string {
  return text
    .replace(/<patch>[\s\S]*?<\/patch>/gi, '')
    .replace(/<patch>[\s\S]*$/gi, '')
    .replace(/<\s*(?:END|END_OF_PROCESS|GUARDAR|FIN(?:_DEL_PROCESO)?)\s*\/?\s*>/gi, '')
    .trim();
}

export function usePreferencesChatStream(options: {
  sessionId: Id<'preferenceChatSessions'> | null;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}) {
  const { sessionId, onComplete, onError } = options;

  const [streamId, setStreamId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [localStatus, setLocalStatus] = useState<ChatStreamStatus>('idle');
  const [httpStreamText, setHttpStreamText] = useState('');
  const completeFiredRef = useRef(false);

  const createStream = useMutation(api.ai.preferencesStreaming.createPreferencesStream);
  const { getAccessToken } = useAccessToken();

  const persistentBody = useQuery(
    api.ai.preferencesStreaming.getStreamBody,
    streamId ? { streamId } : 'skip',
  );

  const status: ChatStreamStatus = (() => {
    if (error) return 'error';
    if (localStatus === 'streaming' || localStatus === 'pending') return localStatus;
    if (streamId && persistentBody) {
      if (persistentBody.status === 'done') return 'done';
      if (persistentBody.status === 'error') return 'error';
      if (persistentBody.status === 'streaming') return 'streaming';
    }
    return localStatus;
  })();

  const rawText = httpStreamText || persistentBody?.text || '';
  const displayText = rawText ? stripForDisplay(rawText) : '';

  useEffect(() => {
    if (status === 'done' && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.();
    }
  }, [status, onComplete]);

  const startStream = useCallback(
    async (sessionIdOverride?: Id<'preferenceChatSessions'>) => {
      const effectiveSessionId = sessionIdOverride ?? sessionId;
      if (!effectiveSessionId) {
        onError?.(new Error('No hay sesión disponible'));
        return;
      }
      try {
        setError(null);
        setLocalStatus('pending');
        setHttpStreamText('');
        completeFiredRef.current = false;

        const result = await createStream({ sessionId: effectiveSessionId });
        setStreamId(result.streamId as string);

        const token = await getAccessToken();
        const siteUrl = getConvexSiteUrl();
        const response = await fetch(`${siteUrl}/ai/preferences-chat-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            streamId: result.streamId,
            messageId: result.messageId,
            sessionId: effectiveSessionId,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        setLocalStatus('streaming');

        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                const final = decoder.decode(value, { stream: false });
                if (final) {
                  accumulated += final;
                  setHttpStreamText(accumulated);
                }
                break;
              }
              accumulated += decoder.decode(value, { stream: true });
              setHttpStreamText(accumulated);
            }
          } catch (readError) {
            console.error('Error leyendo el stream:', readError);
          }
        }

        setLocalStatus('done');
      } catch (err) {
        const streamError = err instanceof Error ? err : new Error('No se pudo iniciar el stream');
        setError(streamError);
        setLocalStatus('error');
        onError?.(streamError);
      }
    },
    [createStream, getAccessToken, sessionId, onError],
  );

  return {
    displayText,
    status,
    isStreaming: status === 'streaming' || status === 'pending',
    startStream,
    error,
  };
}
