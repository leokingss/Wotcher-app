import { Send } from "lucide-react";
import { CURRENT_USER_AVATAR } from "@/data/mockComments";

interface CommentComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variant?: "inset" | "bordered";
}

const CommentComposer = ({ value, onChange, onSubmit, variant = "inset" }: CommentComposerProps) => {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };
  const wrapperClass =
    variant === "inset"
      ? "flex items-center gap-2 neo-card-inset p-2 rounded-xl"
      : "flex items-center gap-2 pt-2 border-t border-border/30";
  return (
    <div className={wrapperClass}>
      <div className="neo-card p-0.5 rounded-full">
        <img src={CURRENT_USER_AVATAR} alt="You" className="w-7 h-7 rounded-full object-cover" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Add a comment..."
        maxLength={500}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!value.trim()}
        aria-label="Post comment"
        className="neo-button-icon p-2 disabled:opacity-50"
      >
        <Send className="w-4 h-4 text-primary" />
      </button>
    </div>
  );
};

export default CommentComposer;
