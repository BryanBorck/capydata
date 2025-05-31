"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Trophy, X, Star, HelpCircle, Home, RotateCcw } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";
import { useGameRewards } from "@/lib/hooks/use-game-rewards";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for AI-generated flashcards
interface AIFlashcard {
  word: string;
  translation: string;
  pronunciation: string;
  distractors: string[];
}

interface FlashcardResponse {
  language: string;
  flashcards: AIFlashcard[];
  tokens_used?: number;
}

// API utility function
async function generateFlashcards(language: string, difficulty: string = 'beginner', count: number = 5): Promise<FlashcardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language,
      difficulty,
      count
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || 'Failed to generate flashcards');
  }

  return response.json();
}

export default function LanguageFlashcardsGamePage() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [currentCard, setCurrentCard] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [flashcards, setFlashcards] = useState<AIFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('language-flashcards');
  
  const totalCards = gameConfig?.stats.cards || 5;

  // Use game rewards hook - moved before early return
  const { rewardsAwarded, awardRewards, resetRewards } = useGameRewards(
    gameConfig?.id || 'language-flashcards',
    {
      points: gameConfig?.rewards.points || 50,
      skill: gameConfig?.rewards.skill || 'science',
      skillValue: gameConfig?.rewards.skillValue || 5
    }
  );

  const availableLanguages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Russian'
  ];

  // Redirect if not authenticated - moved before early return
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Award rewards when game is completed - moved before early return
  useEffect(() => {
    if (isComplete && !rewardsAwarded) {
      awardRewards();
    }
  }, [isComplete, rewardsAwarded, awardRewards]);

  if (!gameConfig) {
    return <div>Game configuration not found</div>;
  }

  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    setCurrentCard(0);
    setScore(0);
    setError('');
    setIsLoading(true);
    
    try {
      const response = await generateFlashcards(language, 'beginner', totalCards);
      setFlashcards(response.flashcards);
      toast.success(`Generated ${response.flashcards.length} flashcards for ${language}!`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate flashcards';
      setError(errorMessage);
      toast.error(`Failed to generate flashcards: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== '' || isLoading) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const card = flashcards[currentCard];
    const isCorrect = answer === card.translation;
    
    if (isCorrect) {
      setScore(score + 20);
    } else {
      setScore(score + 5); // Still give some points for trying
    }
    
    setTimeout(() => {
      if (currentCard < flashcards.length - 1) {
        setCurrentCard(currentCard + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
      } else {
        setIsComplete(true);
        toast.success(`Language practice complete! You earned ${score + (isCorrect ? 20 : 5)} points!`);
      }
    }, 2000);
  };

  const handlePlayAgain = () => {
    setSelectedLanguage('');
    setCurrentCard(0);
    setScore(0);
    setIsComplete(false);
    setShowFeedback(false);
    setSelectedAnswer('');
    setFlashcards([]);
    setError('');
    resetRewards();
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
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 border-1 border-green-800 shadow-[1px_1px_0_#14532d]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/play-game')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-green-700 border-2 border-green-900 shadow-[2px_2px_0_#14532d] px-3 py-1 hover:bg-green-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {gameConfig.title.toUpperCase()}
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-green-700 border-2 border-green-900 shadow-[2px_2px_0_#14532d] px-3 py-1 hover:bg-green-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center gap-2"
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
              
              <div className="bg-green-100 border-2 border-green-600 shadow-[2px_2px_0_#14532d] p-3">
                <div className="font-silkscreen text-xs font-bold text-green-800 uppercase">
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
          
          {selectedLanguage && flashcards.length > 0 && !isComplete && !showFeedback && (
            /* Stats Cards Row */
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-green-800 uppercase">
                  {selectedLanguage}
                </div>
                <div className="font-silkscreen text-xs font-bold text-green-700 uppercase">
                  LANGUAGE
                </div>
              </div>
              
              <div className="bg-blue-100 border-4 border-blue-600 shadow-[4px_4px_0_#1e3a8a] p-4 text-center">
                <div className="font-silkscreen text-lg font-bold text-blue-800 uppercase">
                  {score}
                </div>
                <div className="font-silkscreen text-xs font-bold text-blue-700 uppercase">
                  SCORE
                </div>
              </div>
              
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-purple-800 uppercase">
                  {currentCard + 1}/{flashcards.length}
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  CARD
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
                ERROR LOADING FLASHCARDS
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
          ) : isLoading ? (
            /* Loading Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-blue-100 border-blue-600 text-blue-800 inline-block mb-6">
                <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              
              <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-3">
                GENERATING FLASHCARDS...
              </div>
              <div className="font-silkscreen text-xs text-gray-600 uppercase">
                AI IS CREATING PERSONALIZED {selectedLanguage} VOCABULARY CARDS FOR YOU!
              </div>
            </div>
          ) : isComplete ? (
            /* Completion Screen */
            <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
              <div className="p-4 border-2 border-gray-600 shadow-[2px_2px_0_#374151] bg-yellow-100 border-yellow-600 text-yellow-800 inline-block mb-6">
                <Globe className="h-12 w-12" />
              </div>
              
              <div className="font-silkscreen text-xl font-bold text-gray-800 uppercase mb-3">
                LANGUAGE PRACTICE COMPLETE!
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
                YOU EARNED {score} POINTS LEARNING {selectedLanguage}!
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
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-green-600 border-2 border-green-800 shadow-[2px_2px_0_#14532d] px-4 py-2 hover:bg-green-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#14532d] transition-all flex items-center justify-center gap-2"
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
          ) : !selectedLanguage || flashcards.length === 0 ? (
            /* Language Selection */
            <div className="space-y-6">
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-center">
                <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-3">
                  CHOOSE A LANGUAGE TO PRACTICE
                </div>
                <div className="font-silkscreen text-xs text-gray-600 uppercase">
                  AI WILL GENERATE PERSONALIZED FLASHCARDS FOR YOU!
                </div>
              </div>
              
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                <div className="grid grid-cols-2 gap-3">
                  {availableLanguages.map((language) => (
                    <button
                      key={language}
                      onClick={() => handleLanguageSelect(language)}
                      className="bg-green-100 border-4 border-green-600 shadow-[4px_4px_0_#14532d] p-4 text-center hover:bg-green-200 hover:shadow-[2px_2px_0_#14532d] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#14532d]"
                      disabled={isLoading}
                    >
                      <div className="font-silkscreen text-sm font-bold text-green-800 uppercase mb-1">
                        {language}
                      </div>
                      <div className="px-2 py-1 border-2 border-blue-600 shadow-[1px_1px_0_#1e3a8a] bg-blue-100 text-blue-700 font-silkscreen text-xs font-bold uppercase">
                        AI GENERATED
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-4 text-center">
                <div className="bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e3a8a] p-3 inline-block">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-blue-600" />
                    <div className="font-silkscreen text-xs font-bold text-blue-800 uppercase">
                      POWERED BY OPENAI - UNIQUE VOCABULARY EACH SESSION!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Game Interface */
            <div className="space-y-6">
              {/* Flashcard */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
                <div className="bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-8">
                  <div className="space-y-4">
                    <div className="font-silkscreen text-2xl font-bold text-gray-800 uppercase">
                      {flashcards[currentCard]?.word}
                    </div>
                    <div className="font-mono text-sm text-gray-600 italic">
                      /{flashcards[currentCard]?.pronunciation}/
                    </div>
                    <div className="font-silkscreen text-xs text-gray-600 uppercase">
                      WHAT DOES THIS MEAN IN ENGLISH?
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              {!showFeedback ? (
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {(() => {
                      const card = flashcards[currentCard];
                      const allOptions = [card.translation, ...card.distractors].sort(() => Math.random() - 0.5);
                      return allOptions.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(option)}
                          className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center hover:bg-purple-200 hover:shadow-[2px_2px_0_#581c87] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#581c87]"
                          disabled={selectedAnswer !== ''}
                        >
                          <div className="font-silkscreen text-sm font-bold text-purple-800 uppercase">
                            {option}
                          </div>
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              ) : (
                /* Feedback */
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-center">
                  <div className={`border-2 shadow-[2px_2px_0_#374151] p-4 ${
                    selectedAnswer === flashcards[currentCard].translation 
                      ? 'bg-green-100 border-green-600' 
                      : 'bg-orange-100 border-orange-600'
                  }`}>
                    {selectedAnswer === flashcards[currentCard].translation ? (
                      <>
                        <div className="font-silkscreen text-sm font-bold text-green-800 uppercase mb-2">
                          CORRECT! +20 POINTS!
                        </div>
                        <div className="font-silkscreen text-xs text-green-700 uppercase">
                          GREAT JOB LEARNING {selectedLanguage}!
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="font-silkscreen text-sm font-bold text-orange-800 uppercase mb-2">
                          NOT QUITE! +5 POINTS FOR TRYING!
                        </div>
                        <div className="font-silkscreen text-xs text-orange-700 uppercase">
                          CORRECT ANSWER: {flashcards[currentCard].translation}
                        </div>
                      </>
                    )}
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