import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Play } from "lucide-react";
import { fetchApprovedReleases, fetchPublicArtists, type CatalogRelease, type PublicArtist } from "@/lib/catalog";
import { useDust } from "@/lib/dust";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/")({ component: Home });

const SLIDES = [
  {
    title: "Timeless",
    accent: "Sounds",
    body: "Twenty-six years of pushing the needle. A quarter century of independent music.",
  },
  {
    title: "Music Without",
    accent: "Borders",
    body: "From Effurun to everywhere the songs travel. Simply limitless.",
  },
  {
    title: "Artists With",
    accent: "Vision",
    body: "We don’t just sign talent. We stay with the work.",
  },
  {
    title: "A Label For",
    accent: "Tomorrow",
    body: "Twenty-six years of shaping the culture and finding the next voice.",
  },
];

function Home() {
  const [slide, setSlide] = useState(0);
  const [releases, setReleases] = useState<CatalogRelease[]>([]);
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const play = usePlayer((s) => s.play);
  const { session, profile, loading } = useDust();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session && profile?.role !== "admin" && profile?.artist_id) {
      void navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, session, profile, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => setSlide((n) => (n + 1) % SLIDES.length), 5000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    fetchApprovedReleases().then(setReleases).catch(() => setReleases([]));
    fetchPublicArtists().then(setArtists).catch(() => setArtists([]));
  }, []);

  const current = SLIDES[slide] ?? SLIDES[0];

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <img
          src="/brand/wordmark.png"
          alt=""
          className="pointer-events-none absolute -right-8 top-8 hidden w-[min(70%,42rem)] opacity-[0.08] md:block"
        />
        <div className="mx-auto grid min-h-[70vh] max-w-6xl content-end px-4 py-16">
          <p className="label-kicker">Dust Records · est. 2000</p>
          <h1 className="mt-4 font-display text-5xl leading-none sm:text-7xl">
            {current.title}
            <br />
            <span className="text-gold">{current.accent}</span>
          </h1>
          <p className="mt-6 max-w-md text-muted">{current.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/music" search={{ q: "" }} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-bg">
              Listen <ArrowRight size={16} />
            </Link>
            <Link to="/artists" className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm">
              The roster
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="label-kicker">Meet the artists</p>
            <h2 className="mt-2 font-display text-4xl">Our artists</h2>
          </div>
          <Link to="/artists" className="text-sm text-gold">
            View all
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {artists.length === 0 ? (
            <p className="text-muted sm:col-span-2 lg:col-span-4">The roster is announced with each record.</p>
          ) : (
            artists.map((artist, i) => (
              <Link
                key={artist.slug}
                to="/artists/$slug"
                params={{ slug: artist.slug }}
                className={`group relative overflow-hidden rounded-card bg-elevated ${i === 0 ? "min-h-80 sm:col-span-2 sm:row-span-2" : "min-h-56"}`}
              >
                {artist.image ? (
                  <img src={artist.image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center font-display text-6xl text-gold">{artist.name.slice(0, 1)}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="font-display text-2xl">{artist.name}</div>
                  {artist.genre && <div className="text-sm text-gold-soft">{artist.genre}</div>}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="label-kicker">The catalog</p>
              <h2 className="mt-2 font-display text-4xl">Latest music</h2>
            </div>
            <Link to="/music" search={{ q: "" }} className="text-sm text-gold">
              Full catalog
            </Link>
          </div>
          {releases.length === 0 ? (
            <div className="rounded-card border border-line bg-bg p-8">
              <p className="font-display text-2xl">New music is on the way.</p>
              <p className="mt-2 max-w-lg text-sm text-muted">Records from the roster will land here as they are released.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {releases.slice(0, 4).map((release) => (
                <article key={release.id} className="overflow-hidden rounded-card border border-line bg-bg">
                  <Link to="/releases/$id" params={{ id: release.id }} className="block">
                    {release.coverUrl ? (
                      <img src={release.coverUrl} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="aspect-square bg-elevated" />
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-widest text-gold">
                      {release.releaseType}
                      {release.explicit ? " · Explicit" : ""}
                    </div>
                    <h3 className="mt-1 font-display text-xl">{release.title}</h3>
                    <p className="text-sm text-muted">{release.artistName}</p>
                    <button
                      type="button"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-gold"
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
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="label-kicker">The label</p>
          <h2 className="mt-2 font-display text-4xl">
            The music
            <br />
            lives on
          </h2>
        </div>
        <div className="text-muted">
          <p>
            Founded in 2000, Dust Records has spent over two decades championing independent voices across Afrobeats, hip-hop, R&B, alternative and beyond. We exist to protect the integrity of the sound and the identity of the artist.
          </p>
          <Link to="/about" className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
            Read the story <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
