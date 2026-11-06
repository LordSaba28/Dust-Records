import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, X } from "lucide-react";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";
import { PlayerBar } from "@/components/player-bar";
import { ChatWidget } from "@/components/chat-widget";
import { usePlayer } from "@/lib/player";

const LINKS = [
  { to: "/music", label: "Music" },
  { to: "/artists", label: "Artists" },
  { to: "/about", label: "Label" },
  { to: "/contact", label: "Booking" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const { session, profile } = useDust();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const portal = path.startsWith("/dashboard");
  const desk = path.startsWith("/admin");
  const playerOn = usePlayer((s) => s.queue.length > 0);

  function search(e: React.FormEvent) {
    e.preventDefault();
    setOpen(false);
    void navigate({ to: "/music", search: { q: q.trim() } });
  }

  return (
    <div className={`min-h-screen bg-bg text-fg ${playerOn ? "pb-24" : ""}`}>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={desk ? "/admin" : portal ? "/dashboard" : "/"} className="shrink-0">
            <img src="/brand/mark.png" alt="Dust Records" className="h-10 w-10 object-contain" />
          </Link>
          {!portal && !desk && (
            <form onSubmit={search} className="hidden min-w-0 flex-1 items-center gap-2 rounded-full border border-line bg-elevated px-3 md:flex">
              <Search size={16} className="text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Search songs or artists"
                placeholder="Search songs or artists"
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
              />
            </form>
          )}
          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {desk ? (
              <>
                <Link to="/admin" className={`rounded-full px-3 py-2 text-sm ${path === "/admin" || path === "/admin/" ? "text-gold" : "text-fg"}`}>
                  Releases
                </Link>
                <Link to="/admin/artists" className={`rounded-full px-3 py-2 text-sm ${path.startsWith("/admin/artists") ? "text-gold" : "text-fg"}`}>
                  Artists
                </Link>
              </>
            ) : portal ? (
              <>
                <Link to="/dashboard" className={`rounded-full px-3 py-2 text-sm ${path === "/dashboard" ? "text-gold" : "text-fg"}`}>
                  Studio
                </Link>
                <Link
                  to="/dashboard/new"
                  className={`rounded-full px-3 py-2 text-sm ${path.startsWith("/dashboard/new") || (path.startsWith("/dashboard/") && path !== "/dashboard/profile") ? "text-gold" : "text-fg"}`}
                >
                  Release
                </Link>
                <Link to="/dashboard/profile" className={`rounded-full px-3 py-2 text-sm ${path.startsWith("/dashboard/profile") ? "text-gold" : "text-fg"}`}>
                  Profile
                </Link>
              </>
            ) : (
              LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`rounded-full px-3 py-2 text-sm ${path.startsWith(l.to) ? "text-gold" : "text-fg"}`}
                >
                  {l.label}
                </Link>
              ))
            )}
            {session ? (
              <button
                type="button"
                onClick={() => void getSupabase().auth.signOut()}
                className="rounded-full border border-line px-3 py-2 text-sm"
              >
                Sign out
              </button>
            ) : null}
          </nav>
          <button
            type="button"
            className="ml-auto grid h-11 w-11 place-items-center rounded-full border border-line lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
        {open && (
          <div className="border-t border-line px-4 py-4 lg:hidden">
            {!portal && !desk && (
              <form onSubmit={search} className="mb-3 flex items-center gap-2 rounded-full border border-line bg-elevated px-3">
                <Search size={16} className="text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  aria-label="Search songs or artists"
                  placeholder="Search songs or artists"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </form>
            )}
            <div className="flex flex-col">
              {desk ? (
                <>
                  <Link to="/admin" onClick={() => setOpen(false)} className="py-3">
                    Releases
                  </Link>
                  <Link to="/admin/artists" onClick={() => setOpen(false)} className="py-3">
                    Artists
                  </Link>
                </>
              ) : portal ? (
                <>
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="py-3">
                    Studio
                  </Link>
                  <Link to="/dashboard/new" onClick={() => setOpen(false)} className="py-3">
                    Release
                  </Link>
                  <Link to="/dashboard/profile" onClick={() => setOpen(false)} className="py-3">
                    Profile
                  </Link>
                </>
              ) : (
                LINKS.map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-3 text-base">
                    {l.label}
                  </Link>
                ))
              )}
              {session ? (
                <>
                  {!portal && !desk && profile?.role === "admin" && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="py-3 text-gold">
                      Desk
                    </Link>
                  )}
                  <button type="button" className="py-3 text-left" onClick={() => void getSupabase().auth.signOut()}>
                    Sign out
                  </button>
                </>
              ) : null}
            </div>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <img src="/brand/wordmark.png" alt="Dust Records" className="h-8 w-auto" />
            <p className="mt-3 max-w-sm text-sm text-muted">
              Independent since 2000. Airport Road, Effurun, Delta, Nigeria.
            </p>
          </div>
          <div className="text-sm text-muted">
            <div>bookings@dustrecords.com</div>
            <div className="mt-1">Reply within two business days</div>
            <div className="mt-3 flex gap-4 text-xs">
              <Link to="/access" className="text-muted">
                Studio
              </Link>
              <Link to="/admin" className="text-gold">
                Label desk
              </Link>
            </div>
          </div>
        </div>
      </footer>
      <PlayerBar />
      {!portal && !desk && <ChatWidget />}
    </div>
  );
}
