import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { Movement } from "@/hooks/useChartsStore";

interface Props {
  movement: Movement;
  size?: "sm" | "md";
}

const MovementBadge = ({ movement, size = "md" }: Props) => {
  const text = size === "sm" ? "text-[11px]" : "text-xs";

  if (movement.kind === "new") {
    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-bold tracking-wide ${text}`}>
        NEW
      </span>
    );
  }
  if (movement.kind === "same") {
    return (
      <span className={`inline-flex items-center gap-0.5 text-muted-foreground/60 tabular-nums ${text}`}>
        <Minus className="w-3 h-3" />
      </span>
    );
  }
  if (movement.kind === "up") {
    return (
      <span className={`inline-flex items-center gap-0.5 text-emerald-400 font-semibold tabular-nums ${text}`}>
        <ArrowUp className="w-3 h-3" strokeWidth={2.5} />
        {movement.by}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-0.5 text-red-400 font-semibold tabular-nums ${text}`}>
      <ArrowDown className="w-3 h-3" strokeWidth={2.5} />
      {movement.by}
    </span>
  );
};

export default MovementBadge;
