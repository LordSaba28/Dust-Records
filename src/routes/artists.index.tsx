import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { fetchPublicArtists, type PublicArtist } from "@/lib/catalog";

export const Route = createFileRoute("/artists/")({ component: ArtistsPage });

function ArtistsPage() {
  const [artists, setArtists] = useState<PublicArtist[] | null>(null);

  useEffect(() => {
    fetchPublicArtists()
      .then(setArtists)
      .catch(() => setArtists([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label-kicker">Roster</p>
      <h1 className="mt-2 font-display text-5xl">Artists</h1>
      <p className="mt-3 max-w-xl text-muted">The voices of Dust Records.</p>
      {artists === null ? (
        <p className="mt-10 text-muted">Loading the roster…</p>
      ) : artists.length === 0 ? (
        <p className="mt-10 text-muted">The roster will be announced here.</p>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              to="/artists/$slug"
              params={{ slug: artist.slug }}
              className="group relative min-h-64 overflow-hidden rounded-card bg-elevated"
            >
              {artist.image ? (
                <img src={artist.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center font-display text-6xl text-gold">{artist.name.slice(0, 1)}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                {artist.genre && <div className="text-xs tracking-widest text-gold-soft uppercase">{artist.genre}</div>}
                <div className="font-display text-4xl">{artist.name}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
