// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface LanguageProgress {
  language: string;
  level: number;
  experience_points: number;
  current_difficulty: 'beginner' | 'intermediate' | 'advanced';
  total_words_learned: number;
  total_sessions_completed: number;
  current_streak: number;
  best_streak: number;
  accuracy_rate: number;
  last_played: string;
}

export interface FlashcardSessionData {
  wallet_address: string;
  language: string;
  difficulty: string;
  flashcards_data: Array<{
    word: string;
    translation: string;
    pronunciation: string;
    distractors: string[];
  }>;
  answers_data: Array<{
    is_correct: boolean;
    time_taken: number;
    selected_answer: string;
  }>;
  total_points: number;
  duration_seconds: number;
}

export interface SessionResult {
  session_id: string;
  progress_updated: boolean;
  new_level?: number;
  new_difficulty?: string;
  words_learned: number;
  accuracy_rate: number;
}

export interface EnhancedFlashcardResponse {
  language: string;
  flashcards: Array<{
    word: string;
    translation: string;
    pronunciation: string;
    distractors: string[];
  }>;
  tokens_used?: number;
  user_progress?: LanguageProgress;
}

// API Functions
export async function getLanguageProgress(
  walletAddress: string, 
  language: string
): Promise<LanguageProgress> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/ai/language-progress/${walletAddress}/${language}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || 'Failed to get language progress');
  }

  return response.json();
}

export async function generatePersonalizedFlashcards(
  language: string,
  walletAddress: string,
  count: number = 5
): Promise<EnhancedFlashcardResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/generate-flashcards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language,
      wallet_address: walletAddress,
      count
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || 'Failed to generate flashcards');
  }

  return response.json();
}

export async function completeFlashcardSession(
  sessionData: FlashcardSessionData
): Promise<SessionResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/ai/complete-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || 'Failed to complete session');
  }

  return response.json();
}

// Utility functions
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'text-green-600 bg-green-100 border-green-600';
    case 'intermediate':
      return 'text-yellow-600 bg-yellow-100 border-yellow-600';
    case 'advanced':
      return 'text-red-600 bg-red-100 border-red-600';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-600';
  }
}

export function formatExperienceToNextLevel(currentXP: number): { current: number; needed: number; progress: number } {
  const currentLevel = Math.floor(currentXP / 100);
  const nextLevelXP = (currentLevel + 1) * 100;
  const currentLevelXP = currentLevel * 100;
  const progressInLevel = currentXP - currentLevelXP;
  const neededForNext = nextLevelXP - currentXP;
  const progress = (progressInLevel / 100) * 100;

  return {
    current: progressInLevel,
    needed: neededForNext,
    progress: Math.round(progress)
  };
} 