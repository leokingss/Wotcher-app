import Header from "@/components/Header";
import Stories from "@/components/Stories";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14 pb-14">
        <Stories />
        <Feed />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
