"use client";

import { useState, useEffect } from "react";
import { X, Search, ArrowLeft, ExternalLink, Plus, CheckCircle, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/user-provider";
import { toast } from "sonner";

interface DiscoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesAdded: () => void;
}

interface DiscoveredSource {
  id: string;
  title: string;
  url: string;
  description: string;
  domain: string;
  selected: boolean;
}

interface Pet {
  id: string;
  name: string;
  rarity: string;
  social: number;
  trivia: number;
  science: number;
  code: number;
  trenches: number;
  streak: number;
  created_at: string;
}

const RANDOM_TOPICS = [
  { topic: "Space exploration", emoji: "🚀", description: "NASA missions, SpaceX, Mars exploration, astronomy" },
  { topic: "Carl Sagan", emoji: "🌌", description: "Cosmos, astrophysics, science communication" },
  { topic: "Gold and precious metals", emoji: "💰", description: "Market trends, mining, investment strategies" },
  { topic: "Jewelry making", emoji: "💎", description: "Crafting techniques, gemstones, design principles" },
  { topic: "Ancient civilizations", emoji: "🏛️", description: "Egypt, Rome, Greece, archaeological discoveries" },
  { topic: "Quantum physics", emoji: "⚛️", description: "Quantum mechanics, entanglement, computing" },
  { topic: "Climate change", emoji: "🌍", description: "Environmental science, renewable energy, sustainability" },
  { topic: "Artificial intelligence", emoji: "🤖", description: "Machine learning, deep learning, AI ethics" },
  { topic: "Cryptocurrency", emoji: "₿", description: "Bitcoin, blockchain, DeFi, trading strategies" },
  { topic: "Marine biology", emoji: "🐠", description: "Ocean life, coral reefs, marine conservation" },
  { topic: "Philosophy", emoji: "🤔", description: "Ethics, consciousness, existentialism, logic" },
  { topic: "Cooking techniques", emoji: "👨‍🍳", description: "French cuisine, molecular gastronomy, food science" }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function DiscoverDrawer({ isOpen, onClose, onSourcesAdded }: DiscoverDrawerProps) {
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingSources, setIsAddingSources] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<typeof RANDOM_TOPICS[0] | null>(null);

  const { user, isAuthenticated, pets } = useUser();
  
  // Get active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const activePet = pets.find((p: Pet) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Reset state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('home');
      setSearchQuery('');
      setDiscoveredSources([]);
      setSelectedTopic(null);
    }
  }, [isOpen]);

  const mockDiscoverSources = async (query: string): Promise<DiscoveredSource[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock data based on query
    const mockSources: DiscoveredSource[] = [];
    
    if (query.toLowerCase().includes('space') || query.toLowerCase().includes('carl sagan')) {
      mockSources.push(
        {
          id: '1',
          title: 'NASA Official Website - Space Exploration',
          url: 'https://www.nasa.gov/exploration/',
          description: 'Official NASA resource covering current space missions, research, and exploration programs.',
          domain: 'nasa.gov',
          selected: false
        },
        {
          id: '2',
          title: 'Carl Sagan - Cosmos: A SpaceTime Odyssey',
          url: 'https://en.wikipedia.org/wiki/Carl_Sagan',
          description: 'Comprehensive information about Carl Sagan, his contributions to science and popular science communication.',
          domain: 'wikipedia.org',
          selected: false
        },
        {
          id: '3',
          title: 'SpaceX Official Website',
          url: 'https://www.spacex.com/',
          description: 'Latest updates on SpaceX missions, Starship development, and Mars colonization plans.',
          domain: 'spacex.com',
          selected: false
        }
      );
    } else if (query.toLowerCase().includes('gold') || query.toLowerCase().includes('jewelry')) {
      mockSources.push(
        {
          id: '4',
          title: 'World Gold Council - Market Intelligence',
          url: 'https://www.gold.org/',
          description: 'Comprehensive data on gold markets, investment trends, and industry insights.',
          domain: 'gold.org',
          selected: false
        },
        {
          id: '5',
          title: 'Gemological Institute of America',
          url: 'https://www.gia.edu/',
          description: 'Educational resources on gemstones, jewelry grading, and industry standards.',
          domain: 'gia.edu',
          selected: false
        },
        {
          id: '6',
          title: 'Jewelry Making Techniques - Craftsy',
          url: 'https://www.craftsy.com/jewelry-making',
          description: 'Tutorials and guides for jewelry making, from basic techniques to advanced craftsmanship.',
          domain: 'craftsy.com',
          selected: false
        }
      );
    } else {
      // Generic sources for other topics
      mockSources.push(
        {
          id: '7',
          title: `Encyclopedia Britannica - ${query}`,
          url: `https://www.britannica.com/search?query=${encodeURIComponent(query)}`,
          description: `Comprehensive encyclopedia articles and research on ${query}.`,
          domain: 'britannica.com',
          selected: false
        },
        {
          id: '8',
          title: `Wikipedia - ${query}`,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(' ', '_'))}`,
          description: `Community-maintained articles and references about ${query}.`,
          domain: 'wikipedia.org',
          selected: false
        },
        {
          id: '9',
          title: `Scientific Papers - ${query}`,
          url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
          description: `Academic papers and research publications related to ${query}.`,
          domain: 'scholar.google.com',
          selected: false
        }
      );
    }
    
    return mockSources;
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setCurrentView('results');
    
    try {
      const sources = await mockDiscoverSources(query);
      setDiscoveredSources(sources);
    } catch (error) {
      toast.error("Failed to discover sources");
      console.error('Discovery error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRandomTopic = () => {
    const randomTopic = RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
    setSelectedTopic(randomTopic);
    setSearchQuery(randomTopic.topic);
    handleSearch(randomTopic.topic);
  };

  const toggleSourceSelection = (sourceId: string) => {
    setDiscoveredSources(prev => 
      prev.map(source => 
        source.id === sourceId 
          ? { ...source, selected: !source.selected }
          : source
      )
    );
  };

  const selectAllSources = () => {
    setDiscoveredSources(prev => 
      prev.map(source => ({ ...source, selected: true }))
    );
  };

  const createDataInstance = async (petId: string, instanceContent: string, instanceType: string, knowledgeData?: any[]) => {
    const payload = {
      content: instanceContent,
      content_type: instanceType,
      metadata: {
        source: 'discover_feature',
        type: 'discovered_sources',
        category: 'general',
        timestamp: new Date().toISOString(),
        query: searchQuery
      },
      knowledge_list: knowledgeData || []
    };

    const response = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${petId}/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  const handleAddSources = async () => {
    const selectedSources = discoveredSources.filter(source => source.selected);
    
    if (selectedSources.length === 0) {
      toast.error("Please select at least one source");
      return;
    }

    if (!activePet) {
      toast.error("No active pet found");
      return;
    }

    setIsAddingSources(true);

    try {
      const knowledgeData = selectedSources.map(source => ({
        url: source.url,
        title: source.title,
        content: source.description
      }));

      await createDataInstance(
        activePet.id,
        `Discovered sources for: ${searchQuery}`,
        'url',
        knowledgeData
      );

      toast.success(`Added ${selectedSources.length} source${selectedSources.length > 1 ? 's' : ''} to your knowledge base!`);
      onSourcesAdded();
      onClose();
    } catch (error) {
      toast.error("Failed to add sources");
      console.error('Add sources error:', error);
    } finally {
      setIsAddingSources(false);
    }
  };

  const renderHomeView = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-gray-800 shadow-[4px_4px_0_#374151] flex items-center justify-center mx-auto">
          <Search className="h-8 w-8 text-white" />
        </div>
        <div>
          <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
            Discover Sources
          </div>
          <div className="font-silkscreen text-xs text-gray-600 uppercase">
            Find relevant content for your knowledge base
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase mb-2">
          What are you interested in?
        </div>
        <div className="space-y-3">
          <textarea
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Describe something you'd like to learn about or click 'I'm feeling curious' to explore a new topic."
            rows={4}
            className="w-full px-3 py-2 border-2 border-gray-600 bg-white font-silkscreen text-sm focus:outline-none focus:border-blue-600 resize-none"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleRandomTopic}
              className="font-silkscreen text-sm font-bold text-gray-800 uppercase bg-yellow-200 border-2 border-yellow-600 shadow-[2px_2px_0_#ca8a04] px-4 py-2 hover:bg-yellow-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#ca8a04] transition-all flex items-center gap-2 flex-1"
            >
              <Lightbulb className="h-3 w-3" />
              {`I'm feeling curious`}
            </button>
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={!searchQuery.trim()}
              className="font-silkscreen text-sm font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] px-4 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1"
            >
              <Search className="h-3 w-3" />
              Discover
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase">
          Popular Topics
        </div>
        <div className="grid grid-cols-2 gap-2">
          {RANDOM_TOPICS.slice(0, 6).map((topic, index) => (
            <button
              key={index}
              onClick={() => {
                setSearchQuery(topic.topic);
                handleSearch(topic.topic);
              }}
              className="text-left p-3 bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all"
            >
              <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase flex items-center gap-2">
                <span>{topic.emoji}</span>
                {topic.topic}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResultsView = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
            {selectedTopic ? (
              <div className="flex items-center gap-2">
                <span>{selectedTopic.emoji}</span>
                {selectedTopic.topic}
              </div>
            ) : (
              searchQuery
            )}
          </div>
          {discoveredSources.length > 0 && (
            <button
              onClick={selectAllSources}
              className="font-silkscreen text-xs font-bold text-blue-600 uppercase hover:text-blue-800"
            >
              Select All
            </button>
          )}
        </div>
        
        {selectedTopic && (
          <div className="font-silkscreen text-xs text-gray-600 uppercase">
            {selectedTopic.description}
          </div>
        )}
      </div>

      {isSearching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <div className="font-silkscreen text-sm text-gray-600 uppercase">
              Discovering sources...
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {discoveredSources.length > 0 && (
            <div className="font-silkscreen text-xs text-gray-600 uppercase">
              {discoveredSources.filter(s => s.selected).length} of {discoveredSources.length} sources selected
            </div>
          )}
          
          {discoveredSources.map((source) => (
            <div
              key={source.id}
              className={cn(
                "border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-4 transition-all cursor-pointer",
                source.selected 
                  ? "bg-blue-50 border-blue-600 shadow-[2px_2px_0_#1e40af]" 
                  : "bg-white hover:bg-gray-50"
              )}
              onClick={() => toggleSourceSelection(source.id)}
            >
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                  source.selected 
                    ? "bg-blue-600 border-blue-600" 
                    : "bg-white border-gray-600"
                )}>
                  {source.selected && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                      {source.title}
                    </div>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  
                  <div className="font-silkscreen text-xs text-gray-600">
                    {source.description}
                  </div>
                  
                  <div className="font-silkscreen text-xs text-blue-600 uppercase">
                    {source.domain}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {discoveredSources.length > 0 && (
        <button
          onClick={handleAddSources}
          disabled={discoveredSources.filter(s => s.selected).length === 0 || isAddingSources}
          className="w-full font-silkscreen text-sm font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-3 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAddingSources ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Adding Sources...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add {discoveredSources.filter(s => s.selected).length} Source{discoveredSources.filter(s => s.selected).length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-gray-50 border-l-4 shadow-[8px_0_0_#374151] z-50 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              {currentView !== 'home' && (
                <button
                  onClick={() => setCurrentView('home')}
                  className="font-silkscreen text-sm font-bold text-gray-800 uppercase hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              )}
              <button
                onClick={onClose}
                className="font-silkscreen text-gray-600 hover:text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentView === 'home' && renderHomeView()}
            {currentView === 'results' && renderResultsView()}
          </div>
        </div>
      </div>
    </>
  );
} 