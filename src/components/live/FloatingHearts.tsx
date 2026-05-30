import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface Beat { id: number; left: number; delay: number; }

const FloatingHearts = ({ trigger }: { trigger: number }) => {
  const [beats, setBeats] = useState<Beat[]>([]);

  useEffect(() => {
    if (trigger === 0) return;
    const burst = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      left: 20 + Math.random() * 60,
      delay: i * 80,
    }));
    setBeats((prev) => [...prev, ...burst]);
    const t = setTimeout(() => {
      setBeats((prev) => prev.filter((b) => !burst.find((x) => x.id === b.id)));
    }, 2400);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {beats.map((b) => (
        <Heart
          key={b.id}
          className="absolute bottom-0 w-6 h-6 text-destructive fill-destructive opacity-0"
          style={{
            left: `${b.left}%`,
            animation: `floatHeart 2.2s ease-out ${b.delay}ms forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes floatHeart {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translateY(-220px) scale(1.1) rotate(-8deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FloatingHearts;
