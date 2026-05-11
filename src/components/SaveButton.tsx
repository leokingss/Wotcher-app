import { useState } from "react";
import { Bookmark } from "lucide-react";
import SaveToListSheet from "@/components/SaveToListSheet";
import { useSavedLists, SavedItemType } from "@/hooks/useSavedLists";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  itemType: SavedItemType;
  itemId: string;
  itemTitle?: string;
  className?: string;
  iconClassName?: string;
}

const SaveButton = ({ itemType, itemId, itemTitle, className = "", iconClassName = "" }: Props) => {
  const { user } = useAuth();
  const { isItemSaved, loaded } = useSavedLists();
  const [open, setOpen] = useState(false);

  const saved = loaded && isItemSaved(itemType, itemId);

  return (
    <>
      <button
        type="button"
        aria-label={saved ? "Saved — manage lists" : "Save"}
        aria-pressed={saved}
        onClick={(e) => {
          e.stopPropagation();
          if (!user) { toast.error("Sign in to save items"); return; }
          setOpen(true);
        }}
        className={`neo-button-icon flex items-center justify-center transition-transform active:scale-90 ${className}`}
      >
        <Bookmark
          className={`transition-colors ${saved ? "fill-primary text-primary" : ""} ${iconClassName || "w-5 h-5"}`}
        />
      </button>
      {open && (
        <SaveToListSheet
          open={open}
          onOpenChange={setOpen}
          itemType={itemType}
          itemId={itemId}
          itemTitle={itemTitle}
        />
      )}
    </>
  );
};

export default SaveButton;
