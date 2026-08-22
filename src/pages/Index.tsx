import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Stories from "@/components/Stories";
import Feed from "@/components/Feed";
import Sidebar from "@/components/Sidebar";
import FeedFilter, { FeedFilterState, DEFAULT_FILTER } from "@/components/FeedFilter";
import ActiveFilterChips from "@/components/ActiveFilterChips";
import { useAuth } from "@/hooks/useAuth";
import { TAB_TO_MODE, MODE_TO_TAB, feedModeByTab, FeedModeId } from "@/lib/feedModes";

const Index = () => {
  const { profile, setFeedMode } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedModeId>(1);
  const [filter, setFilter] = useState<FeedFilterState>(DEFAULT_FILTER);

  // Adopt the user's saved algorithm once their profile loads —
  // "we let you decide" means the decision survives sign-out and new devices.
  useEffect(() => {
    if (profile?.feed_mode) setActiveTab(MODE_TO_TAB[profile.feed_mode]);
  }, [profile?.feed_mode]);

  const handleTabChange = (t: number) => {
    const tab = t as FeedModeId;
    setActiveTab(tab);
    if (profile) void setFeedMode(TAB_TO_MODE[tab]);
  };

  const mode = feedModeByTab(activeTab);

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="pt-1.5 pb-24">
        <div className="max-w-6xl mx-auto px-0 lg:px-6 lg:flex lg:gap-8 lg:items-start">
          <div className="flex-1 min-w-0">
            <Stories />
            {/* Radical transparency: always tell the user which algorithm is in charge */}
            <p className="max-w-lg mx-auto px-4 pt-2.5 text-[11px] leading-snug text-muted-foreground flex items-center gap-1.5">
              <mode.Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                You're seeing: <span className="font-semibold text-foreground">{mode.label}</span>
                <span className="hidden sm:inline"> — {mode.tagline}</span>
              </span>
            </p>
            <FeedFilter value={filter} onChange={setFilter} />
            <ActiveFilterChips value={filter} onChange={setFilter} />
            <Feed mode={TAB_TO_MODE[activeTab]} filter={filter} />
          </div>
          <Sidebar />
        </div>
      </main>
    </div>
  );
};

export default Index;
