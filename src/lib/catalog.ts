import { getSupabase } from "@/lib/supabase";

export type Credit = { name: string; role: string };

export type CatalogTrack = {
  id: string;
  title: string;
  audioUrl: string | null;
  duration: number | null;
  explicit: boolean;
  version: string;
  number: number;
  credits: Credit[];
};

export type CatalogRelease = {
  id: string;
  title: string;
  status: string;
  releaseType: "single" | "album";
  albumType: string | null;
  explicit: boolean;
  releaseDate: string | null;
  coverUrl: string | null;
  artistId: string | null;
  artistName: string;
  artistSlug: string | null;
  genres: { name: string; position: number }[];
  tracks: CatalogTrack[];
};

export type PublicArtist = {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image: string | null;
  genre: string | null;
  active: boolean;
};

type RawGenre = { position: number; genres: { name: string } | { name: string }[] | null };
type RawTrack = {
  id: string;
  title: string;
  audio_url: string | null;
  duration_seconds: number | null;
  explicit: boolean | null;
  credits: { name: string; role: string }[] | null;
};
type RawLink = {
  track_number: number | null;
  version_label: string | null;
  tracks: RawTrack | RawTrack[] | null;
};
type RawRelease = {
  id: string;
  title: string;
  status: string;
  release_type: string;
  album_type: string | null;
  explicit: boolean | null;
  release_date: string | null;
  cover_url: string | null;
  artist_id: string | null;
  artists: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  release_genres: RawGenre[] | null;
  release_tracks: RawLink[] | null;
};

const RELEASE_SELECT = `
  id, title, status, release_type, album_type, explicit, release_date, cover_url, artist_id,
  artists ( id, name, slug ),
  release_genres ( position, genres ( name ) ),
  release_tracks (
    track_number, version_label,
    tracks ( id, title, audio_url, duration_seconds, explicit, credits ( name, role ) )
  )
`;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapRelease(raw: RawRelease): CatalogRelease {
  const artist = one(raw.artists);
  const genres = (raw.release_genres ?? [])
    .map((g) => ({ name: one(g.genres)?.name ?? "", position: g.position }))
    .filter((g) => g.name)
    .sort((a, b) => a.position - b.position);
  const tracks = (raw.release_tracks ?? [])
    .map((link) => {
      const track = one(link.tracks);
      if (!track) return null;
      return {
        id: track.id,
        title: track.title,
        audioUrl: track.audio_url,
        duration: track.duration_seconds,
        explicit: Boolean(track.explicit),
        version: link.version_label || "standard",
        number: link.track_number || 0,
        credits: track.credits ?? [],
      } satisfies CatalogTrack;
    })
    .filter((t): t is CatalogTrack => Boolean(t))
    .sort((a, b) => a.number - b.number);
  return {
    id: raw.id,
    title: raw.title,
    status: raw.status,
    releaseType: raw.release_type === "album" ? "album" : "single",
    albumType: raw.album_type,
    explicit: Boolean(raw.explicit),
    releaseDate: raw.release_date,
    coverUrl: raw.cover_url,
    artistId: artist?.id ?? raw.artist_id,
    artistName: artist?.name ?? "Dust Records",
    artistSlug: artist?.slug ?? null,
    genres,
    tracks,
  };
}

async function fetchReleases(filter?: { status?: string; createdBy?: string; id?: string }) {
  let query = getSupabase().from("releases").select(RELEASE_SELECT);
  if (filter?.status) query = query.eq("status", filter.status);
  if (filter?.createdBy) query = query.eq("created_by", filter.createdBy);
  if (filter?.id) query = query.eq("id", filter.id);
  const { data, error } = await query.order("release_date", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawRelease[]).map(mapRelease);
}

export function fetchApprovedReleases() {
  return fetchReleases({ status: "approved" });
}

export function fetchPending() {
  return fetchReleases({ status: "pending" });
}

export function fetchAllReleases() {
  return fetchReleases();
}

export function fetchMyReleases(userId: string) {
  return fetchReleases({ createdBy: userId });
}

export async function fetchRelease(id: string) {
  const rows = await fetchReleases({ id });
  return rows[0] ?? null;
}

function mapArtist(row: {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image_url: string | null;
  genre_primary: string | null;
  is_active: boolean | null;
}): PublicArtist {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio,
    image: row.image_url,
    genre: row.genre_primary,
    active: row.is_active !== false,
  };
}

export async function fetchPublicArtists() {
  const { data, error } = await getSupabase()
    .from("artists")
    .select("id, name, slug, bio, image_url, genre_primary, is_active")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapArtist);
}

export async function fetchAllArtists() {
  const { data, error } = await getSupabase()
    .from("artists")
    .select("id, name, slug, bio, image_url, genre_primary, is_active")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapArtist);
}

export async function fetchArtistBySlug(slug: string) {
  const { data, error } = await getSupabase()
    .from("artists")
    .select("id, name, slug, bio, image_url, genre_primary, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtist(data) : null;
}

export type GenreRow = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
};

export async function fetchGenres() {
  const { data, error } = await getSupabase()
    .from("genres")
    .select("id, name, slug, parent_id, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as GenreRow[];
}

export type ArtistOption = { id: string; name: string; slug: string };

export async function fetchArtistOptions() {
  const { data, error } = await getSupabase()
    .from("artists")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as ArtistOption[];
}

export function slugify(value: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return base || "release";
}

export function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const LABEL_SETUP_SQL = `create or replace function public.admin_create_artist(
  p_email text,
  p_password text,
  p_name text,
  p_slug text,
  p_bio text,
  p_genre text
) returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  uid uuid := gen_random_uuid();
  aid uuid;
  clean_email text := lower(trim(p_email));
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Not the label account';
  end if;

  if length(coalesce(p_password, '')) < 8 then
    raise exception 'The temporary password needs at least 8 characters';
  end if;

  if exists (select 1 from auth.users where lower(email) = clean_email) then
    raise exception 'That email already has a login. Delete it under Authentication, then Users, and create the artist again.';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    uid,
    'authenticated',
    'authenticated',
    clean_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', 'artist'),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    uid,
    jsonb_build_object('sub', uid::text, 'email', clean_email, 'email_verified', true),
    'email',
    uid::text,
    now(),
    now(),
    now()
  );

  insert into public.profiles (id, email, full_name, role)
  values (uid, clean_email, p_name, 'artist')
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        role = 'artist';

  insert into public.artists (name, slug, bio, genre_primary)
  values (p_name, p_slug, nullif(trim(p_bio), ''), nullif(trim(p_genre), ''))
  returning id into aid;

  update public.profiles set artist_id = aid where id = uid;
  return aid;
end $$;

revoke all on function public.admin_create_artist(text, text, text, text, text, text) from public;
grant execute on function public.admin_create_artist(text, text, text, text, text, text) to authenticated;

drop policy if exists "Artists update own page" on public.artists;
create policy "Artists update own page"
  on public.artists for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = artists.id))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.artist_id = artists.id));

drop policy if exists "Label updates artists" on public.artists;
create policy "Label updates artists"
  on public.artists for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Label deletes artists" on public.artists;
create policy "Label deletes artists"
  on public.artists for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into storage.buckets (id, name, public) values
  ('covers','covers', true),
  ('audio','audio', true),
  ('artist-images','artist-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
  on storage.objects for select
  using (bucket_id in ('covers', 'audio', 'artist-images'));

drop policy if exists "Signed-in upload own media" on storage.objects;
create policy "Signed-in upload own media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('covers', 'audio', 'artist-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Signed-in update own media" on storage.objects;
create policy "Signed-in update own media"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('covers', 'audio', 'artist-images')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Label manages media" on storage.objects;
create policy "Label manages media"
  on storage.objects for all to authenticated
  using (
    bucket_id in ('covers', 'audio', 'artist-images')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id in ('covers', 'audio', 'artist-images')
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );`;