"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, ThumbsUp, ThumbsDown, HelpCircle, X } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { APP_NAME } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";

// Sample texts for sentiment analysis
const SAMPLE_TEXTS = [
  "I absolutely love this product! It exceeded all my expectations.",
  "This is the worst experience I've ever had. Completely disappointed.",
  "The weather today is quite nice, not too hot or cold.",
  "I'm so excited about the upcoming vacation! Can't wait!",
  "The service was okay, nothing special but not terrible either."
];

export default function SentimentLabelingGamePage() {
  const [currentText, setCurrentText] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('sentiment-labeling');
  
  if (!gameConfig) {
    return <div>Game configuration not found</div>;
  }

  const totalTexts = gameConfig.stats.texts || 5;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleSentimentSelect = (sentiment: 'positive' | 'negative' | 'neutral') => {
    if (selectedSentiment !== '') return;
    
    setSelectedSentiment(sentiment);
    setShowFeedback(true);
    setScore(score + 10);
    
    setTimeout(() => {
      if (currentText < totalTexts - 1) {
        setCurrentText(currentText + 1);
        setShowFeedback(false);
        setSelectedSentiment('');
      } else {
        setIsComplete(true);
        toast.success(`Sentiment analysis complete! You earned ${score + 10} points!`);
      }
    }, 1500);
  };

  const handlePlayAgain = () => {
    setCurrentText(0);
    setScore(0);
    setIsComplete(false);
    setShowFeedback(false);
    setSelectedSentiment('');
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
          
          {!isComplete && (
            /* Stats Cards Row */
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center">
                <div className="font-silkscreen text-lg font-bold text-purple-800 uppercase">
                  {currentText + 1}/{totalTexts}
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  TEXT
                </div>
              </div>
              
              <div className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-4 text-center">
                <div className="font-silkscreen text-lg font-bold text-green-800 uppercase">
                  {score}
                </div>
                <div className="font-silkscreen text-xs font-bold text-green-700 uppercase">
                  SCORE
                </div>
              </div>
              
              <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-4 text-center">
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
                YOU EARNED {score} POINTS FOR TEXT ANALYSIS!
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handlePlayAgain}
                  className="font-silkscreen text-xs font-bold text-white uppercase bg-purple-600 border-2 border-purple-800 shadow-[2px_2px_0_#581c87] px-6 py-2 hover:bg-purple-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#581c87] transition-all"
                >
                  PLAY AGAIN
                </button>
                
                <div className="font-silkscreen text-xs text-gray-600 uppercase">
                  {gameConfig.rewards.display} EARNED
                </div>
              </div>
            </div>
          ) : (
            /* Game Interface */
            <div className="space-y-6">
              {/* Instructions */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-gray-800 uppercase">
                  WHAT'S THE SENTIMENT OF THIS TEXT?
                </div>
              </div>

              {/* Text Display */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8">
                <div className="bg-gray-100 border-4 border-gray-600 shadow-[4px_4px_0_#374151] p-6 text-center">
                  <div className="font-silkscreen text-lg text-gray-800 leading-relaxed">
                    "{SAMPLE_TEXTS[currentText]}"
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
                  <div className="bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e3a8a] p-4">
                    <div className="font-silkscreen text-sm font-bold text-blue-800 uppercase mb-2">
                      +10 POINTS!
                    </div>
                    <div className="font-silkscreen text-xs text-blue-700 uppercase">
                      THANKS FOR HELPING TRAIN OUR SENTIMENT AI!
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 