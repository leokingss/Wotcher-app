import { useNavigate } from "react-router-dom";
import { Pencil, Check, X } from "lucide-react";
import { Comment } from "@/data/mockComments";
import VoiceNotePlayer from "./VoiceNotePlayer";

interface CommentListProps {
  comments: Comment[];
  limit?: number;
  size?: "sm" | "md";
  canEdit: (c: Comment) => boolean;
  editingId: number | null;
  editText: string;
  onEditTextChange: (v: string) => void;
  onStartEdit: (c: Comment) => void;
  onSave: (id: number) => void;
  onCancel: () => void;
}

const CommentList = ({
  comments,
  limit,
  size = "sm",
  canEdit,
  editingId,
  editText,
  onEditTextChange,
  onStartEdit,
  onSave,
  onCancel,
}: CommentListProps) => {
  const navigate = useNavigate();
  const list = limit ? comments.slice(0, limit) : comments;
  const avatarSize = size === "md" ? "w-7 h-7" : "w-7 h-7";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={size === "md" ? "space-y-3" : "space-y-3 mb-3"}>
      {list.map((comment) => (
        <div key={comment.id} className="flex items-start gap-2">
          <img
            src={comment.avatar}
            alt={comment.username}
            className={`${avatarSize} rounded-full object-cover`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(`/profile/${comment.username}`)} className={`${textSize} font-semibold hover:underline`}>
                {comment.username}
              </button>
              <span className={`${textSize} text-muted-foreground`}>{comment.time}</span>
              {canEdit(comment) && editingId !== comment.id && (
                <button
                  onClick={() => onStartEdit(comment)}
                  aria-label="Edit comment"
                  className="neo-button-icon flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-primary font-medium min-h-[28px]"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>
            {editingId === comment.id ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => onEditTextChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSave(comment.id);
                    if (e.key === "Escape") onCancel();
                  }}
                  autoFocus
                  className={`flex-1 bg-transparent border-b border-border ${textSize} outline-none`}
                />
                <button
                  onClick={() => onSave(comment.id)}
                  aria-label="Save edit"
                  className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full"
                >
                  <Check className="w-4 h-4 text-primary" />
                </button>
                <button
                  onClick={onCancel}
                  aria-label="Cancel edit"
                  className="neo-button-icon w-9 h-9 flex items-center justify-center rounded-full"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ) : (
              comment.voiceUrl ? (
                <div className="mt-1"><VoiceNotePlayer src={comment.voiceUrl} durationSec={comment.voiceDuration} /></div>
              ) : (
                <p className={`${textSize} text-foreground/80`}>
                  {comment.text}
                  {comment.edited && (
                    <span className="text-[10px] text-muted-foreground ml-1">(edited)</span>
                  )}
                </p>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
