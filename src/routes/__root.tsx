import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import "../styles.css";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="t-display">404</h1>
        <h2 className="mt-4 t-h2">Page not found</h2>
        <p className="mt-3 t-body-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link to="/" className="btn-primary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="t-h1">This page didn't load</h1>
        <p className="mt-3 t-body-sm">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {error?.message && (
          <p className="mt-3 font-mono text-xs text-ink-soft/70 break-words">
            {error.message}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-primary"
          >
            Try again
          </button>
          <a href="/" className="btn-secondary">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ask Derivn" },
      { name: "description", content: "AskDerivn is a private fitness decision-support assistant trained on the Derivn coaching system, thousands of workouts, and real coaching transcripts." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Ask Derivn" },
      { property: "og:description", content: "AskDerivn is a private fitness decision-support assistant trained on the Derivn coaching system, thousands of workouts, and real coaching transcripts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Ask Derivn" },
      { name: "twitter:description", content: "AskDerivn is a private fitness decision-support assistant trained on the Derivn coaching system, thousands of workouts, and real coaching transcripts." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/0aqedCLxcMNku9P1zDmwEbx5Crn1/social-images/social-1778100043981-Screenshot_2026-03-10_at_5.14.12_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/0aqedCLxcMNku9P1zDmwEbx5Crn1/social-images/social-1778100043981-Screenshot_2026-03-10_at_5.14.12_PM.webp" },
      { name: "theme-color", content: "#F6F1E5" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "AskDerivn" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "mobile-web-app-capable", content: "yes" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
