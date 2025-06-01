"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface NavigationTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function NavigationTabs({
  tabs,
  activeTab,
  onTabChange
}: NavigationTabsProps) {
  return (
    <div className="relative z-10 px-6 py-4 bg-white border-b-4 border-gray-800 shadow-[0_4px_0_#374151]">
      <div className="flex items-center justify-center space-x-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={cn(
                "font-silkscreen text-xs font-bold uppercase px-4 py-2 border-2 min-w-24 items-center justify-center shadow-[2px_2px_0_#374151] transition-all",
                isActive
                  ? "bg-violet-100 border-violet-600 text-violet-800 shadow-[2px_2px_0_#581c87]"
                  : "bg-gray-100 border-gray-600 text-gray-800 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151]"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <div className="flex items-center space-x-2">
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
} 