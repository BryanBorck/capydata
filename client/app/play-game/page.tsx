"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image, BookOpen, MessageSquare, Tag, Star, Heart, Zap, Users, Trophy, Play, RefreshCw, Check, X, ThumbsUp, ThumbsDown, Camera, Globe } from "lucide-react";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/providers/user-provider";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

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

interface Game {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rewards: string;
  timeEstimate: string;
  category: string;
}

const GAMES: Game[] = [
  {
    id: 'image-quality',
    title: 'Image Quality Judge',
    description: 'Rate the best quality image from 4 options',
    icon: Image,
    color: 'from-blue-500 to-cyan-500',
    difficulty: 'Easy',
    rewards: '+5 XP, +1 Health',
    timeEstimate: '30 seconds',
    category: 'Visual'
  },
  {
    id: 'language-flashcards',
    title: 'Language Flashcards',
    description: 'Learn new words and help improve AI translations',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    difficulty: 'Easy',
    rewards: '+8 XP, +2 Social',
    timeEstimate: '1 minute',
    category: 'Language'
  },
  {
    id: 'sentiment-labeling',
    title: 'Mood Detective',
    description: 'Identify the sentiment of text messages',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    difficulty: 'Easy',
    rewards: '+6 XP, +1 Strength',
    timeEstimate: '45 seconds',
    category: 'Text'
  },
  {
    id: 'content-categorization',
    title: 'Knowledge Trivia',
    description: 'Answer fun trivia questions and learn interesting facts',
    icon: Trophy,
    color: 'from-orange-500 to-red-500',
    difficulty: 'Easy',
    rewards: '+15 XP, +1 Intelligence',
    timeEstimate: '2 minutes',
    category: 'Trivia'
  }
];

// Mock data for games
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=300&h=200&fit=crop'
];

const SAMPLE_TEXTS = [
  "I absolutely love this product! It exceeded all my expectations.",
  "This is the worst experience I've ever had. Completely disappointed.",
  "The weather today is quite nice, not too hot or cold.",
  "I'm so excited about the upcoming vacation! Can't wait!",
  "The service was okay, nothing special but not terrible either."
];

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

function ImageQualityGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleImageSelect = (imageIndex: number) => {
    if (selectedImage !== null) return;
    
    setSelectedImage(imageIndex);
    setShowFeedback(true);
    
    // Simulate scoring (in real app, this would be based on actual quality metrics)
    const points = Math.floor(Math.random() * 20) + 10;
    setScore(score + points);
    
    setTimeout(() => {
      if (currentRound < 2) {
        setCurrentRound(currentRound + 1);
        setSelectedImage(null);
        setShowFeedback(false);
      } else {
        setIsComplete(true);
        onComplete(score + points);
      }
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Great job!</h3>
        <p className="text-gray-600 mb-4">You earned {score} points for your image ratings!</p>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Task Complete! 🎉
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Round {currentRound + 1} of 3</h3>
        <p className="text-sm text-gray-600 mb-4">Choose the highest quality image:</p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Score: {score}</span>
          <span className="text-sm text-gray-500">Round {currentRound + 1}/3</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {SAMPLE_IMAGES.map((imageUrl, index) => (
          <div
            key={index}
            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 ${
              selectedImage === index 
                ? 'ring-4 ring-blue-500 transform scale-105' 
                : selectedImage !== null 
                  ? 'opacity-50' 
                  : 'hover:ring-2 hover:ring-blue-300'
            }`}
            onClick={() => handleImageSelect(index)}
          >
            <img
              src={imageUrl}
              alt={`Option ${index + 1}`}
              className="w-full h-32 object-cover"
            />
            {selectedImage === index && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-white bg-blue-500 rounded-full p-1" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {showFeedback && (
        <div className="text-center bg-green-50 rounded-lg p-3 border border-green-200">
          <p className="text-green-800 font-medium">+{Math.floor(Math.random() * 20) + 10} points!</p>
          <p className="text-green-600 text-sm">Thanks for helping improve image quality detection!</p>
        </div>
      )}
    </div>
  );
}

function LanguageFlashcardsGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [currentCard, setCurrentCard] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [flashcards, setFlashcards] = useState<AIFlashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const availableLanguages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
    'Japanese', 'Korean', 'Mandarin', 'Arabic', 'Russian'
  ];

  const handleLanguageSelect = async (language: string) => {
    setSelectedLanguage(language);
    setCurrentCard(0);
    setScore(0);
    setError('');
    setIsLoading(true);
    
    try {
      const response = await generateFlashcards(language, 'beginner', 5);
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
        onComplete(score + (isCorrect ? 20 : 5));
      }
    }, 2000);
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <Globe className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Language Practice Complete!</h3>
        <p className="text-gray-600 mb-4">You earned {score} points learning {selectedLanguage}!</p>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Polyglot Progress! 🌍
        </Badge>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <X className="h-16 w-16 mx-auto mb-2" />
          <h3 className="text-lg font-semibold">Error Loading Flashcards</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
        </div>
        <Button 
          onClick={() => {
            setError('');
            setSelectedLanguage('');
          }}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating Flashcards...</h3>
        <p className="text-gray-600">AI is creating personalized {selectedLanguage} vocabulary cards for you!</p>
      </div>
    );
  }

  if (!selectedLanguage || flashcards.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Choose a language to practice:</h3>
          <p className="text-sm text-gray-600 mb-4">AI will generate personalized flashcards for you!</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {availableLanguages.map((language) => (
            <Button
              key={language}
              onClick={() => handleLanguageSelect(language)}
              variant="outline"
              className="p-4 h-auto text-center hover:bg-blue-50 border-blue-200 flex flex-col items-center"
              disabled={isLoading}
            >
              <span className="font-medium">{language}</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 mt-1">
                AI Generated
              </Badge>
            </Button>
          ))}
        </div>
        
        <div className="text-center text-xs text-gray-500 bg-blue-50 rounded-lg p-3 border border-blue-200">
          <Star className="h-4 w-4 inline-block mr-1 text-blue-500" />
          Powered by OpenAI - Each session generates unique vocabulary!
        </div>
      </div>
    );
  }

  const card = flashcards[currentCard];
  const allOptions = [card.translation, ...card.distractors].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline">{selectedLanguage}</Badge>
          <span className="text-sm font-medium">Score: {score}</span>
          <span className="text-sm text-gray-500">Card {currentCard + 1}/{flashcards.length}</span>
        </div>
      </div>
      
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200">
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-800">{card.word}</h2>
            <p className="text-gray-600 italic">/{card.pronunciation}/</p>
            <p className="text-sm text-gray-600 mt-4">What does this mean in English?</p>
          </div>
        </CardContent>
      </Card>
      
      {!showFeedback ? (
        <div className="grid grid-cols-1 gap-3">
          {allOptions.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              variant="outline"
              className="p-4 h-auto text-center hover:bg-purple-50 border-purple-200"
              disabled={selectedAnswer !== ''}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <div className={`text-center rounded-lg p-4 border ${
          selectedAnswer === card.translation 
            ? 'bg-green-50 border-green-200' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          {selectedAnswer === card.translation ? (
            <>
              <p className="text-green-800 font-medium">Correct! +20 points!</p>
              <p className="text-green-600 text-sm">Great job learning {selectedLanguage}!</p>
            </>
          ) : (
            <>
              <p className="text-orange-800 font-medium">Not quite! +5 points for trying!</p>
              <p className="text-orange-600 text-sm">The correct answer is: <strong>{card.translation}</strong></p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SentimentLabelingGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [currentText, setCurrentText] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSentimentSelect = (sentiment: 'positive' | 'negative' | 'neutral') => {
    setShowFeedback(true);
    setScore(score + 10);
    
    setTimeout(() => {
      if (currentText < SAMPLE_TEXTS.length - 1) {
        setCurrentText(currentText + 1);
        setShowFeedback(false);
      } else {
        setIsComplete(true);
        onComplete(score + 10);
      }
    }, 1500);
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-16 w-16 text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Sentiment Analysis Complete!</h3>
        <p className="text-gray-600 mb-4">You earned {score} points for text analysis!</p>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Emotion Expert! 😊
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium">Score: {score}</span>
          <span className="text-sm text-gray-500">Text {currentText + 1}/{SAMPLE_TEXTS.length}</span>
        </div>
        <p className="text-sm text-gray-600">What's the sentiment of this text?</p>
      </div>
      
      <Card className="bg-gray-50 border-2 border-gray-200">
        <CardContent className="p-6">
          <p className="text-lg text-gray-800 text-center leading-relaxed">
            "{SAMPLE_TEXTS[currentText]}"
          </p>
        </CardContent>
      </Card>
      
      {!showFeedback ? (
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={() => handleSentimentSelect('positive')}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border-green-200 hover:bg-green-50"
          >
            <ThumbsUp className="h-6 w-6 text-green-600 mb-2" />
            <span className="text-sm">Positive</span>
          </Button>
          <Button
            onClick={() => handleSentimentSelect('neutral')}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border-gray-200 hover:bg-gray-50"
          >
            <div className="h-6 w-6 bg-gray-400 rounded-full mb-2" />
            <span className="text-sm">Neutral</span>
          </Button>
          <Button
            onClick={() => handleSentimentSelect('negative')}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border-red-200 hover:bg-red-50"
          >
            <ThumbsDown className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm">Negative</span>
          </Button>
        </div>
      ) : (
        <div className="text-center bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-blue-800 font-medium">+10 points!</p>
          <p className="text-blue-600 text-sm">Thanks for helping train our sentiment AI!</p>
        </div>
      )}
    </div>
  );
}

function TriviaGame({ onComplete }: { onComplete: (score: number) => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFact, setShowFact] = useState(false);

  const question = TRIVIA_QUESTIONS[currentQuestion];

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
      if (currentQuestion < TRIVIA_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer('');
        setShowFeedback(false);
        setShowFact(false);
      } else {
        setIsComplete(true);
        onComplete(score + points);
      }
    }, 4000);
  };

  if (isComplete) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Trivia Complete!</h3>
        <p className="text-gray-600 mb-4">You earned {score} points and learned amazing facts!</p>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          Knowledge Gained! 🧠
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-between items-center mb-4">
          <Badge variant="outline" className="bg-blue-100 text-blue-700">{question.category}</Badge>
          <span className="text-sm font-medium">Score: {score}</span>
          <span className="text-sm text-gray-500">Q {currentQuestion + 1}/{TRIVIA_QUESTIONS.length}</span>
        </div>
      </div>
      
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-lg text-gray-800 font-medium leading-relaxed">
              {question.question}
            </p>
            <div className="text-xs text-gray-500 flex items-center">
              <BookOpen className="h-3 w-3 mr-1" />
              Source: {question.source}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {!showFeedback ? (
        <div className="grid grid-cols-1 gap-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              variant="outline"
              className="p-4 h-auto text-left hover:bg-orange-50 border-orange-200"
            >
              <span className="font-medium text-gray-700">{String.fromCharCode(65 + index)}.</span>
              <span className="ml-2">{option}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`text-center rounded-lg p-4 border ${
            selectedAnswer === question.correct 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            {selectedAnswer === question.correct ? (
              <>
                <p className="text-green-800 font-medium">Correct! +15 points!</p>
                <p className="text-green-600 text-sm">Excellent knowledge!</p>
              </>
            ) : (
              <>
                <p className="text-red-800 font-medium">Not quite! +5 points for trying!</p>
                <p className="text-red-600 text-sm">The correct answer is: <strong>{question.correct}</strong></p>
              </>
            )}
          </div>
          
          {showFact && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-2">
                <div className="bg-blue-500 rounded-full p-1 mt-1">
                  <Star className="h-3 w-3 text-white" />
                </div>
                <div>
                  <p className="text-blue-800 font-medium text-sm">Did you know?</p>
                  <p className="text-blue-700 text-sm leading-relaxed">{question.fact}</p>
                </div>
              </div>
            </div>
          )}
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
    
    const game = GAMES.find(g => g.id === selectedGame);
    toast.success(`🎉 Task completed! Score: ${score}. ${selectedPet?.name} gained experience and you helped improve AI!`);
    
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
                  AI Training Tasks
                </AnimatedShinyText>
              </div>
              
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Help Improve AI
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
                Quick AI Tasks! 🤖
              </h1>
              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                Complete quick data labeling tasks to train AI models while earning rewards for {selectedPet?.name || 'your pet'}!
              </p>
            </div>

            {/* Pet Stats Display */}
            {selectedPet && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gray-200 shadow-lg">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Choose a Task</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {GAMES.map((game) => {
                    return (
                      <Card 
                        key={game.id}
                        className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                        onClick={() => startGame(game.id)}
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
                                className="text-xs bg-green-100 text-green-700"
                              >
                                {game.timeEstimate}
                              </Badge>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-gray-600">{game.description}</p>
                            
                            <div className="space-y-1">
                              <p className="text-xs text-green-600 font-medium">
                                {game.rewards}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {game.category}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-blue-100 text-blue-700"
                                >
                                  {game.difficulty}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>🎯 Impact:</strong> Your responses help train AI models that power better image recognition, language translation, sentiment analysis, and content categorization systems!
                  </p>
                </div>
              </div>
            ) : (
              /* Game Area */
              <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-r ${GAMES.find(g => g.id === selectedGame)?.color}`}>
                        {(() => {
                          const game = GAMES.find(g => g.id === selectedGame);
                          if (game) {
                            const IconComponent = game.icon;
                            return <IconComponent className="h-3 w-3 text-white" />;
                          }
                          return null;
                        })()}
                      </div>
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
                        <span className="hidden sm:inline">Back to Tasks</span>
                        <span className="sm:hidden">Back</span>
                      </Button>
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm">
                    {GAMES.find(g => g.id === selectedGame)?.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  {selectedGame === 'image-quality' && (
                    <ImageQualityGame onComplete={handleGameComplete} />
                  )}
                  
                  {selectedGame === 'language-flashcards' && (
                    <LanguageFlashcardsGame onComplete={handleGameComplete} />
                  )}
                  
                  {selectedGame === 'sentiment-labeling' && (
                    <SentimentLabelingGame onComplete={handleGameComplete} />
                  )}
                  
                  {selectedGame === 'content-categorization' && (
                    <TriviaGame onComplete={handleGameComplete} />
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