import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { DemoSection } from "@/components/demo-section";
import { rootBeforeLoad } from "@/lib/post-auth-route";
import coachPortrait from "@/assets/coach-portrait.jpeg";

export const Route = createFileRoute("/")({
  beforeLoad: () => rootBeforeLoad(),
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
          <Link to="/" className="t-wordmark">
            AskDerivn
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link to="/login" className="text-ink-soft hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 h-10 px-5 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            >
              Get Access
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center">
          <h1 className="t-display">
            AskDerivn
          </h1>
          <p className="mx-auto mt-8 max-w-2xl t-body text-lg">
            Built to give clear answers and clarity toward fitness goals.
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <Link 
              to="/signup" 
              className="inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            >
              Get Access
            </Link>
            <Link 
              to="/login" 
              className="inline-flex items-center justify-center rounded-full border border-rule bg-transparent text-foreground hover:bg-accent h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-20 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div className="mx-auto w-full max-w-sm md:mx-0">
                <div className="overflow-hidden rounded-2xl border border-rule bg-card">
                  <img
                    src={coachPortrait}
                    alt="Ty Nordene, founder of AskDerivn"
                    className="block h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <div>
                <p className="t-body-sm">
                  I built AskDerivn so the system I use with my own clients is available to anyone who
                  wants real coaching, not another generic fitness app.
                </p>
                <p className="mt-4 t-body-sm">
                  AskDerivn is trained on the Derivn framework, thousands of workouts, and real
                  coaching conversations. The goal is simple: clear answers, sustainable structure,
                  and steady progress toward your goals.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="t-h2">What you get</h2>
              <p className="mt-3 t-body-sm">
                Two things, one membership.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-4xl gap-10 md:grid-cols-2 text-center">
              {[
                {
                  t: "Built for Motion PDF",
                  d: "The full Derivn guide covering training structure, running, nutrition, recovery, habits, progress tracking, and common mistakes.",
                },
                {
                  t: "AskDerivn chat",
                  d: "A private coaching assistant built from the Derivn system, thousands of workouts, and real coaching transcripts.",
                },
              ].map((item, i) => (
                <div key={i}>
                  <div className="t-eyebrow">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-2 t-h3">{item.t}</h3>
                  <p className="mt-3 t-body-sm">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-2xl text-center">
              <p className="t-body-sm">
                The PDF gives you the system. AskDerivn helps you apply it.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="t-eyebrow">PRICING</div>
              <h2 className="mt-4 t-h2">One plan. Everything included.</h2>
              <p className="mx-auto mt-4 max-w-xl t-body-sm">
                The 100-page Built for Motion PDF and unlimited AskDerivn chat access.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-md rounded-2xl border border-rule bg-card p-8 md:mt-14 md:p-10">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-serif text-5xl tracking-tight md:text-6xl">$30</span>
                <span className="t-body-sm">/month</span>
              </div>
              <p className="mt-2 text-center t-body-sm">Cancel anytime.</p>

              <ul className="mt-8 space-y-3 t-body-sm">
                {[
                  "AskDerivn chat access",
                  "100-page Built for Motion PDF",
                  "Saved conversations",
                  "Personalized profile context",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span aria-hidden className="mt-2 inline-block h-1 w-1 rounded-full bg-foreground" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                Get Access
              </Link>
            </div>
          </div>
        </section>

        <DemoSection />

        <section className="border-t border-rule">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="t-h2">
              Ready when you are.
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link 
                to="/signup" 
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                Get Access
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center rounded-full border border-rule bg-transparent text-foreground hover:bg-accent h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
