import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authedFetch } from "@/lib/auth-helpers";
import { useChatContext } from "@/lib/chat-context";
import { PdfViewerDialog } from "@/components/pdf-viewer-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";


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
  

  // Rename modal state
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function openRename(id: string) {
    const current = conversations.find((c) => c.id === id);
    setRenameValue(current?.title ?? "");
    setRenameId(id);
  }

  async function confirmRename() {
    if (!renameId) return;
    const title = renameValue.trim();
    if (!title) return;
    setRenameSaving(true);
    await authedFetch(`/api/conversations/${renameId}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    setRenameSaving(false);
    setRenameId(null);
    refreshConversations();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await authedFetch(`/api/conversations/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    if (activeId === deleteId) navigate({ to: "/chat" });
    setDeleteId(null);
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
                      type="button"
                      onClick={() => openRename(c.id)}
                      className="t-eyebrow text-link hover:text-foreground"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(c.id)}
                      className="t-eyebrow text-link hover:text-foreground"
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
        <nav className="flex flex-col gap-2 t-eyebrow">
          <button
            type="button"
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
            type="button"
            onClick={signOut}
            className="text-left text-link hover:text-foreground"
          >
            Sign out
          </button>
        </nav>
      </div>
      <PdfViewerDialog open={pdfOpen} onOpenChange={setPdfOpen} />

      {/* Rename dialog */}
      <Dialog open={renameId !== null} onOpenChange={(o) => !o && setRenameId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
            <DialogDescription>
              Give this conversation a new name.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void confirmRename();
              }
            }}
            placeholder="Conversation name"
            className="w-full border-b border-rule bg-transparent py-2 text-sm input-soft"
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setRenameId(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRename}
              disabled={renameSaving || !renameValue.trim()}
              className="btn-primary"
            >
              {renameSaving ? "Saving…" : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation. This can&rsquo;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="btn-primary"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
