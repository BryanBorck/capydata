"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gamepad2, Target, Puzzle, Heart, Zap, Users, Trophy, Play, RefreshCw, Star } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface Game {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rewards: string;
  minLevel: number;
}

const GAMES: Game[] = [
  {
    id: 'memory',
    title: 'Memory Match',
    description: 'Test your memory with card matching',
    icon: Puzzle,
    color: 'from-blue-500 to-cyan-500',
    difficulty: 'Easy',
    rewards: '+3 Intelligence, +1 Health',
    minLevel: 1
  },
  {
    id: 'reaction',
    title: 'Quick Reactions',
    description: 'Click targets as fast as you can',
    icon: Target,
    color: 'from-green-500 to-emerald-500',
    difficulty: 'Medium',
    rewards: '+5 Strength, +2 Social',
    minLevel: 3
  },
  {
    id: 'puzzle',
    title: 'Logic Puzzle',
    description: 'Solve challenging brain teasers',
    icon: Star,
    color: 'from-purple-500 to-pink-500',
    difficulty: 'Hard',
    rewards: '+8 Intelligence, +3 Social',
    minLevel: 5
  }
];

interface MemoryCardProps {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
}

function MemoryCard({ id, symbol, isFlipped, isMatched, onClick }: MemoryCardProps) {
  return (
    <div
      className={`w-16 h-16 rounded-lg cursor-pointer transition-all duration-300 flex items-center justify-center text-2xl font-bold ${
        isFlipped || isMatched
          ? isMatched
            ? 'bg-green-200 text-green-800'
            : 'bg-blue-200 text-blue-800'
          : 'bg-gray-300 hover:bg-gray-400'
      }`}
      onClick={onClick}
    >
      {(isFlipped || isMatched) ? symbol : '?'}
    </div>
  );
}

function MemoryGame({ onComplete }: { onComplete: (score: number) => void }) {
  const symbols = ['🐕', '🐱', '🐹', '🐰', '🦊', '🐺', '🐸', '🐥'];
  const [cards, setCards] = useState<Array<{ id: number; symbol: string; isFlipped: boolean; isMatched: boolean }>>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);

  useEffect(() => {
    // Initialize game
    const shuffledCards = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol,
        isFlipped: false,
        isMatched: false
      }));
    setCards(shuffledCards);
  }, []);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (cards[cardId].isFlipped || cards[cardId].isMatched) return;

    const newCards = [...cards];
    newCards[cardId].isFlipped = true;
    setCards(newCards);

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      setTimeout(() => {
        const [first, second] = newFlippedCards;
        if (cards[first].symbol === cards[second].symbol) {
          // Match found
          newCards[first].isMatched = true;
          newCards[second].isMatched = true;
          
          // Check if game is complete
          if (newCards.every(card => card.isMatched)) {
            setIsGameComplete(true);
            const score = Math.max(100 - moves * 5, 10);
            setTimeout(() => onComplete(score), 1000);
          }
        } else {
          // No match, flip back
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
        }
        
        setCards([...newCards]);
        setFlippedCards([]);
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Moves: {moves}</span>
        {isGameComplete && (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Completed! 🎉
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
        {cards.map((card) => (
          <MemoryCard
            key={card.id}
            id={card.id}
            symbol={card.symbol}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => handleCardClick(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReactionGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      onComplete(score * 10);
    }
  }, [isPlaying, timeLeft, score, onComplete]);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setTimeLeft(30);
    moveTarget();
  };

  const moveTarget = () => {
    setTargetPosition({
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20
    });
  };

  const hitTarget = () => {
    if (isPlaying) {
      setScore(score + 1);
      moveTarget();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Score: {score}</span>
        <span className="text-sm font-medium">Time: {timeLeft}s</span>
      </div>
      
      {!isPlaying && timeLeft === 30 ? (
        <div className="text-center py-8">
          <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
            <Play className="h-4 w-4 mr-2" />
            Start Game
          </Button>
        </div>
      ) : !isPlaying && timeLeft === 0 ? (
        <div className="text-center py-8">
          <Badge variant="secondary" className="bg-green-100 text-green-700 mb-4">
            Game Complete! Score: {score} 🎯
          </Badge>
          <Button onClick={startGame} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      ) : (
        <div 
          className="relative bg-blue-50 rounded-lg h-48 border-2 border-blue-200 overflow-hidden"
          style={{ minHeight: '200px' }}
        >
          <div
            className="absolute w-8 h-8 bg-red-500 rounded-full cursor-pointer transition-all duration-200 hover:scale-110 flex items-center justify-center"
            style={{ 
              left: `${targetPosition.x}%`, 
              top: `${targetPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={hitTarget}
          >
            🎯
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayGamePage() {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, pets } = useUser();

  // Get the first pet for simplicity
  const selectedPet = pets[0];

  // Redirect if not authenticated or no pets
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated && pets.length === 0) {
      router.push('/onboard');
      return;
    }
  }, [isAuthenticated, pets, router]);

  const handleGameComplete = (score: number) => {
    setGameComplete(true);
    setIsPlaying(false);
    
    toast.success(`Game completed! Score: ${score}. Your pet gained experience!`);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setGameComplete(false);
      setSelectedGame('');
    }, 3000);
  };

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    setIsPlaying(true);
    setGameComplete(false);
  };

  if (!isAuthenticated || pets.length === 0) {
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
                  disabled={isPlaying}
                  className="px-2 sm:px-3 flex-shrink-0"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <AnimatedShinyText className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                  Play Games
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Level Up Your Pet
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Introduction */}
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                Game Time! 🎮
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Play interactive games with {selectedPet?.name || 'your pet'} to boost their stats and have fun together!
              </p>
            </div>

            {/* Pet Stats Display */}
            {selectedPet && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 shadow-lg">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                  {selectedPet.name}'s Current Stats
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div className="bg-red-50 rounded-lg p-3 sm:p-4 border border-red-200">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-red-600">{selectedPet.health}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Health</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 sm:p-4 border border-yellow-200">
                    <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-yellow-600">{selectedPet.strength}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Strength</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mx-auto mb-1 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold text-blue-600">{selectedPet.social}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Social</div>
                  </div>
                </div>
              </div>
            )}

            {!selectedGame ? (
              /* Game Selection */
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Choose a Game</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {GAMES.map((game) => {
                    // For now, all games are unlocked since we don't have level system yet
                    const isUnlocked = true; // (selectedPet?.level || 1) >= game.minLevel;
                    
                    return (
                      <Card 
                        key={game.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          !isUnlocked && 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => isUnlocked && startGame(game.id)}
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl mb-3 sm:mb-4 flex items-center justify-center bg-gradient-to-r ${game.color}`}>
                            <game.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{game.title}</h3>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${
                                  game.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                  game.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}
                              >
                                {game.difficulty}
                              </Badge>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-gray-600">{game.description}</p>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-green-600 font-medium">
                                Rewards: {game.rewards}
                              </p>
                              
                              {!isUnlocked && (
                                <Badge variant="secondary" className="text-xs">
                                  Requires Level {game.minLevel}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Game Area */
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                      <span className="truncate">{GAMES.find(g => g.id === selectedGame)?.title}</span>
                    </CardTitle>
                    
                    {!isPlaying && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedGame('')}
                        className="px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Back to Games</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {GAMES.find(g => g.id === selectedGame)?.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {selectedGame === 'memory' && (
                    <MemoryGame onComplete={handleGameComplete} />
                  )}
                  
                  {selectedGame === 'reaction' && (
                    <ReactionGame onComplete={handleGameComplete} />
                  )}
                  
                  {selectedGame === 'puzzle' && (
                    <div className="text-center py-8 sm:py-12">
                      <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">
                        Logic Puzzle Coming Soon!
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                        We're working on an amazing puzzle game for you.
                      </p>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedGame('')}
                        className="text-sm sm:text-base"
                      >
                        Choose Another Game
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <Toaster />
    </main>
  );
} 