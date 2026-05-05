import { useState } from "react";
import Header from "@/components/Header";
import Stories from "@/components/Stories";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";

const Index = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="pt-4 pb-24">
        <div className="max-w-6xl mx-auto px-0 lg:px-6 lg:flex lg:gap-8 lg:items-start">
          <div className="flex-1 min-w-0">
            <Stories />
            <Feed />
          </div>
          <Sidebar />
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
