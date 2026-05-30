import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ArrowUpRight, ArrowDownLeft, Gift, Heart, Gavel, ShoppingBag, Music2, Sparkles } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { TxKind, WalletTx } from "@/data/mockWallet";
import DropCard from "@/components/wallet/DropCard";
import RedPacketCard from "@/components/wallet/RedPacketCard";
import { formatRelative } from "@/lib/time";

const TOPUPS = [5, 10, 25, 50];

const kindIcon = (k: TxKind) => {
  switch (k) {
    case "topup": return Plus;
    case "tip-out":
    case "tip-in": return Heart;
    case "bid":
    case "bid-refund": return Gavel;
    case "purchase":
    case "drop-buy": return ShoppingBag;
    case "packet-grab": return Gift;
    default: return ArrowUpRight;
  }
};

const TxRow = ({ tx }: { tx: WalletTx }) => {
  const Icon = kindIcon(tx.kind);
  const positive = tx.amount > 0;
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`neo-button-icon w-10 h-10 rounded-full flex items-center justify-center ${positive ? "text-primary" : "text-foreground"}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{tx.label}</p>
        <p className="text-xs text-muted-foreground">{formatRelative(new Date(tx.at).toISOString())}</p>
      </div>
      <p className={`text-sm font-bold tabular-nums ${positive ? "text-primary" : tx.amount === 0 ? "text-muted-foreground" : "text-foreground"}`}>
        {tx.amount === 0 ? <Music2 className="w-4 h-4 inline" /> : `${positive ? "+" : ""}£${tx.amount.toFixed(2)}`}
      </p>
    </div>
  );
};

const Wallet = () => {
  const navigate = useNavigate();
  const { balance, txs, topUp, drops, packets } = useWallet();
  const [tab, setTab] = useState<"all" | "drops" | "packets">("all");

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur">
        <div className="max-w-lg mx-auto h-14 px-3 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="neo-button-icon p-2"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold">Wallet</h1>
          <div className="w-9" />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 space-y-6">
        {/* Balance hero */}
        <div className="neo-card rounded-3xl p-6 flex flex-col items-center gap-3 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)), transparent 70%)" }} />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Balance</p>
          <p className="text-5xl font-extrabold text-primary leading-none">£{balance.toFixed(2)}</p>
          <p className="text-[11px] text-muted-foreground">One wallet for tips, bids, drops & packets</p>

          <div className="flex gap-2 w-full mt-3">
            {TOPUPS.map((a) => (
              <button
                key={a}
                onClick={() => topUp(a)}
                className="flex-1 neo-button-icon py-2 rounded-2xl text-xs font-bold hover:text-primary"
              >
                +£{a}
              </button>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="neo-card-inset rounded-full p-1 flex">
          {(["all", "drops", "packets"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-full transition-all capitalize ${
                tab === t ? "neo-card text-primary" : "text-muted-foreground"
              }`}
            >
              {t === "all" ? "History" : t}
            </button>
          ))}
        </div>

        {tab === "all" && (
          <div className="neo-card rounded-3xl p-4 divide-y divide-border/40">
            {txs.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground/70">Top up, tip a creator, or grab a packet to start.</p>
              </div>
            ) : txs.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}

        {tab === "drops" && (
          <div className="grid grid-cols-2 gap-3">
            {drops.map((d) => <DropCard key={d.id} drop={d} />)}
          </div>
        )}

        {tab === "packets" && (
          <div className="space-y-3">
            {packets.map((p) => <RedPacketCard key={p.id} packet={p} />)}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wallet;
