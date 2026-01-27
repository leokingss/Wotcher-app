import { Search as SearchIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const exploreImages = [
  { id: 1, image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 2, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=800&fit=crop", span: "col-span-1 row-span-2" },
  { id: 3, image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 4, image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 5, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 6, image: "https://images.unsplash.com/photo-1682695797873-aa4cb6edd613?w=800&h=400&fit=crop", span: "col-span-2 row-span-1" },
  { id: 7, image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 8, image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 9, image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=800&fit=crop", span: "col-span-1 row-span-2" },
  { id: 10, image: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 11, image: "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
  { id: 12, image: "https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=400&h=400&fit=crop", span: "col-span-1 row-span-1" },
];

const Search = () => {
  return (
    <div className="min-h-screen bg-background pb-14">
      {/* Search Bar */}
      <div className="sticky top-0 z-50 bg-background p-3">
        <div className="max-w-lg mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-secondary rounded-lg py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border"
            />
          </div>
        </div>
      </div>

      {/* Explore Grid */}
      <div className="max-w-lg mx-auto">
        <div className="grid grid-cols-3 gap-0.5 auto-rows-[120px]">
          {exploreImages.map((item) => (
            <div key={item.id} className={`${item.span} overflow-hidden`}>
              <img src={item.image} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity cursor-pointer" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Search;
