'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePreferencesChatStream } from '@/lib/ai/usePreferencesChatStream';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { PREFERENCES_CHAT_WELCOME_MESSAGE } from '../../convex/ai/preferencesCreatorSchema';

type PreferencesChatbotProps = {
  mode: 'global' | 'restaurant';
  restaurantId?: Id<'restaurants'>;
  onSaved?: () => void;
};

const Bubble = ({ role, children }: { role: 'user' | 'assistant'; children: React.ReactNode }) => (
  <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div
      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
        role === 'user' ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'
      }`}
    >
      {children}
    </div>
  </div>
);

/**
 * Conversational way to set diner preferences. Lazily creates a chat session on
 * the first message; the assistant writes the collected values into the diner's
 * profile when the conversation is confirmed (see convex/ai/preferencesStreaming).
 */
export const PreferencesChatbot = ({ mode, restaurantId, onSaved }: PreferencesChatbotProps) => {
  const [sessionId, setSessionId] = useState<Id<'preferenceChatSessions'> | null>(null);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedFiredRef = useRef(false);

  const createSession = useMutation(api.ai.preferencesStreaming.createSession);
  const createUserMessage = useMutation(api.ai.preferencesStreaming.createUserMessage);

  const messages = useQuery(
    api.ai.preferencesStreaming.listMessagesBySession,
    sessionId ? { sessionId } : 'skip',
  );
  const sessionStatus = useQuery(
    api.ai.preferencesStreaming.getSessionStatus,
    sessionId ? { sessionId } : 'skip',
  );

  const { displayText, isStreaming, startStream, error } = usePreferencesChatStream({ sessionId });

  // Auto-scroll to the latest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, displayText]);

  // When the session is saved, notify the parent once.
  useEffect(() => {
    if (sessionStatus === 'completed' && !savedFiredRef.current) {
      savedFiredRef.current = true;
      onSaved?.();
    }
  }, [sessionStatus, onSaved]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');

    if (!sessionId) {
      const newId = await createSession({ scope: mode, restaurantId });
      setSessionId(newId);
      await createUserMessage({ sessionId: newId, content: text });
      await startStream(newId);
    } else {
      await createUserMessage({ sessionId, content: text });
      await startStream();
    }
  };

  const renderedMessages = messages ?? [];

  return (
    <div className="border border-border rounded-lg bg-surface flex flex-col h-[28rem]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {/* Static welcome before the session exists. */}
        {!sessionId && <Bubble role="assistant">{PREFERENCES_CHAT_WELCOME_MESSAGE}</Bubble>}

        {renderedMessages.map((m) => {
          if (m.isStreaming) {
            // Live text while the hook is actively streaming. If the turn has
            // already finished/errored on the client (e.g. the server 500'd
            // before finalizing this placeholder), don't leave a stuck
            // "Escribiendo…" bubble — drop the empty placeholder instead.
            if (!isStreaming && !displayText) return null;
            return (
              <Bubble key={m._id} role="assistant">
                {displayText || (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" /> Escribiendo…
                  </span>
                )}
              </Bubble>
            );
          }
          return (
            <Bubble key={m._id} role={m.role}>
              {m.content}
            </Bubble>
          );
        })}

        {error && <p className="text-destructive text-xs px-1">{error.message}</p>}
      </div>

      <form onSubmit={handleSend} className="border-t border-border p-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming || sessionStatus === 'completed'}
          placeholder={
            sessionStatus === 'completed' ? 'Preferencias guardadas ✓' : 'Escribe tu mensaje…'
          }
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <Button type="submit" size="sm" disabled={!input.trim() || isStreaming || sessionStatus === 'completed'}>
          {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </form>

      {sessionStatus !== 'completed' && (
        <p className="px-4 pb-3 text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3" />
          Cuando termines, dile «guardar» para registrar tus preferencias.
        </p>
      )}
    </div>
  );
};
