import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { authedFetch } from "@/lib/auth-helpers";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "AskDerivn" }] }),
});

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

type ConversationSummary = {
  id: string;
  title: string | null;
  updated_at: string;
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
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initial conversations load
  useEffect(() => {
    void loadConversations();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  async function loadConversations() {
    const res = await authedFetch("/api/conversations");
    if (!res.ok) return;
    const { conversations } = await res.json();
    setConversations(conversations);
  }

  async function openConversation(id: string) {
    setActiveId(id);
    setMessages([]);
    setError(null);
    const res = await authedFetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const { messages } = await res.json();
    setMessages(messages);
  }

  function newChat() {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setInput("");
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
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
          conversation_id: activeId,
          content: trimmed,
        }),
      });

      if (res.status === 402) {
        window.location.href = "/subscribe";
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg =
          (data && (data as { error?: string }).error) ||
          "Something went wrong.";
        setError(msg);
        setSending(false);
        return;
      }

      const { conversation_id, message } = data as {
        conversation_id: string;
        message: Message;
      };

      if (!activeId) setActiveId(conversation_id);
      setMessages((m) => [...m, message]);
      void loadConversations();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  }

  async function rename(id: string) {
    const current = conversations.find((c) => c.id === id);
    const title = window.prompt("Rename conversation", current?.title ?? "");
    if (!title) return;
    await authedFetch(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    void loadConversations();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this conversation?")) return;
    await authedFetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) newChat();
    void loadConversations();
  }

  return (
    <main className="mx-auto flex max-w-5xl">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-rule pl-6 pr-4 pt-12 md:block">
        <button
          onClick={newChat}
          className="font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-foreground"
        >
          + New chat
        </button>
        <div className="mt-8 space-y-1">
          {conversations.length === 0 && (
            <p className="text-xs text-ink-soft">No conversations yet.</p>
          )}
          {conversations.map((c) => {
            const isActive = c.id === activeId;
            return (
              <div key={c.id} className="group flex items-center justify-between gap-2 py-1">
                <button
                  onClick={() => openConversation(c.id)}
                  className={`truncate text-left text-sm ${
                    isActive ? "text-foreground" : "text-ink-soft hover:text-foreground"
                  }`}
                >
                  {c.title || "Untitled"}
                </button>
                <div className="flex shrink-0 gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => rename(c.id)}
                    className="text-xs text-ink-soft hover:text-foreground"
                    aria-label="Rename"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-xs text-ink-soft hover:text-foreground"
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main column */}
      <section className="flex min-h-[calc(100vh-180px)] flex-1 flex-col">
        <div className="px-6 pt-12">
          <h1 className="font-serif text-3xl tracking-tight">AskDerivn</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Ask a question about training, running, nutrition, recovery,
            consistency, or what to do next.
          </p>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 pb-6 pt-8"
        >
          {messages.length === 0 && !sending && (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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

          <div className="space-y-8">
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
              <p className="border-t border-rule pt-6 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-rule px-6 py-4">
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
      </section>
    </main>
  );
}
