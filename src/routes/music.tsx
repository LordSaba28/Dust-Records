import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { fetchApprovedReleases, fetchPublicArtists, type CatalogRelease, type PublicArtist } from "@/lib/catalog";
import { usePlayer } from "@/lib/player";

type MusicSearch = { q: string };

export const Route = createFileRoute("/music")({
  validateSearch: (search: Record<string, unknown>): MusicSearch => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: MusicPage,
});

function MusicPage() {
  const { q } = Route.useSearch();
  const [releases, setReleases] = useState<CatalogRelease[] | null>(null);
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const [error, setError] = useState("");
  const play = usePlayer((s) => s.play);

  useEffect(() => {
    fetchApprovedReleases()
      .then(setReleases)
      .catch((err: Error) => {
        setError(err.message);
        setReleases([]);
      });
    fetchPublicArtists().then(setArtists).catch(() => setArtists([]));
  }, []);

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    const list = releases ?? [];
    if (!query) return list;
    return list.filter((r) => {
      const blob = [r.title, r.artistName, r.albumType, ...r.genres.map((g) => g.name), ...r.tracks.map((t) => t.title)]
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [releases, query]);

  const people = useMemo(() => {
    if (!query) return [];
    return artists.filter((a) => `${a.name} ${a.genre ?? ""} ${a.bio ?? ""}`.toLowerCase().includes(query));
  }, [artists, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label-kicker">Catalog</p>
      <h1 className="mt-2 font-display text-5xl">Music</h1>
      <p className="mt-3 max-w-xl text-muted">
        {query ? `Results for “${q}”.` : "Songs and projects from Dust Records."}
      </p>
      {error && <p className="mt-4 text-sm text-gold">{error}</p>}
      {releases === null ? (
        <p className="mt-10 text-muted">Loading the catalog…</p>
      ) : (
        <>
          {people.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm uppercase tracking-widest text-muted">Artists</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {people.map((a) => (
                  <Link key={a.slug} to="/artists/$slug" params={{ slug: a.slug }} className="rounded-full border border-line px-4 py-2 text-sm">
                    {a.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="mt-10 rounded-card border border-line p-8">
              <p className="font-display text-2xl">{query ? "No matches." : "The catalog is quiet."}</p>
              <p className="mt-2 text-sm text-muted">
                {query ? "Try a name, a genre, or a song title." : "New records will appear here."}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((release) => (
                <article key={release.id} className="overflow-hidden rounded-card border border-line bg-surface">
                  <Link to="/releases/$id" params={{ id: release.id }}>
                    {release.coverUrl ? (
                      <img src={release.coverUrl} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="aspect-square bg-elevated" />
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-widest text-gold">
                      {release.artistName}
                      {release.explicit ? " · E" : ""}
                    </div>
                    <h2 className="mt-1 font-display text-2xl">{release.title}</h2>
                    <p className="text-sm text-muted">
                      {release.genres.map((g) => g.name).join(" · ") || release.releaseType}
                    </p>
                    <button
                      type="button"
                      className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-bg"
                      onClick={() =>
                        play(
                          release.tracks
                            .filter((t) => t.audioUrl)
                            .map((t) => ({
                              id: t.id,
                              title: t.title,
                              artist: release.artistName,
                              audioUrl: t.audioUrl as string,
                              coverUrl: release.coverUrl,
                              releaseId: release.id,
                            })),
                        )
                      }
                    >
                      <Play size={14} /> Play
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
