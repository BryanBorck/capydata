"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Zap, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type Pet = Database['public']['Tables']['pets']['Row'];

export default function SelectPetPage() {
  const router = useRouter();
  const { pets } = useUser();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current active pet ID from localStorage
  const getActivePetId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('activePetId');
  };

  const activePetId = getActivePetId();

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
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
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

      {/* Content */}
      <main className="w-full mx-auto p-4 space-y-6">
        <div className="text-center w-full">
          <p className="text-gray-700 text-sm">
            Select which pet you'd like to focus on. <br /> Your active pet will be featured on the home screen.
          </p>
          {activePetId && (
            <p className="text-sm text-violet-500 mt-2">
              Currently active: <span className="font-semibold">
                {pets.find(p => p.id === activePetId)?.name || 'Unknown'}
              </span>
            </p>
          )}
        </div>

        {/* Pet Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pets.map((pet) => {
            const isActive = pet.id === activePetId;
            
            return (
              <Card
                key={pet.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  getRarityColor(pet.rarity),
                  isActive && "ring-2 ring-green-500"
                )}
                onClick={() => selectPet(pet)}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Active
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pet.name}</CardTitle>
                    <Badge className={getRarityBadgeColor(pet.rarity)}>
                      {pet.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Born {new Date(pet.created_at).toLocaleDateString()}
                  </p>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center rounded-full bg-red-100 p-1">
                        <Heart className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-sm font-medium">Health</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{pet.health}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center rounded-full bg-yellow-100 p-1">
                        <Zap className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span className="text-sm font-medium">Strength</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{pet.strength}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center rounded-full bg-blue-100 p-1">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Social</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{pet.social}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-lg">{selectedPet.name}</h4>
                    <Badge className={getRarityBadgeColor(selectedPet.rarity)}>
                      {selectedPet.rarity}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-violet-600">{selectedPet.health}</div>
                    <div className="text-xs text-gray-600">Health</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-violet-600">{selectedPet.strength}</div>
                    <div className="text-xs text-gray-600">Strength</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="font-semibold text-violet-600">{selectedPet.social}</div>
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
              className="bg-violet-500 hover:bg-violet-600"
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