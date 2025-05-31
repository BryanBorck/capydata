"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { APP_NAME } from "@/lib/constants";
import { getAllGames, getDifficultyColor, getGameColor } from "./game-config";

export default function PlayGamePage() {
  const router = useRouter();
  const { isAuthenticated } = useUser();

  const GAMES = getAllGames();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleGameSelect = (gameId: string) => {
    router.push(`/play-game/${gameId}`);
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
            {APP_NAME} - GAMES
          </div>
          
          <div className="w-16"></div> {/* Spacer for balance */}
          </div>
        </header>

        {/* Main Content */}
      <div className="relative z-10 h-full overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {GAMES.map((game) => {
              const IconComponent = game.icon;
                    return (
                <button
                        key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className={`bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-left hover:shadow-[6px_6px_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[4px_4px_0_#374151]`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 border-2 border-gray-600 shadow-[2px_2px_0_#374151] ${getGameColor(game.color)}`}>
                      <IconComponent className="h-6 w-6" />
                          </div>
                          
                    <div className="flex-1">
                      <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-2">
                        {game.title}
                      </div>
                      <div className="font-silkscreen text-xs text-gray-600 uppercase mb-3">
                        {game.description}
                            </div>
                            
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className={`px-2 py-1 border-2 shadow-[1px_1px_0_#374151] font-silkscreen text-xs font-bold uppercase ${getDifficultyColor(game.difficulty)}`}>
                                  {game.difficulty}
                              </div>
                        <div className="px-2 py-1 border-2 border-gray-600 shadow-[1px_1px_0_#374151] bg-gray-100 text-gray-800 font-silkscreen text-xs font-bold uppercase">
                          {game.category}
                            </div>
                </div>
                
                      <div className="space-y-1">
                        <div className="font-silkscreen text-xs text-gray-600 uppercase">
                          TIME: {game.timeEstimate}
                </div>
                        <div className="font-silkscreen text-xs text-violet-600 uppercase">
                          REWARDS: {game.rewards.display}
              </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
} 