"use client";

import { useEffect, useState } from "react";
import { LogOut, Heart, Sword, Users, User, Plus, Settings, Trophy, Activity, Brain, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { updatePet } from "@/lib/services/pets";
import { useDatagotchiFetch } from "@/lib/hooks/use-datagotchi-fetch";
import { DatagotchiSuspense } from "@/components/ui/datagotchi-suspense";

export default function DashboardPage() {
  const router = useRouter();
  const { user, pets, activePet, isAuthenticated, logout, refreshUserData, setActivePet } = useUser();
  
  // Separate hooks for different data sections
  const leaderboardFetch = useDatagotchiFetch();
  const [isPerformingAction, setIsPerformingAction] = useState(false);

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

  // Load leaderboard data when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      leaderboardFetch.fetchLeaderboard(10);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleCreateNewPet = async () => {
    router.push('/onboard')
  }

  const handleFeedPet = async () => {
    if (!activePet) return
    
    setIsPerformingAction(true)
    try {
      const updates = { social: Math.min(100, activePet.social + 5), streak: Math.min(100, activePet.streak + 1) };
      const message = `${activePet.name} feels more social! +5 Social, +1 Streak`;
      
      await updatePet(activePet.id, updates)
      await refreshUserData()
      toast.success(message)
    } catch (error) {
      toast.error('Failed to feed pet')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const handleTrainPet = async () => {
    if (!activePet) return
    
    setIsPerformingAction(true)
    try {
      const updates = {
        trivia: Math.min(100, activePet.trivia + 8),
        streak: Math.min(100, activePet.streak + 2)
      };
      const message = `${activePet.name} got smarter! +8 Trivia, +2 Streak`;
      
      await updatePet(activePet.id, updates)
      await refreshUserData()
      toast.success(message)
    } catch (error) {
      toast.error('Failed to train pet')
    } finally {
      setIsPerformingAction(false)
    }
  }

  const handlePlayWithPet = async () => {
    if (!activePet) return
    
    setIsPerformingAction(true)
    try {
      const updates = {
        social: Math.min(100, activePet.social + 6),
        streak: Math.min(100, activePet.streak + 1)
      };
      const message = `${activePet.name} had fun! +6 Social, +1 Streak`;
      
      await updatePet(activePet.id, updates)
      await refreshUserData()
      toast.success(message)
    } catch (error) {
      toast.error('Failed to play with pet')
    } finally {
      setIsPerformingAction(false)
    }
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-100 p-6">
      <div className="max-w-6xl mx-auto">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                    {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
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

            {/* Leaderboard Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg mt-6">
              <div className="flex items-center space-x-3 mb-4">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <span className="text-lg font-semibold text-gray-800">Leaderboard</span>
              </div>
              
              <DatagotchiSuspense 
                loading={leaderboardFetch.loading} 
                error={leaderboardFetch.error} 
                data={!!leaderboardFetch.data}
              >
                <DatagotchiSuspense.Skeleton>
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                        <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-8 h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </DatagotchiSuspense.Skeleton>

                <DatagotchiSuspense.Error>
                  <div className="text-center py-4">
                    <p className="text-sm text-red-600">Failed to load leaderboard</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => leaderboardFetch.fetchLeaderboard(10)}
                    >
                      Retry
                    </Button>
                  </div>
                </DatagotchiSuspense.Error>

                <DatagotchiSuspense.NoData>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No leaderboard data yet</p>
                  </div>
                </DatagotchiSuspense.NoData>

                <DatagotchiSuspense.Data>
                  <div className="space-y-2">
                    {leaderboardFetch.data?.slice(0, 5).map((pet: any, index: number) => (
                      <div key={pet.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                        <span className="text-sm font-bold text-gray-500 w-6">#{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{pet.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {pet.profiles?.username || 'Unknown'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-800">{pet.streak}</div>
                          <div className="text-xs text-gray-500">Streak</div>
                        </div>
                      </div>
                    ))}
                    {leaderboardFetch.data?.length > 5 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                          View Full Leaderboard
                        </Button>
                      </div>
                    )}
                  </div>
                </DatagotchiSuspense.Data>
              </DatagotchiSuspense>
            </div>
          </div>

          {/* Active Pet Card */}
          <div className="lg:col-span-3">
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
                  <div className="flex items-center space-x-2">
                    {(isPerformingAction) && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Activity className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Brain className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.trivia}</div>
                    <div className="text-sm text-gray-500">Trivia</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${activePet.trivia}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <CheckCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.streak}</div>
                    <div className="text-sm text-gray-500">Streak</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${activePet.streak}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex justify-center mb-2">
                      <Users className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-gray-800">{activePet.social}</div>
                    <div className="text-sm text-gray-500">Social</div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${activePet.social}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Created: {new Date(activePet.created_at).toLocaleDateString()}
                </div>

                <div className="flex space-x-3">
                  <Button 
                    className="flex-1" 
                    onClick={handleFeedPet}
                    disabled={isPerformingAction || activePet.social >= 100}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Feed Pet
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleTrainPet}
                    disabled={isPerformingAction || activePet.trivia >= 100}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Train
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handlePlayWithPet}
                    disabled={isPerformingAction || activePet.streak >= 100}
                  >
                    <Users className="h-4 w-4 mr-2" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <h4 className="font-semibold text-gray-800 truncate">{pet.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pet.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                      pet.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                      pet.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pet.rarity.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <Brain className="h-3 w-3 text-purple-500 mx-auto mb-1" />
                      <div className="font-medium">{pet.trivia}</div>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="h-3 w-3 text-red-500 mx-auto mb-1" />
                      <div className="font-medium">{pet.streak}</div>
                    </div>
                    <div className="text-center">
                      <Users className="h-3 w-3 text-blue-500 mx-auto mb-1" />
                      <div className="font-medium">{pet.social}</div>
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