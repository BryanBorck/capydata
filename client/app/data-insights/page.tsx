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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-10">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => router.back()}
                className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center space-x-8">
              <button 
                className={cn(
                  "text-sm font-medium pb-3 border-b-2 transition-colors",
                  activePanel === 'sources' 
                    ? "text-gray-900 border-blue-600" 
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                )}
                onClick={() => setActivePanel('sources')}
              >
                <div className="flex items-center space-x-5">
                  <span className="text-md">Sources</span>
                </div>
              </button>
              <button 
                className={cn(
                  "text-sm font-medium pb-3 border-b-2 transition-colors",
                  activePanel === 'chat' 
                    ? "text-gray-900 border-blue-600" 
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                )}
                onClick={() => setActivePanel('chat')}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-md">Chat</span>
                </div>
              </button>
              <button 
                className={cn(
                  "text-sm font-medium pb-3 border-b-2 transition-colors",
                  activePanel === 'studio' 
                    ? "text-gray-900 border-blue-600" 
                    : "text-gray-600 hover:text-gray-900 border-transparent"
                )}
                onClick={() => setActivePanel('studio')}
              >
                <div className="flex items-center space-x-2">

                  <span className="text-md">Studio</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activePanel === 'sources' && (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex space-x-3 mb-6">
                <Button className="bg-gray-800 hover:bg-gray-700 text-white flex-1" onClick={() => router.push('/add-data')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 flex-1">
                  <Search className="h-4 w-4 mr-2" />
                  Discover
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className={cn(
                    "w-5 h-5 border border-gray-400 rounded flex items-center justify-center",
                    selectedKnowledgeIds.size === petKnowledge.length ? "bg-blue-600 border-blue-600" : ""
                  )}>
                    {selectedKnowledgeIds.size === petKnowledge.length && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">Select all sources</span>
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1 px-6">
              <div className="space-y-3 py-4">
                {petKnowledge.map((knowledge) => (
                  <div key={knowledge.id} className="flex items-center space-x-3 group">
                    <button
                      onClick={() => toggleKnowledgeSelection(knowledge.id)}
                      className="flex-shrink-0"
                    >
                      <div className={cn(
                        "w-5 h-5 border border-gray-400 rounded flex items-center justify-center",
                        selectedKnowledgeIds.has(knowledge.id) ? "bg-blue-600 border-blue-600" : ""
                      )}>
                        {selectedKnowledgeIds.has(knowledge.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </button>
                    
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">
                          {knowledge.url || knowledge.title || `Text content ${knowledge.id.slice(0, 8)}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {activePanel === 'chat' && (
          <div className="h-full flex flex-col relative">
            {/* Knowledge Header - Only show when no user messages */}
            {chatMessages.filter(m => m.role === 'user').length === 0 && (
              <div className="p-6 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {isLoadingSummary ? (
                      <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
                    ) : (
                      <div className="text-2xl">{knowledgeSummary?.icon || '📚'}</div>
                    )}
                  </div>
                  <div className="flex-1">
                    {isLoadingSummary ? (
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                        </div>
                      </div>
                    ) : knowledgeSummary ? (
                      <>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">
                          {knowledgeSummary.title}
                        </h1>
                        <p className="text-sm text-gray-700 leading-relaxed mb-4">
                          {knowledgeSummary.summary}
                        </p>
                        <div className="flex items-center space-x-3">
                          <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                            <FileText className="h-4 w-4 mr-2" />
                            Save to note
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="text-xl font-semibold text-gray-900 mb-2">
                          No Knowledge Sources
                        </h1>
                        <p className="text-sm text-gray-600 mb-4">0 sources</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Add some knowledge sources to start exploring and chatting with your data.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages - Takes remaining space with bottom padding for fixed input */}
            <div className="flex-1 overflow-hidden">
              <div 
                ref={chatMessagesRef}
                className="h-full overflow-y-auto scroll-smooth pb-44"
              >
                <div className="px-6 py-4">
                  <div className="space-y-6 max-w-4xl">
                    {chatMessages.filter(m => m.id !== 'welcome').map((message) => (
                      <div key={message.id} className="space-y-3">
                        {message.role === 'user' ? (
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-[80%]">
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-3 max-w-[80%]">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                            <span className="text-sm text-gray-600">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Chat Input Area at Bottom */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">

              {/* Chat Input */}
              <div className="p-6">
                <div className="relative">
                  <Input
                    placeholder="Start typing..."
                    value={currentMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 pr-16"
                    disabled={isGenerating}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded text-xs text-gray-600">
                      ({petKnowledge.length})
                    </div>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isGenerating || !currentMessage.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 w-8 h-8 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Compact Suggested Questions - Single Row */}
                <div className="mt-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-gray-500">Suggestions:</span>
                  </div>
                  <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                    {suggestedQuestions.slice(0, 3).map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMessage(question)}
                        className="flex-shrink-0 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs text-gray-700 hover:text-gray-900 transition-colors border border-gray-200"
                      >
                        {question.length > 50 ? question.substring(0, 50) + '...' : question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activePanel === 'studio' && (
          <div className="h-full overflow-auto bg-white">
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>

              {/* Add Note Button */}
              <Button variant="outline" className="w-full border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 h-8">
                <Plus className="h-4 w-4 mr-2" />
                Add note
              </Button>

              {/* Content Generation Grid */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 h-8 text-sm flex flex-row items-center justify-center"
                  onClick={() => generateContent('study_guide')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                >
                  {isGeneratingContent && generatedContent?.type !== 'study_guide' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mb-1" />
                      <span className="text-xs">Study guide</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 h-8 text-sm flex flex-row items-center justify-center"
                  onClick={() => generateContent('briefing')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                >
                  {isGeneratingContent && generatedContent?.type !== 'briefing' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="h-5 w-5 mb-1" />
                      <span className="text-xs">Briefing doc</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 h-8 text-sm flex flex-row items-center justify-center"
                  onClick={() => generateContent('faq')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                >
                  {isGeneratingContent && generatedContent?.type !== 'faq' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="h-5 w-5 mb-1" />
                      <span className="text-xs">FAQ</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 h-8 text-sm flex flex-row items-center justify-center"
                  onClick={() => generateContent('timeline')}
                  disabled={isGeneratingContent || petKnowledge.length === 0}
                >
                  {isGeneratingContent && generatedContent?.type !== 'timeline' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Target className="h-5 w-5 mb-1" />
                      <span className="text-xs">Timeline</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Knowledge Summary */}
              {knowledgeSummary && petKnowledge.length > 0 && (
             
                  <div className="flex items-start justify-baseline space-x-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium text-gray-900 truncate mb-1">
                        {knowledgeSummary.title.length > 60 
                          ? knowledgeSummary.title.substring(0, 60) + '...' 
                          : knowledgeSummary.title}
                      </h3>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {knowledgeSummary.summary.length > 120 
                          ? knowledgeSummary.summary.substring(0, 120) + '...' 
                          : knowledgeSummary.summary}
                      </p>
                    </div>
                  </div>
              )}

              {/* No Knowledge Sources Warning */}
              {petKnowledge.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">No Knowledge Sources</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Add some knowledge sources to start generating AI-powered content.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Content Display */}
              {generatedContent && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 capitalize">
                      {generatedContent.type.replace('_', ' ')}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => copyMessage(generatedContent.content)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => setGeneratedContent(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {generatedContent.content}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex items-center space-x-3">
                    <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <FileText className="h-4 w-4 mr-2" />
                      Save to note
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => copyMessage(generatedContent.content)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => generateContent(generatedContent.type)}
                      disabled={isGeneratingContent}
                    >
                      {isGeneratingContent ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Regenerate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <Toaster />
    </div>
  );
}

const copyMessage = (content: string) => {
  navigator.clipboard.writeText(content);
  toast.success("Copied to clipboard!");
}; 