"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Calendar, Clock, Users, Brain, Lightbulb, Target, Search, Sparkles, Trophy, Star, Zap, BookOpen, MessageCircle, Loader2, ChevronRight, FileText, Link, Upload, CheckCircle } from "lucide-react";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Knowledge {
  id: string;
  url?: string;
  content: string;
  title?: string;
  created_at: string;
  metadata?: any;
  embeddings?: number[];
}

interface DataInstance {
  id: string;
  content: string;
  content_type: string;
  created_at: string;
  metadata?: any;
  knowledge?: Knowledge[];
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
  const [isInferenceLoading, setIsInferenceLoading] = useState(false);
  const [inferenceQuery, setInferenceQuery] = useState("");
  const [inferenceResult, setInferenceResult] = useState("");
  const [showInferencePanel, setShowInferencePanel] = useState(false);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [showXpGain, setShowXpGain] = useState(false);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);

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
  }, [selectedPet]);

  const generateUserStats = (instances: DataInstance[], knowledge: Knowledge[]) => {
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
  };

  const generateAchievements = (instances: DataInstance[], knowledge: Knowledge[]) => {
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
        description: 'Collect 10 pieces of knowledge',
        icon: '📚',
        unlocked: knowledge.length >= 10,
        progress: Math.min(knowledge.length, 10),
        maxProgress: 10
      },
      {
        id: 'diverse_learner',
        title: 'Diverse Learner',
        description: 'Use all 3 data types (text, URL, file)',
        icon: '🌟',
        unlocked: new Set(instances.map(i => i.metadata?.type)).size >= 3,
        progress: new Set(instances.map(i => i.metadata?.type)).size,
        maxProgress: 3
      },
      {
        id: 'daily_streaker',
        title: 'Daily Streaker',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        unlocked: (userStats?.streakDays || 0) >= 7,
        progress: Math.min(userStats?.streakDays || 0, 7),
        maxProgress: 7
      },
      {
        id: 'knowledge_master',
        title: 'Knowledge Master',
        description: 'Reach level 5',
        icon: '👑',
        unlocked: (userStats?.level || 0) >= 5,
        progress: Math.min(userStats?.level || 0, 5),
        maxProgress: 5
      },
      {
        id: 'ai_explorer',
        title: 'AI Explorer',
        description: 'Use AI inference 5 times',
        icon: '🤖',
        unlocked: false, // This would need to be tracked separately
        progress: 0,
        maxProgress: 5
      }
    ];
    
    // Check for newly unlocked achievements
    const previousAchievements = [...achievements];
    const newlyUnlocked = newAchievements.filter(a => 
      a.unlocked && !previousAchievements.find(pa => pa.id === a.id && pa.unlocked)
    );
    
    if (newlyUnlocked.length > 0) {
      // Show achievement notifications
      newlyUnlocked.forEach(achievement => {
        toast.success(`🎉 Achievement Unlocked: ${achievement.title}!`, {
          description: achievement.description,
          duration: 5000
        });
      });
    }
    
    setAchievements(newAchievements);
  };

  const handleInference = async () => {
    if (!inferenceQuery.trim() || !selectedPet) {
      toast.error("Please enter a question or topic to explore");
      return;
    }

    setIsInferenceLoading(true);
    setInferenceResult("");

    try {
      // Step 1: Semantic search to find relevant knowledge
      const searchParams = new URLSearchParams({
        q: inferenceQuery,
        limit: '5',
        similarity_threshold: '0.3'
      });
      
      const searchResponse = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${selectedPet.id}/semantic/search?${searchParams}`);

      if (!searchResponse.ok) {
        throw new Error('Failed to search knowledge');
      }

      const searchResults = await searchResponse.json();
      
      if (searchResults.length === 0) {
        setInferenceResult("I couldn't find any relevant knowledge to base insights on. Try adding more data about this topic first!");
        return;
      }

      // Step 2: Generate insights using OpenAI with RAG
      const contextText = searchResults
        .map((item: any) => `Title: ${item.title || 'Untitled'}\nContent: ${item.content}`)
        .join('\n\n---\n\n');

      const ragResponse = await fetch(`${API_BASE_URL}/api/v1/ai/inference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inferenceQuery,
          context: contextText,
          pet_name: selectedPet.name
        })
      });

      if (ragResponse.ok) {
        const result = await ragResponse.json();
        setInferenceResult(result.inference || result.response || "Generated insights from your knowledge!");
        handleInferenceSuccess();
      } else {
        // Fallback: Create a simple inference without OpenAI
        const fallbackInference = `Based on your ${selectedPet.name}'s knowledge about "${inferenceQuery}", here are some key insights:\n\n${searchResults.map((item: any, idx: number) => `${idx + 1}. ${item.title || 'Knowledge piece'}: ${item.content.substring(0, 200)}...`).join('\n\n')}`;
        setInferenceResult(fallbackInference);
        handleInferenceSuccess();
      }

    } catch (error) {
      console.error('Error generating inference:', error);
      toast.error('Failed to generate insights. Please try again.');
    } finally {
      setIsInferenceLoading(false);
    }
  };

  const getKnowledgeTypeIcon = (knowledge: Knowledge) => {
    if (knowledge.url) return Link;
    if (knowledge.metadata?.type === 'file_upload') return Upload;
    return FileText;
  };

  const getKnowledgeTypeColor = (knowledge: Knowledge) => {
    if (knowledge.url) return 'text-green-600';
    if (knowledge.metadata?.type === 'file_upload') return 'text-purple-600';
    return 'text-blue-600';
  };

  const handleKnowledgeClick = (knowledge: Knowledge) => {
    setSelectedKnowledgeId(selectedKnowledgeId === knowledge.id ? null : knowledge.id);
  };

  const getLevelProgress = () => {
    if (!userStats) return 0;
    return (userStats.xpPoints % 100);
  };

  const getNextLevelXp = () => {
    if (!userStats) return 100;
    return ((userStats.level) * 100);
  };

  const handleInferenceSuccess = () => {
    // Simulate XP gain for using AI inference
    if (userStats) {
      setShowXpGain(true);
      setTimeout(() => setShowXpGain(false), 2000);
      
      // Update XP (this would normally come from backend)
      const xpGain = 5;
      setUserStats(prev => prev ? {
        ...prev,
        xpPoints: prev.xpPoints + xpGain
      } : null);
    }
  };

  if (!isAuthenticated || pets.length === 0) {
    return null;
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 overflow-x-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.3}
        flickerChance={0.1}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/home')}
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Data Insights
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Analytics & AI
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
            {/* Pet Context & Stats */}
            {selectedPet && userStats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pet Info */}
                <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-2xl sm:text-3xl">
                        🐾
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl">{selectedPet.name}'s Knowledge</CardTitle>
                        <CardDescription>Level {userStats.level} • {userStats.xpPoints} XP</CardDescription>
                      </div>
                      <div className="ml-auto">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Lvl {userStats.level}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{userStats.totalKnowledge}</div>
                        <div className="text-sm text-blue-800">Knowledge Items</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{userStats.streakDays}</div>
                        <div className="text-sm text-green-800">Day Streak</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress to Level {userStats.level + 1}</span>
                        <span>{userStats.xpPoints % 100}/100 XP</span>
                      </div>
                      <Progress value={(userStats.xpPoints % 100)} className="h-2" />
                      {showXpGain && (
                        <div className="text-center">
                          <Badge className="bg-green-100 text-green-700 animate-bounce">
                            +5 XP! 🎉
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-purple-500" />
                      <span>Activity Stats</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Daily Average</span>
                      <span className="font-medium">{userStats.avgDailyActivity.toFixed(1)} items</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Weekly Growth</span>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-600">
                          +{userStats.knowledgeGrowth.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-gray-600">Top Categories</span>
                      <div className="flex flex-wrap gap-2">
                        {userStats.topCategories.map((category, idx) => (
                          <Badge key={category} variant="outline" className="text-xs">
                            #{idx + 1} {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* AI Inference Panel */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <span>AI Knowledge Insights</span>
                  <Badge className="bg-purple-100 text-purple-700 ml-2">
                    RAG Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Ask questions about your pet's knowledge and get AI-powered insights using semantic search
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Ask about patterns, connections, or insights from your data..."
                    value={inferenceQuery}
                    onChange={(e) => setInferenceQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInference()}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleInference}
                    disabled={isInferenceLoading || !inferenceQuery.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {isInferenceLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {inferenceResult && (
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start space-x-2 mb-2">
                      <MessageCircle className="h-5 w-5 text-purple-500 mt-0.5" />
                      <span className="font-medium text-purple-800">AI Insights</span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {inferenceResult}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Display */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Recent Knowledge */}
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <span>Recent Knowledge</span>
                  </CardTitle>
                  <CardDescription>
                    Latest {Math.min(petKnowledge.length, 5)} knowledge items added to {selectedPet?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                      <p className="text-sm text-gray-600">Loading knowledge...</p>
                    </div>
                  ) : petKnowledge.length > 0 ? (
                    <div className="space-y-3">
                      {petKnowledge.slice(0, 5).map((knowledge) => {
                        const TypeIcon = getKnowledgeTypeIcon(knowledge);
                        const isExpanded = selectedKnowledgeId === knowledge.id;
                        return (
                          <div key={knowledge.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                            <div 
                              className="flex items-start space-x-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => handleKnowledgeClick(knowledge)}
                            >
                              <TypeIcon className={cn("h-4 w-4 mt-1 flex-shrink-0", getKnowledgeTypeColor(knowledge))} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm truncate">
                                    {knowledge.title || knowledge.url || 'Untitled Knowledge'}
                                  </h4>
                                  <ChevronRight className={cn(
                                    "h-4 w-4 text-gray-400 transition-transform",
                                    isExpanded && "rotate-90"
                                  )} />
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {knowledge.content ? knowledge.content.substring(0, 100) + (knowledge.content.length > 100 ? '...' : '') : 'No content available'}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {new Date(knowledge.created_at).toLocaleDateString()}
                                  </span>
                                  <div className="flex space-x-1">
                                    {knowledge.url && (
                                      <Badge variant="outline" className="text-xs">
                                        URL
                                      </Badge>
                                    )}
                                    {knowledge.embeddings && (
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                        AI Indexed
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="border-t border-gray-200 p-3 bg-white">
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-1">Full Content:</h5>
                                    <p className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                                      {knowledge.content || 'No content available'}
                                    </p>
                                  </div>
                                  
                                  {knowledge.url && (
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Source URL:</h5>
                                      <a 
                                        href={knowledge.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                                      >
                                        {knowledge.url}
                                      </a>
                                    </div>
                                  )}
                                  
                                  {knowledge.metadata && Object.keys(knowledge.metadata).length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-medium text-gray-700 mb-1">Metadata:</h5>
                                      <div className="flex flex-wrap gap-1">
                                        {Object.entries(knowledge.metadata).map(([key, value]) => (
                                          <Badge key={key} variant="outline" className="text-xs">
                                            {key}: {String(value)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInferenceQuery(`Tell me more about: ${knowledge.title || knowledge.content?.substring(0, 50) || 'this knowledge'}`);
                                    }}
                                  >
                                    <Brain className="h-3 w-3 mr-1" />
                                    Ask AI about this
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {petKnowledge.length > 5 && (
                        <Button variant="outline" className="w-full text-sm">
                          View All {petKnowledge.length} Items
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-2">No knowledge items yet</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/add-data')}
                      >
                        Add First Knowledge
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Achievements</span>
                  </CardTitle>
                  <CardDescription>
                    Your progress and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {achievements.map((achievement) => (
                      <div 
                        key={achievement.id} 
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border",
                          achievement.unlocked 
                            ? "bg-green-50 border-green-200" 
                            : "bg-gray-50 border-gray-200"
                        )}
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className={cn(
                            "font-medium text-sm",
                            achievement.unlocked ? "text-green-800" : "text-gray-700"
                          )}>
                            {achievement.title}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {achievement.description}
                          </p>
                          <div className="mt-2">
                            <Progress 
                              value={(achievement.progress / achievement.maxProgress) * 100} 
                              className="h-1"
                            />
                            <span className="text-xs text-gray-500 mt-1">
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                          </div>
                        </div>
                        {achievement.unlocked && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 