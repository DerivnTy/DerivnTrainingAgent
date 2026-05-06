// TODO: remove before public launch
// Preview/dev-only subscription bypass for @derivn.com test accounts.
// Never affects production hosts.

const PROD_HOSTS = new Set([
  "ask.derivn.com",
  "derivn-ai-buddy.lovable.app",
]);

function emailAllowed(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith("@derivn.com");
}

function hostIsProd(host: string | null | undefined): boolean {
  if (!host) return false;
  // Strip port if any
  const h = host.split(":")[0].toLowerCase();
  return PROD_HOSTS.has(h);
}

/** Browser-side check. Reads window.location.hostname. */
export function isDevBypassEmail(email?: string | null): boolean {
  if (!emailAllowed(email)) return false;
  if (typeof window === "undefined") return false;
  return !hostIsProd(window.location.hostname);
}

/** Server-side check. Pass the incoming Request to inspect the Host header. */
export function isDevBypassEmailServer(
  email: string | null | undefined,
  request: Request
): boolean {
  if (!emailAllowed(email)) return false;
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return !hostIsProd(host);
}
