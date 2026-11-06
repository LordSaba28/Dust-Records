import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DeskGate } from "@/components/desk-gate";
import { FileWell } from "@/components/file-well";
import { GenrePicker, genreLabel } from "@/components/genre-picker";
import { PasswordField } from "@/components/password-field";
import { LABEL_SETUP_SQL, fetchAllArtists, fetchGenres, slugify, type PublicArtist } from "@/lib/catalog";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/artists")({ component: ArtistsDesk });

function ArtistsDesk() {
  const { session, profile } = useDust();
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [primary, setPrimary] = useState("");
  const [secondary, setSecondary] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "wait" | "ok" | "bad"; text: string } | null>(null);
  const [needsSql, setNeedsSql] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  async function load() {
    try {
      setArtists(await fetchAllArtists());
    } catch (err) {
      setNotice({ kind: "bad", text: err instanceof Error ? err.message : "Could not load the roster." });
    }
  }

  useEffect(() => {
    if (profile?.role === "admin") void load();
  }, [profile]);

  async function createArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setNotice({ kind: "bad", text: "You are not signed in as the label. Open Label desk and enter with the label email." });
      return;
    }
    if (password.length < 8) {
      setNotice({ kind: "bad", text: "The temporary password needs at least 8 characters." });
      return;
    }
    setBusy(true);
    setNeedsSql(false);
    setNotice({ kind: "wait", text: "Creating the login. Stay on this page until it says created or failed." });
    try {
      const genres = await fetchGenres();
      const genre = genreLabel(genres, primary, secondary);
      const slug = `${slugify(name)}-${crypto.randomUUID().slice(0, 4)}`;
      const { data: artistId, error: rpcError } = await getSupabase().rpc("admin_create_artist", {
        p_email: email.trim(),
        p_password: password,
        p_name: name.trim(),
        p_slug: slug,
        p_bio: bio.trim(),
        p_genre: genre,
      });
      if (rpcError || !artistId) {
        const message = rpcError?.message ?? "Could not create the artist.";
        if (/admin_create_artist|function|schema cache/i.test(message)) setNeedsSql(true);
        throw new Error(message.replace(/^.*ERROR:\s*/i, ""));
      }
      let photoNote = "";
      if (photo) {
        const ext = photo.name.split(".").pop() || "jpg";
        const path = `${session.user.id}/${artistId}.${ext}`;
        const { error: uploadError } = await getSupabase().storage.from("artist-images").upload(path, photo, {
          upsert: true,
          contentType: photo.type || undefined,
        });
        if (uploadError) {
          if (/row-level security/i.test(uploadError.message)) setNeedsSql(true);
          photoNote = ` The login was created, but the photo was not saved: ${uploadError.message}`;
        } else {
          const imageUrl = getSupabase().storage.from("artist-images").getPublicUrl(path).data.publicUrl;
          const { error: updateError } = await getSupabase().from("artists").update({ image_url: imageUrl }).eq("id", artistId as string);
          if (updateError) photoNote = ` The login was created, but the photo was not saved: ${updateError.message}`;
        }
      }
      setNotice({
        kind: photoNote ? "bad" : "ok",
        text: photoNote
          ? `${email.trim()} is in Authentication → Users.${photoNote}`
          : `Created ${name.trim()} (${email.trim()}). They can sign in at Studio with that email and the password you just set. Check Authentication → Users — the account is already there.`,
      });
      setName("");
      setEmail("");
      setPassword("");
      setBio("");
      setPrimary("");
      setSecondary([]);
      setPhoto(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create the artist.";
      if (/rate limit/i.test(message)) {
        setNotice({
          kind: "bad",
          text: "Supabase blocked the email signup (rate limit), so no user was saved. Run the SQL below once. After that, the desk creates the login itself and does not send an email.",
        });
        setNeedsSql(true);
      } else {
        setNotice({ kind: "bad", text: message });
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeArtist(id: string) {
    setNotice(null);
    const { error: deleteError } = await getSupabase().from("artists").delete().eq("id", id);
    if (deleteError) {
      setNotice({ kind: "bad", text: deleteError.message });
      return;
    }
    setConfirm(null);
    await load();
  }

  return (
    <DeskGate>
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="label-kicker">Label desk</p>
        <h1 className="mt-2 font-display text-5xl">Artists</h1>
        <p className="mt-3 max-w-xl text-muted">Create a login and a public page. The result stays at the top of this page, whether it worked or not.</p>
        {notice && (
          <div
            role="status"
            className={`mt-6 max-w-xl rounded-card border p-4 ${notice.kind === "ok" ? "border-gold" : notice.kind === "bad" ? "border-gold bg-elevated" : "border-line"}`}
          >
            <p className="text-xs tracking-widest text-gold uppercase">
              {notice.kind === "ok" ? "Created" : notice.kind === "bad" ? "Not created" : "Working"}
            </p>
            <p className="mt-2 text-sm leading-relaxed">{notice.text}</p>
          </div>
        )}
        {needsSql && (
          <div className="mt-4 max-w-3xl rounded-card border border-line p-4">
            <p className="text-sm text-muted">
              Run this once in the Supabase SQL editor, then press Create artist again. It creates the login directly, so Supabase will not send an email or hit the rate limit.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-bg p-3 text-xs text-fg">{LABEL_SETUP_SQL}</pre>
          </div>
        )}
        <form onSubmit={createArtist} className="mt-8 grid max-w-xl gap-3">
          <input required placeholder="Stage name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-line bg-elevated px-3 py-3" />
          <input required type="email" placeholder="Email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-line bg-elevated px-3 py-3" />
          <PasswordField value={password} onChange={setPassword} autoComplete="new-password" showRules />
          <GenrePicker primary={primary} secondary={secondary} onPrimary={setPrimary} onSecondary={setSecondary} />
          <textarea placeholder="Short bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="rounded-lg border border-line bg-elevated px-3 py-3" />
          <FileWell kind="image" accept="image/*" label="Artist photo" hint="Optional. They can crop a new one from their profile." file={photo} onFile={setPhoto} />
          <button type="submit" disabled={busy} className="h-12 rounded-full bg-gold px-5 font-semibold text-bg disabled:opacity-60">
            {busy ? "Creating…" : "Create artist"}
          </button>
        </form>

        <section className="mt-12">
          <h2 className="font-display text-3xl">Roster</h2>
          {artists.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No artists yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {artists.map((artist) => (
                <li key={artist.id} className="flex flex-wrap items-center gap-3 py-4">
                  {artist.image ? (
                    <img src={artist.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-elevated font-display text-gold">{artist.name.slice(0, 1)}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{artist.name}</div>
                    <div className="text-sm text-muted">
                      {artist.genre || "No genre yet"}
                      {artist.active ? "" : " · hidden"}
                    </div>
                  </div>
                  {confirm === artist.id ? (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void removeArtist(artist.id)} className="h-11 rounded-full bg-gold px-4 text-sm font-semibold text-bg">
                        Confirm remove
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className="h-11 rounded-full border border-line px-4 text-sm">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirm(artist.id)} className="h-11 rounded-full border border-line px-4 text-sm">
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DeskGate>
  );
}
