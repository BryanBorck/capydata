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

const API_BASE_URL = 'http://localhost:8000';

interface Knowledge {
  id: string;
  url?: string;
  content: string;
  title?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  embeddings?: number[];
}

interface DataInstance {
  id: string;
  content: string;
  content_type: string;
  created_at: string;
  metadata?: Record<string, unknown>;
  knowledge?: Knowledge[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Knowledge[];
  isGenerating?: boolean;
}

interface UserStats {
  totalKnowledge: number;
  totalInstances: number;
  avgDailyActivity: number;
  knowledgeGrowth: number;
  topCategories: string[];
  streakDays: number;
  xpPoints: number;
  level: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

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
  const [showCitations, setShowCitations] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Content generation state
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{type: string, content: string} | null>(null);

  // State for dynamic knowledge summary
  const [knowledgeSummary, setKnowledgeSummary] = useState<{title: string, summary: string, icon: string} | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Chat scroll ref
  const chatMessagesRef = useRef<HTMLDivElement>(null);

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
        
        // Initialize welcome message will be handled by the knowledge summary effect
        
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

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isGenerating]);

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

  const suggestedQuestions = [
    "What are the main topics covered in these sources?",
    "Can you summarize the key insights from this knowledge base?",
    "What are the most important findings or conclusions?",
    "How do these sources relate to each other?",
    "What practical applications can be derived from this information?"
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
      <div className="relative z-10 px-6 py-4 bg-white border-b-4 border-gray-800 shadow-[0_4px_0_#374151]">
        <div className="flex items-center space-x-4">
          <button 
            className={cn(
              "font-silkscreen text-xs font-bold uppercase px-4 py-2 border-2 shadow-[2px_2px_0_#374151] transition-all",
              activePanel === 'sources' 
                ? "bg-blue-100 border-blue-600 text-blue-800 shadow-[2px_2px_0_#1e40af]" 
                : "bg-gray-100 border-gray-600 text-gray-800 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151]"
            )}
            onClick={() => setActivePanel('sources')}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-3 w-3" />
              <span>SOURCES</span>
            </div>
          </button>
          <button 
            className={cn(
              "font-silkscreen text-xs font-bold uppercase px-4 py-2 border-2 shadow-[2px_2px_0_#374151] transition-all",
              activePanel === 'chat' 
                ? "bg-blue-100 border-blue-600 text-blue-800 shadow-[2px_2px_0_#1e40af]" 
                : "bg-gray-100 border-gray-600 text-gray-800 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151]"
            )}
            onClick={() => setActivePanel('chat')}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-3 w-3" />
              <span>CHAT</span>
            </div>
          </button>
          <button 
            className={cn(
              "font-silkscreen text-xs font-bold uppercase px-4 py-2 border-2 shadow-[2px_2px_0_#374151] transition-all",
              activePanel === 'studio' 
                ? "bg-blue-100 border-blue-600 text-blue-800 shadow-[2px_2px_0_#1e40af]" 
                : "bg-gray-100 border-gray-600 text-gray-800 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151]"
            )}
            onClick={() => setActivePanel('studio')}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-3 w-3" />
              <span>STUDIO</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-hidden">
        {activePanel === 'sources' && (
          <div className="h-full flex flex-col px-6 py-6">
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
                  onClick={() => router.push('/add-data')}
                  className="font-silkscreen text-xs font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center gap-2 flex-1"
                >
                  <Plus className="h-3 w-3" />
                  ADD DATA
                </button>
                <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center gap-2 flex-1">
                  <Search className="h-3 w-3" />
                  DISCOVER
                </button>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={toggleSelectAll}
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
                        onClick={() => toggleKnowledgeSelection(knowledge.id)}
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
                        <div className="w-8 h-8 bg-red-600 border-2 border-red-800 shadow-[2px_2px_0_#7f1d1d] flex items-center justify-center flex-shrink-0">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase truncate">
                            {knowledge.url || knowledge.title || `TEXT CONTENT ${knowledge.id.slice(0, 8)}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'chat' && (
          <div className="h-full flex flex-col px-6 py-6">
            {/* Knowledge Header - Only show when no user messages */}
            {chatMessages.filter(m => m.role === 'user').length === 0 && (
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e40af] flex items-center justify-center flex-shrink-0">
                    {isLoadingSummary ? (
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    ) : (
                      <div className="text-2xl">{knowledgeSummary?.icon || '📚'}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    {isLoadingSummary ? (
                      <div className="space-y-3">
                        <div className="h-6 bg-gray-200 border-2 border-gray-400 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 border-2 border-gray-400 w-32 animate-pulse"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 border-2 border-gray-400 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 border-2 border-gray-400 w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    ) : knowledgeSummary ? (
                      <>
                        <h1 className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
                          {knowledgeSummary.title}
                        </h1>
                        <p className="font-silkscreen text-xs text-gray-600 leading-relaxed mb-4 uppercase">
                          {knowledgeSummary.summary}
                        </p>
                        <div className="flex items-center space-x-3">
                          <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
                          NO KNOWLEDGE SOURCES
                        </h1>
                        <p className="font-silkscreen text-xs text-gray-600 mb-4 uppercase">0 SOURCES</p>
                        <p className="font-silkscreen text-xs text-gray-600 leading-relaxed uppercase">
                          ADD SOME KNOWLEDGE SOURCES TO START EXPLORING YOUR DATA.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b-2 border-gray-600 bg-gray-100">
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                  CHAT WITH YOUR DATA
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="space-y-4">
                  {chatMessages.filter(m => m.id !== 'welcome').map((message) => (
                    <div key={message.id} className="space-y-3">
                      {message.role === 'user' ? (
                        <div className="flex justify-end">
                          <div className="bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] text-white p-3 max-w-[80%]">
                            <p className="font-silkscreen text-xs uppercase">{message.content}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] text-gray-800 p-3 max-w-[80%]">
                            <p className="font-silkscreen text-xs uppercase whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isGenerating && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                          <span className="font-silkscreen text-xs text-gray-600 uppercase">THINKING...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Chat Input Area at Bottom */}
              <div className="border-t-2 border-gray-600 bg-gray-50 p-4">
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="TYPE YOUR MESSAGE..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="font-silkscreen text-xs uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-2 flex-1 placeholder-gray-500 focus:outline-none focus:border-blue-600"
                      disabled={isGenerating}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={isGenerating || !currentMessage.trim()}
                      className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e40af] px-4 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Suggested Questions */}
                  <div>
                    <div className="font-silkscreen text-xs text-gray-600 uppercase mb-2">
                      QUICK PROMPTS:
                    </div>
                    <div className="flex space-x-2 overflow-x-auto">
                      {suggestedQuestions.slice(0, 3).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMessage(question)}
                          className="font-silkscreen text-xs text-gray-800 uppercase bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all whitespace-nowrap"
                        >
                          {question.length > 30 ? question.substring(0, 30) + '...' : question}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'studio' && (
          <div className="h-full overflow-auto px-6 py-6">
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
              <div className="mb-6">
                <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
                  <Sparkles className="h-6 w-6" />
                  CONTENT STUDIO
                </div>
                <div className="font-silkscreen text-xs text-gray-600 uppercase">
                  GENERATE AI-POWERED CONTENT
                </div>
              </div>
              
              {/* Content Generation Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => generateContent('study_guide')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                  className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e40af] p-4 hover:bg-blue-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
                >
                  {isGeneratingContent && generatedContent?.type === 'study_guide' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <BookOpen className="h-6 w-6" />
                  )}
                  <span>STUDY GUIDE</span>
                </button>
                
                <button 
                  onClick={() => generateContent('briefing')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                  className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] p-4 hover:bg-green-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
                >
                  {isGeneratingContent && generatedContent?.type === 'briefing' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <FileText className="h-6 w-6" />
                  )}
                  <span>BRIEFING DOC</span>
                </button>
                
                <button 
                  onClick={() => generateContent('faq')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                  className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-purple-100 border-2 border-purple-600 shadow-[2px_2px_0_#581c87] p-4 hover:bg-purple-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
                >
                  {isGeneratingContent && generatedContent?.type === 'faq' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <MessageCircle className="h-6 w-6" />
                  )}
                  <span>FAQ</span>
                </button>
                
                <button 
                  onClick={() => generateContent('timeline')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                  className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-orange-100 border-2 border-orange-600 shadow-[2px_2px_0_#c2410c] p-4 hover:bg-orange-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#c2410c] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center gap-2"
                >
                  {isGeneratingContent && generatedContent?.type === 'timeline' ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Target className="h-6 w-6" />
                  )}
                  <span>TIMELINE</span>
                </button>
              </div>

              {/* Knowledge Summary */}
              {knowledgeSummary && petKnowledge.length > 0 && (
                <div className="bg-gray-50 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-4 mb-6">
                  <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
                    KNOWLEDGE OVERVIEW
                  </div>
                  <div className="font-silkscreen text-xs text-gray-600 uppercase leading-relaxed">
                    {knowledgeSummary.summary.length > 200 
                      ? knowledgeSummary.summary.substring(0, 200) + '...' 
                      : knowledgeSummary.summary}
                  </div>
                </div>
              )}

              {/* No Knowledge Sources Warning */}
              {petKnowledge.length === 0 && (
                <div className="bg-yellow-100 border-2 border-yellow-600 shadow-[2px_2px_0_#92400e] p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-yellow-800 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-silkscreen text-sm font-bold text-yellow-800 uppercase">NO KNOWLEDGE SOURCES</h3>
                      <p className="font-silkscreen text-xs text-yellow-700 mt-1 uppercase">
                        ADD KNOWLEDGE SOURCES TO START GENERATING CONTENT.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-silkscreen text-lg font-bold text-gray-800 uppercase">
                      {generatedContent.type.replace('_', ' ')}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => copyMessage(generatedContent.content)}
                        className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-3 py-1 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button 
                        onClick={() => setGeneratedContent(null)}
                        className="font-silkscreen text-xs font-bold text-red-800 uppercase bg-red-100 border-2 border-red-600 shadow-[2px_2px_0_#7f1d1d] px-3 py-1 hover:bg-red-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#7f1d1d] transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white border-2 border-gray-600 shadow-[2px_2px_0_#374151]">
                    <div className="p-6">
                      <div className="font-silkscreen text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {generatedContent.content}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button className="font-silkscreen text-xs font-bold text-gray-800 uppercase bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#374151] transition-all flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      SAVE TO NOTE
                    </button>
                    <button 
                      onClick={() => copyMessage(generatedContent.content)}
                      className="font-silkscreen text-xs font-bold text-blue-800 uppercase bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e40af] px-4 py-2 hover:bg-blue-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e40af] transition-all flex items-center gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      COPY
                    </button>
                    <button 
                      onClick={() => generateContent(generatedContent.type)}
                      disabled={isGeneratingContent}
                      className="font-silkscreen text-xs font-bold text-green-800 uppercase bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGeneratingContent ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      REGENERATE
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Toaster />
    </main>
  );
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content);
  toast.success("Copied to clipboard!");
}; 