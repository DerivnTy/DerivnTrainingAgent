import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Ask Derivn — Private coaching intelligence" },
      {
        name: "description",
        content:
          "Ask Derivn is a private, paid coaching assistant powered by the Derivn operating system. Calm, structured guidance for training, nutrition, and recovery.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link to="/" className="font-serif text-lg tracking-tight">
            Ask Derivn
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-ink-soft hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/"
              className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get access
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <p className="mb-6 text-xs uppercase tracking-[0.2em] text-ink-soft">
            Private coaching intelligence
          </p>
          <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-7xl">
            The Derivn system,<br />in conversation.
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Ask Derivn is a private assistant trained on the Derivn operating
            system — a structured way to think about training, running,
            nutrition, recovery, and consistency. Ask a question, get a clear
            answer. No noise. No hype.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get access
            </Link>
            <Link
              to="/"
              className="rounded-sm border border-rule px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-3 text-center">
            {[
              {
                k: "01",
                t: "Built on Derivn",
                d: "Answers come from the Derivn source material first — philosophy, training structure, nutrition rules, recovery, and habits.",
              },
              {
                k: "02",
                t: "Filtered, not generic",
                d: "Every response runs through the DerivnOS coaching filter: direct answer, why it matters, what to do today, what to avoid, one next action.",
              },
              {
                k: "03",
                t: "Calm authority",
                d: "No fear, no shame, no hype. Safety boundaries on medical issues. Clear scope on what the assistant can and cannot do.",
              },
            ].map((f) => (
              <div key={f.k}>
                <div className="font-mono text-xs text-ink-soft">{f.k}</div>
                <h3 className="mt-3 font-serif text-xl">{f.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-20 text-center">
            <h2 className="font-serif text-4xl tracking-tight md:text-5xl">How it works</h2>
            <ol className="mx-auto mt-10 max-w-2xl space-y-6 text-left text-sm leading-relaxed text-ink-soft">
              {[
                "Create an account and complete a short client context form — goal, training level, available time, equipment, limitations.",
                "Subscribe to unlock Ask Derivn. Monthly access, cancel anytime.",
                "Ask anything: weekly structure, fat loss, running, meals, recovery, missed workouts, doing too much.",
                "Get a structured answer in the Derivn voice — short, practical, safe.",
              ].map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="font-mono text-xs text-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} Derivn</span>
          <span>Ask Derivn is educational. Not a substitute for medical care.</span>
        </div>
      </footer>
    </div>
  );
}
