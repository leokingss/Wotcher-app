import { useState } from "react";
import { Heart } from "lucide-react";
import TipSheet from "./TipSheet";

interface Props {
  recipient: string;
  source?: string;
  variant?: "pill" | "icon" | "compact";
  label?: string;
  className?: string;
}

const TipButton = ({ recipient, source, variant = "pill", label = "Tip", className = "" }: Props) => {
  const [open, setOpen] = useState(false);

  const cls = variant === "icon"
    ? "neo-button-icon p-2.5 rounded-full"
    : variant === "compact"
    ? "neo-button px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
    : "neo-button px-5 py-2 rounded-full text-sm font-medium flex items-center gap-1.5";

  return (
    <>
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className={`${cls} ${className}`}>
        <Heart className={`${variant === "pill" ? "w-4 h-4" : "w-3.5 h-3.5"} text-primary`} />
        {variant !== "icon" && <span>{label}</span>}
      </button>
      <TipSheet open={open} onOpenChange={setOpen} recipient={recipient} source={source} />
    </>
  );
};

export default TipButton;
