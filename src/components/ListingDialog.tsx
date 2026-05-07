import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gavel, ShoppingBag, Tag, History } from "lucide-react";
import { useListing, placeBid, buyNow } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TimeLeft from "./TimeLeft";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listingId: string | null;
}

const formatPrice = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

const ListingDialog = ({ open, onOpenChange, listingId }: Props) => {
  const { user } = useAuth();
  const { listing, bids, refresh } = useListing(open ? listingId : null);
  const [bidAmount, setBidAmount] = useState("");
  const [busy, setBusy] = useState(false);

  if (!listing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="neo-card border-0 max-w-md">
          <DialogHeader><DialogTitle>Loading…</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const isAuction = listing.type === "auction";
  const currentPrice = isAuction
    ? listing.current_bid ?? listing.starting_bid ?? 0
    : listing.price ?? 0;
  const minBid = Number(currentPrice) + 1;
  const isOwner = user?.id === listing.seller_id;
  const ended = listing.ends_at ? new Date(listing.ends_at).getTime() <= Date.now() : false;
  const inactive = listing.status !== "active" || ended;

  const handleBid = async () => {
    if (!user) { toast.error("Sign in to bid"); return; }
    const amt = parseFloat(bidAmount);
    if (isNaN(amt) || amt < minBid) { toast.error(`Bid must be at least ${formatPrice(minBid)}`); return; }
    setBusy(true);
    const { error } = await placeBid(listing.id, user.id, amt);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bid placed!");
    setBidAmount("");
    refresh();
  };

  const handleBuy = async () => {
    if (!user) { toast.error("Sign in to buy"); return; }
    setBusy(true);
    const { error } = await buyNow(listing, user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Purchased! The seller will be in touch.");
    refresh();
  };

  const handleCancel = async () => {
    setBusy(true);
    const { error } = await supabase.from("listings").update({ status: "cancelled" }).eq("id", listing.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Listing cancelled");
    refresh();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAuction ? <Gavel className="w-5 h-5 text-primary" /> : <Tag className="w-5 h-5 text-primary" />}
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        {listing.description && (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{listing.description}</p>
        )}

        <div className="neo-card-inset rounded-2xl p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
              {isAuction ? (listing.current_bid ? "Current bid" : "Starting bid") : "Price"}
            </span>
            <span className="text-2xl font-bold">{formatPrice(currentPrice)}</span>
          </div>
          {isAuction && listing.ends_at && (
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Ends in</span>
              <TimeLeft endsAt={listing.ends_at} />
            </div>
          )}
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium capitalize">{ended && listing.status === "active" ? "ended" : listing.status}</span>
          </div>
        </div>

        {!inactive && !isOwner && isAuction && (
          <div className="flex gap-2">
            <input
              type="number"
              min={minBid}
              step="0.01"
              placeholder={`Min ${formatPrice(minBid)}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="neo-card-inset rounded-xl px-3 py-2 flex-1 text-sm bg-transparent outline-none"
            />
            <button
              onClick={handleBid}
              disabled={busy}
              className="action-button action-button-primary flex items-center gap-1.5"
            >
              <Gavel className="w-4 h-4" /> Bid
            </button>
          </div>
        )}

        {!inactive && !isOwner && !isAuction && (
          <button
            onClick={handleBuy}
            disabled={busy}
            className="action-button action-button-primary w-full flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" /> Buy now {formatPrice(currentPrice)}
          </button>
        )}

        {isOwner && listing.status === "active" && (
          <button
            onClick={handleCancel}
            disabled={busy}
            className="neo-button w-full py-2.5 rounded-xl text-sm text-muted-foreground"
          >
            Cancel listing
          </button>
        )}

        {bids.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Bid history
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1.5">
              {bids.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg neo-card-inset">
                  <div className="flex items-center gap-2 min-w-0">
                    {b.bidder?.avatar_url && (
                      <img src={b.bidder.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                    )}
                    <span className="truncate">{b.bidder?.username ?? "anonymous"}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{formatPrice(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ListingDialog;
