import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";

const StreakBadge = () => {
  const count = useStreak();
  return (
    <div
      title={`${count}-day streak`}
      className="neo-button-icon flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-bold"
    >
      <Flame className="w-3.5 h-3.5 text-orange-500" fill="currentColor" />
      <span className="tabular-nums">{count}</span>
    </div>
  );
};

export default StreakBadge;
