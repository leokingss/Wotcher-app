import { useNavigate } from "react-router-dom";
import { Comment } from "@/data/mockComments";

interface CommentPreviewProps {
  comments: Comment[];
  totalCount?: number;
  limit?: number;
  onViewAll?: () => void;
  framed?: boolean;
}

const CommentPreview = ({
  comments,
  totalCount,
  limit = 2,
  onViewAll,
  framed = true,
}: CommentPreviewProps) => {
  const navigate = useNavigate();
  if (comments.length === 0) return null;
  const preview = comments.slice(0, limit);
  const total = totalCount ?? comments.length;

  return (
    <div className={framed ? "mt-3 pt-3 border-t border-border/50 space-y-2" : "space-y-2"}>
      {preview.map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <div className="neo-card p-0.5 rounded-full">
            <img
              src={c.avatar}
              alt={c.username}
              className="w-6 h-6 rounded-full object-cover"
            />
          </div>
          <p className="text-xs flex-1 min-w-0">
            <button onClick={() => navigate(`/profile/${c.username}`)} className="font-semibold hover:underline">
              {c.username}
            </button>{" "}
            <span className="text-muted-foreground">{c.text}</span>
          </p>
        </div>
      ))}
      {onViewAll && comments.length > limit && (
        <button onClick={onViewAll} className="text-xs text-primary font-medium">
          View all {total} comments
        </button>
      )}
    </div>
  );
};

export default CommentPreview;
