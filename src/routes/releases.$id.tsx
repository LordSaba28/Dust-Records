import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { fetchRelease, formatDate, type CatalogRelease } from "@/lib/catalog";
import { formatTime, usePlayer } from "@/lib/player";

export const Route = createFileRoute("/releases/$id")({ component: ReleasePage });

function ReleasePage() {
  const { id } = Route.useParams();
  const [release, setRelease] = useState<CatalogRelease | null | undefined>(undefined);
  const [error, setError] = useState("");
  const play = usePlayer((s) => s.play);

  useEffect(() => {
    fetchRelease(id)
      .then(setRelease)
      .catch((err: Error) => {
        setError(err.message);
        setRelease(null);
      });
  }, [id]);

  if (release === undefined) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-muted">Loading release…</p>;
  }
  if (!release || release.status !== "approved") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl">This record isn’t available</h1>
        <p className="mt-3 text-muted">{error || "It may have moved, or it isn’t part of the catalog."}</p>
        <Link to="/music" search={{ q: "" }} className="mt-6 inline-block text-gold">
          Back to music
        </Link>
      </div>
    );
  }

  const queue = release.tracks
    .filter((t) => t.audioUrl)
    .map((t) => ({
      id: t.id,
      title: t.title,
      artist: release.artistName,
      audioUrl: t.audioUrl as string,
      coverUrl: release.coverUrl,
      releaseId: release.id,
    }));

  const creditCards = release.tracks.flatMap((t) =>
    t.credits.map((c) => ({ ...c, track: t.title })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid items-center gap-8 md:grid-cols-5">
        <div className="md:col-span-2">
          {release.coverUrl ? (
            <img src={release.coverUrl} alt="" className="aspect-square w-full rounded-card object-cover" />
          ) : (
            <div className="aspect-square rounded-card bg-elevated" />
          )}
        </div>
        <div className="md:col-span-3">
          <p className="label-kicker">
            {release.releaseType}
            {release.albumType ? ` · ${release.albumType}` : ""}
            {release.explicit ? " · Explicit" : ""}
          </p>
          <h1 className="mt-2 font-display text-5xl">{release.title}</h1>
          <p className="mt-2 text-muted">
            {release.artistName} · Dust Records · {formatDate(release.releaseDate)}
          </p>
          <p className="mt-2 text-sm text-gold">{release.genres.map((g) => g.name).join(" · ")}</p>
          <button
            type="button"
            onClick={() => play(queue)}
            className="mt-6 inline-flex h-14 items-center gap-2 rounded-full bg-gold px-6 font-semibold text-bg"
          >
            <Play size={18} /> Play
          </button>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-3xl">Tracks</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {release.tracks.map((track, i) => (
            <li key={`${track.id}-${track.version}`} className="flex items-center gap-4 py-3">
              <button
                type="button"
                aria-label={`Play ${track.title}`}
                disabled={!track.audioUrl}
                onClick={() => play(queue, queue.findIndex((t) => t.id === track.id))}
                className="grid h-11 w-11 place-items-center rounded-full border border-line disabled:opacity-40"
              >
                <Play size={14} />
              </button>
              <div className="w-6 text-sm text-muted">{track.number || i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">
                  {track.title}
                  {track.explicit ? <span className="ml-2 text-xs text-gold">E</span> : null}
                </div>
                <div className="text-xs capitalize text-muted">{track.version}</div>
              </div>
              <div className="text-sm text-muted">{formatTime(track.duration)}</div>
            </li>
          ))}
        </ul>
      </section>

      {creditCards.length > 0 && (
        <section className="mt-12">
          <p className="label-kicker">SongDNA</p>
          <h2 className="mt-2 font-display text-3xl">Contributors</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {creditCards.map((c, i) => (
              <div key={`${c.name}-${c.role}-${i}`} className="rounded-card border border-line p-4 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-elevated font-display text-xl text-gold">
                  {c.name.slice(0, 1)}
                </div>
                <div className="mt-3 text-sm font-semibold">{c.name}</div>
                <div className="text-xs capitalize text-muted">{c.role}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
