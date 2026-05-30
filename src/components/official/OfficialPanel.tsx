import { useState } from "react";
import { Radio, Music2, ShoppingBag, Sparkles, Inbox } from "lucide-react";
import { useOfficial } from "@/hooks/useOfficial";
import { sampleTracks } from "@/data/mockCharts";
import { usePlayer } from "@/hooks/usePlayer";
import VerifiedBadge from "./VerifiedBadge";

interface Props { username: string; isOwn?: boolean }

const TABS = [
  { id: "broadcast", label: "Broadcast", icon: Radio },
  { id: "music", label: "Music", icon: Music2 },
  { id: "shop", label: "Shop", icon: ShoppingBag },
  { id: "drops", label: "Drops", icon: Sparkles },
  { id: "inbox", label: "Inbox", icon: Inbox },
] as const;

const fmt = (n: number) => (n > 999 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

const OfficialPanel = ({ username, isOwn }: Props) => {
  const { getOfficial, broadcastsFor, postBroadcast } = useOfficial();
  const player = usePlayer();
  const acct = getOfficial(username);
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("broadcast");
  const [draft, setDraft] = useState("");

  if (!acct) return null;
  const bcs = broadcastsFor(username);
  const featured = acct.featuredTrackIds.map((id) => sampleTracks.find((t) => t.id === id)).filter(Boolean) as typeof sampleTracks;

  return (
    <div className="mx-4 mt-4 neo-card rounded-2xl p-3">
      <div className="flex items-center gap-2 mb-3">
        <VerifiedBadge size={18} />
        <span className="text-sm font-semibold">Official {acct.category}</span>
        <span className="text-[11px] text-muted-foreground">· {acct.tagline} · {fmt(acct.followers)} followers</span>
      </div>

      <div className="flex gap-1 overflow-x-auto mb-3 no-scrollbar">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${active ? "neo-button-pressed text-primary" : "neo-button-icon text-muted-foreground"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "broadcast" && (
        <div className="space-y-2">
          {isOwn && (
            <div className="neo-card-inset rounded-xl p-2 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Broadcast to all followers…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                disabled={!draft.trim()}
                onClick={() => {
                  postBroadcast({
                    from: username,
                    fromAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
                    title: draft.trim(),
                    body: "",
                  });
                  setDraft("");
                }}
                className="action-button action-button-primary text-xs disabled:opacity-50"
              >
                Send
              </button>
            </div>
          )}
          {bcs.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">No broadcasts yet.</p>
          ) : (
            bcs.map((b) => (
              <div key={b.id} className="neo-card-inset rounded-xl p-3 flex gap-3">
                {b.cover && <img src={b.cover} className="w-12 h-12 rounded-lg object-cover" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{b.title}</p>
                  {b.body && <p className="text-xs text-muted-foreground mt-0.5">{b.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(b.at).toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "music" && (
        <div className="space-y-2">
          {featured.map((t) => (
            <button
              key={t.id}
              onClick={() => player.toggle({ id: t.id, title: t.title, artist: t.artist, cover: t.artwork })}
              className="w-full neo-card-inset rounded-xl p-2 flex items-center gap-3 text-left"
            >
              <img src={t.artwork} className="w-10 h-10 rounded-md object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.title}</p>
                <p className="text-xs text-muted-foreground truncate">{t.artist}</p>
              </div>
              <Music2 className="w-4 h-4 text-primary" />
            </button>
          ))}
        </div>
      )}

      {tab === "shop" && (
        <p className="text-xs text-muted-foreground p-2">Shop items appear in this artist's Shop tab below.</p>
      )}
      {tab === "drops" && (
        <p className="text-xs text-muted-foreground p-2">Active drops appear in the Drops rail on home.</p>
      )}
      {tab === "inbox" && (
        <p className="text-xs text-muted-foreground p-2">{isOwn ? "Fan messages route here. (mock)" : "Send a message via the Contact button."}</p>
      )}
    </div>
  );
};

export default OfficialPanel;
