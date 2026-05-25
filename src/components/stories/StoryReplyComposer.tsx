import { useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateDM } from "@/hooks/useInbox";
import { toast } from "sonner";

interface Props {
  storyId: string;
  ownerId: string;
  ownerUsername: string;
  preview: {
    media_type: string;
    media_url: string;
    caption?: string | null;
  };
  onFocusChange?: (focused: boolean) => void;
}

const StoryReplyComposer = ({ storyId, ownerId, ownerUsername, preview, onFocusChange }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!user || user.id === ownerId) return null;

  const handleSend = async () => {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    try {
      const convId = await getOrCreateDM(ownerId);
      const { error } = await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        body: v,
        media_type: "text",
        story_ref: {
          story_id: storyId,
          owner_id: ownerId,
          media_type: preview.media_type,
          media_url: preview.media_url,
          caption: preview.caption ?? null,
        } as any,
      });
      if (error) throw error;
      setText("");
      toast.success(`Reply sent to @${ownerUsername}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-2">
      <div className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/15">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={`Reply to @${ownerUsername}…`}
          className="flex-1 bg-transparent text-sm text-white placeholder:text-white/60 outline-none"
          maxLength={500}
        />
      </div>
      {text.trim() && (
        <button
          onClick={handleSend}
          disabled={sending}
          aria-label="Send reply"
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 shadow-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default StoryReplyComposer;
