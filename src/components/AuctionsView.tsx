import { useEffect, useMemo, useState } from "react";
import { Gavel, Flame, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/hooks/useListings";
import SaveButton from "@/components/SaveButton";
import TimeLeft from "@/components/TimeLeft";
import EmptyState from "@/components/EmptyState";

const fmt = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "GBP" }).format(n);

const HOT_WINDOW_MS = 24 * 60 * 60 * 1000; // ending within 24h = "happening now"

interface Props {
  onOpenListing: (id: string) => void;
}

const AuctionsView = ({ onOpenListing }: Props) => {
  const [loading, setLoading] = useState(true);
  const [auctions, setAuctions] = useState<Listing[]>([]);

  useEffect(() => {
    const nowIso = new Date().toISOString();
    supabase
      .from("listings")
      .select("*, posts:post_id(image_url)")
      .eq("status", "active")
      .eq("type", "auction")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: true })
      .limit(60)
      .then(({ data }) => {
        const mapped = (data ?? []).map((l: any) => ({
          ...l,
          image_url: l.posts?.image_url ?? null,
        })) as Listing[];
        setAuctions(mapped);
        setLoading(false);
      });
  }, []);

  const { hot, upcoming } = useMemo(() => {
    const now = Date.now();
    const hot: Listing[] = [];
    const upcoming: Listing[] = [];
    auctions.forEach((l) => {
      const ends = l.ends_at ? new Date(l.ends_at).getTime() : 0;
      if (ends - now <= HOT_WINDOW_MS) hot.push(l);
      else upcoming.push(l);
    });
    return { hot, upcoming };
  }, [auctions]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 neo-card-inset rounded-3xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] neo-card-inset rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <EmptyState
        icon={Gavel}
        title="No live auctions right now"
        description="Check back soon — new auctions go up every day."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Highlighted: happening now */}
      {hot.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="neo-button-icon p-1.5 !text-primary">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <h2 className="text-sm font-semibold">Happening now</h2>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {hot.length} live
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-none">
            {hot.map((l) => (
              <AuctionHero key={l.id} listing={l} onOpen={() => onOpenListing(l.id)} />
            ))}
          </div>
        </section>
      )}

      {/* Up & coming */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="neo-button-icon p-1.5">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <h2 className="text-sm font-semibold">Up & coming</h2>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {upcoming.length} listed
          </span>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">
            All auctions are wrapping up — nothing new on the horizon yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {upcoming.map((l) => (
              <AuctionCard key={l.id} listing={l} onOpen={() => onOpenListing(l.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const AuctionHero = ({ listing: l, onOpen }: { listing: Listing; onOpen: () => void }) => {
  const display = l.current_bid ?? l.starting_bid;
  return (
    <div className="relative w-64 shrink-0 snap-start">
      <button
        onClick={onOpen}
        className="group relative neo-card p-1.5 rounded-3xl text-left overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] w-full ring-1 ring-primary/40"
      >
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
          {l.image_url ? (
            <img
              src={l.image_url}
              alt={l.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gavel className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md bg-primary text-primary-foreground">
              <Flame className="w-3 h-3" /> LIVE
            </span>
            {l.ends_at && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md tabular-nums">
                <TimeLeft endsAt={l.ends_at} compact />
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 pr-14 text-white">
            <p className="text-sm font-medium truncate opacity-95">{l.title}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">
              {l.current_bid ? "Current bid" : "Starting at"}
            </p>
            <p className="text-xl font-bold tabular-nums leading-tight">{fmt(display)}</p>
          </div>
        </div>
      </button>
      <SaveButton
        itemType="listing"
        itemId={l.id}
        itemTitle={l.title}
        className="absolute bottom-3.5 right-3.5 w-9 h-9 rounded-full"
        iconClassName="w-4 h-4 text-white"
      />
    </div>
  );
};

const AuctionCard = ({ listing: l, onOpen }: { listing: Listing; onOpen: () => void }) => {
  const display = l.current_bid ?? l.starting_bid;
  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="group relative neo-card p-1.5 rounded-2xl text-left overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] w-full"
      >
        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
          {l.image_url ? (
            <img
              src={l.image_url}
              alt={l.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gavel className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md bg-background/80 text-foreground">
              <Gavel className="w-3 h-3" /> AUCTION
            </span>
            {l.ends_at && (
              <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md tabular-nums flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <TimeLeft endsAt={l.ends_at} compact />
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 pr-14 text-white">
            <p className="text-xs font-medium truncate opacity-90">{l.title}</p>
            <p className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">
              {l.current_bid ? "Current bid" : "Starting at"}
            </p>
            <p className="text-lg font-bold tabular-nums leading-tight">{fmt(display)}</p>
          </div>
        </div>
      </button>
      <SaveButton
        itemType="listing"
        itemId={l.id}
        itemTitle={l.title}
        className="absolute bottom-3.5 right-3.5 w-9 h-9 rounded-full"
        iconClassName="w-4 h-4 text-white"
      />
    </div>
  );
};

export default AuctionsView;
