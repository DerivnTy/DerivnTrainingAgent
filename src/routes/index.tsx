import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "AskDerivn — Private training intelligence" },
      {
        name: "description",
        content:
          "AskDerivn is a private decision-support system for thinking through training, running, nutrition, recovery, and consistency.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top bar */}
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="inline-block h-2 w-2 bg-foreground" />
            AskDerivn
          </Link>
          <nav className="flex items-center gap-2 text-xs">
            <Link
              to="/"
              className="px-3 py-2 font-medium text-ink-soft hover:text-foreground"
            >
              Sign In
            </Link>
            <Link
              to="/"
              className="rounded-none bg-foreground px-4 py-2 font-medium text-background hover:opacity-90"
            >
              Get Access
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="border-b border-rule py-20">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="mb-8 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
                <span className="inline-block h-px w-8 bg-rule" />
                Private Training Intelligence
              </div>
              <h1 className="text-5xl font-semibold leading-[1] tracking-[-0.04em] md:text-7xl">
                AskDerivn
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-snug text-foreground">
                A private decision-support system for thinking through training,
                running, nutrition, recovery, and consistency.
              </p>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-soft">
                Built from the Derivn coaching system, thousands of workouts,
                and real coaching transcripts. Designed to return clear next
                actions, not generic fitness advice.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-2">
                <Link
                  to="/"
                  className="rounded-none bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
                >
                  Get Access
                </Link>
                <Link
                  to="/"
                  className="rounded-none border border-foreground px-6 py-3 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <span className="inline-block h-1.5 w-1.5 bg-success" />
                DerivnOS reasoning layer active
                <span className="text-rule">·</span>
                Source-guided answers
                <span className="text-rule">·</span>
                $50/month membership
              </div>
            </div>

            {/* Side spec panel */}
            <aside className="md:col-span-4 md:border-l md:border-rule md:pl-8">
              <div className="space-y-6 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                <div>
                  <div className="text-foreground">System</div>
                  <div className="mt-1">DerivnOS · v1</div>
                </div>
                <div>
                  <div className="text-foreground">Domain</div>
                  <div className="mt-1">Training · Running · Nutrition · Recovery</div>
                </div>
                <div>
                  <div className="text-foreground">Source</div>
                  <div className="mt-1">Derivn coaching system + transcripts</div>
                </div>
                <div>
                  <div className="text-foreground">Output</div>
                  <div className="mt-1">One clear next action</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-b border-rule py-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                / 01 — Capabilities
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                What AskDerivn does
              </h2>
            </div>
          </div>
          <div className="grid border border-rule md:grid-cols-3">
            {[
              {
                k: "01",
                t: "Source-guided",
                d: "Built from Derivn’s coaching philosophy, programming logic, nutrition principles, and decision-making system.",
              },
              {
                k: "02",
                t: "Filtered through DerivnOS",
                d: "Every answer passes through a reasoning layer before the user sees it: context, missing variables, coaching rules, risk class, and next action.",
              },
              {
                k: "03",
                t: "Built for real decisions",
                d: "Use it for training days, running questions, meals, recovery, missed workouts, plateaus, and schedule problems.",
              },
            ].map((f, i) => (
              <div
                key={f.k}
                className={
                  "p-8 " +
                  (i < 2 ? "md:border-r md:border-rule " : "") +
                  (i > 0 ? "border-t border-rule md:border-t-0" : "")
                }
              >
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  {f.k}
                </div>
                <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider">
                  {f.t}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-b border-rule py-20">
          <div className="mb-10">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              / 02 — Workflow
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              How AskDerivn works
            </h2>
          </div>
          <div className="border-t border-rule">
            {[
              {
                k: "01",
                t: "Set context",
                d: "Goal, training level, schedule, equipment, and limitations.",
              },
              {
                k: "02",
                t: "Ask the question",
                d: "Training, running, nutrition, recovery, consistency, or what to do next.",
              },
              {
                k: "03",
                t: "Get the next action",
                d: "The answer is filtered through the Derivn system so you leave with a clear move.",
              },
              {
                k: "04",
                t: "Keep building",
                d: "Chat history and saved context help the system stay useful over time.",
              },
            ].map((s) => (
              <div
                key={s.k}
                className="grid grid-cols-12 gap-6 border-b border-rule py-6"
              >
                <div className="col-span-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  Step {s.k}
                </div>
                <div className="col-span-4 text-sm font-semibold uppercase tracking-wider">
                  {s.t}
                </div>
                <div className="col-span-12 text-sm leading-relaxed text-ink-soft md:col-span-6">
                  {s.d}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Membership */}
        <section className="py-20">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                / 03 — Membership
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                Membership
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                $50/month includes AskDerivn access and the Built for Motion
                PDF.
              </p>
              <Link
                to="/"
                className="mt-8 inline-block rounded-none bg-foreground px-6 py-3 text-sm font-medium text-background hover:opacity-90"
              >
                Get Access
              </Link>
            </div>

            <div className="md:col-span-7">
              <div className="border border-rule">
                <div className="flex items-baseline justify-between border-b border-rule px-6 py-4">
                  <div className="text-sm font-semibold uppercase tracking-wider">
                    AskDerivn Membership
                  </div>
                  <div className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                    $50 / month
                  </div>
                </div>
                <ul className="divide-y divide-rule">
                  {[
                    "Private AskDerivn chat access",
                    "Built for Motion PDF included",
                    "Saved conversations",
                    "Personalized context from onboarding",
                    "Source-guided Derivn answers",
                    "Cancel anytime",
                  ].map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-4 px-6 py-3 text-sm"
                    >
                      <span className="font-mono text-[11px] text-ink-soft">
                        ✓
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          <span>© {new Date().getFullYear()} Derivn</span>
          <span>Educational. Not a substitute for medical care.</span>
        </div>
      </footer>
    </div>
  );
}
