"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, BookOpen, Star, HelpCircle, X } from "lucide-react";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useUser } from "@/providers/user-provider";
import { APP_NAME } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getGameConfig } from "../game-config";

// Trivia questions data
const TRIVIA_QUESTIONS = [
  {
    question: "Which programming language was originally called 'Oak' before being renamed?",
    fact: "Java was originally developed by James Gosling at Sun Microsystems and was initially called Oak after an oak tree that stood outside Gosling's office.",
    correct: "Java",
    options: ["Java", "Python", "JavaScript", "C++"],
    category: "Technology",
    source: "Computer Science History"
  },
  {
    question: "What natural phenomenon causes the Northern Lights (Aurora Borealis)?",
    fact: "The Northern Lights are caused by solar particles colliding with Earth's magnetic field and atmosphere, creating beautiful light displays typically visible near the Arctic Circle.",
    correct: "Solar particles hitting Earth's atmosphere",
    options: ["Solar particles hitting Earth's atmosphere", "Moon's gravitational pull", "Volcanic activity", "Ocean currents"],
    category: "Science",
    source: "Atmospheric Physics"
  },
  {
    question: "Which ancient wonder of the world was located in Alexandria, Egypt?",
    fact: "The Lighthouse of Alexandria, also known as the Pharos of Alexandria, was one of the Seven Wonders of the Ancient World and guided ships safely to the harbor for over 1,500 years.",
    correct: "The Lighthouse of Alexandria",
    options: ["The Lighthouse of Alexandria", "The Hanging Gardens", "The Colossus", "The Temple of Artemis"],
    category: "History",
    source: "Ancient Civilizations"
  },
  {
    question: "What unique ability do octopuses have that helps them escape predators?",
    fact: "Octopuses can change both their color and texture to perfectly match their surroundings, making them nearly invisible to predators and prey.",
    correct: "Change color and texture to camouflage",
    options: ["Change color and texture to camouflage", "Produce electric shocks", "Fly short distances", "Become completely invisible"],
    category: "Biology",
    source: "Marine Biology"
  },
  {
    question: "Which country has the most time zones?",
    fact: "France has the most time zones of any country (12), due to its overseas territories scattered across the globe, from French Polynesia to New Caledonia.",
    correct: "France",
    options: ["France", "Russia", "United States", "China"],
    category: "Geography",
    source: "World Geography"
  },
  {
    question: "What is the name of the closest star to our solar system?",
    fact: "Proxima Centauri is the closest star to our solar system at about 4.24 light-years away. It's actually part of a triple star system called Alpha Centauri.",
    correct: "Proxima Centauri",
    options: ["Proxima Centauri", "Alpha Centauri", "Sirius", "Vega"],
    category: "Astronomy",
    source: "Space Science"
  }
];

export default function KnowledgeTriviaGamePage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFact, setShowFact] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  const router = useRouter();
  const { isAuthenticated } = useUser();

  // Get game configuration
  const gameConfig = getGameConfig('knowledge-trivia');
  
  if (!gameConfig) {
    return <div>Game configuration not found</div>;
  }

  const totalQuestions = gameConfig.stats.questions || 6;
  const question = TRIVIA_QUESTIONS[currentQuestion];

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer !== '') return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === question.correct;
    const points = isCorrect ? 15 : 5;
    setScore(score + points);
    
    setTimeout(() => {
      setShowFact(true);
    }, 1500);
    
    setTimeout(() => {
      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
        setShowFact(false);
      } else {
        setIsComplete(true);
        toast.success(`Trivia complete! You earned ${score + points} points and learned amazing facts!`);
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
              <div className="bg-orange-100 border-4 border-orange-600 shadow-[4px_4px_0_#9a3412] p-4 text-center">
                <div className="font-silkscreen text-sm font-bold text-orange-800 uppercase">
                  {question.category}
                </div>
                <div className="font-silkscreen text-xs font-bold text-orange-700 uppercase">
                  CATEGORY
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
              
              <div className="bg-purple-100 border-4 border-purple-600 shadow-[4px_4px_0_#581c87] p-4 text-center">
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
              
              <div className="space-y-3">
                <button
                  onClick={handlePlayAgain}
                  className="font-silkscreen text-xs font-bold text-white uppercase bg-orange-600 border-2 border-orange-800 shadow-[2px_2px_0_#9a3412] px-6 py-2 hover:bg-orange-500 active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#9a3412] transition-all"
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
                      selectedAnswer === question.correct 
                        ? 'bg-green-100 border-green-600' 
                        : 'bg-red-100 border-red-600'
                    }`}>
                      {selectedAnswer === question.correct ? (
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
                            CORRECT ANSWER: {question.correct}
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