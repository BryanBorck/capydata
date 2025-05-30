"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Loader2, Sparkles, Dice1 } from "lucide-react";
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

export default function CreatePetPage() {
  const [petName, setPetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  
  const { user, isAuthenticated, pets, refreshUserData } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // If user already has pets, redirect to dashboard
  useEffect(() => {
    if (pets.length > 0) {
      router.push('/dashboard');
    }
  }, [pets, router]);

  const handleCreatePet = async () => {
    if (!user) return;
    
    if (petName.trim().length < 2) {
      toast.error("Pet name must be at least 2 characters long");
      return;
    }

    setIsCreating(true);
    
    try {
      const newPet = await createRandomPet(user.wallet_address, petName.trim());
      
      toast.success(`${newPet.name} has been created! 🎉`);
      
      // Refresh user data to load the new pet
      await refreshUserData();
      
      // Redirect to dashboard
      router.push('/dashboard');
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
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-6">
      <FlickeringGrid
        className="absolute inset-0 z-0 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />
      
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto z-10">
        <AnimatedShinyText
          className="inline-flex text-5xl mb-6 items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400"
        >
          <span>Create Your Pet</span>
        </AnimatedShinyText>

        <div className="text-lg mb-8 text-neutral-600">
          Welcome {user?.username}! Let's create your first Datagotchi
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 shadow-lg w-full">
          <div className="mb-6">
            <div className="text-6xl mb-4">🐾</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Your New Companion</h2>
            <p className="text-gray-600">
              Your pet will have randomly generated stats and rarity based on luck!
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="petName" className="text-sm font-medium text-gray-700">
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
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomName}
                  className="px-3"
                >
                  <Dice1 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {petName.length}/20 characters
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center mb-2">
                <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                <span className="text-sm font-medium text-purple-700">Random Generation</span>
              </div>
              <p className="text-xs text-purple-600">
                Your pet will be assigned random Health, Strength, and Social stats. 
                Higher rarity pets get better base stats!
              </p>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-600">Common: 70%</span>
                <span className="text-blue-600">Rare: 20%</span>
                <span className="text-purple-600">Epic: 8%</span>
                <span className="text-yellow-600">Legendary: 2%</span>
              </div>
            </div>

            <Button
              onClick={handleCreatePet}
              disabled={isCreating || petName.trim().length < 2}
              className="w-full py-3 font-medium bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Creating your pet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  <span>Create Pet</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 