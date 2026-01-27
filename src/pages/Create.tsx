import { X, Camera, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const recentPhotos = [
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1682695797873-aa4cb6edd613?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=200&h=200&fit=crop",
];

const Create = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="p-2 hover:opacity-60 transition-opacity">
            <X className="w-6 h-6" />
          </Link>
          <h1 className="font-semibold">New post</h1>
          <button className="action-button action-button-primary py-1.5">
            Next
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        {/* Selected Image Preview */}
        <div className="aspect-square bg-muted">
          <img 
            src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop" 
            alt="Selected" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Gallery Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Recents</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center gap-3">
            <button className="category-pill">
              <LayoutGrid className="w-4 h-4" />
              <span>Select multiple</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-4 gap-0.5">
          {recentPhotos.map((photo, index) => (
            <div key={index} className="aspect-square relative group cursor-pointer">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Create;
