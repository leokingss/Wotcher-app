import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Heart, Sparkles } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recipient: string;          // @username
  source?: string;            // "post", "live", "profile"
}

const PRESETS = [1, 3, 5];

const TipSheet = ({ open, onOpenChange, recipient, source }: Props) => {
  const { balance, tip } = useWallet();
  const [amount, setAmount] = useState(3);
  const [custom, setCustom] = useState("");
  const [thanks, setThanks] = useState(false);

  const finalAmount = custom ? parseFloat(custom) : amount;

  const send = () => {
    if (!finalAmount || finalAmount <= 0) {
      toast.error("Enter an amount");
      return;
    }
    if (finalAmount > balance) {
      toast.error("Not enough balance. Top up first.");
      return;
    }
    const ok = tip(recipient, finalAmount, source);
    if (!ok) { toast.error("Tip failed"); return; }
    setThanks(true);
    setTimeout(() => {
      setThanks(false);
      onOpenChange(false);
      setCustom("");
      setAmount(3);
    }, 1500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0">
        <SheetHeader>
          <SheetTitle>Tip @{recipient}</SheetTitle>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {thanks ? (
            <motion.div
              key="thanks"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="py-10 flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -6, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.9 }}
                className="neo-card-inset p-5 rounded-full"
              >
                <Sparkles className="w-10 h-10 text-primary" />
              </motion.div>
              <p className="text-sm font-semibold">£{finalAmount.toFixed(2)} sent to @{recipient}</p>
              <p className="text-xs text-muted-foreground">They'll feel that one ✨</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="py-4 space-y-4">
              <p className="text-xs text-muted-foreground text-center">
                Wallet balance: <span className="font-bold text-foreground">£{balance.toFixed(2)}</span>
              </p>

              <div className="flex gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => { setAmount(p); setCustom(""); }}
                    className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all ${
                      !custom && amount === p ? "neo-card-inset text-primary" : "neo-button-icon"
                    }`}
                  >
                    £{p}
                  </button>
                ))}
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Custom"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="w-24 neo-card-inset rounded-2xl px-3 text-sm bg-transparent outline-none"
                />
              </div>

              <button
                onClick={send}
                className="w-full action-button action-button-primary py-3 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-current" />
                Send £{(finalAmount || 0).toFixed(2)}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default TipSheet;
