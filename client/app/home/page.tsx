"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Database, Gamepad2, Settings, Heart, Zap, Users, Crown, ChevronRight, ArrowLeft, PawPrint } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { useDatagotchiFetch } from "@/lib/hooks/use-datagotchi-fetch";
import { DatagotchiSuspense } from "@/components/ui/datagotchi-suspense";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function ActionButtons({ selectedPet }: { selectedPet: any }) {
  const router = useRouter();

  const actions = [
    {
      title: "Select Pet",
      description: "Choose active companion",
      icon: PawPrint,
      color: "from-pink-500 to-rose-500",
      route: "/select-pet",
      available: true
    },
    {
      title: "Create New Pet",
      description: "Add another companion",
      icon: Plus,
      color: "from-green-500 to-emerald-500",
      route: "/create-pet",
      available: true
    },
    {
      title: "Add Data",
      description: "Feed with information",
      icon: Database,
      color: "from-blue-500 to-cyan-500", 
      route: "/add-data",
      available: !!selectedPet
    },
    {
      title: "Play Game",
      description: "Interactive activities",
      icon: Gamepad2,
      color: "from-purple-500 to-pink-500",
      route: "/play-game",
      available: !!selectedPet
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800">What would you like to do?</h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <Card 
            key={action.title}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]",
              !action.available && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => action.available && router.push(action.route)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r flex-shrink-0",
                  action.color
                )}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{action.title}</h4>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                  
                  {!action.available && action.title !== "Create New Pet" && action.title !== "Select Pet" && (
                    <Badge variant="secondary" className="text-xs mt-2">
                      Select a pet first
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  
  const { user, isAuthenticated, pets } = useUser();

  // Simple function to get current active pet ID (like select-pet page)
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  // Get active pet ID directly from localStorage on each render
  const activePetId = getActivePetId();
  const selectedPet = pets.find(pet => pet.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // If no pets, redirect to onboard
    if (isAuthenticated && pets.length === 0) {
      router.push('/onboard');
      return;
    }
  }, [isAuthenticated, pets, router]);

  // Set default active pet if none is set
  useEffect(() => {
    if (pets.length > 0 && !activePetId && selectedPet) {
      localStorage.setItem('activePetId', selectedPet.id);
    }
  }, [pets, activePetId, selectedPet]);

  if (!isAuthenticated || pets.length === 0) {
    return null; // Will redirect in useEffect
  }

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
      case 'common': return 'bg-gray-100 text-gray-700';
      case 'rare': return 'bg-blue-100 text-blue-700';
      case 'epic': return 'bg-purple-100 text-purple-700';
      case 'legendary': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

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
          <div className="w-full px-3 sm:px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <AnimatedShinyText className="text-xl sm:text-2xl font-bold truncate">
                  Datagotchi
                </AnimatedShinyText>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Home
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-20">
                    {user?.username}
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/settings')}
                  className="px-2 sm:px-3"
                >
                  <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline ml-2">Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {user?.username}! 👋
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                You have {pets.length} pet{pets.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>

            {/* Current Active Pet Display */}
            {selectedPet && (
              <div 
                key={`pet-${selectedPet.id}-${activePetId}`}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r flex items-center justify-center text-2xl sm:text-3xl",
                      getRarityColor(selectedPet.rarity)
                    )}>
                      🐾
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2">
                        <span>{selectedPet.name}</span>
                        <Badge className={cn("text-xs", getRarityBadgeColor(selectedPet.rarity))}>
                          {selectedPet.rarity}
                        </Badge>
                      </h2>
                      <p className="text-sm text-gray-600">
                        Born {new Date(selectedPet.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/select-pet')}
                    className="px-2 sm:px-3"
                  >
                    <PawPrint className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-2">Switch</span>
                  </Button>
                </div>

                {/* Pet Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-red-600 text-center">{selectedPet.health}</div>
                    <div className="text-xs sm:text-sm text-gray-600 text-center">Health</div>
                    <Progress value={selectedPet.health} className="h-1.5 mt-2" />
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-yellow-600 text-center">{selectedPet.strength}</div>
                    <div className="text-xs sm:text-sm text-gray-600 text-center">Strength</div>
                    <Progress value={selectedPet.strength} className="h-1.5 mt-2" />
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-xl sm:text-2xl font-bold text-blue-600 text-center">{selectedPet.social}</div>
                    <div className="text-xs sm:text-sm text-gray-600 text-center">Social</div>
                    <Progress value={selectedPet.social} className="h-1.5 mt-2" />
                  </div>
                </div>

                {/* Total Stats */}
                <div className="mt-4 text-center">
                  <div className="text-lg sm:text-xl font-semibold text-gray-700">
                    Total Power: {selectedPet.health + selectedPet.strength + selectedPet.social}/300
                  </div>
                  <Progress 
                    value={(selectedPet.health + selectedPet.strength + selectedPet.social) / 3} 
                    className="h-2 mt-2 max-w-xs mx-auto" 
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <ActionButtons selectedPet={selectedPet} />
          </div>
        </div>
      </div>
    </main>
  );
} 