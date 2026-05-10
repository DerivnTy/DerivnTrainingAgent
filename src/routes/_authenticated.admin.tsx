import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminSummary, getAdminUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — AskDerivn" }] }),
});

type SummaryData = Awaited<ReturnType<typeof getAdminSummary>>;
type UsersData = Awaited<ReturnType<typeof getAdminUsers>>;

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function AdminPage() {
  const fetchSummary = useServerFn(getAdminSummary);
  const fetchUsers = useServerFn(getAdminUsers);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [users, setUsers] = useState<UsersData["users"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, u] = await Promise.all([fetchSummary(), fetchUsers()]);
        if (cancelled) return;
        setSummary(s);
        setUsers(u.users);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load admin data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchSummary, fetchUsers]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <span className="t-eyebrow">Admin</span>
        <h1 className="t-h1 mt-2">Members</h1>
        <p className="mt-3 t-body-sm">
          Internal overview of AskDerivn signups and subscriptions.
        </p>

        {loading && (
          <p className="mt-12 t-body-sm text-ink-soft">Loading…</p>
        )}
        {error && <p className="mt-12 t-body-sm">{error}</p>}

        {summary && (
          <>
            <section className="mt-12 grid grid-cols-2 border-y border-rule md:grid-cols-4">
              <Stat label="Total signups" value={summary.totalSignups} />
              <Stat label="Memberships" value={summary.totalMemberships} />
              <Stat label="Active" value={summary.activeSubscribers} />
              <Stat
                label="Canceled / inactive"
                value={summary.canceledOrInactive}
              />
            </section>

            <section className="mt-16">
              <span className="t-eyebrow">Recent signups</span>
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {summary.recent.length === 0 && (
                  <li className="py-3 t-body-sm text-ink-soft">None yet.</li>
                )}
                {summary.recent.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-3 t-body-sm"
                  >
                    <span>{r.display_name || r.email || r.id}</span>
                    <span className="text-ink-soft">{fmtDate(r.created_at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="mt-16">
          <span className="t-eyebrow">All members</span>
          <div className="mt-4 overflow-x-auto border-y border-rule">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-rule t-eyebrow">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Signed up</th>
                  <th className="py-3 pr-4">Period ends</th>
                  <th className="py-3 pr-4">Profile</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-4 t-body-sm text-ink-soft">
                      No users.
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-rule last:border-b-0 t-body-sm"
                  >
                    <td className="py-3 pr-4">
                      {u.display_name || (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">{u.email || u.id}</td>
                    <td className="py-3 pr-4">
                      {statusLabel(u.subscription_status)}
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {fmtDate(u.created_at)}
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {fmtDate(u.subscription_current_period_end)}
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">
                      {u.profile_completed_at ? "Yes" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-rule px-5 py-6 not-first:border-l">
      <span className="t-eyebrow">{label}</span>
      <div className="mt-2 t-h2">{value.toLocaleString()}</div>
    </div>
  );
}
