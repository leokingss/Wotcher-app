import { useEffect, useState } from "react";
import { Gavel, Tag, Clock, Sparkles, Users, Star, ShoppingBag, Heart, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Listing } from "@/hooks/useListings";
import TimeLeft from "@/components/TimeLeft";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";

const fmt = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

interface Props {
  onOpenListing: (id: string) => void;
}

interface FeaturedSeller {
  seller_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avg_rating: number;
  review_count: number;
}

type SectionState<T> = { loading: boolean; data: T[] };

const ShopView = ({ onOpenListing }: Props) => {
  const { user } = useAuth();
  const { ids: favoriteIds, isFavorite, toggle: toggleFavorite, loaded: favoritesLoaded } = useFavorites();
  const [endingSoon, setEndingSoon] = useState<SectionState<Listing>>({ loading: true, data: [] });
  const [justListed, setJustListed] = useState<SectionState<Listing>>({ loading: true, data: [] });
  const [fromFollowing, setFromFollowing] = useState<SectionState<Listing>>({ loading: true, data: [] });
  const [featuredSellers, setFeaturedSellers] = useState<SectionState<FeaturedSeller>>({ loading: true, data: [] });
  const [saved, setSaved] = useState<SectionState<Listing>>({ loading: true, data: [] });

  const mapImg = (rows: any[]): Listing[] =>
    (rows ?? []).map((l: any) => ({ ...l, image_url: l.posts?.image_url ?? null })) as Listing[];

  useEffect(() => {
    const nowIso = new Date().toISOString();

    // Ending soon
    supabase
      .from("listings")
      .select("*, posts:post_id(image_url)")
      .eq("status", "active")
      .eq("type", "auction")
      .gt("ends_at", nowIso)
      .order("ends_at", { ascending: true })
      .limit(10)
      .then(({ data }) => setEndingSoon({ loading: false, data: mapImg(data ?? []) }));

    // Just listed
    supabase
      .from("listings")
      .select("*, posts:post_id(image_url)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setJustListed({ loading: false, data: mapImg(data ?? []) }));

    // Featured sellers
    (async () => {
      const { data: featRows } = await supabase
        .from("seller_rating_summary")
        .select("*")
        .gte("review_count", 1)
        .order("avg_rating", { ascending: false })
        .order("review_count", { ascending: false })
        .limit(6);
      const rows = featRows ?? [];
      if (rows.length === 0) {
        setFeaturedSellers({ loading: false, data: [] });
        return;
      }
      const ids = rows.map((r: any) => r.seller_id);
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .in("id", ids);
      const pm = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const mapped = rows
        .map((r: any) => {
          const p: any = pm.get(r.seller_id);
          return p
            ? {
                seller_id: r.seller_id,
                username: p.username,
                display_name: p.display_name,
                avatar_url: p.avatar_url,
                avg_rating: Number(r.avg_rating),
                review_count: r.review_count,
              }
            : null;
        })
        .filter(Boolean) as FeaturedSeller[];
      setFeaturedSellers({ loading: false, data: mapped });
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setFromFollowing({ loading: false, data: [] });
      return;
    }
    setFromFollowing({ loading: true, data: [] });
    (async () => {
      const followingIds = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .then((r) => (r.data ?? []).map((x: any) => x.following_id));
      if (followingIds.length === 0) {
        setFromFollowing({ loading: false, data: [] });
        return;
      }
      const { data } = await supabase
        .from("listings")
        .select("*, posts:post_id(image_url)")
        .eq("status", "active")
        .in("seller_id", followingIds)
        .order("created_at", { ascending: false })
        .limit(10);
      setFromFollowing({ loading: false, data: mapImg(data ?? []) });
    })();
  }, [user?.id]);

  const allDone = !endingSoon.loading && !justListed.loading && !fromFollowing.loading && !featuredSellers.loading;
  const allEmpty =
    allDone &&
    endingSoon.data.length === 0 &&
    justListed.data.length === 0 &&
    fromFollowing.data.length === 0 &&
    featuredSellers.data.length === 0;

  if (allEmpty) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6">
        <span className="neo-button-icon w-14 h-14 flex items-center justify-center mb-4">
          <ShoppingBag className="w-6 h-6 text-primary" />
        </span>
        <h3 className="font-semibold text-base mb-1">The shop is quiet</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No items for sale yet. Check back soon or list something of your own.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7 pb-2">
      <Section icon={Clock} title="Ending soon" subtitle="Don't miss these auctions">
        {endingSoon.loading ? (
          <SkeletonRow variant="hero" />
        ) : endingSoon.data.length === 0 ? (
          <SectionEmpty text="No live auctions right now." />
        ) : (
          <HorizontalScroll>
            {endingSoon.data.map((l) => (
              <ListingCard key={l.id} listing={l} variant="hero" onOpen={() => onOpenListing(l.id)} />
            ))}
          </HorizontalScroll>
        )}
      </Section>

      <Section icon={Sparkles} title="Just listed" subtitle="Fresh from the marketplace">
        {justListed.loading ? (
          <SkeletonGrid />
        ) : justListed.data.length === 0 ? (
          <SectionEmpty text="Nothing new yet — be the first to list." />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {justListed.data.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} variant="grid" onOpen={() => onOpenListing(l.id)} />
            ))}
          </div>
        )}
      </Section>

      <Section icon={Users} title="From people you follow" subtitle="Picks from your circle">
        {fromFollowing.loading ? (
          <SkeletonRow variant="compact" />
        ) : fromFollowing.data.length === 0 ? (
          <SectionEmpty
            text={user ? "Follow more sellers to see their listings here." : "Sign in and follow sellers to see picks."}
          />
        ) : (
          <HorizontalScroll>
            {fromFollowing.data.map((l) => (
              <ListingCard key={l.id} listing={l} variant="compact" onOpen={() => onOpenListing(l.id)} />
            ))}
          </HorizontalScroll>
        )}
      </Section>

      <Section icon={Star} title="Featured sellers" subtitle="Top-rated in the community">
        {featuredSellers.loading ? (
          <SkeletonSellers />
        ) : featuredSellers.data.length === 0 ? (
          <SectionEmpty text="No rated sellers yet." />
        ) : (
          <HorizontalScroll>
            {featuredSellers.data.map((s) => (
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
        )}
      </Section>
    </div>
  );
};

const Section = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: any;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) => (
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

const SectionEmpty = ({ text }: { text: string }) => (
  <div className="neo-card rounded-2xl py-8 px-4 text-center">
    <p className="text-xs text-muted-foreground">{text}</p>
  </div>
);

const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`relative overflow-hidden bg-muted/60 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-foreground/5 to-transparent" />
  </div>
);

const SkeletonRow = ({ variant }: { variant: "hero" | "compact" }) => {
  const widthClass = variant === "hero" ? "w-56" : "w-40";
  const aspect = variant === "compact" ? "aspect-square" : "aspect-[4/5]";
  return (
    <div className="flex gap-3 overflow-hidden -mx-4 px-4 pb-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={`shrink-0 neo-card p-1.5 rounded-2xl ${widthClass}`}>
          <Shimmer className={`${aspect} rounded-xl`} />
        </div>
      ))}
    </div>
  );
};

const SkeletonGrid = () => (
  <div className="grid grid-cols-2 gap-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="neo-card p-1.5 rounded-2xl">
        <Shimmer className="aspect-[4/5] rounded-xl" />
      </div>
    ))}
  </div>
);

const SkeletonSellers = () => (
  <div className="flex gap-3 overflow-hidden -mx-4 px-4 pb-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="shrink-0 w-32 neo-card p-3 rounded-2xl flex flex-col items-center gap-2">
        <Shimmer className="w-16 h-16 rounded-full" />
        <Shimmer className="h-3 w-20 rounded" />
        <Shimmer className="h-2.5 w-12 rounded" />
      </div>
    ))}
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
