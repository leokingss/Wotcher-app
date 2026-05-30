import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  CommunityPlaylist,
  PlaylistContributor,
  TrackReply,
  seededAnthems,
  seededPlaylists,
  seededTrackReplies,
} from "@/data/mockMusic";

// ---------------------------------------------------------------------------
// Phase 2 — client-side store for music woven into the social layer.
// Tracks attached to profiles, posts, listings, and community playlists.
// All persisted in localStorage. No backend writes.
// ---------------------------------------------------------------------------

const LS_KEY = "wotcher:musicmeta:v1";

interface PersistedState {
  anthems: Record<string, string>;                 // username -> trackId
  vibeTracks: Record<string, string>;              // listingId -> trackId
  trackReplies: Record<string, TrackReply[]>;      // postId -> replies
  playlists: CommunityPlaylist[];
}

const defaults = (): PersistedState => ({
  anthems: { ...seededAnthems },
  vibeTracks: {},
  trackReplies: { ...seededTrackReplies },
  playlists: seededPlaylists.map((p) => ({ ...p, entries: [...p.entries], contributors: [...p.contributors] })),
});

const load = (): PersistedState => {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const d = defaults();
    return {
      anthems: { ...d.anthems, ...(parsed.anthems ?? {}) },
      vibeTracks: { ...d.vibeTracks, ...(parsed.vibeTracks ?? {}) },
      trackReplies: { ...d.trackReplies, ...(parsed.trackReplies ?? {}) },
      playlists: parsed.playlists?.length ? parsed.playlists as CommunityPlaylist[] : d.playlists,
    };
  } catch {
    return defaults();
  }
};

interface MusicMetaValue {
  // Profile anthems
  getAnthem: (username: string) => string | null;
  setAnthem: (username: string, trackId: string | null) => void;
  // Post track replies
  getReplies: (postId: string) => TrackReply[];
  addReply: (postId: string, reply: TrackReply) => void;
  // Listing vibe tracks
  getVibe: (listingId: string) => string | null;
  setVibe: (listingId: string, trackId: string | null) => void;
  // Playlists
  playlists: CommunityPlaylist[];
  getPlaylist: (id: string) => CommunityPlaylist | undefined;
  addToPlaylist: (id: string, trackId: string, contributor: PlaylistContributor) => void;
}

const Ctx = createContext<MusicMetaValue | null>(null);

export const MusicMetaProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
  }, [state]);

  const setAnthem = useCallback((username: string, trackId: string | null) => {
    setState((s) => {
      const next = { ...s.anthems };
      if (trackId) next[username] = trackId;
      else delete next[username];
      return { ...s, anthems: next };
    });
  }, []);

  const addReply = useCallback((postId: string, reply: TrackReply) => {
    setState((s) => ({
      ...s,
      trackReplies: { ...s.trackReplies, [postId]: [...(s.trackReplies[postId] ?? []), reply] },
    }));
  }, []);

  const setVibe = useCallback((listingId: string, trackId: string | null) => {
    setState((s) => {
      const next = { ...s.vibeTracks };
      if (trackId) next[listingId] = trackId;
      else delete next[listingId];
      return { ...s, vibeTracks: next };
    });
  }, []);

  const addToPlaylist = useCallback((id: string, trackId: string, contributor: PlaylistContributor) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.map((p) => {
        if (p.id !== id) return p;
        const hasContrib = p.contributors.some((c) => c.username === contributor.username);
        return {
          ...p,
          entries: [...p.entries, { trackId, addedBy: contributor.username, at: Date.now() }],
          contributors: hasContrib ? p.contributors : [...p.contributors, contributor],
        };
      }),
    }));
  }, []);

  const value = useMemo<MusicMetaValue>(() => ({
    getAnthem: (u) => state.anthems[u] ?? null,
    setAnthem,
    getReplies: (id) => state.trackReplies[id] ?? [],
    addReply,
    getVibe: (id) => state.vibeTracks[id] ?? null,
    setVibe,
    playlists: state.playlists,
    getPlaylist: (id) => state.playlists.find((p) => p.id === id),
    addToPlaylist,
  }), [state, setAnthem, addReply, setVibe, addToPlaylist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useMusicMeta = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMusicMeta must be used within MusicMetaProvider");
  return ctx;
};
