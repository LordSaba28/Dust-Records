import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  fetchArtistOptions,
  fetchGenres,
  fetchRelease,
  slugify,
  type ArtistOption,
  type GenreRow,
} from "@/lib/catalog";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";
import { FileWell } from "@/components/file-well";

const ALBUM_TYPES = ["EP", "LP", "Mixtape", "Soundtrack", "Compilation"] as const;
const VERSIONS = ["standard", "deluxe", "live", "acoustic", "radio", "extended", "instrumental", "remix"] as const;

type CreditDraft = {
  name: string;
  artistId: string;
  songwriter: boolean;
  producer: boolean;
  featured: boolean;
};

type TrackDraft = {
  key: string;
  title: string;
  file: File | null;
  explicit: boolean;
  version: (typeof VERSIONS)[number];
  existingId: string | null;
  credits: CreditDraft[];
};

type Attachable = { trackId: string; title: string; artist: string };

const emptyCredit = (): CreditDraft => ({
  name: "",
  artistId: "",
  songwriter: false,
  producer: false,
  featured: false,
});

function newTrack(): TrackDraft {
  return {
    key: crypto.randomUUID(),
    title: "",
    file: null,
    explicit: false,
    version: "standard",
    existingId: null,
    credits: [emptyCredit()],
  };
}

async function fileDuration(file: File) {
  return new Promise<number>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}

async function uploadTo(bucket: "covers" | "audio", path: string, file: File) {
  const sb = getSupabase();
  const { error } = await sb.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`${bucket}: ${error.message}`);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export function ReleaseForm({ releaseId }: { releaseId?: string }) {
  const { session, profile } = useDust();
  const navigate = useNavigate();
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [artists, setArtists] = useState<ArtistOption[]>([]);
  const [attachable, setAttachable] = useState<Attachable[]>([]);
  const [locked, setLocked] = useState(false);
  const [releaseType, setReleaseType] = useState<"single" | "album">("single");
  const [albumType, setAlbumType] = useState<(typeof ALBUM_TYPES)[number]>("EP");
  const [title, setTitle] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState<string[]>([]);
  const [cover, setCover] = useState<File | null>(null);
  const [existingCover, setExistingCover] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackDraft[]>([newTrack()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);

  const parents = genres.filter((g) => !g.parent_id);
  const children = useMemo(
    () => genres.filter((g) => g.parent_id === primary),
    [genres, primary],
  );

  useEffect(() => {
    fetchGenres().then(setGenres).catch((err: Error) => setError(err.message));
    fetchArtistOptions().then(setArtists).catch(() => setArtists([]));
  }, []);

  useEffect(() => {
    if (!releaseId) return;
    fetchRelease(releaseId)
      .then((release) => {
        if (!release) {
          setError("Release not found.");
          return;
        }
        if (release.status === "approved") setLocked(true);
        setReleaseType(release.releaseType);
        if (release.albumType && ALBUM_TYPES.includes(release.albumType as (typeof ALBUM_TYPES)[number])) {
          setAlbumType(release.albumType as (typeof ALBUM_TYPES)[number]);
        }
        setTitle(release.title);
        setExplicit(release.explicit);
        setExistingCover(release.coverUrl);
        setTracks([]);
        setStep(1);
      })
      .catch((err: Error) => setError(err.message));
  }, [releaseId]);

  useEffect(() => {
    if (releaseType !== "album") return;
    getSupabase()
      .from("releases")
      .select("title, artists(name), release_tracks(track_id, tracks(id, title))")
      .eq("status", "approved")
      .eq("release_type", "single")
      .then(({ data }) => {
        const rows = (data ?? []) as unknown as {
          title: string;
          artists: { name: string } | { name: string }[] | null;
          release_tracks: { track_id: string; tracks: { id: string; title: string } | { id: string; title: string }[] | null }[];
        }[];
        const list: Attachable[] = [];
        for (const row of rows) {
          const artist = Array.isArray(row.artists) ? row.artists[0] : row.artists;
          for (const link of row.release_tracks ?? []) {
            const track = Array.isArray(link.tracks) ? link.tracks[0] : link.tracks;
            if (!track) continue;
            list.push({
              trackId: track.id,
              title: track.title || row.title,
              artist: artist?.name ?? "Dust",
            });
          }
        }
        setAttachable(list);
      });
  }, [releaseType]);

  function toggleSecondary(id: string) {
    setSecondary((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      if (cur.length >= 2) return cur;
      return [...cur, id];
    });
  }

  function patchTrack(key: string, patch: Partial<TrackDraft>) {
    setTracks((cur) => cur.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  }

  async function save(submit: boolean) {
    if (!session || !profile?.artist_id) {
      setError("Your login isn’t linked to an artist page yet.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!primary) {
      setError("Pick a primary genre.");
      return;
    }
    const meaningful = tracks.filter((t) => t.existingId || t.file || t.title.trim());
    const fresh = meaningful.filter((t) => !t.existingId);
    const attached = meaningful.filter((t) => t.existingId);
    if (submit && !cover && !existingCover) {
      setError("Project artwork is required.");
      return;
    }
    if (submit && !releaseId && fresh.length + attached.length === 0) {
      setError("Add at least one track.");
      return;
    }
    if (submit && fresh.some((t) => !t.file || !t.title.trim())) {
      setError("Every new track needs a title and an audio file.");
      return;
    }
    setBusy(true);
    setError("");
    const sb = getSupabase();
    try {
      const now = new Date().toISOString();
      let id = releaseId;
      if (!id) {
        const { data, error: insertError } = await sb
          .from("releases")
          .insert({
            artist_id: profile.artist_id,
            created_by: session.user.id,
            title: title.trim(),
            slug: `${slugify(title)}-${crypto.randomUUID().slice(0, 6)}`,
            release_type: releaseType,
            album_type: releaseType === "album" ? albumType : null,
            explicit,
            status: "draft",
          })
          .select("id")
          .single();
        if (insertError || !data) throw new Error(insertError?.message ?? "Could not create the release.");
        id = data.id as string;
      } else {
        const { error: updateError } = await sb
          .from("releases")
          .update({
            title: title.trim(),
            release_type: releaseType,
            album_type: releaseType === "album" ? albumType : null,
            explicit,
          })
          .eq("id", id);
        if (updateError) throw new Error(updateError.message);
      }

      let coverUrl = existingCover;
      if (cover) {
        const ext = cover.name.split(".").pop() || "jpg";
        coverUrl = await uploadTo("covers", `${session.user.id}/${id}.${ext}`, cover);
        const { error: coverError } = await sb.from("releases").update({ cover_url: coverUrl }).eq("id", id);
        if (coverError) throw new Error(coverError.message);
      }

      const genreIds = [primary, ...secondary].filter(Boolean).slice(0, 3);
      await sb.from("release_genres").delete().eq("release_id", id);
      const { error: genreError } = await sb.from("release_genres").insert(
        genreIds.map((genre_id, i) => ({
          release_id: id,
          genre_id,
          position: i + 1,
        })),
      );
      if (genreError) throw new Error(genreError.message);

      let number = 1;
      for (const track of tracks) {
        if (track.existingId) {
          const { error: linkError } = await sb.from("release_tracks").insert({
            release_id: id,
            track_id: track.existingId,
            track_number: number,
            version_label: track.version,
            is_primary: false,
          });
          if (linkError && !linkError.message.toLowerCase().includes("duplicate")) {
            throw new Error(linkError.message);
          }
          number += 1;
          continue;
        }
        if (!track.file) continue;
        const ext = track.file.name.split(".").pop() || "mp3";
        const trackId = crypto.randomUUID();
        const audioUrl = await uploadTo("audio", `${session.user.id}/${trackId}.${ext}`, track.file);
        const duration = await fileDuration(track.file);
        const { error: trackError } = await sb.from("tracks").insert({
          id: trackId,
          title: track.title.trim() || title.trim(),
          audio_url: audioUrl,
          duration_seconds: duration || null,
          explicit: track.explicit || explicit,
          original_release_date: now,
          created_by: session.user.id,
        });
        if (trackError) throw new Error(trackError.message);
        const { error: linkError } = await sb.from("release_tracks").insert({
          release_id: id,
          track_id: trackId,
          track_number: number,
          version_label: track.version,
          is_primary: true,
        });
        if (linkError) throw new Error(linkError.message);
        const credits = track.credits.flatMap((c) => {
          const person = c.name.trim();
          if (!person) return [];
          const roles = [
            c.songwriter ? "songwriter" : null,
            c.producer ? "producer" : null,
            c.featured ? "featured" : null,
          ].filter(Boolean) as string[];
          return roles.map((role) => ({
            track_id: trackId,
            artist_id: c.artistId || null,
            name: person,
            role,
          }));
        });
        if (credits.length) {
          const { error: creditError } = await sb.from("credits").insert(credits);
          if (creditError) throw new Error(creditError.message);
        }
        number += 1;
      }

      if (submit) {
        const { error: statusError } = await sb
          .from("releases")
          .update({
            status: "pending",
            submitted_at: now,
            release_date: now,
          })
          .eq("id", id);
        if (statusError) throw new Error(statusError.message);
      }
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!profile) {
    return <p className="text-muted">Loading your studio…</p>;
  }
  if (!profile.artist_id) {
    return <p className="text-muted">Your login isn’t linked to an artist page yet. The label sets that up.</p>;
  }
  if (locked) {
    return (
      <div className="rounded-card border border-line p-6">
        <h1 className="font-display text-3xl">This release is locked</h1>
        <p className="mt-2 text-muted">Approved projects can’t be edited. Talk to the label if something needs to change.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-kicker">{releaseId ? "Edit" : "New project"}</p>
        <h1 className="mt-2 font-display text-4xl">{title || "Untitled release"}</h1>
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl">What are you releasing?</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["single", "album"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReleaseType(type)}
                className={`rounded-card border p-5 text-left ${releaseType === type ? "border-gold bg-surface" : "border-line"}`}
              >
                <div className="font-display text-2xl capitalize">{type}</div>
                <p className="mt-2 text-sm text-muted">
                  {type === "single" ? "One song, its own release date." : "A body of work. You can also pull in older singles."}
                </p>
              </button>
            ))}
          </div>
          {releaseType === "album" && (
            <label className="block text-sm">
              Album type
              <select
                value={albumType}
                onChange={(e) => setAlbumType(e.target.value as (typeof ALBUM_TYPES)[number])}
                className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3"
              >
                {ALBUM_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          )}
          <button type="button" onClick={() => setStep(1)} className="h-12 rounded-full bg-gold px-6 font-semibold text-bg">
            Continue
          </button>
        </section>
      )}

      {step >= 1 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl">Project</h2>
          <label className="block text-sm">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} className="h-5 w-5 accent-gold" />
            Explicit content
          </label>
          <label className="block text-sm">
            Primary genre
            <select
              value={primary}
              onChange={(e) => {
                setPrimary(e.target.value);
                setSecondary([]);
              }}
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3"
            >
              <option value="">Choose one</option>
              {parents.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          {children.length > 0 && (
            <div>
              <p className="text-sm">Sub-genres <span className="text-muted">(up to two)</span></p>
              <div className="mt-2 flex flex-wrap gap-2">
                {children.map((g) => {
                  const on = secondary.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleSecondary(g.id)}
                      className={`rounded-full border px-3 py-2 text-sm ${on ? "border-gold text-gold" : "border-line text-muted"}`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div>
            <p className="text-sm">Artwork {releaseType === "album" ? "— one cover for the whole project" : ""}</p>
            <div className="mt-2">
              <FileWell
                kind="image"
                accept="image/*"
                label="Project artwork"
                hint="Square image works best. You’ll see a preview before you submit."
                file={cover}
                existingUrl={existingCover}
                onFile={setCover}
              />
            </div>
          </div>
        </section>
      )}

      {step >= 1 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Audio</h2>
            {releaseType === "album" && (
              <button type="button" onClick={() => setTracks((t) => [...t, newTrack()])} className="text-sm text-gold">
                Add track
              </button>
            )}
          </div>
          {tracks.map((track, index) => (
            <div key={track.key} className="space-y-3 rounded-card border border-line p-4">
              <div className="text-xs uppercase tracking-widest text-muted">Track {index + 1}</div>
              {track.existingId ? (
                <p className="text-sm">
                  Existing single: <span className="text-gold">{track.title}</span>. Original release data stays on the single. This adds an album version.
                </p>
              ) : (
                <>
                  <input
                    placeholder={releaseType === "single" ? title || "Song title" : "Song title"}
                    value={track.title}
                    onChange={(e) => patchTrack(track.key, { title: e.target.value })}
                    className="w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold"
                  />
                  <FileWell
                    kind="audio"
                    accept="audio/*"
                    label="Song audio"
                    hint="MP3 or WAV. A player appears so you can check the file."
                    file={track.file}
                    onFile={(file) => patchTrack(track.key, { file })}
                  />
                </>
              )}
              <label className="block text-sm">
                Version
                <select
                  value={track.version}
                  onChange={(e) => patchTrack(track.key, { version: e.target.value as TrackDraft["version"] })}
                  className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 capitalize"
                >
                  {VERSIONS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              {!track.existingId && (
                <div className="space-y-3">
                  <p className="text-sm text-muted">Credits — one person can be writer and producer.</p>
                  {track.credits.map((credit, ci) => (
                    <div key={ci} className="grid gap-2 sm:grid-cols-2">
                      <input
                        placeholder="Name"
                        value={credit.name}
                        onChange={(e) => {
                          const credits = track.credits.slice();
                          credits[ci] = { ...credit, name: e.target.value };
                          patchTrack(track.key, { credits });
                        }}
                        className="rounded-lg border border-line bg-elevated px-3 py-3"
                      />
                      <select
                        value={credit.artistId}
                        onChange={(e) => {
                          const picked = artists.find((a) => a.id === e.target.value);
                          const credits = track.credits.slice();
                          credits[ci] = {
                            ...credit,
                            artistId: e.target.value,
                            name: picked?.name ?? credit.name,
                          };
                          patchTrack(track.key, { credits });
                        }}
                        className="rounded-lg border border-line bg-elevated px-3 py-3"
                      >
                        <option value="">Link a label artist (optional)</option>
                        {artists.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <div className="flex flex-wrap gap-3 text-sm sm:col-span-2">
                        {(
                          [
                            ["songwriter", "Songwriter"],
                            ["producer", "Producer"],
                            ["featured", "Featured"],
                          ] as const
                        ).map(([key, label]) => (
                          <label key={key} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={credit[key]}
                              onChange={(e) => {
                                const credits = track.credits.slice();
                                credits[ci] = { ...credit, [key]: e.target.checked };
                                patchTrack(track.key, { credits });
                              }}
                              className="h-4 w-4"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-sm text-gold"
                    onClick={() => patchTrack(track.key, { credits: [...track.credits, emptyCredit()] })}
                  >
                    Add credit
                  </button>
                </div>
              )}
              {tracks.length > 1 && (
                <button type="button" className="text-sm text-muted" onClick={() => setTracks((cur) => cur.filter((t) => t.key !== track.key))}>
                  Remove
                </button>
              )}
            </div>
          ))}

          {releaseType === "album" && attachable.length > 0 && (
            <div>
              <p className="text-sm text-muted">Add a previously released single. It keeps its original release and also lives on this album.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {attachable.map((item) => (
                  <button
                    key={item.trackId}
                    type="button"
                    className="rounded-full border border-line px-3 py-2 text-sm"
                    onClick={() =>
                      setTracks((cur) => {
                        if (cur.some((t) => t.existingId === item.trackId)) return cur;
                        return [
                          ...cur,
                          {
                            ...newTrack(),
                            title: item.title,
                            existingId: item.trackId,
                            credits: [],
                          },
                        ];
                      })
                    }
                  >
                    {item.title} · {item.artist}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {error && <p className="text-sm text-gold">{error}</p>}

      {step >= 1 && (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => void save(false)} className="h-12 rounded-full border border-line px-5 text-sm">
            Save draft
          </button>
          <button type="button" disabled={busy} onClick={() => void save(true)} className="h-12 rounded-full bg-gold px-5 text-sm font-semibold text-bg disabled:opacity-60">
            {busy ? "Working…" : "Submit to the label"}
          </button>
        </div>
      )}
    </div>
  );
}
