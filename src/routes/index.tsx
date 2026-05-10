import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/site-footer";
import { DemoSection } from "@/components/demo-section";
import { rootBeforeLoad } from "@/lib/post-auth-route";

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
          <Link to="/" className="font-serif text-lg tracking-tight text-foreground">
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
          <h1 className="font-serif text-6xl leading-[1.02] tracking-tight md:text-8xl">
            AskDerivn
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-foreground md:text-xl">
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
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
                What you get
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
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
                  <div className="font-mono text-xs text-ink-soft">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-3 font-serif text-xl">{item.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-2xl text-center">
              <p className="text-sm text-ink-soft">
                The PDF gives you the system. AskDerivn helps you apply it.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-rule">
          <div className="mx-auto max-w-5xl px-6 py-20">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
                Pricing
              </h2>
              <div className="mt-8 font-serif tracking-tight text-2xl">
                $30/month
              </div>
              <p className="mt-3 text-sm text-ink-soft">Cancel anytime.</p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 h-12 px-7 text-sm font-medium transition-all duration-200 active:scale-[0.98]"
                >
                  Get Access
                </Link>
              </div>
              <p className="mt-6 text-sm text-ink-soft">
                Includes the 100-page PDF and AskDerivn chat access.
              </p>
            </div>
          </div>
        </section>

        <DemoSection />

        <section className="border-t border-rule">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <h2 className="font-serif text-4xl tracking-tight md:text-5xl">
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
