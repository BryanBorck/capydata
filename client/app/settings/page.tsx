"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useUser } from "@/providers/user-provider";
import { ArrowLeft, User, Trophy, Settings as SettingsIcon, LogOut, Trash2, Gamepad2, Database } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, pets, logout, deleteAccount } = useUser();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

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
      await deleteAccount();
      toast.success('Account deleted successfully');
      setShowDeleteDialog(false);
      router.push('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again.');
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity?.toLowerCase()) {
      case 'common': return 'bg-gray-100 border-gray-600 text-gray-800';
      case 'rare': return 'bg-blue-100 border-blue-600 text-blue-800';
      case 'epic': return 'bg-purple-100 border-purple-600 text-purple-800';
      case 'legendary': return 'bg-yellow-100 border-yellow-600 text-yellow-800';
      default: return 'bg-gray-100 border-gray-600 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="h-[100dvh] w-full relative overflow-hidden pb-16">
      {/* Flickering Grid Background */}
      <FlickeringGrid
        className="absolute inset-0 -z-5 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
        squareSize={4}
        gridGap={6}
        color="#6B7280"
        maxOpacity={0.5}
        flickerChance={0.1}
      />

      {/* Top Header Bar */}
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-violet-500 to-violet-600 border-1 border-violet-800 shadow-[1px_1px_0_#581c87]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/home')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-violet-700 border-2 border-violet-900 shadow-[2px_2px_0_#581c87] px-3 py-1 hover:bg-violet-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {APP_NAME} - SETTINGS
          </div>
          
          <div className="w-16"></div> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* User Profile Section */}
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
            <div className="mb-6">
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
                <User className="h-6 w-6" />
                USER PROFILE
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase">
                ACCOUNT INFORMATION
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
                    USERNAME
                  </div>
                  <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3">
                    <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                      {user?.username || 'ANONYMOUS USER'}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
                    JOINED DATE
                  </div>
                  <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3">
                    <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString().toUpperCase() : 'RECENTLY'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
                  WALLET ADDRESS
                </div>
                <div className="bg-gray-100 border-2 border-gray-600 shadow-[2px_2px_0_#374151] p-3">
                  <div className="font-mono text-xs text-gray-800 break-all">
                    {user?.wallet_address || 'NOT CONNECTED'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Statistics */}
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
            <div className="mb-6">
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
                <Trophy className="h-6 w-6" />
                STATISTICS
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase">
                YOUR ACTIVITY OVERVIEW
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-4 text-center">
                <div className="font-silkscreen text-2xl font-bold text-blue-800 uppercase mb-1">
                  {pets.length}
                </div>
                <div className="font-silkscreen text-xs font-bold text-blue-700 uppercase">
                  PET{pets.length !== 1 ? 'S' : ''}
                </div>
              </div>
              
              <div className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-4 text-center">
                <div className="font-silkscreen text-2xl font-bold text-green-800 uppercase mb-1">
                  0
                </div>
                <div className="font-silkscreen text-xs font-bold text-green-700 uppercase">
                  DATA FED
                </div>
              </div>
              
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center">
                <div className="font-silkscreen text-2xl font-bold text-purple-800 uppercase mb-1">
                  0
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  GAMES
                </div>
              </div>
              
              <div className="bg-yellow-100 border-4 border-yellow-600 shadow-[4px_4px_0_#92400e] p-4 text-center">
                <div className="font-silkscreen text-2xl font-bold text-yellow-800 uppercase mb-1">
                  {Math.floor(pets.reduce((sum, pet) => sum + (pet.social || 0) + (pet.trivia || 0) + (pet.science || 0) + (pet.code || 0) + (pet.trenches || 0), 0) / pets.length) || 0}
                </div>
                <div className="font-silkscreen text-xs font-bold text-yellow-700 uppercase">
                  AVG STATS
                </div>
              </div>
            </div>
          </div>

          {/* Pet Collection */}
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
            <div className="mb-6">
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-2 flex items-center gap-3">
                <Gamepad2 className="h-6 w-6" />
                PET COLLECTION
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase">
                ALL YOUR DIGITAL COMPANIONS
              </div>
            </div>

            {pets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pets.map((pet) => (
                  <div key={pet.id} className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase truncate">
                        {pet.name}
                      </div>
                      <div className={cn(
                        "font-silkscreen text-xs font-bold uppercase px-2 py-1 border-2",
                        getRarityColor(pet.rarity)
                      )}>
                        {pet.rarity}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">SOCIAL:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.social || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">TRIVIA:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.trivia || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">SCIENCE:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.science || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">CODE:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.code || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">TRENCHES:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.trenches || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-silkscreen text-xs text-gray-600 uppercase">STREAK:</span>
                        <span className="font-silkscreen text-xs font-bold text-gray-800">{pet.streak || 0}</span>
                      </div>
                    </div>
                    
                    <div className="font-silkscreen text-xs text-gray-500 uppercase mt-3 pt-2 border-t-2 border-gray-500">
                      BORN {new Date(pet.created_at).toLocaleDateString().toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="font-silkscreen text-lg font-bold text-gray-600 uppercase mb-2">
                  NO PETS YET
                </div>
                <div className="font-silkscreen text-sm text-gray-500 uppercase">
                  GO HOME TO CREATE YOUR FIRST PET!
                </div>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-white border-4 border-red-600 shadow-[8px_8px_0_#dc2626] p-6">
            <div className="mb-6">
              <div className="font-silkscreen text-xl font-bold text-red-800 uppercase mb-2 flex items-center gap-3">
                <SettingsIcon className="h-6 w-6" />
                DANGER ZONE
              </div>
              <div className="font-silkscreen text-xs text-red-600 uppercase">
                LOGOUT OR DELETE ACCOUNT
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleLogout}
                className="font-silkscreen w-full h-12 text-white text-sm font-bold uppercase bg-gray-500 border-4 border-gray-700 shadow-[4px_4px_0_#374151] px-6 py-2 hover:bg-gray-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                LOGOUT
              </button>
              
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="font-silkscreen w-full h-12 text-white text-sm font-bold uppercase bg-red-500 border-4 border-red-700 shadow-[4px_4px_0_#991b1b] px-6 py-2 hover:bg-red-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#991b1b] transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 max-w-md w-full">
            <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
              ARE YOU ABSOLUTELY SURE?
            </div>
            <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6 leading-relaxed">
              THIS ACTION CANNOT BE UNDONE. THIS WILL PERMANENTLY DELETE YOUR ACCOUNT
              AND REMOVE ALL YOUR DATA, INCLUDING YOUR PETS, FROM OUR SERVERS.
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="font-silkscreen flex-1 h-10 text-gray-800 text-sm font-bold uppercase bg-gray-300 border-4 border-gray-600 shadow-[4px_4px_0_#374151] px-4 py-2 hover:bg-gray-200 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#374151] transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={handleDeleteAccount}
                className="font-silkscreen flex-1 h-10 text-white text-sm font-bold uppercase bg-red-500 border-4 border-red-700 shadow-[4px_4px_0_#991b1b] px-4 py-2 hover:bg-red-300 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_#991b1b] transition-all"
              >
                DELETE ACCOUNT
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </main>
  );
} 