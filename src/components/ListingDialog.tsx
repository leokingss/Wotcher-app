import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gavel, ShoppingBag, Tag, History, MapPin, Star, ShieldCheck, CreditCard } from "lucide-react";
import { useListing, placeBid, buyNow } from "@/hooks/useListings";
import { useAuth } from "@/hooks/useAuth";
import { useDefaultShippingAddress } from "@/hooks/useShippingAddress";
import { useBidderRegistration } from "@/hooks/useBidderRegistration";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TimeLeft from "./TimeLeft";
import SellerRating from "./SellerRating";
import ShippingAddressDialog from "./ShippingAddressDialog";
import ReviewDialog from "./ReviewDialog";
import ReportDialog from "./ReportDialog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listingId: string | null;
}

const formatPrice = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

const ListingDialog = ({ open, onOpenChange, listingId }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listing, bids, refresh } = useListing(open ? listingId : null);
  const { address, refresh: refreshAddr } = useDefaultShippingAddress(user?.id);
  const { registration, isApproved: bidderApproved } = useBidderRegistration(user?.id);
  const [bidAmount, setBidAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

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
  const isWinner = listing.status === "sold" && listing.current_bidder_id === user?.id;

  const requireAddress = (): boolean => {
    if (!listing.shipping_required) return true;
    if (!address) {
      toast.error("Add a shipping address first");
      setAddrOpen(true);
      return false;
    }
    return true;
  };

  const handleBid = async () => {
    if (!user) { toast.error("Sign in to bid"); return; }
    if (!bidderApproved) {
      toast.error("Register as a bidder first");
      navigate("/bidder-registration");
      return;
    }
    if (!requireAddress()) return;
    const amt = parseFloat(bidAmount);
    if (isNaN(amt) || amt < minBid) { toast.error(`Bid must be at least ${formatPrice(minBid)}`); return; }
    const cap = Number(registration?.approved_cap ?? 0);
    if (cap && amt > cap) { toast.error(`Your bidding cap is ${formatPrice(cap)}`); return; }
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
    if (!requireAddress()) return;
    setBusy(true);
    // Snapshot the shipping info on the listing so the seller knows where to ship.
    const shippingSnapshot = listing.shipping_required && address
      ? {
          full_name: address.full_name,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          region: address.region,
          postal_code: address.postal_code,
          country: address.country,
          phone: address.phone,
        }
      : null;
    const { error } = await buyNow(listing, user.id, shippingSnapshot);
    if (error) { setBusy(false); toast.error(error.message); return; }
    // Browser redirects to Stripe Checkout on success.
  };

  const handlePayWonAuction = async () => {
    if (!user) return;
    if (!requireAddress()) return;
    setBusy(true);
    const shippingSnapshot = listing.shipping_required && address ? {
      full_name: address.full_name, line1: address.line1, line2: address.line2,
      city: address.city, region: address.region, postal_code: address.postal_code,
      country: address.country, phone: address.phone,
    } : null;
    const { error } = await buyNow(listing, user.id, shippingSnapshot);
    if (error) { setBusy(false); toast.error(error.message); }
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
      <DialogContent className="neo-card border-0 max-w-md w-[95vw] rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isAuction ? <Gavel className="w-5 h-5 text-primary" /> : <Tag className="w-5 h-5 text-primary" />}
            {listing.title}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-1 space-y-3 flex-1">
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

          {/* Seller rating preview */}
          <div className="neo-card-inset rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Seller</p>
              {!isOwner && <ReportDialog targetType="listing" targetId={listing.id} />}
            </div>
            <SellerRating sellerId={listing.seller_id} compact />
          </div>

          {/* Shipping requirement notice */}
          {!isOwner && !inactive && listing.shipping_required && (
            <button
              onClick={() => setAddrOpen(true)}
              className="w-full neo-card-inset rounded-2xl p-3 flex items-center gap-3 text-left hover:opacity-90"
            >
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  {address ? "Ship to" : "Add a shipping address"}
                </p>
                <p className="text-sm truncate">
                  {address
                    ? `${address.full_name} · ${address.line1}, ${address.city} ${address.postal_code}`
                    : "Required to bid or buy"}
                </p>
              </div>
              <span className="text-xs text-primary font-semibold">{address ? "Edit" : "Add"}</span>
            </button>
          )}

          {!inactive && !isOwner && isAuction && !bidderApproved && (
            <button
              onClick={() => navigate("/bidder-registration")}
              className="action-button action-button-primary w-full flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {registration?.status === "pending" ? "Registration pending review" : "Register to bid"}
            </button>
          )}

          {!inactive && !isOwner && isAuction && bidderApproved && (
            <div className="space-y-1">
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
              <p className="text-[11px] text-muted-foreground text-right">
                Your cap: {formatPrice(Number(registration?.approved_cap ?? 0))}
              </p>
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

          {isWinner && (
            <button
              onClick={handlePayWonAuction}
              disabled={busy}
              className="action-button action-button-primary w-full flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" /> Pay {formatPrice(currentPrice)}
            </button>
          )}


          {/* Winner / buyer can leave a review */}
          {isWinner && (
            <button
              onClick={() => setReviewOpen(true)}
              className="action-button action-button-primary w-full flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" /> Leave a review
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
        </div>

        <ShippingAddressDialog open={addrOpen} onOpenChange={setAddrOpen} onSaved={refreshAddr} />
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          sellerId={listing.seller_id}
          listingId={listing.id}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ListingDialog;
