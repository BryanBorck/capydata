"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Database, Gamepad2, Settings, Heart, Zap, Users, PawPrint, BarChart3 } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();
  
  const { user, isAuthenticated, pets } = useUser();

  // Simple function to get current active pet ID
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

  const actions = [
    {
      title: "Select Pet",
      icon: PawPrint,
      color: "bg-pink-500 hover:bg-pink-600",
      route: "/select-pet",
      available: true
    },
    {
      title: "Create Pet",
      icon: Plus,
      color: "bg-green-500 hover:bg-green-600",
      route: "/create-pet",
      available: true
    },
    {
      title: "Add Data",
      icon: Database,
      color: "bg-blue-500 hover:bg-blue-600",
      route: "/add-data",
      available: !!selectedPet
    },
    {
      title: "Insights",
      icon: BarChart3,
      color: "bg-orange-500 hover:bg-orange-600",
      route: "/data-insights",
      available: !!selectedPet
    },
    {
      title: "Play Game",
      icon: Gamepad2,
      color: "bg-purple-500 hover:bg-purple-600",
      route: "/play-game",
      available: !!selectedPet
    }
  ];

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
    <main className="h-[100dvh] w-full relative overflow-hidden">
      {/* Forest Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/background/forest.png"
          alt="Forest Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10" />
      </div>
      
      {/* Top Header Bar */}
      <header className="relative z-10 bg-white/30 backdrop-blur-md border-b border-white/40 px-3 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          {/* Left: App Name */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <AnimatedShinyText className="text-lg sm:text-xl font-bold text-green-900">
              Datagotchi
            </AnimatedShinyText>
            <Badge className="bg-green-200 text-green-900 text-xs">
              Game
            </Badge>
          </div>

          {/* Right: Settings only */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="bg-white/30 border-white/60 text-green-900 hover:bg-white/40 px-1.5 sm:px-2"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* User Info (Top Left, below header) */}
      <div className="absolute top-14 sm:top-16 left-3 sm:left-4 z-20">
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/60 shadow-lg">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs">
              {user?.username?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <div className="font-medium text-green-900">{user?.username}</div>
            <div className="text-green-700 text-xs">{pets.length} pets collected</div>
          </div>
        </div>
      </div>

      {/* Pet Info + Skills (Top Right, below header) */}
      {selectedPet && (
        <div className="absolute top-14 sm:top-16 right-3 sm:right-4 z-20 flex flex-col space-y-2">
          {/* Pet Name and Rarity */}
          <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/60 shadow-lg">
            <h2 className="text-sm font-bold text-green-900">{selectedPet.name}</h2>
            <Badge className={cn("text-xs", getRarityBadgeColor(selectedPet.rarity))}>
              {selectedPet.rarity}
            </Badge>
          </div>
          
          {/* Skills */}
          <div className="flex flex-col space-y-1">
            {/* Health */}
            <div className="flex items-center justify-end space-x-1 bg-red-100/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-red-200/60 shadow-md">
              <span className="text-xs font-bold text-red-700">{selectedPet.health}</span>
              <Heart className="h-3 w-3 text-red-600" />
            </div>
            {/* Strength */}
            <div className="flex items-center justify-end space-x-1 bg-yellow-100/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-yellow-200/60 shadow-md">
              <span className="text-xs font-bold text-yellow-700">{selectedPet.strength}</span>
              <Zap className="h-3 w-3 text-yellow-600" />
            </div>
            {/* Social */}
            <div className="flex items-center justify-end space-x-1 bg-blue-100/95 backdrop-blur-sm px-2 py-1 rounded-lg border border-blue-200/60 shadow-md">
              <span className="text-xs font-bold text-blue-700">{selectedPet.social}</span>
              <Users className="h-3 w-3 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Pet Image - Positioned relative to whole screen */}
      {selectedPet && (
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-10">
          <Image
            src="/capybara/common/default.png"
            alt={selectedPet.name}
            width={300}
            height={300}
            className="w-80 h-80 sm:w-96 sm:h-96 lg:w-96 lg:h-96 object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
            priority
          />
        </div>
      )}

      {/* Action Buttons - Fixed at bottom */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-3 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-w-4xl mx-auto">
          {actions.map((action) => (
            <Button
              key={action.title}
              onClick={() => action.available && router.push(action.route)}
              disabled={!action.available}
              className={cn(
                "h-8 sm:h-10 flex flex-row items-center justify-center space-y-0.5 text-white border-0 shadow-lg transition-all hover:scale-105 rounded-xl text-xs",
                action.color,
                !action.available && "opacity-50 cursor-not-allowed"
              )}
            >
              <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-semibold">{action.title}</span>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}