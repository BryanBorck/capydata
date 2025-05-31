"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Settings, LogOut, Trash2, Save, Edit, BarChart3, Database, Gamepad2, Trophy, AlertTriangle, Crown } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, pets, logout, refreshUserData } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Initialize username when user data loads
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // This would need to be implemented in the backend
      toast.error("Account deletion not implemented yet");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
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
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Settings
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Profile & Account
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* User Profile Card */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                  <span className="truncate">User Profile</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your account information and wallet details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl sm:text-2xl">
                      {user?.username?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {user?.username || 'Anonymous User'}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                    <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                      <Label className="text-xs text-gray-600">Wallet Address</Label>
                      <p className="text-xs sm:text-sm font-mono text-gray-800 break-all">
                        {user?.wallet_address || 'Not connected'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span className="truncate">Account Statistics</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Your activity and achievements overview
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{pets.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Pet{pets.length !== 1 ? 's' : ''}</div>
                  </div>
                  
                  <div className="text-center bg-green-50 rounded-lg p-3 sm:p-4 border border-green-200">
                    <Database className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-green-600">0</div>
                    <div className="text-xs sm:text-sm text-gray-600">Data Fed</div>
                  </div>
                  
                  <div className="text-center bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                    <Gamepad2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-purple-600">0</div>
                    <div className="text-xs sm:text-sm text-gray-600">Games Played</div>
                  </div>
                  
                  <div className="text-center bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200 col-span-2 lg:col-span-1">
                    <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">
                      {Math.floor(pets.reduce((sum, pet) => sum + pet.social + pet.trivia + pet.science + pet.code + pet.trenches + pet.streak, 0) / pets.length) || 0}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Avg Total Stats</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pet Collection */}
            <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                  <span className="truncate">Pet Collection</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Overview of all your digital companions
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-4 sm:p-6">
                {pets.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {pets.map((pet) => (
                      <div key={pet.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{pet.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              pet.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                              pet.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                              pet.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {pet.rarity}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Trivia:</span>
                            <span className="font-medium">{pet.trivia}/100</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Streak:</span>
                            <span className="font-medium">{pet.streak}/100</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Social:</span>
                            <span className="font-medium">{pet.social}/100</span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Born {new Date(pet.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Crown className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2 sm:mb-3" />
                    <p className="text-sm sm:text-base text-gray-600">No pets yet</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Go home to create your first pet!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dangerous Actions */}
            <Card className="bg-white/80 backdrop-blur-sm border border-red-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-base sm:text-lg text-red-600">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Account Actions</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-red-600">
                  Logout or permanently delete your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50 text-sm sm:text-base py-2 sm:py-3"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Logout
                </Button>
                
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="w-full justify-center text-sm sm:text-base py-2 sm:py-3"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Simple Delete Confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
              Are you absolutely sure?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your account
              and remove all your data, including your pets, from our servers.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex-1 text-sm sm:text-base"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </main>
  );
} 