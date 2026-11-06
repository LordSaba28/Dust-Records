import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle, X } from "lucide-react";
import { askDust } from "@/lib/dust-chat";
import { usePlayer } from "@/lib/player";

type Msg = { from: "dust" | "you"; text: string };

const STARTER: Msg = {
  from: "dust",
  text: "Dust here. Ask about an artist, a record, or a booking — type it in your own words.",
};

export function ChatWidget() {
  const openPlayer = usePlayer((s) => s.queue.length > 0);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([STARTER]);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, open]);

  async function send(value: string) {
    const clean = value.trim();
    if (!clean || busy) return;
    const next = [...msgs, { from: "you" as const, text: clean }];
    setMsgs(next);
    setText("");
    setBusy(true);
    const history = next
      .filter((m) => m !== STARTER)
      .map((m) => ({ role: m.from === "you" ? ("user" as const) : ("assistant" as const), content: m.text }));
    const result = await askDust({ data: { messages: history } }).catch(() => ({
      ok: false as const,
      error: "Couldn’t reach the desk.",
    }));
    setMsgs((m) => [...m, { from: "dust", text: result.ok ? result.text : result.error }]);
    setBusy(false);
  }

  return (
    <div className={`fixed right-4 z-50 ${openPlayer ? "bottom-28" : "bottom-4"}`}>
      {open && (
        <div className="mb-3 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <div className="label-kicker">Dust</div>
              <div className="font-display text-lg">Ask Dust</div>
            </div>
            <button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full">
              <X size={16} />
            </button>
          </div>
          <div ref={scroller} className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 py-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.from === "you" ? "ml-auto bg-gold text-bg" : "bg-elevated text-fg"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && <div className="text-sm text-muted">Writing…</div>}
          </div>
          <div className="px-4 pb-2">
            <Link to="/contact" search={{ artist: "" }} className="text-xs text-gold">
              Open the booking form
            </Link>
          </div>
          <form
            className="flex gap-2 border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask anything about the label"
              className="min-w-0 flex-1 rounded-full border border-line bg-elevated px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <button type="submit" disabled={busy} className="rounded-full bg-gold px-4 text-sm font-semibold text-bg disabled:opacity-60">
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        aria-label="Open chat"
        onClick={() => setOpen((v) => !v)}
        className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-gold text-bg shadow-lg"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>
    </div>
  );
}
