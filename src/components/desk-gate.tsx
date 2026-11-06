import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { PasswordField } from "@/components/password-field";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";

export function DeskGate({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useDust();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: signError } = await getSupabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signError) setError(signError.message);
  }

  if (loading) return <p className="px-4 py-16 text-muted">Opening the desk…</p>;

  if (!session) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <img src="/brand/mark.png" alt="" className="h-12 w-12" />
        <p className="label-kicker mt-4">Label</p>
        <h1 className="mt-2 font-display text-4xl">Label desk</h1>
        <p className="mt-2 text-muted">This entrance is only for the label account. Artists sign in at Studio.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm">
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-elevated px-3 py-3 outline-none focus:border-gold"
            />
          </label>
          <label className="block text-sm">
            Password
            <div className="mt-1">
              <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
            </div>
          </label>
          {error && <p className="text-sm text-gold">{error}</p>}
          <button type="submit" disabled={busy} className="h-12 w-full rounded-full bg-gold font-semibold text-bg disabled:opacity-60">
            {busy ? "Signing in…" : "Enter the desk"}
          </button>
        </form>
      </div>
    );
  }

  if (profile?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <p className="label-kicker">Label desk</p>
        <h1 className="mt-2 font-display text-5xl">Artist login</h1>
        <p className="mt-4 text-muted">
          {profile?.email || "This account"} is an artist login. The desk does not open for it. Sign out, then enter with the label email.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void getSupabase().auth.signOut()}
            className="h-12 rounded-full bg-gold px-5 font-semibold text-bg"
          >
            Sign out
          </button>
          <Link to="/dashboard" className="inline-flex h-12 items-center rounded-full border border-line px-5">
            Back to studio
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
