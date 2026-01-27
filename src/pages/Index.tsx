import { useState } from "react";
import Header from "@/components/Header";
import Stories from "@/components/Stories";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-4 pb-24">
        <Stories />
        <Feed />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
