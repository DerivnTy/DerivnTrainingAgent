import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "AskDerivn" }] }),
});

function ChatPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-20 pb-24">
      <h1 className="font-serif text-4xl tracking-tight">AskDerivn</h1>
      <p className="mt-3 text-sm text-ink-soft">
        Your membership is active. The assistant interface will be wired up next.
      </p>

      <div className="mt-12 border-t border-rule pt-8 text-sm leading-relaxed text-ink-soft">
        Chat coming online shortly. In the meantime, complete your{" "}
        <Link to="/onboarding" className="text-foreground underline">
          profile
        </Link>{" "}
        so AskDerivn can give you sharper answers.
      </div>
    </main>
  );
}
