import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FlaskConical, Camera, CloudSun, Radio, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PerspectiveMoments from "@/components/labs/PerspectiveMoments";
import VibeWeather from "@/components/labs/VibeWeather";
import SyncSessions from "@/components/labs/SyncSessions";
import LiveTogether from "@/components/labs/LiveTogether";

type LabId = "perspective" | "weather" | "sync" | "live";

const LABS: { id: LabId; title: string; tagline: string; Icon: typeof Camera; tint: string }[] = [
  { id: "live", title: "Live Together", tagline: "Up to 10 friends co-host one live story. Spotlight any camera.", Icon: Users, tint: "from-red-400/30 to-orange-500/20" },
  { id: "perspective", title: "Perspective Moments", tagline: "Multi-camera collage stories from your friends, one event.", Icon: Camera, tint: "from-amber-400/30 to-rose-500/20" },
  { id: "weather", title: "Vibe Weather", tagline: "A live forecast of your circle's emotional climate.", Icon: CloudSun, tint: "from-sky-400/30 to-indigo-500/20" },
  { id: "sync", title: "Sync Sessions", tagline: "Live shared listening room. Same beat, same second.", Icon: Radio, tint: "from-emerald-400/30 to-teal-500/20" },
];

const Labs = () => {
  const [active, setActive] = useState<LabId | null>(null);
  const lab = LABS.find((l) => l.id === active);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          {active ? (
            <button onClick={() => setActive(null)} className="neo-button-icon p-2" aria-label="Back to labs">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link to="/" className="neo-button-icon p-2" aria-label="Home">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <h1 className="font-bold tracking-tight">{lab ? lab.title : "Watcher Labs"}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4">
        <AnimatePresence mode="wait">
          {!active ? (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground px-1">
                Three experiments that don't exist anywhere else. Tap to try.
              </p>
              {LABS.map(({ id, title, tagline, Icon, tint }) => (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  className="relative w-full neo-card p-5 rounded-3xl text-left overflow-hidden group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${tint} opacity-60 group-hover:opacity-100 transition-opacity`} />
                  <div className="relative flex items-start gap-4">
                    <div className="neo-button-icon w-12 h-12 rounded-2xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold tracking-tight">{title}</p>
                      <p className="text-sm text-muted-foreground mt-1 leading-snug">{tagline}</p>
                    </div>
                  </div>
                  <span className="absolute top-3 right-4 text-[10px] uppercase tracking-widest font-bold text-primary/80">Beta</span>
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {active === "perspective" && <PerspectiveMoments />}
              {active === "weather" && <VibeWeather />}
              {active === "sync" && <SyncSessions />}
              {active === "live" && <LiveTogether />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Labs;
