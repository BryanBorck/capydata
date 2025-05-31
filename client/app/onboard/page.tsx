"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Dice1, CheckCircle } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { createRandomPet } from "@/lib/services/pets";

export default function OnboardPage() {
  const [petName, setPetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'welcome' | 'create' | 'success'>('welcome');
  const router = useRouter();
  
  const { user, isAuthenticated, pets, refreshUserData } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // If user already has pets, redirect to home
  useEffect(() => {
    if (isAuthenticated && pets.length > 0) {
      router.push('/home');
    }
  }, [isAuthenticated, pets, router]);

  const handleNext = () => {
    setStep('create');
  };

  const handleCreatePet = async () => {
    if (!user) return;
    
    if (petName.trim().length < 2) {
      toast.error("Pet name must be at least 2 characters long");
      return;
    }

    setIsCreating(true);
    
    try {
      const newPet = await createRandomPet(user.wallet_address, petName.trim());
      
      setStep('success');
      
      // Refresh user data to load the new pet
      await refreshUserData();
      
      // Auto redirect to home after success
      setTimeout(() => {
        router.push('/home');
      }, 2000);
      
    } catch (error) {
      console.error("Error creating pet:", error);
      toast.error("Failed to create pet. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const generateRandomName = () => {
    const prefixes = ['Cyber', 'Pixel', 'Quantum', 'Neo', 'Star', 'Luna', 'Echo', 'Nova'];
    const suffixes = ['gon', 'chi', 'mon', 'bit', 'zen', 'flux', 'wave', 'core'];
    
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    setPetName(randomPrefix + randomSuffix);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-3 sm:p-6 overflow-x-hidden">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      
      <div className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto z-10">
        {step === 'welcome' && (
          <>
            <AnimatedShinyText
              className="inline-flex text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 items-center justify-center px-2 sm:px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
            >
              <span>Welcome to Datagotchi!</span>
            </AnimatedShinyText>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg w-full">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎉</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Great to have you here!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Welcome {user?.username}! Let's start your journey by creating your first digital companion.
              </p>
              
              <div className="space-y-3 sm:space-y-4 text-left mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Feed and care for your pet</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Train and improve their stats</span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                  </div>
                  <span className="text-xs sm:text-sm">Add data to help them grow</span>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full py-2 sm:py-3 font-medium text-sm sm:text-base">
                <span>Let's Create Your Pet</span>
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 'create' && (
          <>
            <AnimatedShinyText
              className="inline-flex text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 items-center justify-center px-2 sm:px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
            >
              <span>Create Your Pet</span>
            </AnimatedShinyText>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg w-full">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🐾</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Your New Companion</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Your pet will have randomly generated stats and rarity based on luck!
              </p>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="petName" className="text-xs sm:text-sm font-medium text-gray-700">
                    Pet Name
                  </Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      id="petName"
                      type="text"
                      placeholder="Enter a name for your pet"
                      value={petName}
                      onChange={(e) => setPetName(e.target.value)}
                      maxLength={20}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomName}
                      className="px-2 sm:px-3 flex-shrink-0"
                    >
                      <Dice1 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {petName.length}/20 characters
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                  <div className="flex items-center mb-2">
                    <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mr-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-purple-700">Random Generation</span>
                  </div>
                  <p className="text-xs text-purple-600 mb-2">
                    Your pet will be assigned random Health, Strength, and Social stats. 
                    Higher rarity pets get better base stats!
                  </p>
                  <div className="grid grid-cols-2 sm:flex sm:justify-between text-xs gap-1">
                    <span className="text-gray-600">Common: 70%</span>
                    <span className="text-blue-600">Rare: 20%</span>
                    <span className="text-purple-600">Epic: 8%</span>
                    <span className="text-yellow-600">Legendary: 2%</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreatePet}
                  disabled={isCreating || petName.trim().length < 2}
                  className="w-full py-2 sm:py-3 font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm sm:text-base"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                      <span>Creating your pet...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span>Create Pet</span>
                      <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg w-full text-center">
              <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎉</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Success!</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Your pet has been created! Taking you to your new home...
              </p>
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">Redirecting to home...</span>
              </div>
            </div>
          </>
        )}
      </div>
      
      <Toaster />
    </main>
  );
} 