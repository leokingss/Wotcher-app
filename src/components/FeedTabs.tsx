import { useState } from "react";

const tabs = [
  { id: 1, label: "Live Feed" },
  { id: 2, label: "Popular" },
  { id: 3, label: "Algorithm" },
];

interface FeedTabsProps {
  activeTab: number;
  onTabChange: (tab: number) => void;
}

const FeedTabs = ({ activeTab, onTabChange }: FeedTabsProps) => {
  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-2 mx-4 mb-4">
      <p className="text-xs text-muted-foreground text-center mb-2">Visualization</p>
      <div className="flex gap-2 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`tab-pill ${activeTab === tab.id ? 'tab-pill-active' : 'tab-pill-inactive'}`}
          >
            <span className="font-semibold">{tab.id}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 justify-center mt-2">
        {tabs.map((tab) => (
          <span 
            key={tab.id}
            className={`text-xs ${activeTab === tab.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
          >
            {tab.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FeedTabs;
