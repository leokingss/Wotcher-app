const LiveBadge = ({ className = "" }: { className?: string }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground text-[10px] font-extrabold tracking-wider uppercase ${className}`}
  >
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
    LIVE
  </span>
);

export default LiveBadge;
