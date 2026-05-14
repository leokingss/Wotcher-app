import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Video, VideoOff, Mic, MicOff, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  mode: "audio" | "video";
  other: { username: string; display_name: string | null; avatar_url: string | null } | null;
  onClose: () => void;
}

type CallState = "calling" | "connected" | "ended";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const CallOverlay = ({ open, mode, other, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [state, setState] = useState<CallState>("calling");
  const [endedReason, setEndedReason] = useState<"hangup" | "declined" | "failed">("hangup");
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

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setState("calling");
    setElapsed(0);
    setMuted(false);
    setCamOff(mode === "audio");
    setEndedReason("hangup");
  }, [open, mode]);

  // Acquire media + simulate connection
  useEffect(() => {
    if (!open || state === "ended") return;
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
        setEndedReason("failed");
        setState("ended");
      }
    })();
    const t = setTimeout(() => setState((s) => (s === "calling" ? "connected" : s)), 1800);
    return () => {
      stopped = true;
      clearTimeout(t);
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, facing]);

  // Tick elapsed while connected
  useEffect(() => {
    if (state !== "connected") return;
    const i = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(i);
  }, [state]);

  // Auto-close shortly after ended
  useEffect(() => {
    if (state !== "ended") return;
    stopStream();
    const t = setTimeout(() => onClose(), 1600);
    return () => clearTimeout(t);
  }, [state, onClose]);

  const hangUp = () => {
    setEndedReason(state === "calling" ? "declined" : "hangup");
    setState("ended");
  };

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

  const statusLabel =
    state === "calling" ? (mode === "video" ? "Ringing video…" : "Calling…")
    : state === "connected" ? `Live · ${fmt(elapsed)}`
    : endedReason === "failed" ? "Call failed"
    : endedReason === "declined" ? "Call cancelled"
    : `Call ended · ${fmt(elapsed)}`;

  const dotClass =
    state === "calling" ? "bg-yellow-500 animate-pulse"
    : state === "connected" ? "bg-primary animate-pulse"
    : "bg-destructive";

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

          {/* Video / avatar area */}
          <div className="relative flex-1 flex items-center justify-center">
            {mode === "video" && !camOff && state !== "ended" ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ filter: filters[filter].style, transform: facing === "user" ? "scaleX(-1)" : "none" }}
              />
            ) : null}

            {(mode === "audio" || camOff || state === "ended") && (
              <div className="relative z-10 flex flex-col items-center gap-4">
                <motion.div
                  animate={
                    state === "ended"
                      ? { scale: 1, opacity: 0.6 }
                      : { scale: state === "connected" ? [1, 1.06, 1] : [1, 1.15, 1] }
                  }
                  transition={{ duration: state === "connected" ? 2.4 : 1.2, repeat: state === "ended" ? 0 : Infinity }}
                  className="neo-button-icon p-1 rounded-full"
                >
                  <img
                    src={other?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.username}`}
                    alt=""
                    className="w-32 h-32 rounded-full object-cover"
                  />
                </motion.div>
                <p className="text-2xl font-bold">{other?.display_name || other?.username}</p>
                <p className={`text-sm ${state === "ended" ? "text-destructive" : "text-muted-foreground"}`}>
                  {statusLabel}
                </p>
              </div>
            )}

            {/* Top status bar */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex items-center justify-between">
              <div className="neo-card-inset px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                <span className="text-xs font-medium">{statusLabel}</span>
              </div>
              {mode === "video" && state !== "ended" && (
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
            {state === "ended" ? (
              <button
                onClick={onClose}
                className="neo-button px-6 py-3 rounded-full text-sm font-semibold"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  disabled={state !== "connected"}
                  className={`neo-button-icon w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-50 ${muted ? "bg-destructive/20" : ""}`}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted ? <MicOff className="w-5 h-5 text-destructive" /> : <Mic className="w-5 h-5 text-primary" />}
                </button>

                {mode === "video" && (
                  <button
                    onClick={toggleCam}
                    disabled={state !== "connected"}
                    className={`neo-button-icon w-14 h-14 rounded-full flex items-center justify-center disabled:opacity-50 ${camOff ? "bg-destructive/20" : ""}`}
                    aria-label={camOff ? "Camera on" : "Camera off"}
                  >
                    {camOff ? <VideoOff className="w-5 h-5 text-destructive" /> : <Video className="w-5 h-5 text-primary" />}
                  </button>
                )}

                <button
                  onClick={hangUp}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/40 hover:scale-105 active:scale-95 transition"
                  aria-label={state === "calling" ? "Cancel call" : "Hang up"}
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallOverlay;
