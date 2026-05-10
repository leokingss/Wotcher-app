import { useEffect, useState } from "react";
import { Gavel, Tag, Clock, Sparkles, Users, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Listing } from "@/hooks/useListings";
import TimeLeft from "@/components/TimeLeft";
import { useAuth } from "@/hooks/useAuth";

const fmt = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  onOpenListing: (id: string) => void;
}

interface Sections {
  endingSoon: Listing[];
  justListed: Listing[];
  fromFollowing: Listing[];
  featuredSellers: { seller_id: string; username: string; display_name: string | null; avatar_url: string | null; avg_rating: number; review_count: number }[];
}

const ShopView = ({ onOpenListing }: Props) => {
  const { user } = useAuth();
  const [data, setData] = useState<Sections>({ endingSoon: [], justListed: [], fromFollowing: [], featuredSellers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();

      // Ending soon: active auctions with ends_at in future, soonest first
      const endingSoonReq = supabase
        .from("listings")
        .select("*, posts:post_id(image_url)")
        .eq("status", "active")
        .eq("type", "auction")
        .gt("ends_at", nowIso)
        .order("ends_at", { ascending: true })
        .limit(10);

      // Just listed: newest active listings
      const justListedReq = supabase
        .from("listings")
        .select("*, posts:post_id(image_url)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      // From following
      let fromFollowingReq: Promise<{ data: any[] | null }> = Promise.resolve({ data: [] });
      if (user) {
        const followingIds = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .then((r) => (r.data ?? []).map((x: any) => x.following_id));
        if (followingIds.length > 0) {
          fromFollowingReq = supabase
            .from("listings")
            .select("*, posts:post_id(image_url)")
            .eq("status", "active")
            .in("seller_id", followingIds)
            .order("created_at", { ascending: false })
            .limit(10) as any;
        }
      }

      // Featured sellers
      const featuredReq = supabase
        .from("seller_rating_summary")
        .select("*")
        .gte("review_count", 1)
        .order("avg_rating", { ascending: false })
        .order("review_count", { ascending: false })
        .limit(6);

      const [endingSoon, justListed, fromFollowing, featured] = await Promise.all([
        endingSoonReq,
        justListedReq,
        fromFollowingReq,
        featuredReq,
      ]);

      const mapImg = (rows: any[]) => (rows ?? []).map((l: any) => ({ ...l, image_url: l.posts?.image_url ?? null })) as Listing[];

      let featuredSellers: Sections["featuredSellers"] = [];
      const featRows = (featured as any).data ?? [];
      if (featRows.length > 0) {
        const ids = featRows.map((r: any) => r.seller_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url")
          .in("id", ids);
        const pm = new Map((profs ?? []).map((p: any) => [p.id, p]));
        featuredSellers = featRows
          .map((r: any) => {
            const p: any = pm.get(r.seller_id);
            return p
              ? { seller_id: r.seller_id, username: p.username, display_name: p.display_name, avatar_url: p.avatar_url, avg_rating: Number(r.avg_rating), review_count: r.review_count }
              : null;
          })
          .filter(Boolean);
      }

      setData({
        endingSoon: mapImg((endingSoon as any).data ?? []),
        justListed: mapImg((justListed as any).data ?? []),
        fromFollowing: mapImg((fromFollowing as any).data ?? []),
        featuredSellers,
      });
      setLoading(false);
    })();
  }, [user?.id]);

  if (loading) {
    return <div className="text-center py-12 text-sm text-muted-foreground">Loading shop…</div>;
  }

  const allEmpty =
    data.endingSoon.length === 0 &&
    data.justListed.length === 0 &&
    data.fromFollowing.length === 0 &&
    data.featuredSellers.length === 0;

  if (allEmpty) {
    return <div className="text-center py-16 text-sm text-muted-foreground">No items for sale yet.</div>;
  }

  return (
    <div className="space-y-7 pb-2">
      {data.endingSoon.length > 0 && (
        <Section icon={Clock} title="Ending soon" subtitle="Don't miss these auctions">
          <HorizontalScroll>
            {data.endingSoon.map((l) => (
              <ListingCard key={l.id} listing={l} variant="hero" onOpen={() => onOpenListing(l.id)} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {data.justListed.length > 0 && (
        <Section icon={Sparkles} title="Just listed" subtitle="Fresh from the marketplace">
          <div className="grid grid-cols-2 gap-3">
            {data.justListed.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} variant="grid" onOpen={() => onOpenListing(l.id)} />
            ))}
          </div>
        </Section>
      )}

      {data.fromFollowing.length > 0 && (
        <Section icon={Users} title="From people you follow" subtitle="Picks from your circle">
          <HorizontalScroll>
            {data.fromFollowing.map((l) => (
              <ListingCard key={l.id} listing={l} variant="compact" onOpen={() => onOpenListing(l.id)} />
            ))}
          </HorizontalScroll>
        </Section>
      )}

      {data.featuredSellers.length > 0 && (
        <Section icon={Star} title="Featured sellers" subtitle="Top-rated in the community">
          <HorizontalScroll>
            {data.featuredSellers.map((s) => (
              <a
                key={s.seller_id}
                href={`/profile/${s.username}`}
                className="shrink-0 w-32 neo-card p-3 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-[1.03]"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden neo-button-icon p-0">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.username} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-muted-foreground">
                      {s.username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold truncate w-full text-center">@{s.username}</p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="tabular-nums font-semibold text-foreground">{s.avg_rating.toFixed(1)}</span>
                  <span>· {s.review_count}</span>
                </div>
              </a>
            ))}
          </HorizontalScroll>
        </Section>
      )}
    </div>
  );
};

const Section = ({ icon: Icon, title, subtitle, children }: { icon: any; title: string; subtitle: string; children: React.ReactNode }) => (
  <section>
    <div className="flex items-center gap-2 mb-3 px-1">
      <span className="neo-button-icon w-8 h-8 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </span>
      <div>
        <h3 className="text-sm font-bold leading-tight">{title}</h3>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{subtitle}</p>
      </div>
    </div>
    {children}
  </section>
);

const HorizontalScroll = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
    {children}
  </div>
);

const ListingCard = ({
  listing: l,
  variant,
  onOpen,
}: {
  listing: Listing;
  variant: "hero" | "grid" | "compact";
  onOpen: () => void;
}) => {
  const isAuction = l.type === "auction";
  const display = isAuction ? (l.current_bid ?? l.starting_bid) : l.price;
  const widthClass =
    variant === "hero" ? "w-56 shrink-0 snap-start" :
    variant === "compact" ? "w-40 shrink-0 snap-start" :
    "";
  const aspect = variant === "compact" ? "aspect-square" : "aspect-[4/5]";

  return (
    <button
      onClick={onOpen}
      className={`group relative neo-card p-1.5 rounded-2xl text-left overflow-hidden transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] ${widthClass}`}
    >
      <div className={`relative ${aspect} rounded-xl overflow-hidden bg-muted`}>
        {l.image_url ? (
          <img src={l.image_url} alt={l.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isAuction ? <Gavel className="w-8 h-8 text-muted-foreground" /> : <Tag className="w-8 h-8 text-muted-foreground" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md ${
            isAuction ? "bg-primary/90 text-primary-foreground" : "bg-background/80 text-foreground"
          }`}>
            {isAuction ? <Gavel className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
            {isAuction ? "AUCTION" : "BUY NOW"}
          </span>
          {isAuction && l.ends_at && (
            <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-background/80 backdrop-blur-md tabular-nums">
              <TimeLeft endsAt={l.ends_at} compact />
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="text-xs font-medium truncate opacity-90">{l.title}</p>
          <p className="text-[9px] uppercase tracking-wider opacity-70 mt-0.5">
            {isAuction ? (l.current_bid ? "Current bid" : "Starting at") : "Price"}
          </p>
          <p className="text-lg font-bold tabular-nums leading-tight">{fmt(display)}</p>
        </div>
      </div>
    </button>
  );
};

export default ShopView;
