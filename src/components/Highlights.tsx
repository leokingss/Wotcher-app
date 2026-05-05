import { Plus } from "lucide-react";

const highlights = [
  { id: 1, label: "Travel", cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop" },
  { id: 2, label: "Music", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" },
  { id: 3, label: "Code", cover: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&h=200&fit=crop" },
  { id: 4, label: "Art", cover: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop" },
  { id: 5, label: "Build", cover: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=200&h=200&fit=crop" },
];

const Highlights = () => (
  <div className="mb-4 -mx-4">
    <div className="flex gap-3 overflow-x-auto hide-scrollbar px-4 pb-1">
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
