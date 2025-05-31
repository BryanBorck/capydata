"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Zap, Users, CheckCircle, ChevronLeft, ChevronRight, Star, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Database } from "@/lib/types/database";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Pet = Database['public']['Tables']['pets']['Row'];

interface Knowledge {
  id: string;
  url?: string;
  content: string;
  title?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface PetSummary {
  title: string;
  summary: string;
  icon: string;
  knowledgeCount: number;
}

export default function SelectPetPage() {
  const router = useRouter();
  const { pets } = useUser();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [petSummaries, setPetSummaries] = useState<{ [key: string]: PetSummary }>({});
  const [loadingSummaries, setLoadingSummaries] = useState<{ [key: string]: boolean }>({});

  // Get current active pet ID from localStorage
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();

  // Load pet summaries
  useEffect(() => {
    const loadPetSummaries = async () => {
      for (const pet of pets) {
        if (petSummaries[pet.id]) continue;
        
        setLoadingSummaries(prev => ({ ...prev, [pet.id]: true }));
        
        try {
          // Fetch pet knowledge
          const knowledgeResponse = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${pet.id}/knowledge?limit=10`);
          
          if (knowledgeResponse.ok) {
            const knowledge: Knowledge[] = await knowledgeResponse.json();
            
            if (knowledge.length > 0) {
              // Generate summary
              const combinedContent = knowledge
                .map(k => `Title: ${k.title || 'Untitled'}\nContent: ${k.content}`)
                .join('\n\n---\n\n');

              const summaryResponse = await fetch(`${API_BASE_URL}/api/v1/ai/generate-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content_type: 'summary',
                  context: combinedContent,
                  pet_name: pet.name,
                  additional_instructions: 'Generate a very brief 1-2 sentence summary of the key topics covered.'
                })
              });

              let summary = '';
              if (summaryResponse.ok) {
                const result = await summaryResponse.json();
                summary = result.content;
              } else {
                // Fallback summary
                const topics = knowledge.map(k => k.title || k.content.substring(0, 30)).slice(0, 3).join(', ');
                summary = `Contains ${knowledge.length} sources covering ${topics}`;
              }

              const icon = generateKnowledgeIcon(knowledge);
              
              setPetSummaries(prev => ({
                ...prev,
                [pet.id]: {
                  title: `${pet.name}'s Knowledge`,
                  summary: summary.length > 100 ? summary.substring(0, 100) + '...' : summary,
                  icon,
                  knowledgeCount: knowledge.length
                }
              }));
            } else {
              setPetSummaries(prev => ({
                ...prev,
                [pet.id]: {
                  title: `${pet.name}'s Knowledge`,
                  summary: 'No knowledge sources yet. Start adding data to build your pet\'s intelligence!',
                  icon: '📚',
                  knowledgeCount: 0
                }
              }));
            }
          }
        } catch (error) {
          console.error(`Error loading summary for pet ${pet.id}:`, error);
          setPetSummaries(prev => ({
            ...prev,
            [pet.id]: {
              title: `${pet.name}'s Knowledge`,
              summary: 'Unable to load knowledge summary.',
              icon: '📚',
              knowledgeCount: 0
            }
          }));
        } finally {
          setLoadingSummaries(prev => ({ ...prev, [pet.id]: false }));
        }
      }
    };

    if (pets.length > 0) {
      loadPetSummaries();
    }
  }, [pets, petSummaries]);

  const generateKnowledgeIcon = (knowledge: Knowledge[]) => {
    if (knowledge.length === 0) return '📚';

    const allContent = knowledge.map(k => k.content + ' ' + (k.title || '')).join(' ').toLowerCase();
    
    const emojiMapping = [
      { keywords: ['research', 'study', 'analysis', 'paper', 'academic'], emoji: '🔬' },
      { keywords: ['technology', 'software', 'programming', 'code', 'development'], emoji: '💻' },
      { keywords: ['business', 'market', 'finance', 'economy', 'strategy'], emoji: '📈' },
      { keywords: ['health', 'medical', 'healthcare', 'medicine', 'treatment'], emoji: '🏥' },
      { keywords: ['education', 'learning', 'teaching', 'school', 'university'], emoji: '🎓' },
      { keywords: ['science', 'experiment', 'data', 'scientific', 'discovery'], emoji: '🧪' },
      { keywords: ['ai', 'artificial', 'intelligence', 'machine', 'learning'], emoji: '🤖' },
    ];

    for (const mapping of emojiMapping) {
      if (mapping.keywords.some(keyword => allContent.includes(keyword))) {
        return mapping.emoji;
      }
    }

    return knowledge.length >= 10 ? '📚' : knowledge.length >= 5 ? '📖' : '📄';
  };

  // Carousel navigation
  const nextPet = () => {
    setCurrentIndex((prev) => (prev + 1) % pets.length);
  };

  const prevPet = () => {
    setCurrentIndex((prev) => (prev - 1 + pets.length) % pets.length);
  };

  // Handle pet selection
  const selectPet = (pet: Pet) => {
    if (pet.id === activePetId) {
      toast.info(`${pet.name} is already your active pet!`);
      return;
    }
    
    setSelectedPet(pet);
  };

  // Confirm pet selection
  const confirmSelection = async () => {
    if (!selectedPet) return;
    
    setIsLoading(true);
    
    try {
      localStorage.setItem('activePetId', selectedPet.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${selectedPet.name} is now your active pet!`);
      setSelectedPet(null);
      
      setTimeout(() => router.push('/home'), 500);
    } catch (error) {
      toast.error('Failed to select pet');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel selection
  const cancelSelection = () => {
    setSelectedPet(null);
  };

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
    // Generate a consistent pet emoji based on ID and rarity
    const petEmojis = ['🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐢'];
    const index = petId.charCodeAt(0) % petEmojis.length;
    return petEmojis[index];
  };

  if (pets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Pets Available</h2>
          <p className="text-gray-600 mb-4">You need to create a pet first!</p>
          <Button onClick={() => router.push('/onboard')}>
            Create Your First Pet
          </Button>
        </div>
      </div>
    );
  }

  const currentPet = pets[currentIndex];
  const isActive = currentPet?.id === activePetId;
  const summary = petSummaries[currentPet?.id];
  const isLoadingSummary = loadingSummaries[currentPet?.id];

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center overflow-hidden relative">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={5}
        color="#6B7280"
        maxOpacity={0.3}
        flickerChance={0.1}
      />
      
      {/* Header */}
      <header className="relative w-full z-10 h-16 flex items-center justify-center bg-white/60 backdrop-blur-sm border-b border-gray-200/60 shadow-sm">
          <div className="absolute left-3 h-8 w-8 bg-violet-500 rounded-full flex items-center justify-center cursor-pointer" onClick={() => router.push('/home')}>
            <ArrowLeft className="h-4 w-4 text-white" />
          </div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-gray-700">Select Pet</div>
      </header>

      {/* Carousel Container */}
      <main className="max-w-md mx-auto p-4 flex flex-col justify-center min-h-[calc(100vh-120px)]">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Active Pet</h2>
          <p className="text-gray-600 text-sm">
            Swipe or use arrows to browse your pets
          </p>
        </div>

        {/* Pokemon-style Card */}
        <div className="relative">
          <Card className={cn(
            "relative overflow-hidden border-4 shadow-xl transform transition-all duration-300",
            `bg-gradient-to-br ${getRarityColor(currentPet.rarity)}`,
            isActive && "ring-4 ring-green-400 ring-offset-2"
          )}>
            {/* Rarity Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_70%)]" />
            </div>

            {/* Active Badge */}
            {isActive && (
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full flex items-center space-x-1 shadow-lg z-100">
                <CheckCircle className="h-3 w-3" />
                <span>Active</span>
              </div>
            )}

            <CardHeader className="relative bg-white/90 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 mt-2">
                  {/* Pet Image */}
                  {/* <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-lg",
                    `bg-gradient-to-br ${getRarityColor(currentPet.rarity)}`
                  )}>
                    {getPetImage(currentPet.id, currentPet.rarity)}
                  </div> */}
                  
                  {/* Pet Info */}
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {currentPet.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Born {new Date(currentPet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Rarity Badge */}
                <Badge className={cn(
                  "border font-semibold mt-2",
                  getRarityBadgeColor(currentPet.rarity)
                )}>
                  <Star className="h-3 w-3 mr-1" />
                  {currentPet.rarity}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="relative bg-white/95 backdrop-blur-sm space-y-4 p-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Heart className="h-5 w-5 text-violet-500 mx-auto mb-1" />
                  <div className="font-bold text-lg text-violet-500">{currentPet.health}</div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Health</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Zap className="h-5 w-5 text-violet-500 mx-auto mb-1" />
                  <div className="font-bold text-lg text-violet-500">{currentPet.strength}</div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Strength</div>
                </div>
                
                <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Users className="h-5 w-5 text-violet-500 mx-auto mb-1" />
                  <div className="font-bold text-lg text-violet-500">{currentPet.social}</div>
                  <div className="text-xs text-gray-600 uppercase tracking-wide">Social</div>
                </div>
              </div>

              {/* Knowledge Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {isLoadingSummary ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : summary ? (
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1 flex items-center">
                        Knowledge Base
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {summary.knowledgeCount} sources
                        </Badge>
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {summary.summary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-3">
                    <div className="text-lg flex-shrink-0">📚</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Knowledge Base</h4>
                      <p className="text-xs text-gray-600">Loading...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button
                onClick={() => selectPet(currentPet)}
                disabled={isActive}
                className={cn(
                  "w-full h-10 font-semibold transition-all",
                  isActive 
                    ? "bg-green-500 text-white cursor-default" 
                    : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg"
                )}
              >
                {isActive ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Currently Active
                  </>
                ) : (
                  <>
                    Select {currentPet.name}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={prevPet}
            disabled={pets.length <= 1}
            className="w-12 h-12 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          {/* Dots Indicator */}
          <div className="flex space-x-2">
            {pets.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex 
                    ? "bg-blue-500 w-6" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextPet}
            disabled={pets.length <= 1}
            className="w-12 h-12 rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </main>

      {/* Confirmation Drawer */}
      <Drawer open={!!selectedPet} onOpenChange={(open) => !open && cancelSelection()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirm Pet Selection</DrawerTitle>
            <DrawerDescription>
              {selectedPet && `Make ${selectedPet.name} your active pet?`}
            </DrawerDescription>
          </DrawerHeader>
          
          {selectedPet && (
            <div className="px-4 pb-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                    `bg-gradient-to-br ${getRarityColor(selectedPet.rarity)}`
                  )}>
                    {getPetImage(selectedPet.id, selectedPet.rarity)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedPet.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPet.rarity} rarity</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-violet-600">{selectedPet.trivia}</div>
                    <div className="text-xs text-gray-600">Trivia</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-violet-600">{selectedPet.streak}</div>
                    <div className="text-xs text-gray-600">Streak</div>
                  </div>
                  <div className="bg-blue-100 rounded p-2">
                    <div className="font-semibold text-blue-600">{selectedPet.social}</div>
                    <div className="text-xs text-gray-600">Social</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DrawerFooter>
            <Button
              onClick={confirmSelection}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Selecting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Selection
                </>
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}