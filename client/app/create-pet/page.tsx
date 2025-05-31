"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles, Dice1, CheckCircle, ArrowLeft } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { createRandomPet } from "@/lib/services/pets";

export default function CreatePetPage() {
  const [petName, setPetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'create' | 'success'>('create');
  const router = useRouter();
  
  const { user, isAuthenticated, refreshUserData } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
                  disabled={isCreating}
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Create New Pet
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Add Companion
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-md mx-auto">
            {step === 'create' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg w-full">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🐾</div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Create New Companion</h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    Add another digital pet to your collection! Each pet has unique stats and rarity.
                  </p>
                </div>

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
                      Your new pet will have randomly generated stats and rarity. Will you get lucky?
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
            )}

            {step === 'success' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-lg w-full text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4">🎉</div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Pet Created!</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  Your new companion "{petName}" has joined your collection!
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">Returning to home...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 