import { create } from "zustand";

export type Playable = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl: string | null;
  releaseId: string;
};

type PlayerState = {
  queue: Playable[];
  index: number;
  playing: boolean;
  play: (tracks: Playable[], start?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  close: () => void;
  setPlaying: (playing: boolean) => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  playing: false,
  play: (tracks, start = 0) => {
    const playable = tracks.filter((t) => t.audioUrl);
    if (!playable.length) return;
    const index = Math.min(Math.max(start, 0), playable.length - 1);
    set({ queue: playable, index, playing: true });
  },
  toggle: () => set({ playing: !get().playing }),
  next: () => {
    const { queue, index } = get();
    if (!queue.length) return;
    if (index < queue.length - 1) set({ index: index + 1, playing: true });
    else set({ playing: false });
  },
  prev: () => {
    const { index } = get();
    set({ index: Math.max(0, index - 1), playing: true });
  },
  close: () => set({ playing: false, queue: [], index: 0 }),
  setPlaying: (playing) => set({ playing }),
}));

export function formatTime(seconds: number | null | undefined) {
  if (!seconds || !Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
