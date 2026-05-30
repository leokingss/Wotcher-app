import { useNavigate } from "react-router-dom";
import { Gift, Sparkles, ChevronRight } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import DropCard from "./DropCard";
import RedPacketCard from "./RedPacketCard";

const DropsRail = () => {
  const { drops, packets } = useWallet();
  const navigate = useNavigate();
  if (!drops.length && !packets.length) return null;

  return (
    <section className="px-4 pt-3 pb-2">
      <button
        onClick={() => navigate("/wallet")}
        className="w-full flex items-center justify-between mb-2"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Drops & Packets</h3>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
          Wallet <ChevronRight className="w-3 h-3" />
        </span>
      </button>

      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
        {packets.map((p) => (
          <div key={p.id} className="w-[280px] shrink-0 snap-start">
            <RedPacketCard packet={p} />
          </div>
        ))}
        {drops.map((d) => (
          <div key={d.id} className="w-[200px] shrink-0 snap-start">
            <DropCard drop={d} />
          </div>
        ))}
        <button
          onClick={() => navigate("/wallet")}
          className="w-[120px] shrink-0 snap-start neo-card rounded-3xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Gift className="w-6 h-6" />
          <span className="text-xs font-semibold">See all</span>
        </button>
      </div>
    </section>
  );
};

export default DropsRail;
