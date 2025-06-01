"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, BookOpen, Star, HelpCircle, X, Home, RotateCcw } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";
import { useGameRewards } from "@/lib/hooks/use-game-rewards";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types for AI-generated trivia questions
interface TriviaQuestion {
  question: string;
  correct_answer: string;
  options: string[];
  category: string;
  fact: string;
  source: string;
}

interface TriviaQuestionResponse {
  questions: TriviaQuestion[];
  tokens_used?: number;
}

interface TriviaAnswer {
  is_correct: boolean;
  selected_answer: string;
  time_taken: number;
}

export default function KnowledgeTriviaGamePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFact, setShowFact] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Session tracking state
  const [sessionAnswers, setSessionAnswers] = useState<TriviaAnswer[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('knowledge-trivia');
  
  const totalQuestions = gameConfig?.stats.questions || 6;

  // Use game rewards hook
  const { rewardsAwarded, awardRewards, resetRewards } = useGameRewards(
    gameConfig?.id || 'knowledge-trivia',
    {
      points: gameConfig?.rewards.points || 50,
      skill: gameConfig?.rewards.skill || 'trivia',
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

  // Generate trivia questions when component mounts
  useEffect(() => {
    if (isAuthenticated && !gameStarted) {
      generateTriviaQuestions();
    }
  }, [isAuthenticated, gameStarted]);

  const generateTriviaQuestions = async () => {
    if (!user?.wallet_address) {
      toast.error("User wallet address not found");
      return;
    }

    setIsLoading(true);
    setError('');
    setSessionStartTime(Date.now());
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-trivia-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: totalQuestions,
          difficulty: 'easy', // Could be made configurable later
          wallet_address: user.wallet_address
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: TriviaQuestionResponse = await response.json();
      setTriviaQuestions(data.questions);
      setGameStarted(true);
      setQuestionStartTime(Date.now());
      
      toast.success(`Generated ${data.questions.length} unique trivia questions!`);
    } catch (error) {
      console.error('Error generating trivia questions:', error);
      setError('Failed to generate trivia questions. Please try again.');
      toast.error('Failed to generate trivia questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionComplete = async (finalAnswer: TriviaAnswer) => {
    const allAnswers = [...sessionAnswers, finalAnswer];
    
    if (!user?.wallet_address) {
      console.error("No wallet address available for session completion");
      setIsComplete(true);
      return;
    }

    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
      
      const response = await fetch(`${API_BASE_URL}/api/v1/ai/complete-trivia-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: user.wallet_address,
          questions_data: triviaQuestions,
          answers_data: allAnswers,
          total_score: score + (finalAnswer.is_correct ? 15 : 5),
          duration_seconds: sessionDuration
        }),
      });

      if (response.ok) {
        const sessionResult = await response.json();
        console.log('Trivia session completed:', sessionResult);
        toast.success(`Session completed! Accuracy: ${sessionResult.accuracy_rate.toFixed(1)}%`);
      } else {
        console.error('Failed to complete trivia session');
      }
    } catch (error) {
      console.error('Error completing trivia session:', error);
    } finally {
      setIsComplete(true);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== '' || isLoading) return;
    
    const answerTime = Date.now();
    const timeTaken = Math.max(1, Math.floor((answerTime - questionStartTime) / 1000));
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const question = triviaQuestions[currentQuestion];
    const isCorrect = answer === question.correct_answer;
    
    // Record the answer
    const answerData: TriviaAnswer = {
      is_correct: isCorrect,
      selected_answer: answer,
      time_taken: timeTaken
    };
    setSessionAnswers(prev => [...prev, answerData]);
    
    const points = isCorrect ? 15 : 5;
    setScore(score + points);
    
    setTimeout(() => {
      setShowFact(true);
    }, 1500);
    
    setTimeout(() => {
      if (currentQuestion < triviaQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
        setShowFact(false);
        setQuestionStartTime(Date.now());
      } else {
        handleSessionComplete(answerData);
      }
    }, 4000);
  };

  const handlePlayAgain = () => {
    setCurrentQuestion(0);
    setScore(0);
    setIsComplete(false);
    setShowFeedback(false);
    setSelectedAnswer('');
    setShowFact(false);
    setTriviaQuestions([]);
    setSessionAnswers([]);
    setGameStarted(false);
    resetRewards();
    // This will trigger generateTriviaQuestions again
  };

  // Early returns after all hooks
  if (!gameConfig) {
    return <div>Game configuration not found</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Show loading state while generating questions
  if (isLoading || triviaQuestions.length === 0) {
    return (
      <main className="h-[100dvh] w-full relative overflow-hidden pb-16 flex items-center justify-center">
        <FlickeringGrid
          className="absolute inset-0 -z-5 h-full w-full [mask-image:radial-gradient(1200px_circle_at_center,transparent,white)]"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.5}
          flickerChance={0.1}
        />
        <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8 text-center">
          <div className="font-silkscreen text-lg font-bold text-gray-800 uppercase mb-4">
            {isLoading ? "GENERATING AI TRIVIA..." : "LOADING GAME..."}
          </div>
          <div className="font-silkscreen text-sm text-gray-600 uppercase">
            {isLoading ? "Creating unique questions just for you!" : "Please wait..."}
          </div>
          {error && (
            <div className="mt-4 font-silkscreen text-xs text-red-600 uppercase">
              {error}
            </div>
          )}
        </div>
      </main>
    );
  }

  const question = triviaQuestions[currentQuestion];

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
      <header className="relative z-10 px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 border-1 border-orange-800 shadow-[1px_1px_0_#9a3412]">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/play-game')}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-orange-700 border-2 border-orange-900 shadow-[2px_2px_0_#9a3412] px-3 py-1 hover:bg-orange-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#9a3412] transition-all flex items-center gap-2"
          >
            <ArrowLeft className="h-3 w-3" />
            BACK
          </button>
          
          <div className="font-silkscreen text-sm font-bold text-white uppercase tracking-wider drop-shadow-lg">
            {gameConfig.title.toUpperCase()}
          </div>
          
          <button
            onClick={() => setShowHelp(true)}
            className="font-silkscreen text-xs font-bold text-white uppercase bg-orange-700 border-2 border-orange-900 shadow-[2px_2px_0_#9a3412] px-3 py-1 hover:bg-orange-600 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#9a3412] transition-all flex items-center gap-2"
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
              
              <div className="bg-orange-100 border-2 border-orange-600 shadow-[2px_2px_0_#9a3412] p-3">
                <div className="font-silkscreen text-xs font-bold text-orange-800 uppercase">
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
              <div className="bg-orange-100 border-4 border-orange-600 shadow-[4px_4px_0_#9a3412] p-2 text-center flex flex-col items-center justify-center">
                <div className="font-silkscreen text-sm font-bold text-orange-800 uppercase">
                  {question.category}
                </div>
                <div className="font-silkscreen text-xs font-bold text-orange-700 uppercase">
                  CATEGORY
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
                <div className="font-silkscreen text-sm font-bold text-purple-800 uppercase">
                  {currentQuestion + 1}/{totalQuestions}
                </div>
                <div className="font-silkscreen text-xs font-bold text-purple-700 uppercase">
                  QUESTION
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
                TRIVIA COMPLETE!
              </div>
              <div className="font-silkscreen text-sm text-gray-600 uppercase mb-6">
                YOU EARNED {score} POINTS AND LEARNED AMAZING FACTS!
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
                    className="font-silkscreen text-xs font-bold text-white uppercase bg-orange-600 border-2 border-orange-800 shadow-[2px_2px_0_#9a3412] px-4 py-2 hover:bg-orange-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#9a3412] transition-all flex items-center justify-center gap-2"
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
            /* Game Interface */
            <div className="space-y-6">
              {/* Question */}
              <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-8">
                <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-orange-600 shadow-[4px_4px_0_#9a3412] p-6">
                  <div className="space-y-4">
                    <div className="font-silkscreen text-lg text-gray-800 font-medium leading-relaxed">
                      {question.question}
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3 w-3 text-gray-500" />
                      <div className="font-silkscreen text-xs text-gray-500 uppercase">
                        SOURCE: {question.source}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              {!showFeedback ? (
                <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {question.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(option)}
                        className="bg-orange-100 border-4 border-orange-600 shadow-[4px_4px_0_#9a3412] p-4 text-left hover:bg-orange-200 hover:shadow-[2px_2px_0_#9a3412] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-[0px_0px_0_#9a3412]"
                        disabled={selectedAnswer !== ''}
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-silkscreen text-sm font-bold text-orange-700 bg-orange-200 border-2 border-orange-700 shadow-[1px_1px_0_#9a3412] px-2 py-1 uppercase">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <div className="font-silkscreen text-sm font-bold text-orange-800 uppercase">
                            {option}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Feedback */
                <div className="space-y-4">
                  <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6 text-center">
                    <div className={`border-2 shadow-[2px_2px_0_#374151] p-4 ${
                      selectedAnswer === question.correct_answer 
                        ? 'bg-green-100 border-green-600' 
                        : 'bg-red-100 border-red-600'
                    }`}>
                      {selectedAnswer === question.correct_answer ? (
                        <>
                          <div className="font-silkscreen text-sm font-bold text-green-800 uppercase mb-2">
                            CORRECT! +15 POINTS!
                          </div>
                          <div className="font-silkscreen text-xs text-green-700 uppercase">
                            EXCELLENT KNOWLEDGE!
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-silkscreen text-sm font-bold text-red-800 uppercase mb-2">
                            NOT QUITE! +5 POINTS FOR TRYING!
                          </div>
                          <div className="font-silkscreen text-xs text-red-700 uppercase">
                            CORRECT ANSWER: {question.correct_answer}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {showFact && (
                    <div className="bg-white border-4 border-gray-800 shadow-[8px_8px_0_#374151] p-6">
                      <div className="bg-blue-100 border-2 border-blue-600 shadow-[2px_2px_0_#1e3a8a] p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-600 border-2 border-blue-800 shadow-[1px_1px_0_#1e3a8a] p-1">
                            <Star className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <div className="font-silkscreen text-sm font-bold text-blue-800 uppercase mb-2">
                              DID YOU KNOW?
                            </div>
                            <div className="font-silkscreen text-xs text-blue-700 leading-relaxed">
                              {question.fact}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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