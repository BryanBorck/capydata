"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Zap, Users, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/home')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Select Pet</h1>
          </div>
          <Badge variant="secondary">Choose Active Pet</Badge>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Active Pet 🐾</h2>
          <p className="text-gray-600">
            Select which pet you'd like to focus on. Your active pet will be featured on the home screen.
          </p>
          {activePetId && (
            <p className="text-sm text-blue-600 mt-2">
              Currently active: <span className="font-semibold">
                {pets.find(p => p.id === activePetId)?.name || 'Unknown'}
              </span>
            </p>
          )}
        </div>

        {/* Pet Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                
                <CardHeader className="pb-3">
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
                
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span>Health</span>
                      </div>
                      <span>{pet.health}/100</span>
                    </div>
                    <Progress value={pet.health} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>Strength</span>
                      </div>
                      <span>{pet.strength}/100</span>
                    </div>
                    <Progress value={pet.strength} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Social</span>
                      </div>
                      <span>{pet.social}/100</span>
                    </div>
                    <Progress value={pet.social} className="h-2" />
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
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xl">
                    🐾
                  </div>
                  <div>
                    <h4 className="font-semibold">{selectedPet.name}</h4>
                    <p className="text-sm text-gray-600">{selectedPet.rarity} rarity</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-100 rounded p-2">
                    <div className="font-semibold text-red-600">{selectedPet.health}</div>
                    <div className="text-xs text-gray-600">Health</div>
                  </div>
                  <div className="bg-yellow-100 rounded p-2">
                    <div className="font-semibold text-yellow-600">{selectedPet.strength}</div>
                    <div className="text-xs text-gray-600">Strength</div>
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