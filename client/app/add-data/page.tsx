"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, Link, Brain, Loader2, CheckCircle, X, PawPrint, Heart, Zap, Users, Star, Sparkles, Search, MoreVertical, Eye, Trash2, Plus } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface DataType {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  statBoost: string;
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

interface Knowledge {
  id: string;
  url?: string;
  content: string;
  title?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const DATA_TYPES: DataType[] = [
  {
    id: 'social',
    title: 'Social Content',
    description: 'Twitter posts, social media content',
    icon: Users,
    color: 'from-blue-500 to-cyan-500',
    statBoost: '+3 Social, +1 Streak'
  },
  {
    id: 'trivia',
    title: 'Trivia & Knowledge',
    description: 'Fun facts, trivia questions, general knowledge',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    statBoost: '+3 Trivia, +1 Streak'
  },
  {
    id: 'science',
    title: 'Science Papers',
    description: 'arXiv papers, research documents, scientific content',
    icon: Sparkles,
    color: 'from-green-500 to-emerald-500',
    statBoost: '+3 Science, +1 Streak'
  },
  {
    id: 'code',
    title: 'Code & Documentation',
    description: 'GitHub repos, documentation, programming content',
    icon: FileText,
    color: 'from-orange-500 to-red-500',
    statBoost: '+3 Code, +1 Streak'
  },
  {
    id: 'trenches',
    title: 'Crypto & Finance',
    description: 'Crypto info, DeFi, blockchain, financial content',
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    statBoost: '+3 Trenches, +1 Streak'
  },
  {
    id: 'general',
    title: 'General Content',
    description: 'Text, articles, or general written content',
    icon: FileText,
    color: 'from-gray-500 to-slate-500',
    statBoost: '+2 Streak'
  }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AddDataPage() {
  const [petKnowledge, setPetKnowledge] = useState<Knowledge[]>([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [showDataTypeDialog, setShowDataTypeDialog] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, pets } = useUser();

  // Get active pet
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();
  const activePet = pets.find((p: Pet) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Fetch pet knowledge
  useEffect(() => {
    if (!activePet) return;

    const fetchPetKnowledge = async () => {
      setIsLoadingKnowledge(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${activePet.id}/knowledge?limit=20`);
        if (response.ok) {
          const knowledge = await response.json();
          setPetKnowledge(knowledge);
        }
      } catch (error) {
        console.error('Error fetching pet knowledge:', error);
      } finally {
        setIsLoadingKnowledge(false);
      }
    };

    fetchPetKnowledge();
  }, [activePet]);

  // Redirect if not authenticated or no pets
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

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPetImage = (petId: string, rarity: string) => {
    const petEmojis = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐢'];
    const index = petId.charCodeAt(0) % petEmojis.length;
    return petEmojis[index];
  };

  const getKnowledgeTypeIcon = (knowledge: Knowledge) => {
    if (knowledge.url) return '🔗';
    if (knowledge.metadata?.type === 'file_upload') return '📎';
    return '📄';
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleDataTypeSelect = (category: string) => {
    setShowDataTypeDialog(false);
    router.push(`/add-data/entry?petId=${activePet?.id}&category=${category}`);
  };

  if (!isAuthenticated || pets.length === 0) {
    return null;
  }

  if (!activePet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Pet</h2>
          <p className="text-gray-600 mb-4">Please select a pet first!</p>
          <Button onClick={() => router.push('/select-pet')}>
            Select Pet
          </Button>
        </div>
      </div>
    );
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
                  Feed Your Pet
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Add Data
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Active Pet Card */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Your Active Pet</h2>
              
              <Card className={cn(
                "relative overflow-hidden border-4 shadow-xl bg-gradient-to-br",
                getRarityColor(activePet.rarity)
              )}>
                {/* Rarity Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_70%)]" />
                </div>

                {/* Active Badge */}
                <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg z-10">
                  <CheckCircle className="h-3 w-3" />
                  <span>Active</span>
                </div>

                <CardHeader className="relative bg-white/90 backdrop-blur-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 mt-2">
                      {/* Pet Image */}
                      <div className={cn(
                        "w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg bg-gradient-to-br",
                        getRarityColor(activePet.rarity)
                      )}>
                        {getPetImage(activePet.id, activePet.rarity)}
                      </div>
                      
                      {/* Pet Info */}
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900">
                          {activePet.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          Born {new Date(activePet.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Rarity Badge */}
                    <Badge className={cn(
                      "border font-semibold mt-2",
                      getRarityBadgeColor(activePet.rarity)
                    )}>
                      <Star className="h-3 w-3 mr-1" />
                      {activePet.rarity}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="relative bg-white/95 backdrop-blur-sm space-y-4 p-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-blue-600">{activePet.social}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Social</div>
                      <Progress value={activePet.social} className="h-1 mt-1" />
                    </div>

                    <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <Brain className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-purple-600">{activePet.trivia}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Trivia</div>
                      <Progress value={activePet.trivia} className="h-1 mt-1" />
                    </div>

                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <Sparkles className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-green-600">{activePet.science}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Science</div>
                      <Progress value={activePet.science} className="h-1 mt-1" />
                    </div>

                    <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <FileText className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-orange-600">{activePet.code}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Code</div>
                      <Progress value={activePet.code} className="h-1 mt-1" />
                    </div>

                    <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <Zap className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-amber-600">{activePet.trenches}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Trenches</div>
                      <Progress value={activePet.trenches} className="h-1 mt-1" />
                    </div>

                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <CheckCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <div className="font-bold text-lg text-red-600">{activePet.streak}</div>
                      <div className="text-xs text-gray-600 uppercase tracking-wide">Streak</div>
                      <Progress value={activePet.streak} className="h-1 mt-1" />
                    </div>
                  </div>

                  {/* Knowledge Count */}

                </CardContent>
              </Card>
            </div>

            {/* Knowledge Sources Section */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Sources</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDataTypeDialog(true)}
                  className="text-xs bg-blue-500 text-white hover:bg-blue-600 border-blue-500"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Entry
                </Button>
              </div>
              
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200">
                <CardContent className="p-4">
                  {isLoadingKnowledge ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 rounded mb-1"></div>
                              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : petKnowledge.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Sources Yet</h3>
                      <p className="text-sm text-gray-600 mb-4">Start adding data to build your pet&apos;s intelligence!</p>
                      <Button 
                        onClick={() => setShowDataTypeDialog(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Entry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {petKnowledge.slice(0, 5).map((knowledge) => (
                        <div key={knowledge.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg group">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">{getKnowledgeTypeIcon(knowledge)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {knowledge.title || knowledge.url || 'Untitled'}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {knowledge.url ? knowledge.url : truncateText(knowledge.content, 60)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(knowledge.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {petKnowledge.length > 5 && (
                        <div className="pt-2 border-t border-gray-200">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-purple-600 hover:text-purple-700"
                            onClick={() => router.push('/data-insights')}
                          >
                            View {petKnowledge.length - 5} more sources
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Data Type Selection Dialog */}
      <Drawer open={showDataTypeDialog} onOpenChange={setShowDataTypeDialog}>
        <DrawerContent className="sm:max-w-md">
          <DrawerHeader>
            <DrawerTitle>Choose Data Type</DrawerTitle>
            <DrawerDescription>
              Select the type of data you want to add to {activePet?.name}&apos;s knowledge base.
            </DrawerDescription>
          </DrawerHeader>
          
          <div className="space-y-3">
            {DATA_TYPES.map((type) => (
              <Card 
                key={type.id}
                className="cursor-pointer transition-all hover:shadow-md hover:bg-gray-50"
                onClick={() => handleDataTypeSelect(type.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${type.color}`}>
                      <type.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{type.title}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {type.statBoost}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
      
      <Toaster />
    </main>
  );
} 