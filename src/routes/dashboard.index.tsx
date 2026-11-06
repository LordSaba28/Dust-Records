import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { fetchMyReleases, formatDate, type CatalogRelease } from "@/lib/catalog";
import { useDust } from "@/lib/dust";

export const Route = createFileRoute("/dashboard/")({ component: DashboardPage });

function DashboardPage() {
  const { session, profile, loading } = useDust();
  const navigate = useNavigate();
  const [releases, setReleases] = useState<CatalogRelease[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/access" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (!session) return;
    fetchMyReleases(session.user.id).then(setReleases).catch((err: Error) => setError(err.message));
  }, [session]);

  if (loading || !session) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-muted">Opening the studio…</p>;
  }

  const counts = {
    all: releases.length,
    pending: releases.filter((r) => r.status === "pending").length,
    live: releases.filter((r) => r.status === "approved").length,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label-kicker">Artist portal</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl">Studio</h1>
        {profile?.artist_id && (
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/profile" className="rounded-full border border-line px-5 py-3 text-sm">
              Profile
            </Link>
            <Link to="/dashboard/new" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-bg">
              New release
            </Link>
          </div>
        )}
      </div>
      <p className="mt-3 max-w-xl text-muted">
        {profile?.artists?.name ? `${profile.artists.name}. ` : ""}
        {profile?.role === "admin"
          ? "You are also on the label desk."
          : "Submitted projects stay with the label until they are released."}
      </p>

      {!profile?.artist_id && (
        <p className="mt-8 max-w-lg text-muted">This login is not attached to an artist page yet. The label creates artist pages and sends the entrance separately.</p>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Projects", counts.all],
          ["Pending", counts.pending],
          ["Live", counts.live],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-card border border-line bg-surface p-4">
            <div className="text-xs uppercase tracking-widest text-gold">{label}</div>
            <div className="mt-2 font-display text-4xl">{value}</div>
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-gold">{error}</p>}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {releases.length === 0 && <li className="py-6 text-sm text-muted">No projects yet.</li>}
        {releases.map((release) => (
          <li key={release.id} className="flex flex-wrap items-center gap-3 py-4">
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{release.title}</div>
              <div className="text-xs tracking-widest text-muted uppercase">
                {release.status === "approved" ? "Released" : release.status === "pending" ? "With the label" : release.status === "rejected" ? "Returned" : "Draft"}
                {" · "}
                {release.releaseType} · {formatDate(release.releaseDate)}
              </div>
            </div>
            {release.status === "approved" ? (
              <Link to="/releases/$id" params={{ id: release.id }} className="text-sm text-gold">
                View
              </Link>
            ) : release.status === "rejected" ? (
              <span className="text-sm text-muted">Returned. The label can reopen it.</span>
            ) : (
              <Link to="/dashboard/$id" params={{ id: release.id }} className="text-sm text-gold">
                Edit
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
