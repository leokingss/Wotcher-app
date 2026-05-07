import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { submitReview } from "@/hooks/useSellerReviews";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sellerId: string;
  listingId: string;
  onSubmitted?: () => void;
}

const ReviewDialog = ({ open, onOpenChange, sellerId, listingId, onSubmitted }: Props) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    if (comment.length > 1000) { toast.error("Comment too long"); return; }
    setBusy(true);
    const { error } = await submitReview(sellerId, user.id, listingId, rating, comment);
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "You've already reviewed this purchase" : error.message);
      return;
    }
    toast.success("Review posted");
    onSubmitted?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="neo-card border-0 max-w-sm w-[95vw] rounded-3xl">
        <DialogHeader><DialogTitle>Rate this seller</DialogTitle></DialogHeader>
        <div className="flex items-center justify-center gap-1.5 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className="neo-button-icon p-2">
              <Star className={`w-6 h-6 ${n <= rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="Tell others how it went… (optional)"
          rows={4}
          className="neo-card-inset rounded-xl px-3 py-2 w-full text-sm bg-transparent outline-none resize-none"
        />
        <button onClick={handleSubmit} disabled={busy} className="action-button action-button-primary w-full">
          Post review
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
