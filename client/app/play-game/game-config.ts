import { Image, BookOpen, MessageSquare, Trophy } from "lucide-react";

export interface GameConfig {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rewards: {
    display: string;
    points: number;
    skill: 'social' | 'trivia' | 'science' | 'code' | 'trenches' | 'streak';
    skillValue: number;
  };
  timeEstimate: string;
  category: string;
  helpInstructions: string[];
  stats: {
    rounds?: number;
    questions?: number;
    cards?: number;
    texts?: number;
  };
}

export const GAME_CONFIGS: Record<string, GameConfig> = {
  'image-quality': {
    id: 'image-quality',
    title: 'Image Quality Judge',
    description: 'Rate the best quality image from 4 options',
    icon: Image,
    color: 'blue',
    difficulty: 'Easy',
    rewards: {
      display: '+5 Points, +1 Science',
      points: 5,
      skill: 'science',
      skillValue: 1
    },
    timeEstimate: '30 seconds',
    category: 'Visual',
    helpInstructions: [
      '• LOOK AT 4 DIFFERENT IMAGES',
      '• SELECT THE HIGHEST QUALITY ONE',
      '• COMPLETE 3 ROUNDS TO FINISH',
      '• EARN POINTS FOR EACH SELECTION',
      '• HELP TRAIN AI IMAGE RECOGNITION!'
    ],
    stats: {
      rounds: 3
    }
  },
  
  'language-flashcards': {
    id: 'language-flashcards',
    title: 'Language Flashcards',
    description: 'Learn new words and help improve AI translations',
    icon: BookOpen,
    color: 'green',
    difficulty: 'Easy',
    rewards: {
      display: '+8 Points, +2 Social',
      points: 8,
      skill: 'social',
      skillValue: 2
    },
    timeEstimate: '1 minute',
    category: 'Language',
    helpInstructions: [
      '• CHOOSE A LANGUAGE TO PRACTICE',
      '• AI GENERATES UNIQUE FLASHCARDS',
      '• LEARN THE ENGLISH TRANSLATION',
      '• COMPLETE 5 CARDS TO FINISH',
      '• HELP IMPROVE AI TRANSLATIONS!'
    ],
    stats: {
      cards: 5
    }
  },
  
  'sentiment-labeling': {
    id: 'sentiment-labeling',
    title: 'Mood Detective',
    description: 'Identify the sentiment of text messages',
    icon: MessageSquare,
    color: 'purple',
    difficulty: 'Easy',
    rewards: {
      display: '+6 Points, +1 Code',
      points: 6,
      skill: 'code',
      skillValue: 1
    },
    timeEstimate: '45 seconds',
    category: 'Text',
    helpInstructions: [
      '• READ THE TEXT MESSAGE CAREFULLY',
      '• DECIDE IF IT\'S POSITIVE, NEGATIVE, OR NEUTRAL',
      '• COMPLETE 5 TEXTS TO FINISH',
      '• EARN POINTS FOR EACH CLASSIFICATION',
      '• HELP TRAIN AI SENTIMENT ANALYSIS!'
    ],
    stats: {
      texts: 5
    }
  },
  
  'knowledge-trivia': {
    id: 'knowledge-trivia',
    title: 'Knowledge Trivia',
    description: 'Answer fun trivia questions and learn interesting facts',
    icon: Trophy,
    color: 'orange',
    difficulty: 'Easy',
    rewards: {
      display: '+15 Points, +1 Trivia',
      points: 15,
      skill: 'trivia',
      skillValue: 1
    },
    timeEstimate: '2 minutes',
    category: 'Trivia',
    helpInstructions: [
      '• READ THE TRIVIA QUESTION CAREFULLY',
      '• CHOOSE THE CORRECT ANSWER FROM OPTIONS',
      '• LEARN INTERESTING FACTS AFTER EACH QUESTION',
      '• COMPLETE 6 QUESTIONS TO FINISH',
      '• EARN MORE POINTS FOR CORRECT ANSWERS!'
    ],
    stats: {
      questions: 6
    }
  }
};

// Helper functions for common operations
export const getGameConfig = (gameId: string): GameConfig | null => {
  return GAME_CONFIGS[gameId] || null;
};

export const getAllGames = (): GameConfig[] => {
  return Object.values(GAME_CONFIGS);
};

export const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 border-green-600 text-green-800';
    case 'Medium': return 'bg-yellow-100 border-yellow-600 text-yellow-800';
    case 'Hard': return 'bg-red-100 border-red-600 text-red-800';
    default: return 'bg-gray-100 border-gray-600 text-gray-800';
  }
};

export const getGameColor = (color: string) => {
  switch (color) {
    case 'blue': return 'bg-blue-100 border-blue-600 text-blue-800 hover:bg-blue-200';
    case 'green': return 'bg-green-100 border-green-600 text-green-800 hover:bg-green-200';
    case 'purple': return 'bg-purple-100 border-purple-600 text-purple-800 hover:bg-purple-200';
    case 'orange': return 'bg-orange-100 border-orange-600 text-orange-800 hover:bg-orange-200';
    default: return 'bg-gray-100 border-gray-600 text-gray-800 hover:bg-gray-200';
  }
}; 