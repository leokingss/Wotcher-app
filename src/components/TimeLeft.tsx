import { useEffect, useState } from "react";

interface Props { endsAt?: string | null; compact?: boolean }

const TimeLeft = ({ endsAt, compact }: Props) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return <span className="text-destructive font-medium">Ended</span>;
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const urgent = diff < 3_600_000;
  const txt = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;
  return (
    <span className={`font-medium tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}>
      {compact ? txt : `${txt} left`}
    </span>
  );
};

export default TimeLeft;
