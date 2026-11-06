import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export type ArtistRow = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image_url: string | null;
  genre_primary: string | null;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "artist" | "admin";
  artist_id: string | null;
  artists: ArtistRow | null;
};

type DustContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const DustContext = createContext<DustContextValue>({
  session: null,
  profile: null,
  loading: true,
  refresh: async () => {},
});

function normalizeArtist(value: unknown): ArtistRow | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  const a = row as ArtistRow;
  return a.id ? a : null;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, email, full_name, role, artist_id, artists(*)")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    role: data.role === "admin" ? "admin" : "artist",
    artist_id: data.artist_id,
    artists: normalizeArtist(data.artists),
  };
}

export function DustProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await getSupabase().auth.getSession();
    setSession(data.session);
    if (data.session) setProfile(await loadProfile(data.session.user.id));
    else setProfile(null);
  };

  useEffect(() => {
    let alive = true;
    getSupabase()
      .auth.getSession()
      .then(async ({ data }) => {
        if (!alive) return;
        setSession(data.session);
        if (data.session) setProfile(await loadProfile(data.session.user.id));
        if (alive) setLoading(false);
      });
    const { data: sub } = getSupabase().auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setProfile(null);
        return;
      }
      void loadProfile(next.user.id).then((p) => {
        if (alive) setProfile(p);
      });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, refresh }),
    [session, profile, loading],
  );

  return <DustContext.Provider value={value}>{children}</DustContext.Provider>;
}

export function useDust() {
  return useContext(DustContext);
}
