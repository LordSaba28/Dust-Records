export type RosterArtist = {
  slug: string;
  name: string;
  genre: string;
  image: string;
  bio: string;
  role: string;
};

export const ROSTER: RosterArtist[] = [
  {
    slug: "saba",
    name: "$ABA",
    genre: "Hip-Hop / Afro Fusion",
    role: "Artist / Producer",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80&auto=format&fit=crop",
    bio: "$ABA is a genre-blurring artist and producer at the intersection of hip-hop, Afro-fusion and alternative R&B. Signed in 2019, he is one of the label’s flagship voices — cinematic production, introspective writing, and a refusal to be boxed in.",
  },
  {
    slug: "esounds",
    name: "ESOUNDS",
    genre: "Alternative / R&B",
    role: "Artist",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80&auto=format&fit=crop",
    bio: "ESOUNDS builds quiet, late-night records — alternative R&B with room in the arrangement and a voice that sits close to the mic. The songs are small on purpose, and they stay with you.",
  },
  {
    slug: "kairo",
    name: "KAIRO",
    genre: "Afrobeats / Pop",
    role: "Artist",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
    bio: "KAIRO writes bright Afrobeats and pop with a drummer’s sense of pocket. Hooks first, then the story. Built for rooms that are already moving.",
  },
  {
    slug: "kami",
    name: "KAMI",
    genre: "Alternative / Indie",
    role: "Artist",
    image:
      "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=800&q=80&auto=format&fit=crop",
    bio: "KAMI works the edge of indie and alternative — guitars, spoken detail, and choruses that arrive later than you expect. A writer first.",
  },
  {
    slug: "khalia",
    name: "KHALIA",
    genre: "R&B / Soul",
    role: "Artist",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&auto=format&fit=crop",
    bio: "KHALIA sings R&B and soul with a classic sense of phrasing and a modern low end. The records are about devotion, distance, and what people don’t say out loud.",
  },
];

export function rosterBySlug(slug: string) {
  return ROSTER.find((a) => a.slug === slug) ?? null;
}
