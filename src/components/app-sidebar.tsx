import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";
import { useChatContext } from "@/lib/chat-context";
import { PdfViewerDialog } from "@/components/pdf-viewer-dialog";

type ConversationSummary = {
  id: string;
  title: string | null;
  updated_at: string;
};

export function AppSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const navigate = useNavigate();
  const { conversationsVersion, refreshConversations } = useChatContext();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);

  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const activeId =
    pathname === "/chat"
      ? (routerState.location.search as { c?: string }).c ?? null
      : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await authedFetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      if (!cancelled) setConversations(data.conversations ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationsVersion]);

  async function rename(id: string) {
    const current = conversations.find((c) => c.id === id);
    const title = window.prompt("Rename conversation", current?.title ?? "");
    if (!title) return;
    await authedFetch(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    refreshConversations();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this conversation?")) return;
    await authedFetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (activeId === id) navigate({ to: "/chat" });
    refreshConversations();
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top */}
      <div className="border-b border-rule px-5 pb-4 pt-6">
        <span className="block t-wordmark">
          AskDerivn
        </span>
        <Link
          to="/chat"
          onClick={onNavigate}
          className="mt-5 block t-eyebrow text-link hover:text-foreground"
        >
          + New chat
        </Link>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {conversations.length === 0 ? (
          <p className="px-2 t-body-sm">No conversations yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <li
                  key={c.id}
                  className="group flex items-center justify-between gap-1 rounded-full px-3 py-1.5 nav-row"
                >
                  <Link
                    to="/chat"
                    search={{ c: c.id }}
                    onClick={onNavigate}
                    className={`flex-1 truncate text-left text-sm transition-colors duration-200 ${
                      isActive ? "text-foreground" : "text-ink-soft hover:text-foreground"
                    }`}
                    title={c.title ?? "Untitled"}
                  >
                    {c.title || "Untitled"}
                  </Link>
                  <div className="flex shrink-0 gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      onClick={() => rename(c.id)}
                      className="text-[10px] uppercase tracking-wider text-ink-soft text-link hover:text-foreground"
                    >
                      Rename
                    </button>
                    <button
                      onClick={() => remove(c.id)}
                      className="text-[10px] uppercase tracking-wider text-ink-soft text-link hover:text-foreground"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Utility links */}
      <div className="border-t border-rule px-5 py-4">
        <nav className="flex flex-col gap-2 font-mono text-xs uppercase tracking-wider text-ink-soft">
          <button
            onClick={() => {
              setPdfOpen(true);
              onNavigate?.();
            }}
            className="text-left text-link hover:text-foreground"
          >
            Download PDF
          </button>
          <Link
            to="/account"
            onClick={onNavigate}
            className="text-link hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
          >
            Account
          </Link>
          <button
            onClick={signOut}
            className="text-left text-link hover:text-foreground"
          >
            Sign out
          </button>
        </nav>
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} />
    </div>
  );
}
