import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { fetchApprovedReleases, fetchArtistBySlug, type CatalogRelease, type PublicArtist } from "@/lib/catalog";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/artists/$slug")({ component: ArtistPage });

function ArtistPage() {
  const { slug } = Route.useParams();
  const [artist, setArtist] = useState<PublicArtist | null | undefined>(undefined);
  const [releases, setReleases] = useState<CatalogRelease[]>([]);
  const play = usePlayer((s) => s.play);

  useEffect(() => {
    fetchArtistBySlug(slug)
      .then(setArtist)
      .catch(() => setArtist(null));
  }, [slug]);

  useEffect(() => {
    if (!artist) return;
    fetchApprovedReleases()
      .then((all) => setReleases(all.filter((r) => r.artistId === artist.id || r.artistSlug === slug)))
      .catch(() => setReleases([]));
  }, [artist, slug]);

  if (artist === undefined) {
    return <p className="mx-auto max-w-6xl px-4 py-16 text-muted">Loading…</p>;
  }

  if (!artist) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <h1 className="font-display text-4xl">Artist not found</h1>
        <Link to="/artists" className="mt-4 inline-block text-gold">
          Back to artists
        </Link>
      </div>
    );
  }

  return (
    <div>
      <section className="relative min-h-[50vh] overflow-hidden border-b border-line bg-elevated">
        {artist.image ? (
          <img src={artist.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center font-display text-8xl text-gold">{artist.name.slice(0, 1)}</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/20" />
        <div className="relative mx-auto flex min-h-[50vh] max-w-6xl flex-col justify-end px-4 py-12">
          <p className="label-kicker">Dust Records</p>
          <h1 className="mt-2 font-display text-6xl sm:text-7xl">{artist.name}</h1>
          {artist.genre && <p className="mt-2 text-gold-soft">{artist.genre}</p>}
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-5">
        <div className="md:col-span-3">
          <h2 className="font-display text-3xl">Bio</h2>
          <p className="mt-4 text-muted">{artist.bio || "Biography coming soon."}</p>
        </div>
        <div className="md:col-span-2">
          <h2 className="font-display text-3xl">Releases</h2>
          {releases.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No records here yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {releases.map((release) => (
                <li key={release.id} className="flex items-center gap-3 rounded-card border border-line p-3">
                  {release.coverUrl ? (
                    <img src={release.coverUrl} alt="" className="h-14 w-14 rounded-md object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-md bg-elevated" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link to="/releases/$id" params={{ id: release.id }} className="font-semibold">
                      {release.title}
                    </Link>
                    <div className="text-xs tracking-widest text-muted uppercase">{release.releaseType}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Play ${release.title}`}
                    className="grid h-11 w-11 place-items-center rounded-full bg-gold text-bg"
                    onClick={() =>
                      play(
                        release.tracks
                          .filter((t) => t.audioUrl)
                          .map((t) => ({
                            id: t.id,
                            title: t.title,
                            artist: artist.name,
                            audioUrl: t.audioUrl as string,
                            coverUrl: release.coverUrl,
                            releaseId: release.id,
                          })),
                      )
                    }
                  >
                    <Play size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Link to="/contact" search={{ artist: artist.name }} className="mt-6 inline-flex rounded-full border border-line px-4 py-3 text-sm">
            Book {artist.name}
          </Link>
        </div>
      </section>
    </div>
  );
}
