"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft } from "lucide-react";

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
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl font-bold text-gray-700">Settings</div>
      </header>

      {/* Content */}
      <main className="w-full mx-auto p-4 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Profile Card */}
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>User Profile</span>
              </CardTitle>
              <CardDescription>
                Your account information and wallet details
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* <Avatar className="h-20 w-20 mx-auto sm:mx-0">
                  <AvatarFallback className="bg-blue-500 text-white text-2xl">
                    {user?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar> */}
                
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div className="text-lg font-bold text-gray-800 truncate">
                    {user?.username || 'Anonymous User'}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}
                  </p>
                  <div className="bg-gray-100 rounded-lg p-3 mt-4">
                    <p className="text-xs text-gray-600 mb-1">Wallet Address</p>
                    <p className="text-sm font-mono text-gray-800 break-all">
                      {user?.wallet_address || 'Not connected'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Account Statistics</span>
              </CardTitle>
              <CardDescription>
                Your activity and achievements overview
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-xl font-bold text-blue-600">{pets.length}</div>
                  <div className="text-sm text-gray-600">Pet{pets.length !== 1 ? 's' : ''}</div>
                </div>
                
                <div className="text-center bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Data Fed</div>
                </div>
                
                <div className="text-center bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-600">Games Played</div>
                </div>
                
                <div className="text-center bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="text-xl font-bold text-yellow-600">
                    {Math.floor(pets.reduce((sum, pet) => sum + pet.health + pet.strength + pet.social, 0) / pets.length) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Avg Total Stats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pet Collection */}
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Pet Collection</span>
              </CardTitle>
              <CardDescription>
                Overview of all your digital companions
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {pets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pets.map((pet) => (
                    <div key={pet.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-gray-800 truncate">{pet.name}</div>
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
                          <span className="text-gray-600">Health:</span>
                          <span className="font-medium">{pet.health}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Strength:</span>
                          <span className="font-medium">{pet.strength}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Social:</span>
                          <span className="font-medium">{pet.social}</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-2">
                        Born {new Date(pet.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-base text-gray-600">No pets yet</p>
                  <p className="text-sm text-gray-500 mt-1">Go home to create your first pet!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dangerous Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border border-red-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <span>Account Actions</span>
              </CardTitle>
              <CardDescription className="text-red-600">
                Logout or permanently delete your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-center border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full justify-center"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Simple Delete Confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-lg font-semibold text-gray-800 mb-2">
              Are you absolutely sure?
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete your account
              and remove all your data, including your pets, from our servers.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex-1"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </div>
  );
} 