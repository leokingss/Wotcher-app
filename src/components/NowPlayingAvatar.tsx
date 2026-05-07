import { usePlayer } from "@/hooks/usePlayer";
import { Music2 } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  size?: number;
  /** If true, this avatar belongs to the current user — show now playing ring when player is active */
  isCurrentUser?: boolean;
  /** Force show now playing (e.g. for other users from realtime presence). */
  forceActive?: boolean;
  className?: string;
}

const NowPlayingAvatar = ({ src, alt, size = 44, isCurrentUser, forceActive, className = "" }: Props) => {
  const { track } = usePlayer();
  const active = forceActive || (isCurrentUser && !!track);

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {active && (
        <span
          className="absolute inset-0 rounded-full pointer-events-none animate-spin"
          style={{
            background: "conic-gradient(from 0deg, hsl(var(--primary)), transparent 60%, hsl(var(--primary)))",
            animationDuration: "3s",
          }}
        />
      )}
      <div className={`absolute inset-[2px] neo-card p-0.5 rounded-full`}>
        <img src={src} alt={alt} className="w-full h-full rounded-full object-cover" />
      </div>
      {active && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background"
          title={track ? `${track.title} • ${track.artist}` : "Now playing"}
        >
          <Music2 className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
};

export default NowPlayingAvatar;
