"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Database, Settings, Heart, Zap, Users, PawPrint, BarChart3, Brain, Sword, Beaker, Code, Flame, Gamepad2 } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

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

  const getRarityGem = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common':
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 shadow-lg relative">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 opacity-60"></div>
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
          </div>
        );
      case 'rare':
        return (
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-800 shadow-lg relative transform rotate-45">
            <div className="absolute inset-0.5 bg-gradient-to-br from-blue-300 to-blue-500 opacity-60"></div>
            <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white opacity-90"></div>
          </div>
        );
      case 'epic':
        return (
          <div
            className="w-5 h-7 bg-gradient-to-b from-violet-400 to-violet-600 border-2 border-violet-800 shadow-lg relative"
            style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }}
          >
            <div className="absolute inset-0.5 bg-gradient-to-b from-violet-300 to-violet-500 opacity-60"></div>
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white opacity-90"></div>
          </div>
        );
      case 'legendary':
        return (
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 border-2 border-orange-700 shadow-lg relative">
            <div className="absolute inset-0.5 bg-gradient-to-br from-yellow-300 to-orange-400 opacity-70"></div>
            <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-orange-300 opacity-50"></div>
            <div className="absolute top-1 left-1 w-1 h-1 bg-white opacity-95"></div>
            <div className="absolute bottom-1 right-1 w-0.5 h-0.5 bg-white opacity-80"></div>
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 border-2 border-gray-600 shadow-lg relative">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 opacity-60"></div>
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white opacity-80"></div>
          </div>
        );
    }
  };

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
    <main className="h-[100dvh] w-full relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <LazyBackgroundImage
          src={selectedPet ? getBackgroundImage(selectedPet.background) : "/background/variants/forest.png"}
          alt="Background"
          priority={true}
        />
        {/* Optional overlay for better contrast */}
        <div className="absolute inset-0 bg-black/10" />
      </div>
      
      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-2 bg-white/60 backdrop-blur-sm border-b border-white/60 rounded-b-3xl">
        <div className="flex items-center justify-between relative">
          {/* Left: App Name */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="text-xs font-bold text-violet-500 uppercase">
              Datagotchi
            </div>
          </div>

          {/* Center: User Info Badge - Absolutely positioned to be perfectly centered */}
          <div onClick={() => router.push('/select-pet')} className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-2 bg-white border-2 border-gray-800 shadow-[2px_2px_0_#374151] px-4 py-1">
            <div className="font-silkscreen text-xs flex flex-col items-center justify-center">
              <div className="font-bold text-gray-800">{user?.username}</div>
              <div className="text-gray-600 text-[10px]">{pets.length} pets</div>
            </div>
          </div>

          {/* Right: Settings only */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/settings')}
              className="bg-white/30 border-white/60 text-violet-500 hover:bg-white/40 px-1.5 sm:px-2"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Pet Info + Skills (Top Left, below header) */}
      {selectedPet && (
        <div className="absolute top-18 left-3 z-20 flex flex-col space-y-2">
           {/* Pet Action Buttons */}
           <div className="flex flex-row items-start space-x-2 pb-2">
            {/* Select Pet Button */}
            <div
              onClick={() => router.push("/select-pet")}
              className="h-8 w-8 flex items-center justify-center text-white border-0 shadow-lg transition-all hover:scale-105 rounded-xl bg-violet-500 hover:bg-violet-600 p-0 cursor-pointer"
            >
              <PawPrint className="h-4 w-4" />
            </div>

            {/* Create Pet Button */}
            <div
              onClick={() => router.push("/create-pet")}
              className="h-8 w-8 flex items-center justify-center text-white border-0 shadow-lg transition-all hover:scale-105 rounded-xl bg-violet-500 hover:bg-violet-600 p-0"
            >
              <Plus className="h-4 w-4" />
            </div>
          </div>

          {/* Pet Name and Rarity */}
          <div className="flex items-center justify-end space-x-1 bg-white/70 backdrop-blur-sm p-1 rounded-sm border border-white/60 shadow-lg">
            <div className="relative w-8 h-8 flex items-center justify-center">
              {getRarityGem(selectedPet.rarity)}
            </div>
            <div className="text-sm font-bold text-green-900 min-w-[5ch] text-left">{selectedPet.name}</div>
          </div>
          
          {/* Skills */}
          <div className="flex flex-col space-y-1 w-full pt-2">
            {/* Science */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-green-500 border-2 border-green-700 shadow-[2px_2px_0_#14532d] p-1">
                <Beaker className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-green-700 w-[3ch] text-right">{selectedPet.science}</span>
            </div>

            {/* Code */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-blue-500 border-2 border-blue-700 shadow-[2px_2px_0_#1e40af] p-1">
                <Code className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-blue-700 w-[3ch] text-right">{selectedPet.code}</span>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-violet-500 border-2 border-violet-700 shadow-[2px_2px_0_#4c1d95] p-1">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-violet-700 w-[3ch] text-right">{selectedPet.social}</span>
            </div>

            {/* Trivia */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-yellow-500 border-2 border-yellow-700 shadow-[2px_2px_0_#92400e] p-1">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-yellow-700 w-[3ch] text-right">{selectedPet.trivia}</span>
            </div>

            {/* Trenches */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-red-500 border-2 border-red-700 shadow-[2px_2px_0_#991b1b] p-1">
                <Sword className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-red-700 w-[3ch] text-right">{selectedPet.trenches}</span>
            </div>

            {/* Streak */}
            <div className="flex items-center justify-end space-x-2 bg-white/90 backdrop-blur-sm pr-2 rounded-full w-fit">
              <div className="flex items-center justify-center bg-orange-500 border-2 border-orange-700 shadow-[2px_2px_0_#9a3412] p-1">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="font-silkscreen text-base font-bold text-orange-700 w-[3ch] text-right">{selectedPet.streak}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pet Image - Positioned relative to whole screen */}
      {selectedPet && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <LazyCapybaraImage
            src={getCapybaraImage(selectedPet.variant)}
            alt={selectedPet.name}
            width={300}
            height={300}
            className="w-96 h-96 transition-transform duration-300"
            priority={true}
          />
        </div>
      )}

      {/* Action Buttons - Individual positioning like game buttons */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 sm:px-4">
        {/* Add Data Button - Bottom Center */}
        <Button
          onClick={() => selectedPet && router.push("/add-data")}
          disabled={!selectedPet}
          className={cn(
            "absolute bottom-12 left-1/2 transform -translate-x-1/2 w-28 h-10 flex flex-row items-center justify-center space-x-1 text-white border-0 shadow-lg transition-all hover:scale-105 rounded-xl text-base bg-violet-500 hover:bg-violet-600",
            !selectedPet && "opacity-50 cursor-not-allowed"
          )}
        >
          <Database className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold">Add Data</span>
        </Button>

        {/* Insights Button - Bottom Right-Center */}
        <Button
          onClick={() => selectedPet && router.push("/data-insights")}
          disabled={!selectedPet}
          className={cn(
            "font-silkscreen w-36 h-12 text-white text-md font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95] transition-all flex flex-col justify-center items-center gap-2",
            !selectedPet && "opacity-50 cursor-not-allowed"
          )}
        >
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold">Insights</span>
        </Button>

        {/* Play Game Button - Bottom Right */}
        <Button
          onClick={() => selectedPet && router.push("/play-game")}
          disabled={!selectedPet}
          className={cn(
            "font-silkscreen w-36 h-12 text-white text-md font-bold uppercase bg-violet-500 border-4 border-violet-700 shadow-[4px_4px_0_#4c1d95] px-6 py-2 hover:bg-violet-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#4c1d95] transition-all flex flex-col justify-center items-center gap-2",
            !selectedPet && "opacity-50 cursor-not-allowed"
          )}
        >
          <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-semibold">Claim</span>
        </Button>
      </div>
    </main>
  );
}