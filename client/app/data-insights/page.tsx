"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Lightbulb, Target, BookOpen, MessageCircle, Loader2, ChevronRight, FileText, Link, Upload, CheckCircle, Send, Plus, Copy, Eye, EyeOff, Quote, Trophy, Sparkles, Menu, X, ChevronLeft, Check, Info, Settings, MoreHorizontal, User, Grid3X3, MoreVertical } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { ScrollArea } from "@/components/scroll-area";
import { Separator } from "@/components/separator";
import { APP_NAME } from "@/lib/constants";

// Import components and types
import SourcesPanel from "./components/SourcesPanel";
import ChatPanel from "./components/ChatPanel";
import StudioPanel from "./components/StudioPanel";
import NavigationTabs, { TabConfig } from "./components/NavigationTabs";
import { 
  Knowledge, 
  DataInstance, 
  ChatMessage, 
  UserStats, 
  Achievement, 
  KnowledgeSummary, 
  GeneratedContent 
} from "./types";

const API_BASE_URL = 'http://localhost:8000';

export default function DataInsightsPage() {
  const router = useRouter();
  const { user, isAuthenticated, pets } = useUser();
  const [petKnowledge, setPetKnowledge] = useState<Knowledge[]>([]);
  const [petInstances, setPetInstances] = useState<DataInstance[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // UI state
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<Set<string>>(new Set());
  const [activePanel, setActivePanel] = useState<'sources' | 'chat' | 'studio'>('chat');
  const [isMobile, setIsMobile] = useState(false);

  // Content generation state
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // State for dynamic knowledge summary
  const [knowledgeSummary, setKnowledgeSummary] = useState<KnowledgeSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const selectedPet = pets.find(pet => pet.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && pets.length === 0) {
      router.push('/onboard');
      return;
    }
  }, [isAuthenticated, pets, router]);

  // Fetch pet data and generate stats
  useEffect(() => {
    if (!selectedPet) return;

    const fetchPetData = async () => {
      setIsLoading(true);
      try {
        console.log(`Fetching data for pet: ${selectedPet.id} (${selectedPet.name})`);
        
        // Fetch pet instances and knowledge in parallel
        const [instancesResponse, knowledgeResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/instances?limit=100`),
          fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/knowledge?limit=100`)
        ]);

        let instances: DataInstance[] = [];
        let knowledge: Knowledge[] = [];

        if (instancesResponse.ok) {
          instances = await instancesResponse.json();
          setPetInstances(instances);
          console.log(`Fetched ${instances.length} instances for pet ${selectedPet.name}`);
        } else {
          console.error('Failed to fetch instances:', instancesResponse.status, instancesResponse.statusText);
          toast.error(`Failed to load pet instances (${instancesResponse.status})`);
        }

        if (knowledgeResponse.ok) {
          knowledge = await knowledgeResponse.json();
          setPetKnowledge(knowledge);
          console.log(`Fetched ${knowledge.length} knowledge items for pet ${selectedPet.name}`);
          
          // Select all sources by default
          setSelectedKnowledgeIds(new Set(knowledge.map(k => k.id)));
        } else {
          console.error('Failed to fetch knowledge:', knowledgeResponse.status, knowledgeResponse.statusText);
          toast.error(`Failed to load pet knowledge (${knowledgeResponse.status})`);
        }
        
        // Generate user stats with actual data
        generateUserStats(instances, knowledge);
        generateAchievements(instances, knowledge);
        
      } catch (error) {
        console.error('Error fetching pet data:', error);
        toast.error('Failed to load pet data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetData();
  }, [selectedPet, chatMessages.length]);

  // Generate knowledge summary when sources change
  useEffect(() => {
    if (petKnowledge.length > 0 && !knowledgeSummary) {
      setIsLoadingSummary(true);
      
      const generateSummary = async () => {
        try {
          const summary = await generateKnowledgeSummary(petKnowledge);
          const icon = generateKnowledgeIcon(petKnowledge);
          
          if (summary && typeof summary === 'string') {
            // Try to extract title and summary from AI response
            const lines = summary.split('\n').filter(line => line.trim());
            const title = lines[0]?.replace(/^(Title:|#\s*)/i, '').trim() || `Knowledge Collection (${petKnowledge.length} sources)`;
            const summaryText = lines.slice(1).join(' ').trim() || summary;
            
            setKnowledgeSummary({
              title: title.length > 80 ? title.substring(0, 80) + '...' : title,
              summary: summaryText,
              icon
            });
          } else {
            // Use fallback - inline simple summary generation
            const allContent = petKnowledge.map(k => k.content + ' ' + (k.title || '')).join(' ').toLowerCase();
            const words = allContent.split(/\W+/).filter(word => word.length > 3);
            const wordFreq: { [key: string]: number } = {};
            
            words.forEach(word => {
              wordFreq[word] = (wordFreq[word] || 0) + 1;
            });

            const topWords = Object.entries(wordFreq)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([word]) => word);

            const topics = petKnowledge.map(k => k.title || k.content.substring(0, 50)).join(', ');
            const fallbackTitle = topics.length > 60 ? topics.substring(0, 60) + '...' : topics;

            setKnowledgeSummary({
              title: fallbackTitle || `Knowledge Collection`,
              summary: `This collection contains ${petKnowledge.length} sources covering topics related to ${topWords.slice(0, 3).join(', ')}. The sources provide insights and information across various domains and subjects.`,
              icon
            });
          }
        } catch (error) {
          console.error('Error generating summary:', error);
          // Use fallback - inline simple summary generation  
          const allContent = petKnowledge.map(k => k.content + ' ' + (k.title || '')).join(' ').toLowerCase();
          const words = allContent.split(/\W+/).filter(word => word.length > 3);
          const wordFreq: { [key: string]: number } = {};
          
          words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
          });

          const topWords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);

          const topics = petKnowledge.map(k => k.title || k.content.substring(0, 50)).join(', ');
          const fallbackTitle = topics.length > 60 ? topics.substring(0, 60) + '...' : topics;
          const icon = generateKnowledgeIcon(petKnowledge);

          setKnowledgeSummary({
            title: fallbackTitle || `Knowledge Collection`,
            summary: `This collection contains ${petKnowledge.length} sources covering topics related to ${topWords.slice(0, 3).join(', ')}. The sources provide insights and information across various domains and subjects.`,
            icon
          });
        } finally {
          setIsLoadingSummary(false);
        }
      };

      generateSummary();
    } else if (petKnowledge.length === 0) {
      setKnowledgeSummary(null);
    }
  }, [petKnowledge]);

  // Initialize welcome message when knowledge summary is ready
  useEffect(() => {
    if (knowledgeSummary && chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: knowledgeSummary.summary,
        timestamp: new Date(),
      };
      setChatMessages([welcomeMessage]);
    }
  }, [knowledgeSummary, chatMessages.length]);

  const generateUserStats = useCallback((instances: DataInstance[], knowledge: Knowledge[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate growth
    const recentKnowledge = knowledge.filter(k => new Date(k.created_at) > weekAgo);
    const growthRate = recentKnowledge.length / 7;
    
    // Calculate categories
    const categories: { [key: string]: number } = {};
    instances.forEach(instance => {
      const type = instance.content_type || 'other';
      categories[type] = (categories[type] || 0) + 1;
    });
    
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
    
    // Calculate XP and level based on activity
    const xpPoints = knowledge.length * 10 + instances.length * 5;
    const level = Math.floor(xpPoints / 100) + 1;
    
    // Calculate streak (mock for now)
    const streakDays = Math.min(Math.floor(knowledge.length / 2), 30);
    
    setUserStats({
      totalKnowledge: knowledge.length,
      totalInstances: instances.length,
      avgDailyActivity: growthRate,
      knowledgeGrowth: (recentKnowledge.length / Math.max(knowledge.length - recentKnowledge.length, 1)) * 100,
      topCategories,
      streakDays,
      xpPoints,
      level
    });
  }, []);

  const generateAchievements = useCallback((instances: DataInstance[], knowledge: Knowledge[]) => {
    const newAchievements: Achievement[] = [
      {
        id: 'first_knowledge',
        title: 'First Steps',
        description: 'Add your first piece of knowledge',
        icon: '🎯',
        unlocked: knowledge.length >= 1,
        progress: Math.min(knowledge.length, 1),
        maxProgress: 1
      },
      {
        id: 'knowledge_collector',
        title: 'Knowledge Collector',
        description: 'Accumulate 10 knowledge items',
        icon: '📚',
        unlocked: knowledge.length >= 10,
        progress: Math.min(knowledge.length, 10),
        maxProgress: 10
      },
      {
        id: 'ai_explorer',
        title: 'AI Explorer',
        description: 'Use AI inference 5 times',
        icon: '🤖',
        unlocked: chatMessages.filter(m => m.role === 'user').length >= 5,
        progress: Math.min(chatMessages.filter(m => m.role === 'user').length, 5),
        maxProgress: 5
      },
      {
        id: 'data_scientist',
        title: 'Data Scientist',
        description: 'Reach 500 XP',
        icon: '🔬',
        unlocked: (userStats?.xpPoints || 0) >= 500,
        progress: Math.min((userStats?.xpPoints || 0), 500),
        maxProgress: 500
      }
    ];
    
    setAchievements(newAchievements);
  }, [chatMessages.length, userStats?.xpPoints]);

  // Generate dynamic content based on knowledge sources
  const generateKnowledgeSummary = useCallback(async (knowledge: Knowledge[]) => {
    if (knowledge.length === 0) return null;

    try {
      // Combine all knowledge content for analysis
      const combinedContent = knowledge
        .map(k => `Title: ${k.title || 'Untitled'}\nContent: ${k.content}`)
        .join('\n\n---\n\n');

      // Use AI to generate a summary and title
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: 'summary',
          context: combinedContent,
          pet_name: selectedPet?.name,
          additional_instructions: 'Generate a concise title and 2-3 sentence summary highlighting the main themes and key insights. Keep it engaging and informative.'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.content;
      }
    } catch (error) {
      console.error('Error generating knowledge summary:', error);
    }

    // Fallback to simple analysis
    const allContent = knowledge.map(k => k.content + ' ' + (k.title || '')).join(' ').toLowerCase();
    const words = allContent.split(/\W+/).filter(word => word.length > 3);
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);

    // Generate title based on most common themes
    const topics = knowledge.map(k => k.title || k.content.substring(0, 50)).join(', ');
    const title = topics.length > 60 ? topics.substring(0, 60) + '...' : topics;

    return {
      title: title || 'Knowledge Collection',
      summary: `This collection contains ${knowledge.length} sources covering topics related to ${topWords.slice(0, 3).join(', ')}. The sources provide insights and information across various domains and subjects.`
    };
  }, [selectedPet?.name]);

  const generateKnowledgeIcon = useCallback((knowledge: Knowledge[]) => {
    if (knowledge.length === 0) return '📚';

    // Analyze content to suggest appropriate emoji
    const allContent = knowledge.map(k => k.content + ' ' + (k.title || '')).join(' ').toLowerCase();
    
    const emojiMapping = [
      { keywords: ['research', 'study', 'analysis', 'paper', 'academic'], emoji: '🔬' },
      { keywords: ['technology', 'software', 'programming', 'code', 'development'], emoji: '💻' },
      { keywords: ['business', 'market', 'finance', 'economy', 'strategy'], emoji: '📈' },
      { keywords: ['health', 'medical', 'healthcare', 'medicine', 'treatment'], emoji: '🏥' },
      { keywords: ['education', 'learning', 'teaching', 'school', 'university'], emoji: '🎓' },
      { keywords: ['science', 'experiment', 'data', 'scientific', 'discovery'], emoji: '🧪' },
      { keywords: ['ai', 'artificial', 'intelligence', 'machine', 'learning'], emoji: '🤖' },
      { keywords: ['design', 'creative', 'art', 'visual', 'graphics'], emoji: '🎨' },
      { keywords: ['environment', 'climate', 'nature', 'sustainability', 'green'], emoji: '🌱' },
      { keywords: ['law', 'legal', 'policy', 'regulation', 'compliance'], emoji: '⚖️' }
    ];

    for (const mapping of emojiMapping) {
      if (mapping.keywords.some(keyword => allContent.includes(keyword))) {
        return mapping.emoji;
      }
    }

    // Default based on number of sources
    if (knowledge.length >= 10) return '📚';
    if (knowledge.length >= 5) return '📖';
    return '📄';
  }, []);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !selectedPet || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsGenerating(true);

    try {
      // Step 1: Semantic search for relevant knowledge
      const searchParams = new URLSearchParams({
        q: userMessage.content,
        limit: '5',
        similarity_threshold: '0.3'
      });
      
      const searchResponse = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/semantic/search?${searchParams}`);

      let relevantSources: Knowledge[] = [];
      let contextText = "";

      if (searchResponse.ok) {
        relevantSources = await searchResponse.json();
        contextText = relevantSources
          .map((item: Knowledge) => `Title: ${item.title || 'Untitled'}\nContent: ${item.content}`)
          .join('\n\n---\n\n');
      }

      // Step 2: Generate response using chat endpoint
      const chatResponse = await fetch(`${API_BASE_URL}/api/v1/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage.content,
          context: contextText,
          pet_name: selectedPet.name
        })
      });

      let responseContent = "";
      if (chatResponse.ok) {
        const result = await chatResponse.json();
        responseContent = result.response || result.inference || "I understand your question, but I need more context from your knowledge base to provide a helpful answer.";
      } else {
        responseContent = "I'm having trouble processing your request right now. Please try again.";
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        sources: relevantSources.length > 0 ? relevantSources : undefined,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Update achievements and XP
      if (userStats) {
        setUserStats(prev => prev ? {
          ...prev,
          xpPoints: prev.xpPoints + 5
        } : null);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleKnowledgeSelection = (knowledgeId: string) => {
    const newSelection = new Set(selectedKnowledgeIds);
    if (newSelection.has(knowledgeId)) {
      newSelection.delete(knowledgeId);
    } else {
      newSelection.add(knowledgeId);
    }
    setSelectedKnowledgeIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedKnowledgeIds.size === petKnowledge.length) {
      setSelectedKnowledgeIds(new Set());
    } else {
      setSelectedKnowledgeIds(new Set(petKnowledge.map(k => k.id)));
    }
  };

  const handleDataAdded = async () => {
    if (!selectedPet) return;
    
    // Refetch pet data after new content is added
    try {
      const [instancesResponse, knowledgeResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/instances?limit=100`),
        fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/knowledge?limit=100`)
      ]);

      let instances: DataInstance[] = [];
      let knowledge: Knowledge[] = [];

      if (instancesResponse.ok) {
        instances = await instancesResponse.json();
        setPetInstances(instances);
      }

      if (knowledgeResponse.ok) {
        knowledge = await knowledgeResponse.json();
        setPetKnowledge(knowledge);
        
        // Keep existing selections if possible, or select all if new data
        const existingSelections = new Set([...selectedKnowledgeIds].filter(id => 
          knowledge.some(k => k.id === id)
        ));
        
        // If no existing selections or all new data, select all
        if (existingSelections.size === 0) {
          setSelectedKnowledgeIds(new Set(knowledge.map(k => k.id)));
        } else {
          setSelectedKnowledgeIds(existingSelections);
        }
      }
      
      // Regenerate stats and achievements
      generateUserStats(instances, knowledge);
      generateAchievements(instances, knowledge);
      
      // Clear summary to trigger regeneration
      setKnowledgeSummary(null);
      
    } catch (error) {
      console.error('Error refetching pet data:', error);
    }
  };

  const generateContent = async (contentType: string) => {
    if (!selectedPet || petKnowledge.length === 0) {
      toast.error("Please add some knowledge sources first");
      return;
    }

    setIsGeneratingContent(true);
    
    try {
      // Use selected knowledge as context for content generation
      const selectedSources = petKnowledge.filter(k => selectedKnowledgeIds.has(k.id));
      const contextText = selectedSources
        .map((item) => `Title: ${item.title || 'Untitled'}\nContent: ${item.content}`)
        .join('\n\n---\n\n');

      const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_type: contentType,
          context: contextText,
          pet_name: selectedPet.name
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedContent({
          type: contentType,
          content: result.content
        });
        toast.success(`Generated ${contentType.replace('_', ' ')} successfully!`);
      } else {
        throw new Error('Failed to generate content');
      }

    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Navigation tabs configuration
  const navigationTabs: TabConfig[] = [
    {
      id: 'sources',
      label: 'SOURCES',
      icon: FileText
    },
    {
      id: 'chat',
      label: 'CHAT',
      icon: MessageCircle
    },
    {
      id: 'studio',
      label: 'STUDIO',
      icon: Sparkles
    }
  ];

  if (!isAuthenticated || pets.length === 0) {
    return null;
  }

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden pb-16">
      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="absolute inset-0 -z-5 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 border-1 border-blue-800 shadow-[1px_1px_0_#1e40af]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-700 border-2 border-blue-900 shadow-[2px_2px_0_#1e40af] px-3 py-1 hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {APP_NAME} - DATA INSIGHTS
          </div>
          
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Navigation Tabs */}
      <NavigationTabs
        tabs={navigationTabs}
        activeTab={activePanel}
        onTabChange={(tabId) => setActivePanel(tabId as 'sources' | 'chat' | 'studio')}
      />

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-hidden">
        {activePanel === 'sources' && (
          <SourcesPanel
            petKnowledge={petKnowledge}
            selectedKnowledgeIds={selectedKnowledgeIds}
            onToggleKnowledgeSelection={toggleKnowledgeSelection}
            onToggleSelectAll={toggleSelectAll}
            onDataAdded={handleDataAdded}
          />
        )}

        {activePanel === 'chat' && (
          <ChatPanel
            chatMessages={chatMessages}
            currentMessage={currentMessage}
            isGenerating={isGenerating}
            knowledgeSummary={knowledgeSummary}
            isLoadingSummary={isLoadingSummary}
            onCurrentMessageChange={setCurrentMessage}
            onSendMessage={handleSendMessage}
          />
        )}

        {activePanel === 'studio' && (
          <StudioPanel
            petKnowledge={petKnowledge}
            knowledgeSummary={knowledgeSummary}
            isGeneratingContent={isGeneratingContent}
            generatedContent={generatedContent}
            onGenerateContent={generateContent}
            onSetGeneratedContent={setGeneratedContent}
          />
        )}
      </div>
      
      <Toaster />
    </main>
  );
} 