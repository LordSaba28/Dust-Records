import { useEffect, useMemo, useState } from "react";
import { fetchGenres, type GenreRow } from "@/lib/catalog";

export function genreLabel(rows: GenreRow[], primaryId: string, secondaryIds: string[]) {
  const name = (id: string) => rows.find((g) => g.id === id)?.name;
  return [name(primaryId), ...secondaryIds.map(name)].filter(Boolean).join(" · ");
}

export function matchGenre(rows: GenreRow[], label: string | null | undefined) {
  const parts = (label ?? "").split("·").map((part) => part.trim().toLowerCase()).filter(Boolean);
  const primary = rows.find((g) => !g.parent_id && g.name.toLowerCase() === parts[0]);
  if (!primary) return { primary: "", secondary: [] as string[] };
  const secondary = parts
    .slice(1)
    .map((part) => rows.find((g) => g.parent_id === primary.id && g.name.toLowerCase() === part)?.id)
    .filter((id): id is string => Boolean(id));
  return { primary: primary.id, secondary };
}

export function GenrePicker({
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  primary: string;
  secondary: string[];
  onPrimary: (id: string) => void;
  onSecondary: (ids: string[]) => void;
}) {
  const [genres, setGenres] = useState<GenreRow[]>([]);
  const parents = genres.filter((g) => !g.parent_id);
  const children = useMemo(() => genres.filter((g) => g.parent_id === primary), [genres, primary]);

  useEffect(() => {
    fetchGenres().then(setGenres).catch(() => setGenres([]));
  }, []);

  function toggle(id: string) {
    if (secondary.includes(id)) onSecondary(secondary.filter((item) => item !== id));
    else if (secondary.length < 2) onSecondary([...secondary, id]);
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Genre
        <select
          value={primary}
          onChange={(e) => {
            onPrimary(e.target.value);
            onSecondary([]);
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
          <p className="text-sm">
            Sub-genres <span className="text-muted">(up to two)</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {children.map((g) => {
              const on = secondary.includes(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggle(g.id)}
                  className={`rounded-full border px-3 py-2 text-sm ${on ? "border-gold text-gold" : "border-line text-muted"}`}
                >
                  {g.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
