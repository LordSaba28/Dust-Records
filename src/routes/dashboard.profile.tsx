import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AvatarCrop } from "@/components/avatar-crop";
import { GenrePicker, genreLabel, matchGenre } from "@/components/genre-picker";
import { LABEL_SETUP_SQL, fetchGenres, type GenreRow } from "@/lib/catalog";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/profile")({ component: ProfilePage });

function ProfilePage() {
  const { session, profile, loading, refresh } = useDust();
  const navigate = useNavigate();
  const artist = profile?.artists;
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [cropped, setCropped] = useState<Blob | null>(null);
  const [needsSql, setNeedsSql] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !session) void navigate({ to: "/access" });
  }, [loading, session, navigate]);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => setGenres([]));
  }, []);

  useEffect(() => {
    if (!artist) return;
    setName(artist.name);
    setBio(artist.bio ?? "");
    const matched = matchGenre(genres, artist.genre_primary);
    setPrimary(matched.primary);
    setSecondary(matched.secondary);
  }, [artist, genres]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !profile?.artist_id) return;
    setBusy(true);
    setError("");
    setSaved(false);
    setNeedsSql(false);
    try {
      let imageUrl = artist?.image_url ?? null;
      if (cropped) {
        const path = `${session.user.id}/avatar.jpg`;
        const sb = getSupabase();
        const { error: uploadError } = await sb.storage.from("artist-images").upload(path, cropped, {
          upsert: true,
          contentType: "image/jpeg",
        });
        if (uploadError) throw new Error(uploadError.message);
        imageUrl = `${sb.storage.from("artist-images").getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
      }
      const { error: updateError } = await getSupabase()
        .from("artists")
        .update({
          name: name.trim(),
          bio: bio.trim(),
          genre_primary: genreLabel(genres, primary, secondary) || null,
          image_url: imageUrl,
        })
        .eq("id", profile.artist_id);
      if (updateError) throw new Error(updateError.message);
      await getSupabase().from("profiles").update({ full_name: name.trim() }).eq("id", session.user.id);
      await refresh();
      setFile(null);
      setCropped(null);
      setSaved(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the profile.";
      if (/row-level security/i.test(message)) setNeedsSql(true);
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !session) return <p className="px-4 py-16 text-muted">Opening the studio…</p>;
  if (!profile?.artist_id || !artist) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="font-display text-4xl">No artist page yet</h1>
        <p className="mt-3 text-muted">The label attaches a page to this login. Until then there is nothing to edit.</p>
        <Link to="/dashboard" className="mt-6 inline-block text-gold">
          Back to studio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="label-kicker">Artist page</p>
      <h1 className="mt-2 font-display text-5xl">Profile</h1>
      <p className="mt-3 text-muted">This is what visitors see on the roster. The address of the page stays the same if you change the name.</p>
      <form onSubmit={save} className="mt-8 space-y-4">
        <label className="block text-sm">
          Name
          <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
        </label>
        <GenrePicker primary={primary} secondary={secondary} onPrimary={setPrimary} onSecondary={setSecondary} />
        <label className="block text-sm">
          Bio
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
        </label>
        <div>
          <p className="text-sm">Picture</p>
          <p className="mt-1 text-sm text-muted">Choose a photo, then drag and zoom until the square is the part you want.</p>
          {artist.image_url && !file && (
            <img src={artist.image_url} alt="" className="mt-3 h-28 w-28 rounded-card object-cover" />
          )}
          <label className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-card border border-dashed border-line bg-elevated px-4 py-5 text-center">
            <span className="font-semibold">{file ? file.name : "Choose a photo"}</span>
            <span className="mt-3 inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-bg">
              {file ? "Choose another" : "Choose file"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setCropped(null);
              }}
            />
          </label>
          {file && (
            <div className="mt-4">
              <AvatarCrop file={file} onCrop={setCropped} />
            </div>
          )}
        </div>
        {error && <p className="text-sm text-gold">{error}</p>}
        {needsSql && (
          <div className="rounded-card border border-line p-4">
            <p className="text-sm text-muted">The photo is blocked by a database permission. Run this once in the Supabase SQL editor, then save again.</p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-fg">{LABEL_SETUP_SQL}</pre>
          </div>
        )}
        {saved && <p className="text-sm text-gold-soft">Saved. The public page is updated.</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-full bg-gold px-6 font-semibold text-bg disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
