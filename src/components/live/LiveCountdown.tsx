import { useEffect, useState } from "react";

const LiveCountdown = ({ endsAt, big = false }: { endsAt: string; big?: boolean }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(endsAt).getTime() - now;
  if (diff <= 0) return <span className="text-destructive font-bold">ENDED</span>;
  const m = Math.floor(diff / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const urgent = diff < 10_000;
  return (
    <span
      className={`tabular-nums font-bold ${urgent ? "text-destructive animate-pulse" : "text-foreground"} ${
        big ? "text-2xl" : "text-sm"
      }`}
    >
      {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
    </span>
  );
};

export default LiveCountdown;
