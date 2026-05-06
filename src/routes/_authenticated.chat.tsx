import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { authedFetch } from "@/lib/auth-helpers";
import { useChatContext } from "@/lib/chat-context";
import { AddToHomeScreenBanner } from "@/components/add-to-home-screen-banner";

export const Route = createFileRoute("/_authenticated/chat")({
  validateSearch: (s: Record<string, unknown>) => ({
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  component: ChatPage,
  head: () => ({ meta: [{ title: "AskDerivn" }] }),
});

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

const STARTERS = [
  "Plan my week",
  "Fix my fat loss",
  "Should I run today?",
  "Build this meal",
  "I missed workouts",
  "Am I doing too much?",
  "What should I eat before training?",
  "How do I combine lifting and running?",
];

function ChatPage() {
  const { c: conversationId } = Route.useSearch();
  const navigate = useNavigate();
  const { refreshConversations } = useChatContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Load messages whenever active conversation changes
  useEffect(() => {
    setError(null);
    if (!conversationId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingConv(true);
    (async () => {
      const res = await authedFetch(`/api/conversations/${conversationId}`);
      if (cancelled) return;
      if (!res.ok) {
        setMessages([]);
        setLoadingConv(false);
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setMessages(data.messages ?? []);
      setLoadingConv(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  const [debug, setDebug] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setDebug(null);
    setInput("");

    const tempUser: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((m) => [...m, tempUser]);
    setSending(true);

    try {
      const res = await authedFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId ?? null,
          content: trimmed,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        conversation_id?: string;
        message?: Message;
        error?: string;
        debug?: string;
        reason?: string;
      };

      if (!res.ok) {
        if (res.status === 401 || data.reason === "unauthenticated") {
          window.location.href = "/login";
          return;
        }
        if (res.status === 402) {
          window.location.href = "/subscribe";
          return;
        }
        if (res.status === 428 || data.reason === "profile_incomplete") {
          window.location.href = "/onboarding";
          return;
        }
        setError(data.error || "AskDerivn could not respond. Please try again.");
        if (data.debug) setDebug(data.debug);
        setSending(false);
        return;
      }

      if (!data.message || !data.conversation_id) {
        setError("AskDerivn could not respond. Please try again.");
        setSending(false);
        return;
      }

      setMessages((m) => [...m, data.message!]);
      refreshConversations();

      if (!conversationId) {
        navigate({ to: "/chat", search: { c: data.conversation_id } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  const showStarters = !conversationId && messages.length === 0 && !sending;

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-6">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-6 pt-12"
      >
        {!conversationId && messages.length === 0 && (
          <>
            <h1 className="font-serif text-3xl tracking-tight">AskDerivn</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Ask a question about training, running, nutrition, recovery,
              consistency, or what to do next.
            </p>
          </>
        )}

        {showStarters && (
          <div className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="border border-rule px-4 py-3 text-left text-sm text-foreground hover:bg-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loadingConv && (
          <p className="text-sm text-ink-soft">Loading conversation…</p>
        )}

        <div className={messages.length > 0 ? "mt-2 space-y-8" : "space-y-8"}>
          {messages.map((m, i) => (
            <article
              key={m.id}
              className={i > 0 ? "border-t border-rule pt-8" : ""}
            >
              <div className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                {m.role === "user" ? "You" : "AskDerivn"}
              </div>
              <div className="mt-3 text-sm leading-relaxed">
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-neutral max-w-none [&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </article>
          ))}

          {sending && (
            <article
              className={messages.length > 0 ? "border-t border-rule pt-8" : ""}
            >
              <div className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                AskDerivn
              </div>
              <p className="mt-3 text-sm text-ink-soft">Thinking…</p>
            </article>
          )}

          {error && (
            <div className="border-t border-rule pt-6">
              <p className="text-sm text-red-700">{error}</p>
              {debug && (
                <p className="mt-2 font-mono text-xs text-ink-soft">debug: {debug}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-rule py-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ask anything about training, running, nutrition, recovery…"
            rows={2}
            className="flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-ink-soft"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="font-mono text-xs uppercase tracking-wider text-foreground hover:opacity-70 disabled:opacity-30"
          >
            Send
          </button>
        </form>
      </div>

      <AddToHomeScreenBanner />
    </main>
  );
}
