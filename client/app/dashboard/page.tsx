"use client";

import { useEffect } from "react";
import { LogOut, Heart, Sword, Users, User, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { createRandomPet } from "@/lib/services/pets";

export default function DashboardPage() {
  const router = useRouter();
  const { user, pets, activePet, isAuthenticated, logout, refreshUserData, setActivePet } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Redirect to create pet if no pets exist
  useEffect(() => {
    if (isAuthenticated && pets.length === 0) {
      router.push('/create-pet');
    }
  }, [isAuthenticated, pets, router]);

  const handleLogout = async () => {
    try {
      // Clear any API session
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      toast.success("Logged out successfully");
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  const handleCreateNewPet = async () => {
    if (!user) return;
    
    try {
      const newPet = await createRandomPet(user.wallet_address);
      toast.success(`New pet created! 🎉`);
      await refreshUserData();
    } catch (error) {
      console.error("Error creating pet:", error);
      toast.error("Failed to create pet. Please try again.");
    }
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.username}!</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-6 w-6 text-gray-600" />
                <span className="text-lg font-semibold text-gray-800">Profile</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Username:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded font-medium text-sm">
                    {user.username}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Wallet:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded font-mono text-xs break-all">
                    {user.wallet_address}
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Pets:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {pets.length} pet{pets.length !== 1 ? 's' : ''} created
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Member Since:</span>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Pet Card */}
          <div className="lg:col-span-2">
            {activePet ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🐾</span>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">{activePet.name}</h2>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        activePet.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                        activePet.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                        activePet.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activePet.rarity.charAt(0).toUpperCase() + activePet.rarity.slice(1)}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Heart className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.health}</div>
                    <div className="text-sm text-gray-500">Health</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Sword className="h-8 w-8 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.strength}</div>
                    <div className="text-sm text-gray-500">Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.social}</div>
                    <div className="text-sm text-gray-500">Social</div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Created: {new Date(activePet.created_at).toLocaleDateString()}
                </div>

                <div className="flex space-x-3">
                  <Button className="flex-1">
                    Feed Pet
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Train
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Play
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg text-center">
                <div className="text-6xl mb-4">🐾</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Pet</h2>
                <p className="text-gray-600 mb-4">Select a pet or create a new one</p>
                <Button onClick={handleCreateNewPet}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Pet
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* All Pets Grid */}
        {pets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Your Pets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border-2 cursor-pointer transition-all hover:shadow-lg ${
                    activePet?.id === pet.id 
                      ? 'border-blue-500 shadow-md' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setActivePet(pet)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">{pet.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pet.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      pet.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      pet.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pet.rarity}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <Heart className="h-3 w-3 text-red-500 mx-auto mb-1" />
                      <div>{pet.health}</div>
                    </div>
                    <div className="text-center">
                      <Sword className="h-3 w-3 text-orange-500 mx-auto mb-1" />
                      <div>{pet.strength}</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-3 w-3 text-blue-500 mx-auto mb-1" />
                      <div>{pet.social}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Pet Card */}
              <div 
                className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border-2 border-dashed border-gray-300 cursor-pointer transition-all hover:border-gray-400 hover:bg-white/80 flex flex-col items-center justify-center text-gray-500"
                onClick={handleCreateNewPet}
              >
                <Plus className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Create New Pet</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <Toaster />
    </main>
  );
} 