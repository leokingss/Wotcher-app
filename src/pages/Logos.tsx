import c1 from "@/assets/logo-concept-1.png";
import c2 from "@/assets/logo-concept-2.png";
import c3 from "@/assets/logo-concept-3.png";
import v4 from "@/assets/logo-v4.png";
import v5 from "@/assets/logo-v5.png";
import v6 from "@/assets/logo-v6.png";
import v7 from "@/assets/logo-v7.png";
import v8 from "@/assets/logo-v8.png";
import v9 from "@/assets/logo-v9.png";
import v10 from "@/assets/logo-v10.png";
import v11 from "@/assets/logo-v11.png";
import v12 from "@/assets/logo-v12.png";
import v13 from "@/assets/logo-v13.png";
import h1 from "@/assets/logo-hand-1.png";
import h2 from "@/assets/logo-hand-2.png";
import h3 from "@/assets/logo-hand-3.png";
import h4 from "@/assets/logo-hand-4.png";
import h5 from "@/assets/logo-hand-5.png";

const logos = [
  { src: h1, label: "H1 — Hand + Spiral Eye (app icon)" },
  { src: h2, label: "H2 — Hand + Spiral (mark only)" },
  { src: h3, label: "H3 — Outline Hand + Eye" },
  { src: h4, label: "H4 — Waving Hand + Spiral" },
  { src: h5, label: "H5 — Equalizer Hand + Eye" },
  { src: c1, label: "1 — Eye + W fusion" },
  { src: c2, label: "2 — Sonic Eye" },
  { src: c3, label: "3 — Waving Hand Eye" },
  { src: v4, label: "4 — W-Eye negative space" },
  { src: v5, label: "5 — Aperture Eye" },
  { src: v6, label: "6 — Vinyl Vision" },
  { src: v7, label: "7 — Owl Watcher" },
  { src: v8, label: "8 — Signal Smile" },
  { src: v9, label: "9 — Eye Bubble" },
  { src: v10, label: "10 — Royal Watcher" },
  { src: v11, label: "11 — Time Watcher" },
  { src: v12, label: "12 — Galaxy Note" },
  { src: v13, label: "13 — Grid Eye" },
];

const Logos = () => (
  <div className="min-h-screen bg-background px-4 py-8">
    <div className="max-w-5xl mx-auto">
      <h1 className="watcher-logo text-signature text-center mb-2">Watcher</h1>
      <p className="text-center text-sm text-muted-foreground mb-8">
        13 logo concepts — tap a number to tell me which to refine
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {logos.map((l, i) => (
          <div key={i} className="neo-card p-3 flex flex-col items-center gap-2">
            <div className="w-full aspect-square neo-card-inset rounded-2xl overflow-hidden flex items-center justify-center bg-background">
              <img
                src={l.src}
                alt={l.label}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-center text-foreground font-medium">{l.label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Logos;
