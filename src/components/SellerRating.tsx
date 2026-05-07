import { Star } from "lucide-react";
import { useSellerReviews } from "@/hooks/useSellerReviews";

interface Props { sellerId: string; compact?: boolean }

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const Stars = ({ value, size = 14 }: { value: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        style={{ width: size, height: size }}
        className={n <= Math.round(value) ? "fill-primary text-primary" : "text-muted-foreground"}
      />
    ))}
  </div>
);

const SellerRating = ({ sellerId, compact }: Props) => {
  const { reviews, summary, loading } = useSellerReviews(sellerId);

  if (loading) return null;
  if (summary.review_count === 0) {
    return compact ? (
      <span className="text-xs text-muted-foreground">No reviews yet</span>
    ) : (
      <div className="text-sm text-muted-foreground">No reviews yet</div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Stars value={summary.avg_rating ?? 0} size={12} />
        <span className="text-xs font-semibold tabular-nums">{summary.avg_rating?.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">({summary.review_count})</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold tabular-nums">{summary.avg_rating?.toFixed(1)}</span>
        <div className="flex flex-col">
          <Stars value={summary.avg_rating ?? 0} />
          <span className="text-xs text-muted-foreground">{summary.review_count} review{summary.review_count === 1 ? "" : "s"}</span>
        </div>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {reviews.map((r) => (
          <div key={r.id} className="neo-card-inset rounded-2xl p-3">
            <div className="flex items-center gap-2 mb-1.5">
              {r.buyer?.avatar_url && <img src={r.buyer.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />}
              <span className="text-xs font-semibold truncate">{r.buyer?.username ?? "anonymous"}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{formatDate(r.created_at)}</span>
            </div>
            <Stars value={r.rating} size={12} />
            {r.comment && <p className="text-sm mt-2 whitespace-pre-line">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SellerRating;
