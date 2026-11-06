import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { formatTime, usePlayer } from "@/lib/player";

export function PlayerBar() {
  const { queue, index, playing, toggle, next, prev, close, setPlaying } = usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seeking = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const track = queue[index];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const nextSrc = new URL(track.audioUrl, window.location.href).href;
    if (audio.src !== nextSrc) {
      audio.src = track.audioUrl;
      setProgress(0);
      setDuration(0);
    }
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [track, playing, setPlaying]);

  function seekTo(value: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(value)) return;
    audio.currentTime = value;
    setProgress(value);
  }

  if (!track) return null;

  const max = duration > 0 ? duration : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => {
          if (!seeking.current) setProgress(e.currentTarget.currentTime);
        }}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onEnded={next}
      />
      <label className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-2">
        <span className="w-10 text-xs text-muted tabular-nums">{formatTime(progress)}</span>
        <input
          type="range"
          min={0}
          max={max || 0}
          step={0.1}
          value={max ? Math.min(progress, max) : 0}
          disabled={!max}
          aria-label="Song position"
          onPointerDown={() => {
            seeking.current = true;
          }}
          onPointerUp={() => {
            seeking.current = false;
          }}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="seek h-8 w-full cursor-pointer"
        />
        <span className="w-10 text-right text-xs text-muted tabular-nums">{formatTime(duration)}</span>
      </label>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-3">
        <Link to="/releases/$id" params={{ id: track.releaseId }} className="flex min-w-0 flex-1 items-center gap-3">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt="" className="h-12 w-12 rounded-md object-cover" />
          ) : (
            <div className="h-12 w-12 rounded-md bg-elevated" />
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{track.title}</div>
            <div className="truncate text-xs text-muted">{track.artist}</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous" onClick={prev} className="grid h-11 w-11 place-items-center rounded-full text-fg">
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onClick={toggle}
            className="grid h-11 w-11 place-items-center rounded-full bg-gold text-bg"
          >
            {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button type="button" aria-label="Next" onClick={next} className="grid h-11 w-11 place-items-center rounded-full text-fg">
            <SkipForward size={16} />
          </button>
        </div>
        <button type="button" aria-label="Close player" onClick={close} className="grid h-11 w-11 place-items-center rounded-full text-muted">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
