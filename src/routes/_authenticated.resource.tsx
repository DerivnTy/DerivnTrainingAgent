import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/resource")({
  component: ResourcePage,
  head: () => ({ meta: [{ title: "Built for Motion — AskDerivn" }] }),
});

const PDF_URL = "/pdf/built-for-motion.pdf";

function ResourcePage() {
  return (
    <main className="mx-auto h-full max-w-2xl overflow-y-auto px-6 pt-20 pb-24">
      <div className="font-mono text-xs uppercase tracking-wider text-ink-soft">
        PDF · 100 pages
      </div>
      <h1 className="mt-3 font-serif text-4xl tracking-tight">
        Built for Motion
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        The 100-page Derivn handbook. Training structure, running, nutrition,
        recovery, habits, progress tracking, and common mistakes.
      </p>

      <div className="mt-10 space-y-3">
        <a href={PDF_URL} download className="btn-primary w-full">
          Download PDF
        </a>
        <a
          href={PDF_URL}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary w-full"
        >
          Open in browser
        </a>
      </div>
    </main>
  );
}
