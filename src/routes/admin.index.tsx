import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeskGate } from "@/components/desk-gate";
import { fetchAllReleases, fetchPending, formatDate, type CatalogRelease } from "@/lib/catalog";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

type Inquiry = {
  id: string;
  name: string;
  email: string;
  inquiry_type: string;
  message: string;
  status: string;
  created_at: string;
};

function AdminPage() {
  const { profile } = useDust();
  const [pending, setPending] = useState<CatalogRelease[]>([]);
  const [live, setLive] = useState<CatalogRelease[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<string | null>(null);

  async function load() {
    try {
      const [waiting, all] = await Promise.all([fetchPending(), fetchAllReleases()]);
      setPending(waiting);
      setLive(all.filter((r) => r.status === "approved"));
      const { data, error: qError } = await getSupabase()
        .from("inquiries")
        .select("id, name, email, inquiry_type, message, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (qError) throw new Error(qError.message);
      setInquiries((data ?? []) as Inquiry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the desk.");
    }
  }

  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile]);

  async function setStatus(id: string, status: "approved" | "rejected" | "draft") {
    setError("");
    const patch: Record<string, string | null> = { status };
    if (status === "approved") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = profile?.id ?? null;
      patch.rejection_reason = null;
    }
    if (status === "rejected") patch.rejection_reason = reason[id] || "Needs changes.";
    const { error: updateError } = await getSupabase().from("releases").update(patch).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await load();
  }

  async function removeRelease(id: string) {
    setError("");
    const { error: deleteError } = await getSupabase().from("releases").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setConfirm(null);
    await load();
  }

  return (
    <DeskGate>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="label-kicker">Label desk</p>
        <h1 className="mt-2 font-display text-5xl">Releases</h1>
        <p className="mt-3 max-w-xl text-muted">Approve or return a submission, or take a record off the catalog. New artists are under Artists.</p>
        {error && <p className="mt-4 text-sm text-gold">{error}</p>}

        <section className="mt-10">
          <h2 className="font-display text-3xl">Waiting</h2>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing waiting.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pending.map((release) => (
                <li key={release.id} className="rounded-card border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-2xl">{release.title}</div>
                      <div className="text-sm text-muted">
                        {release.artistName} · {release.releaseType}
                        {release.albumType ? ` · ${release.albumType}` : ""} · {formatDate(release.releaseDate)}
                      </div>
                      <div className="mt-1 text-sm text-gold">{release.genres.map((g) => g.name).join(" · ")}</div>
                      <ul className="mt-2 text-sm text-muted">
                        {release.tracks.map((t) => (
                          <li key={t.id}>
                            {t.title} · {t.version}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {release.coverUrl && <img src={release.coverUrl} alt="" className="h-20 w-20 rounded-md object-cover" />}
                  </div>
                  <input
                    placeholder="Note if you send it back"
                    value={reason[release.id] ?? ""}
                    onChange={(e) => setReason((r) => ({ ...r, [release.id]: e.target.value }))}
                    className="mt-3 w-full rounded-lg border border-line bg-elevated px-3 py-3 text-sm"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => void setStatus(release.id, "approved")} className="h-11 rounded-full bg-gold px-4 text-sm font-semibold text-bg">
                      Approve
                    </button>
                    <button type="button" onClick={() => void setStatus(release.id, "rejected")} className="h-11 rounded-full border border-line px-4 text-sm">
                      Reject
                    </button>
                    <button type="button" onClick={() => void setStatus(release.id, "draft")} className="h-11 rounded-full border border-line px-4 text-sm">
                      Return to draft
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl">On the site</h2>
          {live.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Nothing published.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {live.map((release) => (
                <li key={release.id} className="flex flex-wrap items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{release.title}</div>
                    <div className="text-sm text-muted">
                      {release.artistName} · {formatDate(release.releaseDate)}
                    </div>
                  </div>
                  {confirm === `release-${release.id}` ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void removeRelease(release.id)} className="h-11 rounded-full bg-gold px-4 text-sm font-semibold text-bg">
                        Confirm remove
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className="h-11 rounded-full border border-line px-4 text-sm">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirm(`release-${release.id}`)} className="h-11 rounded-full border border-line px-4 text-sm">
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-display text-3xl">Messages</h2>
          {inquiries.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No messages yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {inquiries.map((item) => (
                <li key={item.id} className="rounded-card border border-line p-4">
                  <div className="text-xs tracking-widest text-gold uppercase">
                    {item.inquiry_type} · {formatDate(item.created_at)}
                  </div>
                  <div className="mt-1 font-semibold">
                    {item.name} · {item.email}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-muted">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DeskGate>
  );
}
