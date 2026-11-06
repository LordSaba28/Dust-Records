import { createServerFn } from "@tanstack/react-start";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase";

type Turn = { role: "user" | "assistant"; content: string };

export const askDust = createServerFn({ method: "POST" })
  .validator((input: { messages?: Turn[] }) => {
    const messages = (input.messages ?? [])
      .slice(-8)
      .map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m.content ?? "").trim().slice(0, 800),
      }))
      .filter((m) => m.content);
    return { messages };
  })
  .handler(async ({ data }) => {
    if (!data.messages.length || data.messages.at(-1)?.role !== "user") {
      return { ok: false as const, error: "Say something first." };
    }
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "The desk is offline right now." };

    const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
    const [artistsRes, releasesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/artists?select=name,bio,genre_primary&is_active=eq.true&order=name.asc`, { headers }),
      fetch(
        `${SUPABASE_URL}/rest/v1/releases?select=title,release_type,album_type,artists(name)&status=eq.approved&order=release_date.desc&limit=24`,
        { headers },
      ),
    ]);
    const artists = artistsRes.ok ? ((await artistsRes.json()) as { name: string; bio: string | null; genre_primary: string | null }[]) : [];
    const releases = releasesRes.ok
      ? ((await releasesRes.json()) as {
          title: string;
          release_type: string;
          album_type: string | null;
          artists: { name: string } | { name: string }[] | null;
        }[])
      : [];

    const roster = artists
      .map((a) => `${a.name}${a.genre_primary ? ` (${a.genre_primary})` : ""}${a.bio ? ` — ${a.bio}` : ""}`)
      .join("\n");
    const catalog = releases
      .map((r) => {
        const artist = Array.isArray(r.artists) ? r.artists[0]?.name : r.artists?.name;
        return `${r.title} — ${artist ?? "Dust Records"} — ${r.release_type}${r.album_type ? ` ${r.album_type}` : ""}`;
      })
      .join("\n");

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 320,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `You are Dust, the public assistant on the Dust Records website. Speak in short, warm, plain sentences. No markdown headings, no bullet walls.

Facts you may use:
- Independent label, founded in 2000, based at The Mansion by Charissa, before Mosheshe Estate, Airport Road, Effurun, Delta, Nigeria.
- Mail: bookings@dustrecords.com. Replies within two business days.
- Booking covers shows, festivals, brand partnerships, and press. The booking form is on the Booking page.
- Help visitors figure out what to put on that form: artist, date, city, room or festival, and a contact email. If something is missing, ask for it.
- Do not invent artists, songs, prices, or dates that are not in the roster or catalog below.
- Do not mention accounts, the studio, approvals, drafts, or anything behind the site.

Roster:
${roster || "No artists announced yet."}

Catalog:
${catalog || "No records in the catalog yet."}`,
          },
          ...data.messages,
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: "Couldn’t reach the desk. Try again in a moment." };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false as const, error: "No answer came back." };
    return { ok: true as const, text };
  });
