import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PasswordField } from "@/components/password-field";
import { useDust } from "@/lib/dust";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/access")({ component: AccessPage });

function AccessPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useDust();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !session || !profile) return;
    if (profile.role !== "admin") void navigate({ to: "/dashboard" });
  }, [loading, session, profile, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: signError } = await getSupabase().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signError) setError(signError.message);
  }

  if (!loading && session && profile?.role === "admin") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
        <p className="label-kicker">Studio</p>
        <h1 className="mt-2 font-display text-4xl">This is the artist entrance</h1>
        <p className="mt-3 text-muted">You are signed in as the label account. Artists do not use this door the other way around either. The desk has its own entrance.</p>
        <Link to="/admin" className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-gold px-5 font-semibold text-bg">
          Open the label desk
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <img src="/brand/mark.png" alt="" className="h-12 w-12" />
        <p className="label-kicker mt-4">Artists</p>
        <h1 className="mt-2 font-display text-4xl">Studio</h1>
        <p className="mt-2 text-muted">Artist entrance only. The label account signs in at Label desk, not here.</p>
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
          {busy ? "Signing in…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
