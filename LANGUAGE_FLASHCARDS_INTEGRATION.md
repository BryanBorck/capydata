# Language Flashcards Integration

This document outlines the complete integration of language flashcards with backend user progress tracking, difficulty evolution, and points logic.

## 🚀 Overview

The language flashcards game now features:
- **Personalized Learning**: AI generates cards based on user's current level and avoids already-learned words
- **Progressive Difficulty**: Automatic advancement from beginner → intermediate → advanced
- **Comprehensive Progress Tracking**: Level, XP, streaks, accuracy, words learned
- **Session Analytics**: Detailed recording of each game session
- **Mastery System**: Individual word tracking with progressive mastery levels (0-100%)

## 📊 Database Schema

### 1. `language_progress` Table
Tracks user progress and statistics for each language:
- `level`: User's current level (starts at 1, increases every 100 XP)
- `experience_points`: Total XP earned
- `current_difficulty`: beginner/intermediate/advanced (auto-evolves)
- `total_words_learned`: Count of words with 80%+ mastery
- `current_streak`: Consecutive sessions with 70%+ accuracy
- `accuracy_rate`: Rolling average accuracy percentage

### 2. `flashcard_sessions` Table
Records completed flashcard game sessions:
- `total_cards`, `correct_answers`, `total_points`
- `duration_seconds`: Time taken to complete session
- `session_data`: Full flashcards and answers (JSONB)

### 3. `learned_words` Table
Tracks individual words with mastery levels:
- `mastery_level`: 0-100 scale (80+ = mastered, excluded from future cards)
- `times_seen`, `times_correct`: Usage statistics
- `last_seen`, `first_learned`: Timestamps for spaced repetition

## 🔧 Backend API

### Enhanced Endpoints

#### `POST /api/v1/ai/generate-flashcards`
- **Enhanced**: Now accepts `wallet_address` for personalized generation
- **Features**: 
  - Considers user's current difficulty level
  - Excludes words with 80%+ mastery level
  - Adapts AI prompt based on user progress

#### `GET /api/v1/ai/language-progress/{wallet_address}/{language}`
- **New**: Retrieves user's progress for specific language
- **Returns**: Complete progress statistics and current difficulty

#### `POST /api/v1/ai/complete-session`
- **New**: Records session results and updates user progress
- **Features**:
  - Updates individual word mastery levels
  - Calculates new XP, level, and streak
  - Automatically evolves difficulty based on performance
  - Returns session results and progress updates

### Difficulty Evolution Logic

```python
def determine_difficulty(level: int, accuracy_rate: float, current_difficulty: str) -> str:
    if level >= 10 and accuracy_rate >= 80 and current_difficulty == 'beginner':
        return 'intermediate'
    elif level >= 20 and accuracy_rate >= 85 and current_difficulty == 'intermediate':
        return 'advanced'
    elif accuracy_rate < 60:
        # Drop difficulty if struggling
        if current_difficulty == 'advanced':
            return 'intermediate'
        elif current_difficulty == 'intermediate':
            return 'beginner'
    
    return current_difficulty
```

## 🎮 Frontend Integration

### Enhanced Game Component
`client/app/play-game/language-flashcards/page.tsx` now includes:

1. **Progress Display**: Shows user level, XP progress, difficulty, streak
2. **Personalized API Calls**: Uses new backend endpoints
3. **Session Tracking**: Records timing, answers, and accuracy
4. **Progress Updates**: Real-time feedback on level-ups and difficulty changes
5. **Enhanced Completion Screen**: Detailed session results and progress stats

### New Service Layer
`client/lib/services/language-progress.ts` provides:
- TypeScript interfaces for all progress data structures
- API functions for all progress tracking endpoints
- Utility functions for difficulty colors and XP calculations

### Key Features Added

#### Real-time Progress Tracking
```typescript
// Session answers tracking
const [sessionAnswers, setSessionAnswers] = useState<FlashcardAnswer[]>([]);
const [sessionStartTime, setSessionStartTime] = useState<number>(0);

// Progress state management
const [userProgress, setUserProgress] = useState<LanguageProgress | null>(null);
```

#### Personalized Card Generation
```typescript
// Generate cards avoiding learned words
const response = await generatePersonalizedFlashcards(language, user.wallet_address, totalCards);
setFlashcards(response.flashcards);
```

#### Session Completion with Progress Updates
```typescript
const sessionData = {
  wallet_address: user.wallet_address,
  language: selectedLanguage,
  difficulty: userProgress?.current_difficulty || 'beginner',
  flashcards_data: flashcards,
  answers_data: allAnswers,
  total_points: finalScore,
  duration_seconds: sessionDuration
};

const result = await completeFlashcardSession(sessionData);
// Handle level-ups, difficulty changes, etc.
```

## 🗄️ Database Setup

### 1. Run Migration
```bash
cd back
python run_migration.py
```

### 2. Test Integration
```bash
cd back
python test_integration.py
```

## 📈 Performance Optimizations

### Database Indexes
- `idx_language_progress_wallet_language`: Fast progress lookups
- `idx_flashcard_sessions_wallet_language`: Session history queries
- `idx_learned_words_wallet_language`: Quick word mastery checks
- `idx_learned_words_mastery_level`: Efficient mastered word exclusion

### Auto-Update Triggers
- `language_progress.updated_at`: Automatic timestamp updates
- `learned_words.updated_at`: Track word learning progression

## 🎯 User Experience Flow

1. **Game Start**: Load user progress, show current level/difficulty
2. **Card Generation**: AI creates personalized cards excluding mastered words
3. **Gameplay**: Track timing and accuracy for each answer
4. **Session End**: Record results, update progress, show achievements
5. **Progress Evolution**: Automatic difficulty advancement based on performance

## 🔄 Continuous Learning Features

### Spaced Repetition
- Words with low mastery levels appear more frequently
- Mastered words (80%+ mastery) are excluded from future sessions
- Last seen timestamps enable future spaced repetition algorithms

### Adaptive Difficulty
- **Beginner**: Basic vocabulary, common greetings, everyday objects
- **Intermediate**: Complex grammar, workplace vocabulary, cultural expressions  
- **Advanced**: Sophisticated vocabulary, idiomatic expressions, nuanced meanings

### Gamification Elements
- **XP System**: 100 XP per level, earned through correct answers
- **Streak Tracking**: Maintain momentum with consecutive good sessions (70%+ accuracy)
- **Mastery Progress**: Visual feedback on individual word learning progress
- **Level Progression**: Clear advancement path with automatic difficulty scaling

## 🚀 Ready for Production

The integration is now complete and production-ready with:
- ✅ Full backend API implementation
- ✅ Enhanced frontend game experience
- ✅ Comprehensive progress tracking
- ✅ Database schema with proper indexes
- ✅ Migration scripts and testing tools
- ✅ TypeScript types and error handling
- ✅ Performance optimizations

Users can now enjoy a fully personalized language learning experience that adapts to their skill level and tracks their progress over time! 