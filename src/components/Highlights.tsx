import { Plus } from "lucide-react";
import { highlights } from "@/data/mockSocial";


const Highlights = () => (
  <div className="mb-4 -mx-4">
    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 py-2">
      <button className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="neo-button-icon w-16 h-16 rounded-full flex items-center justify-center">
          <Plus className="w-5 h-5 text-muted-foreground" />
        </div>
        <span className="text-[11px] text-muted-foreground">New</span>
      </button>
      {highlights.map((h) => (
        <button key={h.id} className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="neo-card p-1 rounded-full">
            <img src={h.cover} alt={h.label} className="w-14 h-14 rounded-full object-cover" />
          </div>
          <span className="text-[11px] text-foreground font-medium max-w-[64px] truncate">{h.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default Highlights;
