import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicArtists, type PublicArtist } from "@/lib/catalog";
import { getSupabase } from "@/lib/supabase";

type ContactSearch = { artist: string };

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): ContactSearch => ({
    artist: typeof search.artist === "string" ? search.artist : "",
  }),
  component: ContactPage,
});

function ContactPage() {
  const { artist } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(artist ? "booking" : "general");
  const [who, setWho] = useState(artist);
  const [message, setMessage] = useState(artist ? `I'd like to book ${artist}. ` : "");
  const [artists, setArtists] = useState<PublicArtist[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublicArtists().then(setArtists).catch(() => setArtists([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const artistRow = artists.find((a) => a.name === who);
    const { error: insertError } = await getSupabase().from("inquiries").insert({
      name,
      email,
      inquiry_type: type,
      artist_id: artistRow?.id ?? null,
      message: who ? `Artist: ${who}\n\n${message}` : message,
    });
    if (insertError) {
      setStatus("error");
      setError(insertError.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 lg:grid-cols-2">
      <div>
        <p className="label-kicker">Get in touch</p>
        <h1 className="mt-3 font-display text-5xl leading-tight">
          Let’s talk music,
          <br />
          culture & bookings.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Booking an artist, a festival, or a brand partnership — send the details. We reply within two business days.
        </p>
        <dl className="mt-8 space-y-4 text-sm">
          <div>
            <dt className="text-muted">Mail</dt>
            <dd>bookings@dustrecords.com</dd>
          </div>
          <div>
            <dt className="text-muted">Room</dt>
            <dd>The Mansion by Charissa, before Mosheshe Estate, Airport Road, Effurun, Delta</dd>
          </div>
        </dl>
        <ol className="mt-8 space-y-2 text-sm text-muted">
          <li>01 — We review the request</li>
          <li>02 — We confirm availability and terms</li>
          <li>03 — Contracts, then the show</li>
        </ol>
      </div>
      <form onSubmit={submit} className="rounded-card border border-line bg-surface p-5">
        {status === "sent" ? (
          <div>
            <h2 className="font-display text-3xl">Received.</h2>
            <p className="mt-2 text-muted">We’ll write back within two business days.</p>
          </div>
        ) : (
          <>
            <label className="block text-sm">
              Name
              <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
            </label>
            <label className="mt-4 block text-sm">
              Email
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
            </label>
            <label className="mt-4 block text-sm">
              This is
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none">
                <option value="booking">A booking</option>
                <option value="general">A general inquiry</option>
                <option value="partnership">A partnership</option>
                <option value="press">Press</option>
              </select>
            </label>
            <label className="mt-4 block text-sm">
              Artist
              <select value={who} onChange={(e) => setWho(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none">
                <option value="">No specific artist</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 block text-sm">
              Details
              <textarea required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold" />
            </label>
            {error && <p className="mt-3 text-sm text-gold">{error}</p>}
            <button type="submit" disabled={status === "sending"} className="mt-5 h-12 w-full rounded-full bg-gold font-semibold text-bg disabled:opacity-60">
              {status === "sending" ? "Sending…" : "Send"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
