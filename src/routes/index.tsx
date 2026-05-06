import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "AskDerivn" },
      {
        name: "description",
        content: "AskDerivn",
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
            AskDerivn
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="text-ink-soft hover:text-foreground">
              Sign In
            </Link>
            <Link
              to="/"
              className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Access
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center">
          <h1 className="font-serif text-6xl leading-[1.02] tracking-tight md:text-8xl">
            AskDerivn
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-foreground md:text-xl">
            Trained on the Derivn coaching system, thousands of workouts, and
            real coaching transcripts.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink-soft">
            Built to give clear answers and clarity toward reaching fitness
            goals.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get Access
            </Link>
            <Link
              to="/"
              className="rounded-sm border border-rule px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-24 text-center">
            <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
              How it works
            </h2>
            <div className="mx-auto mt-14 grid max-w-4xl gap-12 md:grid-cols-3 text-center">
              {[
                {
                  t: "Create your profile",
                  d: "Set your goal, training level, schedule, equipment, and limitations.",
                },
                {
                  t: "Ask your question",
                  d: "Training, running, nutrition, recovery, consistency, or what to do next.",
                },
                {
                  t: "Get a clear answer",
                  d: "AskDerivn filters the question through the Derivn system and gives one practical next action.",
                },
              ].map((step, i) => (
                <div key={i}>
                  <div className="font-mono text-xs text-ink-soft">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 font-serif text-xl">{step.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {step.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-xs text-ink-soft">
          <span>© {new Date().getFullYear()} Derivn</span>
          <span>Educational. Not a substitute for medical care.</span>
        </div>
      </footer>
    </div>
  );
}
