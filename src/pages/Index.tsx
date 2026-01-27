import { useState } from "react";
import Header from "@/components/Header";
import Stories from "@/components/Stories";
import FeedTabs from "@/components/FeedTabs";
import Feed from "@/components/Feed";
import BottomNav from "@/components/BottomNav";

const Index = () => {
  const [activeTab, setActiveTab] = useState(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Stories />
        <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <Feed />
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
