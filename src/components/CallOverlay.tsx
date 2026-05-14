import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  mode: "audio" | "video";
  other: { username: string; display_name: string | null; avatar_url: string | null } | null;
  onClose: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const CallOverlay = ({ open, mode, other, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [filter, setFilter] = useState(0);

  const filters = [
    { name: "None", style: "" },
    { name: "Glow", style: "saturate(1.4) brightness(1.1) contrast(1.1)" },
    { name: "Noir", style: "grayscale(1) contrast(1.2)" },
    { name: "Dream", style: "blur(0.5px) saturate(1.3) hue-rotate(15deg)" },
    { name: "Vivid", style: "saturate(2) contrast(1.15)" },
  ];

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video" ? { facingMode: facing } : false,
        });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current && mode === "video") videoRef.current.srcObject = stream;
      } catch {
        toast.error("Mic / camera access denied");
        onClose();
      }
    })();
    const t = setTimeout(() => setConnected(true), 1800);
    return () => {
      stopped = true;
      clearTimeout(t);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      setConnected(false);
      setElapsed(0);
    };
  }, [open, mode, facing, onClose]);

  useEffect(() => {
    if (!connected) return;
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(i);
  }, [connected]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
  };
  const toggleCam = () => {
    const next = !camOff;
    setCamOff(next);
    streamRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col"
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/30 blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/30 blur-3xl"
            />
          </div>

          {/* Video preview / avatar */}
          <div className="relative flex-1 flex items-center justify-center">
            {mode === "video" && !camOff ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: filters[filter].style, transform: facing === "user" ? "scaleX(-1)" : "none" }}
              />
            ) : null}

            {(mode === "audio" || camOff) && (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div
                  animate={{ scale: connected ? [1, 1.06, 1] : [1, 1.15, 1] }}
                  transition={{ duration: connected ? 2.4 : 1.2, repeat: Infinity }}
                  className="neo-button-icon p-1 rounded-full"
                >
                  <img
                    src={other?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.username}`}
                    alt=""
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </motion.div>
                <p className="text-2xl font-bold">{other?.display_name || other?.username}</p>
                <p className="text-sm text-muted-foreground">
                  {connected ? fmt(elapsed) : mode === "video" ? "Ringing video…" : "Calling…"}
                </p>
              </div>
            )}

            {/* Top status bar */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between">
              <div className="neo-card-inset px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-primary" : "bg-yellow-500"} animate-pulse`} />
                <span className="text-xs font-medium">{connected ? `Live · ${fmt(elapsed)}` : "Connecting"}</span>
              </div>
              {mode === "video" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilter((f) => (f + 1) % filters.length)}
                    className="neo-button-icon px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {filters[filter].name}
                  </button>
                  <button
                    onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
                    className="neo-button-icon p-2 rounded-full"
                  >
                    <RotateCcw className="w-4 h-4 text-primary" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-20 p-6 pb-10 flex items-center justify-center gap-5">
            <button
              onClick={toggleMute}
              className={`neo-button-icon w-14 h-14 rounded-full flex items-center justify-center ${muted ? "bg-destructive/20" : ""}`}
            >
              {muted ? <MicOff className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5 text-primary" />}
            </button>

            {mode === "video" && (
              <button
                onClick={toggleCam}
                className={`neo-button-icon w-14 h-14 rounded-full flex items-center justify-center ${camOff ? "bg-destructive/20" : ""}`}
              >
                {camOff ? <VideoOff className="w-5 h-5 text-destructive" /> : <Video className="w-5 h-5 text-primary" />}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/40 hover:scale-105 active:scale-95 transition"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallOverlay;
