import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Music2 } from "lucide-react";
import { RedPacket, RedPacketShare } from "@/data/mockWallet";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { sampleTracks } from "@/data/mockCharts";

interface Props { packet: RedPacket }

const RedPacketCard = ({ packet }: Props) => {
  const { grabPacket } = useWallet();
  const { profile } = useAuth();
  const username = profile?.username ?? "you";
  const myShare = packet.shares.find((s) => s.claimedBy === username) ?? null;
  const remaining = packet.shares.filter((s) => !s.claimedBy).length;
  const total = packet.shares.length;
  const [reveal, setReveal] = useState<RedPacketShare | null>(myShare);
  const [opening, setOpening] = useState(false);

  const grab = () => {
    if (reveal || remaining === 0 || opening) return;
    setOpening(true);
    setTimeout(() => {
      const got = grabPacket(packet.id, username);
      setReveal(got);
      setOpening(false);
    }, 700);
  };

  const track = reveal?.trackId ? sampleTracks.find((t) => t.id === reveal.trackId) : null;

  return (
    <motion.div
      className="relative rounded-3xl overflow-hidden p-4 flex flex-col gap-3"
      style={{
        background:
          "linear-gradient(135deg, hsl(0 75% 35%) 0%, hsl(10 80% 45%) 50%, hsl(40 90% 55%) 100%)",
        boxShadow: "0 10px 30px -8px hsl(0 75% 35% / 0.5)",
      }}
      whileHover={{ y: -2 }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, rgba(255,220,150,0.6), transparent 60%)" }} />

      <div className="relative flex items-center gap-3">
        <img src={packet.creatorAvatar} className="w-9 h-9 rounded-full ring-2 ring-yellow-200" alt="" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-yellow-100/90 font-medium">@{packet.creator}</p>
          <p className="text-sm font-bold text-white truncate">{packet.greeting}</p>
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-black/30 text-yellow-100 tracking-wider">
          Red Packet
        </span>
      </div>

      <div className="relative flex items-end justify-between">
        <div>
          <p className="text-yellow-100/80 text-[11px] uppercase tracking-wide font-semibold">Pool</p>
          <p className="text-3xl font-extrabold text-white leading-none drop-shadow">£{packet.pool.toFixed(2)}</p>
          <p className="text-[11px] text-yellow-100/90 mt-1">
            <span className="font-bold text-white">{remaining}</span> of {total} left
          </p>
        </div>

        <AnimatePresence mode="wait">
          {reveal ? (
            <motion.div
              key="revealed"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/95 text-foreground rounded-2xl px-4 py-3 text-right shadow-lg"
            >
              {reveal.trackId ? (
                <>
                  <Music2 className="w-4 h-4 text-primary inline mr-1" />
                  <span className="text-xs font-bold">Bonus track</span>
                  {track && <p className="text-[11px] text-muted-foreground">{track.title}</p>}
                </>
              ) : (
                <>
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">You got</p>
                  <p className="text-2xl font-extrabold text-primary leading-none">£{reveal.amount.toFixed(2)}</p>
                </>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="grab"
              onClick={grab}
              disabled={remaining === 0 || opening}
              whileTap={{ scale: 0.92 }}
              animate={opening ? { rotate: [0, -8, 8, -6, 6, 0], scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.6 }}
              className="bg-yellow-300 text-red-900 font-extrabold rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <Gift className="w-5 h-5" />
              {opening ? "Opening…" : remaining === 0 ? "Empty" : "Grab"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {reveal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          {[...Array(14)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ x: "50%", y: "60%", opacity: 1, scale: 0 }}
              animate={{
                x: `${20 + Math.random() * 60}%`,
                y: `${10 + Math.random() * 40}%`,
                opacity: 0,
                scale: 1,
              }}
              transition={{ duration: 1.1 + Math.random() * 0.6, delay: i * 0.04 }}
              className="absolute w-2 h-2 rounded-full"
              style={{ background: i % 2 === 0 ? "#fde68a" : "#fff" }}
            />
          ))}
          <Sparkles className="absolute top-3 right-3 w-5 h-5 text-yellow-200" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default RedPacketCard;
