import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode, useCallback } from "react";
import { mockLiveRooms, mockScheduledAuctions, sampleBidderNames, sampleChatLines, LiveRoom, ScheduledAuction } from "@/data/mockLive";

export type FeedEvent =
  | { id: string; kind: "chat"; user: string; avatar: string; text: string; at: number }
  | { id: string; kind: "bid"; user: string; avatar: string; amount: number; at: number }
  | { id: string; kind: "join"; user: string; avatar: string; at: number };

interface LiveStore {
  rooms: LiveRoom[];
  getRoom: (id: string) => LiveRoom | undefined;
  feed: Record<string, FeedEvent[]>;
  placeBid: (roomId: string, amount: number, user?: { name: string; avatar: string }) => void;
  sendChat: (roomId: string, text: string, user?: { name: string; avatar: string }) => void;
  addRoom: (room: LiveRoom) => void;
  scheduledAuctions: ScheduledAuction[];
  addScheduledAuction: (s: ScheduledAuction) => void;
}

const Ctx = createContext<LiveStore | null>(null);

const AV = (s: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s)}`;
const uid = () => Math.random().toString(36).slice(2, 10);

export const LiveProvider = ({ children }: { children: ReactNode }) => {
  const [rooms, setRooms] = useState<LiveRoom[]>(mockLiveRooms);
  const [scheduledAuctions, setScheduledAuctions] = useState<ScheduledAuction[]>(mockScheduledAuctions);
  const [feed, setFeed] = useState<Record<string, FeedEvent[]>>({});
  const roomsRef = useRef(rooms);
  roomsRef.current = rooms;

  const pushEvent = useCallback((roomId: string, ev: FeedEvent) => {
    setFeed((prev) => {
      const next = [...(prev[roomId] ?? []), ev].slice(-80);
      return { ...prev, [roomId]: next };
    });
  }, []);

  const placeBid: LiveStore["placeBid"] = useCallback((roomId, amount, user) => {
    const u = user ?? { name: "you", avatar: AV("you") };
    setRooms((prev) =>
      prev.map((r) => {
        if (r.id !== roomId || !r.item) return r;
        if (amount <= r.item.topBid) return r;
        // anti-snipe: extend by 10s if <10s left
        const remaining = new Date(r.endsAt).getTime() - Date.now();
        const endsAt = remaining > 0 && remaining < 10_000
          ? new Date(Date.now() + 10_000).toISOString()
          : r.endsAt;
        return {
          ...r,
          endsAt,
          bidders: r.bidders + (r.item.topBidderId === u.name ? 0 : 1),
          item: { ...r.item, topBid: amount, topBidderId: u.name },
        };
      })
    );
    pushEvent(roomId, { id: uid(), kind: "bid", user: u.name, avatar: u.avatar, amount, at: Date.now() });
  }, [pushEvent]);

  const sendChat: LiveStore["sendChat"] = useCallback((roomId, text, user) => {
    const u = user ?? { name: "you", avatar: AV("you") };
    pushEvent(roomId, { id: uid(), kind: "chat", user: u.name, avatar: u.avatar, text, at: Date.now() });
  }, [pushEvent]);

  // Simulated live activity
  useEffect(() => {
    const t = setInterval(() => {
      const live = roomsRef.current;
      if (!live.length) return;
      const r = live[Math.floor(Math.random() * live.length)];
      const name = sampleBidderNames[Math.floor(Math.random() * sampleBidderNames.length)];
      const avatar = AV(name);
      const roll = Math.random();
      if (r.kind === "auction" && r.item && roll < 0.45) {
        const bump = [5, 5, 10, 10, 20][Math.floor(Math.random() * 5)];
        placeBid(r.id, r.item.topBid + bump, { name, avatar });
      } else if (roll < 0.9) {
        const text = sampleChatLines[Math.floor(Math.random() * sampleChatLines.length)];
        sendChat(r.id, text, { name, avatar });
      } else {
        pushEvent(r.id, { id: uid(), kind: "join", user: name, avatar, at: Date.now() });
      }
      // viewer drift
      setRooms((prev) =>
        prev.map((rm) =>
          rm.id === r.id ? { ...rm, viewers: Math.max(1, rm.viewers + (Math.random() < 0.5 ? -1 : 2)) } : rm
        )
      );
    }, 2200);
    return () => clearInterval(t);
  }, [placeBid, sendChat, pushEvent]);

  const value = useMemo<LiveStore>(() => ({
    rooms,
    getRoom: (id) => rooms.find((r) => r.id === id),
    feed,
    placeBid,
    sendChat,
    addRoom: (r) => setRooms((prev) => [r, ...prev]),
  }), [rooms, feed, placeBid, sendChat]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useLive = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLive must be used inside LiveProvider");
  return ctx;
};
