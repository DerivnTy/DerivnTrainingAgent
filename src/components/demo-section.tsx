import { useState } from "react";
import { Link } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import { readChatStream } from "@/lib/sse";

const SUGGESTIONS = [
  "Should I run today if my legs are sore?",
  "What should I eat before training?",
  "I missed two workouts. What should I do?",
  "Should I cut carbs to lose fat?",
];

const DEMO_LIMIT = 2;
const STORAGE_KEY = "askderivn_demo_count";

type Exchange = { question: string; answer: string };

function getCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export function DemoSection() {
  const [input, setInput] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number>(() => getCount());

  const limitReached = count >= DEMO_LIMIT;

  async function ask(question: string) {
    if (loading || limitReached) return;
    const q = question.trim();
    if (!q) return;
    if (q.length > 500) {
      setError("Keep your question under 500 characters.");
      return;
    }
    setError(null);
    setLoading(true);

    // Push the exchange optimistically with an empty answer so we can stream into it.
    const idx = exchanges.length;
    setExchanges((prev) => [...prev, { question: q, answer: "" }]);
    setInput("");

    let answer = "";

    try {
      const res = await fetch("/api/public/demo-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ content: q }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Something went wrong. Try again.");
        setExchanges((prev) => prev.filter((_, i) => i !== idx));
        return;
      }

      await readChatStream(res, {
        onDelta: (chunk) => {
          answer += chunk;
          setExchanges((prev) =>
            prev.map((ex, i) => (i === idx ? { ...ex, answer } : ex))
          );
        },
      });

      if (!answer.trim()) {
        setError("Empty response. Please try again.");
        setExchanges((prev) => prev.filter((_, i) => i !== idx));
        return;
      }

      const next = getCount() + 1;
      window.sessionStorage.setItem(STORAGE_KEY, String(next));
      setCount(next);
    } catch {
      setError("Network error. Please try again.");
      setExchanges((prev) => prev.filter((_, i) => i !== idx));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="border-t border-rule">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center">
          <h2 className="t-h2">
            Give it a try
          </h2>
          <p className="mx-auto mt-3 max-w-xl t-body text-ink-soft">
            Ask a training, nutrition, running, recovery, or consistency
            question and see how AskDerivn thinks.
          </p>
        </div>

        <form
          className="mt-10"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            disabled={loading || limitReached}
            placeholder="Ask something like: Should I run today if my legs are sore?"
            rows={3}
            className="w-full resize-none rounded-3xl border border-rule bg-background px-5 py-4 text-base leading-relaxed text-foreground placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-60"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="t-eyebrow">
              {limitReached
                ? "Demo limit reached"
                : `${DEMO_LIMIT - count} demo question${DEMO_LIMIT - count === 1 ? "" : "s"} left`}
            </span>
            <button
              type="submit"
              disabled={loading || limitReached || !input.trim()}
              className="btn-primary btn-pill-lg opacity-40 disabled:opacity-40 [&:not(:disabled)]:opacity-100"
            >
              {loading ? "Thinking…" : "Ask AskDerivn"}
            </button>
          </div>
        </form>

        {!limitReached && exchanges.length === 0 && (
          <div className="mt-8">
            <div className="t-eyebrow">
              Try one of these
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => setInput(s)}
                    disabled={loading}
                    className="rounded-full border border-rule px-4 py-2 t-body-sm transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <p className="mt-6 t-body-sm text-destructive">{error}</p>
        )}

        {exchanges.length > 0 && (
          <div className="mt-10 space-y-8">
            {exchanges.map((ex, i) => (
              <div key={i}>
                <div className="t-eyebrow">You asked</div>
                <p className="mt-2 t-body">{ex.question}</p>

                <div className="mt-5 t-eyebrow">AskDerivn</div>
                <div className="prose prose-sm mt-2 max-w-none text-foreground">
                  <ReactMarkdown>{ex.answer}</ReactMarkdown>
                </div>
                <p className="mt-4 t-meta">
                  Full AskDerivn uses your goals, training level, schedule, and
                  limitations to give sharper answers.
                </p>
              </div>
            ))}
          </div>
        )}

        {limitReached && (
          <div className="mt-10 border-t border-rule pt-8 text-center">
            <p className="t-h3">
              Create an account to keep asking and unlock the full AskDerivn
              system.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/signup" className="btn-primary btn-pill-lg">
                Get Access
              </Link>
              <Link to="/login" className="btn-secondary btn-pill-lg">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
