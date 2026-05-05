import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from "react";

export interface PlayerTrack {
  id: number;
  title: string;
  artist: string;
  cover: string;
}

interface PlayerContextValue {
  track: PlayerTrack | null;
  playingId: number | null;
  play: (track: PlayerTrack) => void;
  toggle: (track: PlayerTrack) => void;
  stop: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [track, setTrack] = useState<PlayerTrack | null>(null);

  const play = useCallback((t: PlayerTrack) => setTrack(t), []);
  const stop = useCallback(() => setTrack(null), []);
  const toggle = useCallback((t: PlayerTrack) => {
    setTrack((prev) => (prev?.id === t.id ? null : t));
  }, []);

  const value = useMemo(
    () => ({ track, playingId: track?.id ?? null, play, toggle, stop }),
    [track, play, toggle, stop]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};
