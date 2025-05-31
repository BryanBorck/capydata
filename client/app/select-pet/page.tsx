"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Zap, Users, CheckCircle, ChevronLeft, ChevronRight, Star, Sparkles, Brain, Beaker, Code, Sword, Flame } from "lucide-react";
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
import { APP_NAME } from "@/lib/constants";
import Image from "next/image";

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

// Loading skeleton component
const ImageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 flex items-center justify-center", className)}>
    <div className="w-8 h-8 border-4 border-gray-300 border-t-transparent animate-spin"></div>
  </div>
)

// Lazy loaded image component for backgrounds
const LazyBackgroundImage = ({ 
  src, 
  alt, 
  className = "",
  priority = false
}: { 
  src: string
  alt: string
  className?: string
  priority?: boolean
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <>
      {isLoading && <ImageSkeleton className="absolute inset-0" />}
      
      <Image
        src={src}
        alt={alt}
        fill
        className={cn(
          "object-cover",
          className,
          isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        priority={priority}
        quality={90}
      />
      
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-gray-300 flex items-center justify-center">
          <div className="text-gray-600 text-xs font-silkscreen uppercase">
            BACKGROUND FAILED
          </div>
        </div>
      )}
    </>
  )
}

// Lazy loaded image component for capybaras
const LazyCapybaraImage = ({ 
  src, 
  alt, 
  width,
  height,
  className = "",
  priority = false
}: { 
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative">
      {isLoading && (
        <ImageSkeleton className={cn("absolute inset-0", className)} />
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-contain drop-shadow-2xl transition-all duration-500",
          className,
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        priority={priority}
      />
      
      {hasError && !isLoading && (
        <div className={cn("absolute inset-0 bg-gray-200 flex items-center justify-center", className)}>
          <div className="text-gray-600 text-xs font-silkscreen uppercase text-center">
            CAPYBARA<br/>FAILED
          </div>
        </div>
      )}
    </div>
  )
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
          // Check if API is available first
          if (!API_BASE_URL || API_BASE_URL === 'http://localhost:8000') {
            // API might not be running, provide basic summary
            setPetSummaries(prev => ({
              ...prev,
              [pet.id]: {
                title: `${pet.name}'s Knowledge`,
                summary: 'Knowledge system not connected. Core pet features are available.',
                icon: '📚',
                knowledgeCount: 0
              }
            }));
            continue;
          }
          
          // Fetch pet knowledge - with better error handling
          let knowledge: Knowledge[] = [];
          
          try {
            const knowledgeResponse = await fetch(`${API_BASE_URL}/api/v1/storage/pets/${pet.id}/knowledge?limit=10`);
            
            if (knowledgeResponse.ok) {
              knowledge = await knowledgeResponse.json();
            } else {
              console.log(`Knowledge API returned ${knowledgeResponse.status} for pet ${pet.id}`);
            }
          } catch (apiError) {
            console.log(`Knowledge API unavailable for pet ${pet.id}:`, apiError);
            // Continue with empty knowledge array
          }
          
          if (knowledge.length > 0) {
            // Try to generate summary, but don't fail if AI service is unavailable
            let summary = '';
            
            try {
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

              if (summaryResponse.ok) {
                const result = await summaryResponse.json();
                summary = result.content;
              } else {
                console.log(`AI summary API returned ${summaryResponse.status} for pet ${pet.id}`);
                // Fallback to manual summary
                const topics = knowledge.map(k => k.title || k.content.substring(0, 30)).slice(0, 3).join(', ');
                summary = `Contains ${knowledge.length} sources covering ${topics}`;
              }
            } catch (aiError) {
              console.log(`AI summary API unavailable for pet ${pet.id}:`, aiError);
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
            // No knowledge sources found or API unavailable
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
        } catch (error) {
          console.log(`Error loading data for pet ${pet.id}:`, error);
          // Provide a basic fallback summary
          setPetSummaries(prev => ({
            ...prev,
            [pet.id]: {
              title: `${pet.name}'s Knowledge`,
              summary: 'Knowledge data temporarily unavailable.',
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
    if (!currentPet) return;
    
    // Check if already active
    if (currentPet.id === activePetId) {
      toast.info(`${currentPet.name} is already your active pet!`);
      return;
    }
    
    setIsLoading(true);
    
    try {
      localStorage.setItem('activePetId', currentPet.id);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`${currentPet.name} is now your active pet!`);
      
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
      case 'common': return 'bg-gray-100 border-gray-600 text-gray-800';
      case 'rare': return 'bg-blue-100 border-blue-600 text-blue-800';
      case 'epic': return 'bg-purple-100 border-purple-600 text-purple-800';
      case 'legendary': return 'bg-yellow-100 border-yellow-600 text-yellow-800';
      default: return 'bg-gray-100 border-gray-600 text-gray-800';
    }
  };

  if (pets.length === 0) {
    return (
      <main className="h-[100dvh] w-full relative overflow-hidden">
        <FlickeringGrid
          className="absolute inset-0 -z-5 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.5}
          flickerChance={0.1}
        />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
            <div className="font-silkscreen text-2xl font-bold text-gray-800 uppercase mb-4">
              NO PETS AVAILABLE
            </div>
            <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
              YOU NEED TO CREATE A PET FIRST!
            </div>
            <button
              onClick={() => router.push('/onboard')}
              className="font-silkscreen h-12 text-white text-sm font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95] transition-all"
            >
              CREATE YOUR FIRST PET
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentPet = pets[currentIndex];
  const isActive = currentPet?.id === activePetId;
  const summary = petSummaries[currentPet?.id];
  const isLoadingSummary = loadingSummaries[currentPet?.id];

  const getCapybaraImage = (variant: string): string => {
    // Use the variant from the pet data
    switch (variant?.toLowerCase()) {
      case 'default':
        return "/capybara/variants/default-capybara.png";
      case 'pink':
        return "/capybara/variants/pink-capybara.png";
      case 'blue':
        return "/capybara/variants/blue-capybara.png";
      case 'ice':
        return "/capybara/variants/ice-capybara.png";
      case 'black':
        return "/capybara/variants/black-capybara.png";
      default:
        return "/capybara/variants/default-capybara.png";
    }
  };

  const getBackgroundImage = (background: string): string => {
    // Use the background from the pet data
    switch (background?.toLowerCase()) {
      case 'forest':
        return "/background/variants/forest.png";
      case 'lake':
        return "/background/variants/lake.png";
      case 'ice':
        return "/background/variants/ice.png";
      case 'farm':
        return "/background/variants/farm.png";
      case 'beach':
        return "/background/variants/beach.png";
      default:
        return "/background/variants/forest.png";
    }
  };

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
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 border-1 border-violet-800 shadow-[1px_1px_0_#581c87]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-violet-700 border-2 border-violet-900 shadow-[2px_2px_0_#581c87] px-3 py-1 hover:bg-violet-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {APP_NAME} - SELECT PET
          </div>
          
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Title Section */}
          <div className="text-center mb-8">
            <div className="font-silkscreen text-2xl font-bold text-gray-800 uppercase mb-2">
              CHOOSE YOUR ACTIVE PET
            </div>
            <div className="font-silkscreen text-sm text-gray-600 uppercase">
              USE ARROWS TO BROWSE YOUR COLLECTION
            </div>
          </div>

          {/* Pet Card */}
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 relative">
            {/* Active Badge */}
            {isActive && (
              <div className="absolute -top-3 -right-3 bg-green-500 border-4 border-green-700 shadow-[4px_4px_0_#14532d] text-white font-silkscreen text-xs px-3 py-1 uppercase font-bold">
                ★ ACTIVE ★
              </div>
            )}

            {/* Pet Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-1">
                    {currentPet.name}
                  </div>
                  <div className="font-silkscreen text-xs text-gray-600 uppercase">
                    BORN {new Date(currentPet.created_at).toLocaleDateString().toUpperCase()}
                  </div>
                </div>
                <div className={cn(
                  "font-silkscreen text-xs font-bold uppercase px-3 py-2 border-4",
                  getRarityColor(currentPet.rarity)
                )}>
                  ★ {currentPet.rarity} ★
                </div>
              </div>
            </div>

            {/* Pet Preview */}
            <div className="mb-6">
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                PET PREVIEW
              </div>
              <div className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-4">
                <div className="relative w-full h-48 bg-gray-200 border-2 border-gray-500 mb-4 overflow-hidden">
                  {/* Background */}
                  <LazyBackgroundImage
                    src={getBackgroundImage(currentPet.background || 'forest')}
                    alt={`${currentPet.background || 'forest'} background`}
                    priority={false}
                  />
                  
                  {/* Capybara overlay */}
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    <LazyCapybaraImage
                      src={getCapybaraImage(currentPet.variant || 'default')}
                      alt={`${currentPet.variant || 'default'} capybara`}
                      width={120}
                      height={120}
                      className="w-24 h-24"
                      priority={false}
                    />
                  </div>
                </div>
                
                {/* Variant and Background Labels */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-violet-100 border-4 border-violet-600 shadow-[2px_2px_0_#4c1d95] p-3 text-center">
                    <div className="font-silkscreen text-xs font-bold text-violet-800 uppercase mb-1">
                      VARIANT
                    </div>
                    <div className="font-silkscreen text-sm font-bold text-violet-700 uppercase">
                      {currentPet.variant || 'DEFAULT'}
                    </div>
                  </div>
                  <div className="bg-green-100 border-4 border-green-600 shadow-[2px_2px_0_#14532d] p-3 text-center">
                    <div className="font-silkscreen text-xs font-bold text-green-800 uppercase mb-1">
                      BACKGROUND
                    </div>
                    <div className="font-silkscreen text-sm font-bold text-green-700 uppercase">
                      {currentPet.background || 'FOREST'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pet Stats Grid */}
            <div className="mb-6">
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                STATS
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Science */}
                <div className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-4 text-center">
                  <Beaker className="h-6 w-6 text-green-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-green-800 uppercase mb-1">
                    {currentPet.science || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-green-700 uppercase">
                    SCIENCE
                  </div>
                </div>

                {/* Code */}
                <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-4 text-center">
                  <Code className="h-6 w-6 text-blue-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-blue-800 uppercase mb-1">
                    {currentPet.code || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-blue-700 uppercase">
                    CODE
                  </div>
                </div>

                {/* Social */}
                <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center">
                  <Users className="h-6 w-6 text-purple-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-purple-800 uppercase mb-1">
                    {currentPet.social || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                    SOCIAL
                  </div>
                </div>

                {/* Trivia */}
                <div className="bg-yellow-100 border-4 border-yellow-600 shadow-[4px_4px_0_#92400e] p-4 text-center">
                  <Brain className="h-6 w-6 text-yellow-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-yellow-800 uppercase mb-1">
                    {currentPet.trivia || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-yellow-700 uppercase">
                    TRIVIA
                  </div>
                </div>

                {/* Trenches */}
                <div className="bg-red-100 border-4 border-red-600 shadow-[4px_4px_0_#991b1b] p-4 text-center">
                  <Sword className="h-6 w-6 text-red-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-red-800 uppercase mb-1">
                    {currentPet.trenches || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-red-700 uppercase">
                    TRENCHES
                  </div>
                </div>

                {/* Streak */}
                <div className="bg-orange-100 border-4 border-orange-600 shadow-[4px_4px_0_#9a3412] p-4 text-center">
                  <Flame className="h-6 w-6 text-orange-700 mx-auto mb-2" />
                  <div className="font-silkscreen text-xl font-bold text-orange-800 uppercase mb-1">
                    {currentPet.streak || 0}
                  </div>
                  <div className="font-silkscreen text-xs font-bold text-orange-700 uppercase">
                    STREAK
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Summary */}
            <div className="mb-6">
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                KNOWLEDGE BASE
              </div>
              <div className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-4">
                {isLoadingSummary ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ) : summary ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                        DATA SOURCES
                      </div>
                      <div className="bg-gray-300 border-2 border-gray-600 px-2 py-1">
                        <span className="font-silkscreen text-xs font-bold text-gray-800 uppercase">
                          {summary.knowledgeCount}
                        </span>
                      </div>
                    </div>
                    <div className="font-silkscreen text-xs text-gray-700 uppercase leading-relaxed">
                      {summary.summary}
                    </div>
                  </div>
                ) : (
                  <div className="font-silkscreen text-xs text-gray-600 uppercase">
                    LOADING KNOWLEDGE SUMMARY...
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-4">
              {/* Select Button */}
              <button
                onClick={() => confirmSelection()}
                disabled={isLoading || isActive}
                className={cn(
                  "font-silkscreen h-12 w-full text-white text-sm font-bold uppercase border-4 shadow-[4px_4px_0] px-6 py-3 transition-all",
                  isLoading
                    ? "bg-gray-500 border-gray-700 shadow-[4px_4px_0_#374151] cursor-not-allowed opacity-50"
                    : isActive
                    ? "bg-green-500 border-green-700 shadow-[4px_4px_0_#14532d] cursor-default"
                    : "bg-violet-500 border-violet-700 shadow-[4px_4px_0_#4c1d95] hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95]"
                )}
              >
                {isLoading ? (
                  <>
                  SELECTING...
                  </>
                ) : isActive ? (
                  "★ CURRENTLY ACTIVE ★"
                ) : (
                  `SELECT ${currentPet.name.toUpperCase()}`
                )}
              </button>

              {/* Create New Pet Button */}
              <button
                onClick={() => router.push('/create-pet')}
                className="font-silkscreen h-10 w-full text-white text-xs font-bold uppercase bg-gray-500 border-4 border-gray-700 shadow-[4px_4px_0_#374151] px-4 py-2 hover:bg-gray-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="h-3 w-3" />
                CREATE NEW PET
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-6">
            <button
              onClick={prevPet}
              disabled={pets.length <= 1}
              className="font-silkscreen h-12 w-12 text-white text-sm font-bold uppercase bg-gray-500 border-4 border-gray-700 shadow-[4px_4px_0_#374151] hover:bg-gray-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            {/* Pet Counter */}
            <div className="bg-white border-4 border-gray-800 shadow-[4px_4px_0_#374151] px-4 py-2">
              <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                {currentIndex + 1} / {pets.length}
              </div>
            </div>
            
            <button
              onClick={nextPet}
              disabled={pets.length <= 1}
              className="font-silkscreen h-12 w-12 text-white text-sm font-bold uppercase bg-gray-500 border-4 border-gray-700 shadow-[4px_4px_0_#374151] hover:bg-gray-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 max-w-md w-full">
            <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
              CONFIRM PET SELECTION
            </div>
            <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
              MAKE {selectedPet.name.toUpperCase()} YOUR ACTIVE PET?
            </div>
            
            <div className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                  {selectedPet.name}
                </div>
                <div className={cn(
                  "font-silkscreen text-xs font-bold uppercase px-2 py-1 border-2",
                  getRarityColor(selectedPet.rarity)
                )}>
                  {selectedPet.rarity}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-200 border-2 border-gray-500 p-2 text-center">
                  <div className="font-silkscreen text-sm font-bold text-gray-800">{selectedPet.social || 0}</div>
                  <div className="font-silkscreen text-xs text-gray-600 uppercase">SOCIAL</div>
                </div>
                <div className="bg-gray-200 border-2 border-gray-500 p-2 text-center">
                  <div className="font-silkscreen text-sm font-bold text-gray-800">{selectedPet.trivia || 0}</div>
                  <div className="font-silkscreen text-xs text-gray-600 uppercase">TRIVIA</div>
                </div>
                <div className="bg-gray-200 border-2 border-gray-500 p-2 text-center">
                  <div className="font-silkscreen text-sm font-bold text-gray-800">{selectedPet.streak || 0}</div>
                  <div className="font-silkscreen text-xs text-gray-600 uppercase">STREAK</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={cancelSelection}
                disabled={isLoading}
                className="font-silkscreen flex-1 h-10 text-gray-800 text-sm font-bold uppercase bg-gray-300 border-4 border-gray-600 shadow-[4px_4px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all disabled:opacity-50"
              >
                CANCEL
              </button>
              <button
                onClick={confirmSelection}
                disabled={isLoading}
                className="font-silkscreen flex-1 h-10 text-white text-sm font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-4 py-2 hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin mr-2"></div>
                    SELECTING...
                  </>
                ) : (
                  "CONFIRM SELECTION"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}