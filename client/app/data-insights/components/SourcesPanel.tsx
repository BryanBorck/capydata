"use client";

import { useState } from "react";
import { Plus, Search, FileText, Check } from "lucide-react";
import { FaTwitter, FaLinkedin, FaExternalLinkAlt, FaFileAlt } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { Knowledge } from "../types";
import AddDataDrawer from "./AddDataDrawer";
import DiscoverDrawer from "./DiscoverDrawer";

interface SourcesPanelProps {
  petKnowledge: Knowledge[];
  selectedKnowledgeIds: Set<string>;
  onToggleKnowledgeSelection: (knowledgeId: string) => void;
  onToggleSelectAll: () => void;
  onDataAdded?: () => void;
}

// Function to determine icon based on knowledge source
const getKnowledgeIcon = (knowledge: Knowledge): React.ReactNode => {
  const url = knowledge.url?.toLowerCase();
  
  if (url) {
    // X/Twitter links
    if (url.includes('x.com') || url.includes('twitter.com')) {
      return <FaTwitter className="h-4 w-4 text-white" />;
    }
    
    // LinkedIn links
    if (url.includes('linkedin.com')) {
      return <FaLinkedin className="h-4 w-4 text-white" />;
    }
    
    // Documentation/docs links
    if (url.includes('docs.') || url.includes('/docs/') || url.includes('documentation') || 
        (url.includes('github.com') && url.includes('/wiki'))) {
      return <FaFileAlt className="h-4 w-4 text-white" />;
    }
    
    // General web links
    return <FaExternalLinkAlt className="h-4 w-4 text-white" />;
  }
  
  // For general text content without URL, use random emojis
  const emojis = ['📝', '💭', '📋', '🗒️', '📄', '✍️', '🧠', '💡', '📚', '🎯'];
  const emojiIndex = Math.abs(knowledge.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % emojis.length;
  
  return <span className="text-sm">{emojis[emojiIndex]}</span>;
};

export default function SourcesPanel({
  petKnowledge,
  selectedKnowledgeIds,
  onToggleKnowledgeSelection,
  onToggleSelectAll,
  onDataAdded
}: SourcesPanelProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);

  const handleDataAdded = () => {
    if (onDataAdded) {
      onDataAdded();
    }
  };

  return (
    <div className="h-full flex flex-col px-6 py-6 pb-16">
      <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 mb-6">
        <div className="mb-6">
          <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
            <FileText className="h-6 w-6" />
            DATA SOURCES
          </div>
          <div className="font-silkscreen text-xs text-gray-600 uppercase">
            MANAGE YOUR KNOWLEDGE BASE
          </div>
        </div>
        
        <div className="flex space-x-3 mb-6">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="font-silkscreen text-sm font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center gap-2 flex-1"
          >
            <Plus className="h-3 w-3" />
            ADD
          </button>
          <button 
            onClick={() => setIsDiscoverOpen(true)}
            className="font-silkscreen text-sm font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center gap-2 flex-1"
          >
            <Search className="h-3 w-3" />
            DISCOVER
          </button>
        </div>
        
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={onToggleSelectAll}
            className="flex items-center space-x-2 font-silkscreen text-xs text-gray-800 hover:text-gray-900 uppercase"
          >
            <div className={cn(
              "w-4 h-4 border-2 border-gray-600 flex items-center justify-center",
              selectedKnowledgeIds.size === petKnowledge.length ? "bg-blue-600 border-blue-600" : "bg-white"
            )}>
              {selectedKnowledgeIds.size === petKnowledge.length && (
                <Check className="h-2 w-2 text-white" />
              )}
            </div>
            <span>SELECT ALL ({petKnowledge.length})</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] flex-1 overflow-hidden">
        <div className="p-4 border-b-2 border-gray-600 bg-gray-100">
          <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
            KNOWLEDGE ITEMS ({petKnowledge.length})
          </div>
        </div>
        <div className="h-full overflow-y-auto p-4">
          <div className="space-y-3">
            {petKnowledge.map((knowledge) => (
              <div key={knowledge.id} className="bg-gray-50 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3 flex items-center space-x-3 group hover:bg-gray-100 transition-colors">
                <button
                  onClick={() => onToggleKnowledgeSelection(knowledge.id)}
                  className="flex-shrink-0"
                >
                  <div className={cn(
                    "w-4 h-4 border-2 border-gray-600 flex items-center justify-center",
                    selectedKnowledgeIds.has(knowledge.id) ? "bg-blue-600 border-blue-600" : "bg-white"
                  )}>
                    {selectedKnowledgeIds.has(knowledge.id) && (
                      <Check className="h-2 w-2 text-white" />
                    )}
                  </div>
                </button>
                
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gray-800 border-2 border-gray-800 shadow-[2px_2px_0_#7f1d1d] flex items-center justify-center flex-shrink-0">
                    {getKnowledgeIcon(knowledge)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase truncate">
                      {knowledge.title || knowledge.url || `TEXT CONTENT ${knowledge.id.slice(0, 8)}`}
                    </div>
                    <div className="font-silkscreen text-xs text-gray-600 truncate">
                      {knowledge.url || `${knowledge.id.slice(0, 8)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddDataDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDataAdded={handleDataAdded}
      />

      <DiscoverDrawer
        isOpen={isDiscoverOpen}
        onClose={() => setIsDiscoverOpen(false)}
        onSourcesAdded={handleDataAdded}
      />
    </div>
  );
}