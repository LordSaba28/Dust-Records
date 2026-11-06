import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: AboutPage });

const FACTS = [
  { value: "15+", label: "Signed artists" },
  { value: "26+", label: "Years active" },
  { value: "100+", label: "Projects released" },
];

const AWARDS = [
  { title: "Best Independent Label", year: "AFRIMA · 2023" },
  { title: "Breakthrough Label of the Year", year: "The Headies · 2022" },
  { title: "International Impact", year: "Independent Music Awards · 2022" },
  { title: "Cultural Excellence", year: "Urban Music Awards · 2024" },
];

function AboutPage() {
  return (
    <div>
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="label-kicker">The label</p>
          <h1 className="mt-3 font-display text-5xl leading-tight sm:text-6xl">
            <span className="text-gold">Dust Records</span>
            <br />
            The music lives on
          </h1>
          <p className="mt-6 max-w-xl text-muted">
            Founded in 2000, Dust Records has spent over two decades championing independent voices across Afrobeats, hip-hop, R&B, alternative and beyond. We exist to protect the integrity of the sound and the identity of the artist.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl grid-cols-3 gap-4 px-4 py-12">
        {FACTS.map((f) => (
          <div key={f.label} className="border-t border-gold pt-4">
            <div className="font-display text-4xl">{f.value}</div>
            <div className="mt-1 text-sm text-muted">{f.label}</div>
          </div>
        ))}
      </section>
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="label-kicker">Recognition</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {AWARDS.map((a) => (
              <div key={a.title} className="rounded-card border border-line bg-bg p-5">
                <div className="font-display text-2xl">{a.title}</div>
                <div className="mt-2 text-sm text-gold">{a.year}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-4xl">How a record leaves the building</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["01", "The artist builds the project in Studio — single or album, artwork, genres, credits, audio."],
            ["02", "Submit. It sits as pending. They can still edit. The public site does not see it."],
            ["03", "An admin approves. Only then does it enter search and the player. Approved work is locked."],
          ].map(([n, text]) => (
            <li key={n} className="rounded-card border border-line p-5">
              <div className="font-display text-gold">{n}</div>
              <p className="mt-3 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <Link to="/contact" search={{ artist: "" }} className="mt-8 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-bg">
          Book the roster
        </Link>
      </section>
    </div>
  );
}
