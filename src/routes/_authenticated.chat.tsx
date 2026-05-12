import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp } from "lucide-react";
import { authedFetch } from "@/lib/auth-helpers";
import { readChatStream } from "@/lib/sse";
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

const STARTERS: Array<{ title: string; sub: string }> = [
  { title: "Plan my week", sub: "so I train, run, and recover right" },
  { title: "Fix my fat loss", sub: "without killing my running" },
];

function ChatPage() {
  const { c: conversationId } = Route.useSearch();
  const navigate = useNavigate();
  const { refreshConversations } = useChatContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadingConv, setLoadingConv] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  // Conversations we just created locally — skip the server reload so the
  // freshly streamed messages aren't wiped while persistence catches up.
  const skipReloadRef = useRef<Set<string>>(new Set());

  // Load messages whenever active conversation changes
  useEffect(() => {
    setError(null);
    if (!conversationId) {
      setMessages([]);
      return;
    }
    if (skipReloadRef.current.has(conversationId)) {
      skipReloadRef.current.delete(conversationId);
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
  }, [messages, sending, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    setInput("");

    const tempUser: Message = {
      id: `tmp-user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    const assistantId = `tmp-assistant-${Date.now()}`;
    setMessages((m) => [...m, tempUser]);
    setSending(true);

    let assistantStarted = false;
    let assistantText = "";
    let newConversationId: string | null = null;

    try {
      const res = await authedFetch("/api/chat", {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: JSON.stringify({
          conversation_id: conversationId ?? null,
          content: trimmed,
        }),
      });

      if (!res.ok) {
        const data = (await res
          .json()
          .catch(() => ({}))) as {
          error?: string;
          reason?: string;
        };
        if (res.status === 401 || data.reason === "unauthenticated") {
          window.location.href = "/login";
          return;
        }
        if (res.status === 402) {
          setError(data.error || "Subscription required.");
          setSending(false);
          return;
        }
        if (res.status === 428 || data.reason === "profile_incomplete") {
          window.location.href = "/onboarding";
          return;
        }
        setError(data.error || "AskDerivn could not respond. Please try again.");
        setSending(false);
        return;
      }

      setStreaming(true);

      await readChatStream(res, {
        onMeta: (meta) => {
          const cid = meta.conversation_id;
          if (typeof cid === "string") newConversationId = cid;
        },
        onDelta: (chunk) => {
          assistantText += chunk;
          setMessages((m) => {
            if (!assistantStarted) {
              assistantStarted = true;
              return [
                ...m,
                {
                  id: assistantId,
                  role: "assistant",
                  content: assistantText,
                },
              ];
            }
            return m.map((msg) =>
              msg.id === assistantId ? { ...msg, content: assistantText } : msg
            );
          });
        },
      });

      if (!assistantText.trim()) {
        setError("AskDerivn returned an empty response. Please try again.");
        setMessages((m) => m.filter((msg) => msg.id !== assistantId));
      }

      refreshConversations();

      if (!conversationId && newConversationId) {
        navigate({ to: "/chat", search: { c: newConversationId } });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
      setStreaming(false);
    }
  }

  const showStarters = !conversationId && messages.length === 0 && !sending;

  return (
    <main className="mx-auto flex h-full w-full max-w-3xl flex-col px-4">
      <div ref={scrollRef} className="flex-1 overflow-y-auto pb-4 pt-6">
        {loadingConv && <p className="t-body-sm">Loading conversation…</p>}

        <div className="space-y-6">
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end animate-message-in">
                  <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm leading-relaxed text-primary-foreground whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              );
            }
            const prev = messages[i - 1];
            const showDivider = i > 0 && prev?.role === "assistant";
            return (
              <article
                key={m.id}
                className={`animate-message-in ${showDivider ? "border-t border-rule pt-6" : ""}`}
              >
                <div className="t-eyebrow">AskDerivn</div>
                <div className="mt-3 text-sm leading-relaxed">
                  <div className="prose prose-sm prose-neutral max-w-none [&_p]:my-3 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </article>
            );
          })}

          {sending && !streaming && (
            <article
              className={`animate-message-in ${messages.length > 0 ? "border-t border-rule pt-8" : ""}`}
            >
              <div className="t-eyebrow">AskDerivn</div>
              <p className="mt-3 t-body-sm animate-pulse">Thinking…</p>
            </article>
          )}

          {error && (
            <div className="border-t border-rule pt-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom area: starters + input */}
      <div className="pb-4">
        {showStarters && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {STARTERS.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => send(s.title)}
                className="rounded-2xl bg-accent/60 px-3 py-3 text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-accent active:scale-[0.98]"
              >
                <div className="text-sm font-semibold text-foreground">
                  {s.title}
                </div>
                <div className="mt-0.5 text-xs text-ink-soft">{s.sub}</div>
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-center gap-2 rounded-full bg-accent/60 px-4 py-2 transition-colors duration-200 focus-within:bg-accent"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AskDerivn"
            className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-soft"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:opacity-90 active:scale-[0.95] disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>

      <AddToHomeScreenBanner />
    </main>
  );
}
