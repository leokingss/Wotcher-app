import { ShoppingBag, Gavel, Tag } from "lucide-react";
import { Listing } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import TimeLeft from "./TimeLeft";
import VibeTrackBar from "./music/VibeTrackBar";
import SocialProofBar from "./social/SocialProofBar";
import GroupBuyCard from "./social/GroupBuyCard";
import { useGroupBuys } from "@/hooks/useGroupBuys";

interface Props {
  listing: Listing;
  onOpen: () => void;
}

const formatPrice = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

const ListingBar = ({ listing, onOpen }: Props) => {
  const { user } = useAuth();
  const isAuction = listing.type === "auction";
  const price = isAuction
    ? listing.current_bid ?? listing.starting_bid
    : listing.price;
  const isSeller = user?.id === listing.seller_id;

  return (
    <div className="mt-3 mx-4 space-y-2">
      <div className="neo-card-inset rounded-2xl p-3 flex items-center gap-3">
        <div className="neo-button-icon w-10 h-10 flex items-center justify-center shrink-0">
          {isAuction ? <Gavel className="w-5 h-5 text-primary" /> : <Tag className="w-5 h-5 text-primary" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            {isAuction ? (listing.current_bid ? "Current bid" : "Starting bid") : "Buy now"}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">{formatPrice(price)}</span>
            {isAuction && listing.ends_at && (
              <span className="text-xs"><TimeLeft endsAt={listing.ends_at} /></span>
            )}
          </div>
        </div>
        <button
          onClick={onOpen}
          className="action-button action-button-primary flex items-center gap-1.5 shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          {isAuction ? "Bid now" : "Buy now"}
        </button>
      </div>
      <VibeTrackBar listingId={listing.id} isSeller={isSeller} />
    </div>
  );
};

export default ListingBar;
