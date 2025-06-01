"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Check, HelpCircle, X, Home, RotateCcw } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";
import { useGameRewards } from "@/lib/hooks/use-game-rewards";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for image quality game
interface ImageData {
  url: string;
  prompt: string;
  generation_params: any;
  metadata?: any;
}

interface ImageQualityRound {
  round_number: number;
  prompt: string;
  images: ImageData[];
  created_by?: string;
}

interface ImageQualityRoundResponse {
  round: ImageQualityRound;
  is_first_player: boolean;
  tokens_used?: number;
}

interface ImageQualityEvaluation {
  round_number: number;
  selected_image_index: number;
  selected_image_url: string;
  reasoning?: string;
  time_taken: number; // seconds
}

interface ImageQualitySessionResponse {
  session_id: string;
  rounds_completed: number;
  high_quality_images_added: number;
  pet_knowledge_updated: boolean;
}

export default function ImageQualityGamePage() {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Game data state
  const [roundsData, setRoundsData] = useState<ImageQualityRound[]>([]);
  const [evaluationsData, setEvaluationsData] = useState<ImageQualityEvaluation[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, activePet } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('image-quality');
  
  const totalRounds = gameConfig?.stats.rounds || 3;

  // Use game rewards hook
  const { rewardsAwarded, awardRewards, resetRewards } = useGameRewards(
    gameConfig?.id || 'image-quality',
    {
      points: gameConfig?.rewards.points || 50,
      skill: gameConfig?.rewards.skill || 'science',
      skillValue: gameConfig?.rewards.skillValue || 5
    }
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Award rewards when game is completed
  useEffect(() => {
    if (isComplete && !rewardsAwarded) {
      awardRewards();
    }
  }, [isComplete, rewardsAwarded, awardRewards]);

  // Load game rounds when component mounts
  useEffect(() => {
    if (isAuthenticated && activePet && !gameStarted) {
      loadGameRounds();
    }
  }, [isAuthenticated, activePet, gameStarted]);

  const loadGameRounds = async () => {
    if (!user?.wallet_address || !activePet) {
      toast.error("User or pet data not found");
      return;
    }

    setIsLoading(true);
    setError('');
    setSessionStartTime(Date.now());
    
    try {
      const allRounds: ImageQualityRound[] = [];
      
      // Load all rounds for the game
      for (let i = 1; i <= totalRounds; i++) {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/get-image-quality-round`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            round_number: i,
            wallet_address: user.wallet_address,
            pet_id: activePet.id
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to load round ${i}: ${response.status}`);
        }

        const roundData: ImageQualityRoundResponse = await response.json();
        allRounds.push(roundData.round);
        
        if (roundData.is_first_player) {
          toast.success(`🎨 You're the first to play round ${i}! Images generated for everyone.`);
        }
      }
      
      setRoundsData(allRounds);
      setGameStarted(true);
      setQuestionStartTime(Date.now());
      
      toast.success(`Loaded ${allRounds.length} image quality rounds!`);
    } catch (error) {
      console.error('Error loading game rounds:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load game rounds';
      setError(errorMessage);
      toast.error(`Failed to load game rounds: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (imageIndex: number) => {
    if (selectedImage !== null || isLoading) return;
    
    const selectionTime = Date.now();
    const timeTaken = Math.max(1, Math.floor((selectionTime - questionStartTime) / 1000));
    
    setSelectedImage(imageIndex);
    setShowFeedback(true);
    
    const currentRoundData = roundsData[currentRound];
    const selectedImageData = currentRoundData.images[imageIndex];
    
    // Record the evaluation
    const evaluation: ImageQualityEvaluation = {
      round_number: currentRoundData.round_number,
      selected_image_index: imageIndex,
      selected_image_url: selectedImageData.url,
      time_taken: timeTaken
    };
    setEvaluationsData(prev => [...prev, evaluation]);
    
    // Simulate scoring (in real app, this would be based on community consensus)
    const points = Math.floor(Math.random() * 20) + 10;
    setScore(score + points);
    
    setTimeout(() => {
      if (currentRound < totalRounds - 1) {
        setCurrentRound(currentRound + 1);
        setSelectedImage(null);
        setShowFeedback(false);
        setQuestionStartTime(Date.now());
      } else {
        handleSessionComplete(evaluation);
      }
    }, 2000);
  };

  const handleSessionComplete = async (finalEvaluation: ImageQualityEvaluation) => {
    const allEvaluations = [...evaluationsData, finalEvaluation];
    
    if (!user?.wallet_address || !activePet) {
      console.error("No user or pet data available for session completion");
      setIsComplete(true);
      return;
    }

    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      const finalScore = score + 10; // Add points for final selection
      
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/complete-image-quality-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          pet_id: activePet.id,
          evaluations_data: allEvaluations,
          rounds_data: roundsData,
          total_score: finalScore,
          duration_seconds: sessionDuration
        }),
      });

      if (response.ok) {
        const sessionResult: ImageQualitySessionResponse = await response.json();
        console.log('Image quality session completed:', sessionResult);
        
        if (sessionResult.high_quality_images_added > 0) {
          toast.success(`🎉 Added ${sessionResult.high_quality_images_added} high-quality images to ${activePet.name}'s knowledge!`);
        }
        if (sessionResult.pet_knowledge_updated) {
          toast.success(`📚 ${activePet.name} learned from your image evaluations!`);
        }
      } else {
        console.error('Failed to complete image quality session');
        toast.error('Failed to save session data');
      }
    } catch (error) {
      console.error('Error completing image quality session:', error);
      toast.error('Failed to save session progress');
    } finally {
      setIsComplete(true);
    }
  };

  const handlePlayAgain = () => {
    setCurrentRound(0);
    setScore(0);
    setIsComplete(false);
    setSelectedImage(null);
    setShowFeedback(false);
    setRoundsData([]);
    setEvaluationsData([]);
    setGameStarted(false);
    setError('');
    resetRewards();
    // This will trigger loadGameRounds again
  };

  if (!gameConfig) {
    return <div>Game configuration not found</div>;
  }

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
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 border-1 border-blue-800 shadow-[1px_1px_0_#1e3a8a]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/play-game')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-700 border-2 border-blue-900 shadow-[2px_2px_0_#1e3a8a] px-3 py-1 hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e3a8a] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {gameConfig.title.toUpperCase()}
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-700 border-2 border-blue-900 shadow-[2px_2px_0_#1e3a8a] px-3 py-1 hover:bg-blue-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e3a8a] transition-all flex items-center gap-2"
          >
            <HelpCircle className="h-3 w-3" />
            HELP
          </button>
        </div>
      </header>

      {/* Help Dialog */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase">
                HOW TO PLAY
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-gray-100 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="font-silkscreen text-xs text-gray-600 uppercase space-y-2">
                {gameConfig.helpInstructions.map((instruction, index) => (
                  <p key={index}>{instruction}</p>
                ))}
              </div>
              
              <div className="bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e3a8a] p-3">
                <div className="font-silkscreen text-xs font-bold text-blue-800 uppercase">
                  REWARDS: {gameConfig.rewards.display}
                </div>
              </div>
              
              <div className="bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] p-3">
                <div className="font-silkscreen text-xs font-bold text-green-800 uppercase">
                  🎨 SHARED ROUNDS: All players evaluate the same images!
                </div>
              </div>
              
              <div className="bg-purple-100 border-2 border-purple-600 shadow-[2px_2px_0_#581c87] p-3">
                <div className="font-silkscreen text-xs font-bold text-purple-800 uppercase">
                  📚 Your choices teach {activePet?.name || 'your pet'} about quality!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {!isComplete && gameStarted && roundsData.length > 0 && (
            /* Stats Cards Row */
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-lg font-bold text-blue-800 uppercase">
                  {currentRound + 1}/{totalRounds}
                </div>
                <div className="font-silkscreen text-xs font-bold text-blue-700 uppercase">
                  ROUND
                </div>
              </div>
              
              <div className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-lg font-bold text-green-800 uppercase">
                  {score}
                </div>
                <div className="font-silkscreen text-xs font-bold text-green-700 uppercase">
                  SCORE
                </div>
              </div>
              
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-lg font-bold text-purple-800 uppercase">
                  {gameConfig.timeEstimate}
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  TIME
                </div>
              </div>
            </div>
          )}

          {error ? (
            /* Error Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-red-100 border-red-600 text-red-800 inline-block mb-6">
                <X className="h-12 w-12" />
              </div>
              
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-3">
                ERROR LOADING ROUNDS
              </div>
              <div className="font-silkscreen text-xs text-red-600 uppercase mb-6">
                {error}
              </div>
              
              <button
                onClick={handlePlayAgain}
                className="font-silkscreen text-xs font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-6 py-2 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          ) : isLoading || !gameStarted ? (
            /* Loading Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-blue-100 border-blue-600 text-blue-800 inline-block mb-6">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-3">
                GENERATING AI IMAGES...
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase mb-2">
                Creating high-quality images with different AI parameters
              </div>
              <div className="font-silkscreen text-xs text-green-600 uppercase">
                🎨 Using OpenAI DALL-E 3 • This may take 30-60 seconds
              </div>
            </div>
          ) : isComplete ? (
            /* Completion Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-yellow-100 border-yellow-600 text-yellow-800 inline-block mb-6">
                <Trophy className="h-12 w-12" />
              </div>
              
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-3">
                EVALUATION COMPLETE!
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
                GREAT JOB EVALUATING IMAGE QUALITY!
              </div>
              
              <div className="space-y-4">
                {/* Session Results */}
                <div className="bg-purple-100 border-2 border-purple-600 shadow-[2px_2px_0_#581c87] p-4">
                  <div className="font-silkscreen text-sm font-bold text-purple-800 uppercase mb-2">
                    📚 {activePet?.name || 'Your Pet'} Learned From Your Choices!
                  </div>
                  <div className="font-silkscreen text-xs text-purple-700 uppercase">
                    High-quality selections added to pet knowledge
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => router.push('/')}
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center justify-center gap-2"
                  >
                    <Home className="h-3 w-3" />
                    HOME
                  </button>
                  
                  <button
                    onClick={() => router.push('/play-game')}
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e3a8a] px-4 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e3a8a] transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="h-3 w-3" />
                    NEW GAME
                  </button>
                  
                  <button
                    onClick={handlePlayAgain}
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e3a8a] px-4 py-2 hover:bg-blue-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1e3a8a] transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="h-3 w-3" />
                    PLAY AGAIN
                  </button>
                </div>
                
                <div className="font-silkscreen text-xs text-green-700 uppercase font-bold">
                  {rewardsAwarded ? "✓ " : ""}REWARDS: {gameConfig.rewards.display}
                </div>
              </div>
            </div>
          ) : roundsData.length > 0 ? (
            /* Game Interface */
            <div className="space-y-6">
              {/* Round Info */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase mb-2">
                  CHOOSE THE HIGHEST QUALITY IMAGE
                </div>
                <div className="font-silkscreen text-xs text-gray-600 uppercase mb-2">
                  Prompt: &quot;{roundsData[currentRound]?.prompt}&quot;
                </div>
                <div className="font-silkscreen text-xs text-blue-600 uppercase">
                  🎨 Same prompt, different AI models/settings - Pick the best quality!
                </div>
                {roundsData[currentRound]?.images.some(img => img.generation_params?.model === "dall-e-3") && (
                  <div className="font-silkscreen text-xs text-green-600 uppercase mt-2">
                    ✨ Real AI-generated images with OpenAI DALL-E 3!
                  </div>
                )}
              </div>

              {/* Image Grid */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                <div className="grid grid-cols-2 gap-4">
                  {roundsData[currentRound]?.images.map((imageData, index) => (
                    <div key={index} className="relative">
                      <button
                        className={`relative border-4 border-gray-600 shadow-[4px_4px_0_#374151] overflow-hidden transition-all w-full ${
                          selectedImage === index 
                            ? 'border-blue-600 shadow-[2px_2px_0_#1e3a8a] translate-x-[2px] translate-y-[2px]' 
                            : selectedImage !== null 
                              ? 'opacity-50' 
                              : 'hover:border-blue-400 hover:shadow-[2px_2px_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px]'
                        }`}
                        onClick={() => handleImageSelect(index)}
                        disabled={selectedImage !== null || isLoading}
                      >
                        <img
                          src={imageData.url}
                          alt={`Option ${index + 1}: ${imageData.prompt}`}
                          className="w-full h-32 object-cover"
                          onError={(e) => {
                            // Fallback for broken images
                            e.currentTarget.src = `https://via.placeholder.com/300x200/cccccc/666666?text=Image+${index + 1}`;
                          }}
                        />
                        {selectedImage === index && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="bg-blue-600 border-2 border-blue-800 shadow-[2px_2px_0_#1e3a8a] p-2">
                              <Check className="h-6 w-6 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute top-2 left-2 bg-gray-800 border-2 border-gray-600 shadow-[1px_1px_0_#374151] px-2 py-1">
                          <div className="font-silkscreen text-xs font-bold text-white uppercase">
                            {index + 1}
                          </div>
                        </div>
                      </button>
                      
                      {/* Parameter Info */}
                      <div className="mt-2 bg-gray-100 border-2 border-gray-300 shadow-[1px_1px_0_#6b7280] p-2">
                        <div className="font-silkscreen text-xs font-bold text-gray-800 uppercase mb-1">
                          {imageData.generation_params?.parameter_set_name || `Model ${index + 1}`}
                        </div>
                        <div className="font-silkscreen text-xs text-gray-600 uppercase space-y-1">
  
                          {imageData.generation_params?.steps && (
                            <div>⚙️ {imageData.generation_params.steps} steps</div>
                          )}
                          {imageData.generation_params?.guidance_scale && (
                            <div>🎯 guidance: {imageData.generation_params.guidance_scale}</div>
                          )}
                          {imageData.generation_params?.temperature && (
                            <div>🌡️ temp: {imageData.generation_params.temperature}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              {showFeedback && (
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-center">
                  <div className="bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] p-4">
                    <div className="font-silkscreen text-sm font-bold text-green-800 uppercase mb-2">
                      +{Math.floor(Math.random() * 20) + 10} POINTS!
                    </div>
                    <div className="font-silkscreen text-xs text-green-700 uppercase">
                      THANKS FOR HELPING IMPROVE IMAGE QUALITY DETECTION!
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 