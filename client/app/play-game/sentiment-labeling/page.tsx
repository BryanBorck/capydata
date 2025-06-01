"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, ThumbsUp, ThumbsDown, HelpCircle, X, Home, RotateCcw } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";
import { useGameRewards } from "@/lib/hooks/use-game-rewards";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for AI-generated sentiment texts
interface SentimentText {
  text: string;
  correct_sentiment: 'positive' | 'negative' | 'neutral';
  difficulty_level: string;
}

interface SentimentTextResponse {
  texts: SentimentText[];
  tokens_used?: number;
}

interface SentimentAnswer {
  is_correct: boolean;
  selected_sentiment: string;
  time_taken: number;
}

export default function SentimentLabelingGamePage() {
  const [currentText, setCurrentText] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [sentimentTexts, setSentimentTexts] = useState<SentimentText[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Session tracking state
  const [sessionAnswers, setSessionAnswers] = useState<SentimentAnswer[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('sentiment-labeling');
  
  const totalTexts = gameConfig?.stats.texts || 5;

  // Use game rewards hook
  const { rewardsAwarded, awardRewards, resetRewards } = useGameRewards(
    gameConfig?.id || 'sentiment-labeling',
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

  // Generate sentiment texts when component mounts
  useEffect(() => {
    if (isAuthenticated && !gameStarted) {
      generateSentimentTexts();
    }
  }, [isAuthenticated, gameStarted]);

  const generateSentimentTexts = async () => {
    if (!user?.wallet_address) {
      toast.error("User wallet address not found");
      return;
    }

    setIsLoading(true);
    setError('');
    setSessionStartTime(Date.now());
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-sentiment-texts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: totalTexts,
          difficulty: 'easy', // Could be made configurable later
          wallet_address: user.wallet_address
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SentimentTextResponse = await response.json();
      setSentimentTexts(data.texts);
      setGameStarted(true);
      setQuestionStartTime(Date.now());
      
      toast.success(`Generated ${data.texts.length} sentiment texts for analysis!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate sentiment texts';
      setError(errorMessage);
      toast.error(`Failed to generate sentiment texts: ${errorMessage}`);
      
      // Fallback to sample texts if API fails
      const fallbackTexts: SentimentText[] = [
        {
          text: "I absolutely love this product! It exceeded all my expectations.",
          correct_sentiment: 'positive',
          difficulty_level: 'easy'
        },
        {
          text: "This is the worst experience I've ever had. Completely disappointed.",
          correct_sentiment: 'negative',
          difficulty_level: 'easy'
        },
        {
          text: "The weather today is quite nice, not too hot or cold.",
          correct_sentiment: 'neutral',
          difficulty_level: 'easy'
        },
        {
          text: "I'm so excited about the upcoming vacation! Can't wait!",
          correct_sentiment: 'positive',
          difficulty_level: 'easy'
        },
        {
          text: "The service was okay, nothing special but not terrible either.",
          correct_sentiment: 'neutral',
          difficulty_level: 'easy'
        }
      ];
      setSentimentTexts(fallbackTexts);
      setGameStarted(true);
      setQuestionStartTime(Date.now());
      
      toast.info("Using sample texts due to API error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSentimentSelect = (sentiment: 'positive' | 'negative' | 'neutral') => {
    if (selectedSentiment !== '' || isLoading) return;
    
    const answerTime = Date.now();
    const timeTaken = Math.max(1, Math.floor((answerTime - questionStartTime) / 1000));
    
    setSelectedSentiment(sentiment);
    setShowFeedback(true);
    
    const currentSentimentText = sentimentTexts[currentText];
    const isCorrect = sentiment === currentSentimentText.correct_sentiment;
    
    // Record the answer
    const answerData: SentimentAnswer = {
      is_correct: isCorrect,
      selected_sentiment: sentiment,
      time_taken: timeTaken
    };
    setSessionAnswers(prev => [...prev, answerData]);
    
    // Award points
    const points = isCorrect ? 15 : 5; // More points for correct answers
    setScore(score + points);
    
    setTimeout(() => {
      if (currentText < sentimentTexts.length - 1) {
        setCurrentText(currentText + 1);
        setShowFeedback(false);
        setSelectedSentiment('');
        setQuestionStartTime(Date.now());
      } else {
        handleSessionComplete(answerData);
      }
    }, 1500);
  };

  const handleSessionComplete = async (finalAnswer: SentimentAnswer) => {
    if (!user?.wallet_address) {
      setIsComplete(true);
      return;
    }
    
    const allAnswers = [...sessionAnswers, finalAnswer];
    const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
    const finalScore = score + (finalAnswer.is_correct ? 15 : 5);
    
    try {
      // Submit session data to backend
      const sessionData = {
        wallet_address: user.wallet_address,
        texts_data: sentimentTexts,
        answers_data: allAnswers,
        total_score: finalScore,
        duration_seconds: sessionDuration
      };
      
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/complete-sentiment-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setIsComplete(true);
      toast.success(`Session complete! Accuracy: ${Math.round(result.accuracy_rate)}% (${result.correct_answers}/${result.total_answers})`);
    } catch (error) {
      console.error('Failed to complete session:', error);
      toast.error('Failed to save session progress');
      setIsComplete(true); // Still complete the game even if tracking fails
    }
  };

  const handlePlayAgain = () => {
    setCurrentText(0);
    setScore(0);
    setIsComplete(false);
    setShowFeedback(false);
    setSelectedSentiment('');
    setSentimentTexts([]);
    setSessionAnswers([]);
    setGameStarted(false);
    setError('');
    resetRewards();
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
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 border-1 border-purple-800 shadow-[1px_1px_0_#581c87]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/play-game')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-purple-700 border-2 border-purple-900 shadow-[2px_2px_0_#581c87] px-3 py-1 hover:bg-purple-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {gameConfig.title.toUpperCase()}
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-purple-700 border-2 border-purple-900 shadow-[2px_2px_0_#581c87] px-3 py-1 hover:bg-purple-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all flex items-center gap-2"
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
              
              <div className="bg-purple-100 border-2 border-purple-600 shadow-[2px_2px_0_#581c87] p-3">
                <div className="font-silkscreen text-xs font-bold text-purple-800 uppercase">
                  REWARDS: {gameConfig.rewards.display}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 h-full overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Loading State */}
          {isLoading && (
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
                GENERATING AI SENTIMENT TEXTS...
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase">
                PLEASE WAIT WHILE WE CREATE UNIQUE TEXTS FOR YOU
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="bg-white border-4 border-red-600 shadow-[8px_8px_0_#dc2626] p-6 text-center">
              <div className="font-silkscreen text-lg font-bold text-red-800 uppercase mb-2">
                ERROR GENERATING TEXTS
              </div>
              <div className="font-silkscreen text-sm text-red-600 uppercase mb-4">
                {error}
              </div>
              <button
                onClick={generateSentimentTexts}
                className="font-silkscreen text-xs font-bold text-white uppercase bg-red-600 border-2 border-red-800 shadow-[2px_2px_0_#dc2626] px-4 py-2 hover:bg-red-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#dc2626] transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          )}
          
          {!isLoading && !error && sentimentTexts.length > 0 && !isComplete && (
            /* Stats Cards Row */
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-lg font-bold text-purple-800 uppercase">
                  {currentText + 1}/{sentimentTexts.length}
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  TEXT
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
              
              <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-lg font-bold text-blue-800 uppercase">
                  {gameConfig.timeEstimate}
                </div>
                <div className="font-silkscreen text-xs font-bold text-blue-700 uppercase">
                  TIME
                </div>
              </div>
            </div>
          )}

          {isComplete ? (
            /* Completion Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-yellow-100 border-yellow-600 text-yellow-800 inline-block mb-6">
                <Trophy className="h-12 w-12" />
              </div>
              
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-3">
                SENTIMENT ANALYSIS COMPLETE!
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
                YOU EARNED {score} POINTS HELPING TRAIN AI!
              </div>
              
              <div className="space-y-4">
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
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-purple-600 border-2 border-purple-800 shadow-[2px_2px_0_#581c87] px-4 py-2 hover:bg-purple-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all flex items-center justify-center gap-2"
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
          ) : (
            !isLoading && !error && sentimentTexts.length > 0 && (
            /* Game Interface */
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                  WHAT&apos;S THE SENTIMENT OF THIS TEXT?
                </div>
              </div>

              {/* Text Display */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8">
                <div className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-6 text-center">
                  <div className="font-silkscreen text-lg text-gray-800 leading-relaxed">
                    &quot;{sentimentTexts[currentText]?.text}&quot;
                  </div>
                </div>
              </div>

              {/* Sentiment Options */}
              {!showFeedback ? (
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => handleSentimentSelect('positive')}
                      className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-2 text-center hover:bg-green-200 hover:shadow-[2px_2px_0_#14532d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#14532d]"
                      disabled={selectedSentiment !== ''}
                    >
                      <ThumbsUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <div className="font-silkscreen text-sm font-bold text-green-800 uppercase">
                        POSITIVE
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleSentimentSelect('neutral')}
                      className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-2 text-center hover:bg-gray-200 hover:shadow-[2px_2px_0_#374151] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#374151]"
                      disabled={selectedSentiment !== ''}
                    >
                      <div className="h-8 w-8 bg-gray-400 rounded-full mx-auto mb-3" />
                      <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                        NEUTRAL
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleSentimentSelect('negative')}
                      className="bg-red-100 border-4 border-red-600 shadow-[4px_4px_0_#dc2626] p-2 text-center hover:bg-red-200 hover:shadow-[2px_2px_0_#dc2626] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#dc2626]"
                      disabled={selectedSentiment !== ''}
                    >
                      <ThumbsDown className="h-8 w-8 text-red-600 mx-auto mb-3" />
                      <div className="font-silkscreen text-sm font-bold text-red-800 uppercase">
                        NEGATIVE
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                /* Feedback */
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-center">
                  <div className={`border-2 shadow-[2px_2px_0_#374151] p-4 ${
                    sessionAnswers[sessionAnswers.length - 1]?.is_correct 
                      ? 'bg-green-100 border-green-600' 
                      : 'bg-orange-100 border-orange-600'
                  }`}>
                    <div className={`font-silkscreen text-sm font-bold uppercase mb-2 ${
                      sessionAnswers[sessionAnswers.length - 1]?.is_correct 
                        ? 'text-green-800' 
                        : 'text-orange-800'
                    }`}>
                      {sessionAnswers[sessionAnswers.length - 1]?.is_correct ? '+15 POINTS!' : '+5 POINTS!'}
                    </div>
                    <div className={`font-silkscreen text-xs uppercase ${
                      sessionAnswers[sessionAnswers.length - 1]?.is_correct 
                        ? 'text-green-700' 
                        : 'text-orange-700'
                    }`}>
                      {sessionAnswers[sessionAnswers.length - 1]?.is_correct 
                        ? 'CORRECT! THANKS FOR HELPING TRAIN OUR AI!' 
                        : `GOOD TRY! THE CORRECT ANSWER WAS ${sentimentTexts[currentText]?.correct_sentiment.toUpperCase()}`
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          )}
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 