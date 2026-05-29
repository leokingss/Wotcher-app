import { Track } from "@/data/mockCharts";
import { Movement } from "@/hooks/useChartsStore";
import MovementBadge from "./MovementBadge";

interface Props {
  rank: number;
  track: Track;
  movement?: Movement;
  rightSlot?: React.ReactNode;
  onClick?: () => void;
}

const ChartRow = ({ rank, track, movement, rightSlot, onClick }: Props) => {
  const isOne = rank === 1;
  return (
    <button
      onClick={onClick}
      className="w-full neo-card flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-foreground/[0.02]"
    >
      <span
        className={`text-2xl font-black tabular-nums w-7 text-center shrink-0 ${
          isOne ? "text-primary" : rank <= 3 ? "text-foreground/80" : "text-muted-foreground/60"
        }`}
      >
        {rank}
      </span>
      <img
        src={track.artwork}
        alt={track.title}
        className="w-11 h-11 rounded-md object-cover shrink-0"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{track.title}</p>
        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
      </div>
      {rightSlot ?? (movement && <MovementBadge movement={movement} />)}
    </button>
  );
};

export default ChartRow;
