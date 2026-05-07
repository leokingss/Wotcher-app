import { useEffect, useRef, useState } from "react";
import { Send, Mic, Square, Trash2, Play, Pause } from "lucide-react";
import { CURRENT_USER_AVATAR } from "@/data/mockComments";

interface CommentComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onSubmitVoice?: (blob: Blob, durationSec: number) => void;
  variant?: "inset" | "bordered";
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

const CommentComposer = ({ value, onChange, onSubmit, onSubmitVoice, variant = "inset" }: CommentComposerProps) => {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, [voiceUrl]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorderRef.current = mr;
      setElapsed(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  const discardVoice = () => {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setElapsed(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
  };

  const sendVoice = () => {
    if (voiceBlob) onSubmitVoice?.(voiceBlob, elapsed);
    discardVoice();
  };

  const wrapperClass =
    variant === "inset"
      ? "flex items-center gap-2 neo-card-inset p-2 rounded-xl"
      : "flex items-center gap-2 pt-2 border-t border-border/30";

  return (
    <div className={wrapperClass}>
      <div className="neo-card p-0.5 rounded-full">
        <img src={CURRENT_USER_AVATAR} alt="You" className="w-7 h-7 rounded-full object-cover" />
      </div>

      {voiceUrl ? (
        <div className="flex-1 flex items-center gap-2">
          <button type="button" onClick={togglePlay} aria-label="Play voice note" className="neo-button-icon p-2">
            {playing ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
          </button>
          <span className="text-xs text-muted-foreground flex-1">Voice note · {fmt(elapsed)}</span>
          <audio ref={audioRef} src={voiceUrl} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} hidden />
          <button type="button" onClick={discardVoice} aria-label="Discard voice note" className="neo-button-icon p-2">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button type="button" onClick={sendVoice} aria-label="Send voice note" className="neo-button-icon p-2">
            <Send className="w-4 h-4 text-primary" />
          </button>
        </div>
      ) : recording ? (
        <div className="flex-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          <span className="flex-1 text-sm text-muted-foreground">Recording · {fmt(elapsed)}</span>
          <button type="button" onClick={stopRecording} aria-label="Stop recording" className="neo-button-icon p-2">
            <Square className="w-4 h-4 text-primary" />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Add a comment..."
            maxLength={500}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={startRecording}
            aria-label="Record voice note"
            className="neo-button-icon p-2"
          >
            <Mic className="w-4 h-4 text-primary" />
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!value.trim()}
            aria-label="Post comment"
            className="neo-button-icon p-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-primary" />
          </button>
        </>
      )}
    </div>
  );
};

export default CommentComposer;
