import { motion } from "framer-motion";

export type MusicFilter = "featured" | "releases" | "singles" | "saved" | "top10";

interface MusicFilterChipsProps {
  active: MusicFilter;
  onChange: (filter: MusicFilter) => void;
  isOwnProfile?: boolean;
}

const ALL_CHIPS: { id: MusicFilter; label: string }[] = [
  { id: "featured", label: "Featured" },
  { id: "releases", label: "Releases" },
  { id: "singles", label: "Singles" },
  { id: "saved", label: "Saved" },
  { id: "top10", label: "My Top 10" },
];

const MusicFilterChips = ({ active, onChange, isOwnProfile = true }: MusicFilterChipsProps) => {
  // "Saved" and "My Top 10" only show on your own profile
  const ownOnly: MusicFilter[] = ["saved", "top10"];
  const chips = ALL_CHIPS.filter((c) => !ownOnly.includes(c.id) || isOwnProfile);

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
      {chips.map((chip) => {
        const isActive = active === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onChange(chip.id)}
            className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              isActive
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="music-filter-active"
                className="absolute inset-0 bg-primary rounded-full"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MusicFilterChips;
