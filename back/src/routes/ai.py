from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import OpenAI
import json
from datetime import datetime, timezone
import random

from src.services.storage.supabase import Supabase

router = APIRouter(prefix="/ai", tags=["AI"])


class InferenceRequest(BaseModel):
    query: str
    context: str
    pet_name: Optional[str] = None


class InferenceResponse(BaseModel):
    inference: str
    tokens_used: Optional[int] = None


class FlashcardRequest(BaseModel):
    language: str
    difficulty: Optional[str] = "beginner"
    count: Optional[int] = 5
    wallet_address: Optional[str] = None  # For user-specific generation


class Flashcard(BaseModel):
    word: str
    translation: str
    pronunciation: str
    distractors: List[str]


class FlashcardResponse(BaseModel):
    language: str
    flashcards: List[Flashcard]
    tokens_used: Optional[int] = None
    user_progress: Optional[dict] = None


class ContentGenerationRequest(BaseModel):
    content_type: str  # 'summary', 'study_guide', 'faq', 'timeline', 'briefing'
    context: str
    pet_name: Optional[str] = None
    additional_instructions: Optional[str] = None


class ContentGenerationResponse(BaseModel):
    content: str
    content_type: str
    tokens_used: Optional[int] = None


class GameSessionRequest(BaseModel):
    wallet_address: str
    language: str
    difficulty: str
    flashcards_data: List[dict]  # The flashcards that were shown
    answers_data: List[dict]     # User's answers and timing
    total_points: int
    duration_seconds: int


class GameSessionResponse(BaseModel):
    session_id: str
    progress_updated: bool
    new_level: Optional[int] = None
    new_difficulty: Optional[str] = None
    words_learned: int
    accuracy_rate: float


class LanguageProgressResponse(BaseModel):
    language: str
    level: int
    experience_points: int
    current_difficulty: str
    total_words_learned: int
    total_sessions_completed: int
    current_streak: int
    best_streak: int
    accuracy_rate: float
    last_played: str


# New models for sentiment labeling game
class SentimentTextRequest(BaseModel):
    count: Optional[int] = 5
    difficulty: Optional[str] = "easy"
    wallet_address: Optional[str] = None  # For user-specific generation


class SentimentText(BaseModel):
    text: str
    correct_sentiment: str  # 'positive', 'negative', 'neutral'
    difficulty_level: str


class SentimentTextResponse(BaseModel):
    texts: List[SentimentText]
    tokens_used: Optional[int] = None


class SentimentGameSessionRequest(BaseModel):
    wallet_address: str
    texts_data: List[dict]  # The texts that were shown
    answers_data: List[dict]  # User's sentiment classifications
    total_score: int
    duration_seconds: int


class SentimentGameSessionResponse(BaseModel):
    session_id: str
    accuracy_rate: float
    correct_answers: int
    total_answers: int
    points_awarded: int


# New models for trivia game
class TriviaQuestionRequest(BaseModel):
    count: Optional[int] = 6
    difficulty: Optional[str] = "easy"
    wallet_address: Optional[str] = None  # For user-specific generation


class TriviaQuestion(BaseModel):
    question: str
    correct_answer: str
    options: List[str]  # 4 options including the correct one
    category: str
    fact: str  # Interesting fact about the answer
    source: str  # Source/topic area


class TriviaQuestionResponse(BaseModel):
    questions: List[TriviaQuestion]
    tokens_used: Optional[int] = None


class TriviaGameSessionRequest(BaseModel):
    wallet_address: str
    questions_data: List[dict]  # The questions that were shown
    answers_data: List[dict]  # User's trivia answers
    total_score: int
    duration_seconds: int


class TriviaGameSessionResponse(BaseModel):
    session_id: str
    accuracy_rate: float
    correct_answers: int
    total_questions: int
    points_awarded: int


def get_openai_client() -> OpenAI:
    """Get OpenAI client instance."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API is not configured"
        )
    return OpenAI(api_key=api_key)


def get_storage() -> Supabase:
    """Return a singleton instance of the Supabase storage helper configured
    from environment variables `SUPABASE_URL` and `SUPABASE_KEY`."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY environment variables must be set.")

    # Re-use a single instance to avoid recreating connections on every request
    if not hasattr(get_storage, "_instance"):
        get_storage._instance = Supabase(url, key, openai_key)
    return get_storage._instance


def determine_difficulty(level: int, accuracy_rate: float, current_difficulty: str) -> str:
    """Determine the appropriate difficulty based on user performance"""
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


@router.post("/inference", response_model=InferenceResponse)
async def generate_inference(
    payload: InferenceRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Generate AI-powered insights and inferences from provided context using RAG.
    
    This endpoint takes a user query and relevant context (from semantic search)
    and generates intelligent insights similar to NotebookLM.
    """
    try:
        # Create a comprehensive prompt for generating insights
        system_prompt = """You are an AI assistant that generates insightful analysis and connections from data. 
Your job is to analyze the provided context and generate meaningful insights, patterns, and connections based on the user's query.

Key responsibilities:
1. Identify patterns and trends in the data
2. Make intelligent connections between different pieces of information  
3. Provide actionable insights and recommendations
4. Present information in a clear, engaging way
5. Focus on what's most relevant to the user's question

Style guidelines:
- Be conversational but informative
- Use bullet points for clarity when appropriate
- Highlight key insights and patterns
- Make it engaging and easy to understand
- Connect insights back to the pet's learning journey when relevant"""

        pet_context = f" for {payload.pet_name}" if payload.pet_name else ""
        
        user_prompt = f"""Based on the knowledge data{pet_context}, please analyze and provide insights for this question: "{payload.query}"

Context/Knowledge Data:
{payload.context}

Please provide:
1. Key insights and patterns you notice
2. Connections between different pieces of information
3. Actionable recommendations or next steps
4. Any interesting trends or observations

Focus on being helpful and insightful while staying grounded in the provided data."""

        # Generate response using OpenAI
        response = openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=800,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        inference_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        return InferenceResponse(
            inference=inference_text,
            tokens_used=tokens_used
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate inference: {str(e)}"
        )


@router.post("/chat")
async def chat_with_knowledge(
    payload: InferenceRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Interactive chat interface with the knowledge base.
    
    This endpoint provides a conversational interface similar to NotebookLM,
    with source-grounded responses and citation capabilities.
    """
    try:
        system_prompt = f"""You are an AI assistant similar to Google's NotebookLM, helping users explore and understand their knowledge base. 

Your role is to:
1. Provide accurate, source-grounded responses based ONLY on the provided knowledge
2. Make connections between different pieces of information
3. Be conversational but precise
4. Acknowledge when information is not available in the knowledge base
5. Help users discover insights and patterns in their data

Knowledge Context Guidelines:
- Always base your responses on the provided context
- If the context doesn't contain enough information, clearly state this limitation
- Make intelligent connections between different sources when relevant
- Use a conversational tone while maintaining accuracy
- Reference specific details from the sources when possible

Pet Context: You're helping explore {payload.pet_name if payload.pet_name else 'the user'}'s knowledge base."""

        user_prompt = f"""User Question: {payload.query}

Available Knowledge Sources:
{payload.context if payload.context else "No relevant knowledge sources found for this query."}

Instructions:
- If relevant knowledge is available, provide a comprehensive answer based on the sources
- If the knowledge is insufficient, explain what's missing and suggest what additional information would be helpful
- Make connections between different pieces of information when relevant
- Be helpful and engaging while staying grounded in the available sources"""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=600,
            temperature=0.6,
            response_format={"type": "json_object"}
        )
        
        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "model": "gpt-3.5-turbo"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}"
        )


@router.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    payload: FlashcardRequest,
    openai_client: OpenAI = Depends(get_openai_client),
    storage: Supabase = Depends(get_storage)
):
    """
    Generate language flashcards using OpenAI for educational language learning games.
    
    Enhanced version that considers user's learned words and adapts difficulty.
    """
    try:
        # Get user progress if wallet address provided
        user_progress = None
        learned_words = []
        recently_shown_words = []
        actual_difficulty = payload.difficulty
        
        if payload.wallet_address:
            user_progress = await get_user_progress(payload.wallet_address, payload.language, storage)
            if user_progress:
                # Use user's current difficulty level
                actual_difficulty = user_progress['current_difficulty']
                # Get words user has already learned (mastery level >= 60)
                learned_words = await get_learned_words(payload.wallet_address, payload.language, storage, mastery_threshold=60)
                # Get words shown in recent sessions (last 5 sessions)
                recently_shown_words = await get_recently_shown_words(payload.wallet_address, payload.language, storage, last_sessions=5)
        
        # Enhanced system prompt that emphasizes variety and uniqueness
        system_prompt = """You are an expert language teacher creating educational flashcards for language learners. 

Your task is to generate vocabulary flashcards that include:
1. Essential words/phrases for practical use
2. Accurate pronunciation guides using simple phonetic spelling
3. Three plausible distractors (wrong answers) for multiple choice questions
4. Age-appropriate and culturally sensitive content

Guidelines:
- Choose practical, everyday vocabulary that learners would find useful
- Pronunciation should be easy to read (e.g., "OH-lah" not IPA symbols)
- Distractors should be plausible but clearly different meanings
- PRIORITIZE VARIETY: Use different word categories, themes, and types
- Avoid word families or similar themes in the same set
- Mix nouns, verbs, adjectives, expressions, and phrases
- Ensure cultural appropriateness and accuracy
- CRITICAL: NEVER repeat words the user has seen before

CRITICAL: Your response MUST be valid JSON only. Do not include any text before or after the JSON.
Do not wrap the JSON in markdown code blocks or any other formatting.

Return ONLY this exact JSON structure:
{
  "flashcards": [
    {
      "word": "foreign language word/phrase",
      "translation": "English translation",
      "pronunciation": "simple phonetic pronunciation",
      "distractors": ["wrong answer 1", "wrong answer 2", "wrong answer 3"]
    }
  ]
}"""

        # Build user prompt with learned words exclusion
        exclusion_text = ""
        all_excluded_words = list(set(learned_words + recently_shown_words))  # Remove duplicates
        
        # Debug logging
        print(f"Debug - Learned words: {learned_words}")
        print(f"Debug - Recently shown words: {recently_shown_words}")
        print(f"Debug - Total excluded words: {len(all_excluded_words)}")
        
        if all_excluded_words:
            exclusion_text = f"""
CRITICAL EXCLUSION RULE: The user has already seen these words in recent sessions. 
DO NOT include ANY of these words: {', '.join(all_excluded_words[:30])}

You must generate completely different words that are NOT in the above list.
Focus on variety and avoid repetition at all costs."""

        user_prompt = f"""Create {payload.count} {actual_difficulty} level flashcards for {payload.language} language learning.

Requirements:
- Language: {payload.language}
- Difficulty: {actual_difficulty}
- Number of flashcards: {payload.count}
- Generate UNIQUE words that haven't been shown before

{exclusion_text}

Focus on practical vocabulary that would be useful for {actual_difficulty} learners of {payload.language}. 

For {actual_difficulty} level:
{"- Use basic vocabulary: family members, colors, numbers, food items, common verbs" if actual_difficulty == "beginner" else ""}
{"- Include workplace vocabulary, travel phrases, cultural expressions, past/future tenses" if actual_difficulty == "intermediate" else ""}
{"- Use sophisticated vocabulary, literary terms, business language, complex grammar" if actual_difficulty == "advanced" else ""}

Each flashcard should have:
1. A word or phrase in {payload.language}
2. The English translation
3. Simple pronunciation guide (readable phonetics, not IPA)
4. Three incorrect English translations as distractors

IMPORTANT: Ensure maximum variety - no repeated themes or word families.
Mix different categories: actions, objects, adjectives, expressions, etc.

Return valid JSON only, no additional text."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1500,
            temperature=0.3,  # Lower temperature for more consistent JSON output
            response_format={"type": "json_object"}  # Force JSON response format
        )
        
        response_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        # Debug logging for troubleshooting
        print(f"OpenAI Response: {response_text}")
        
        # Parse the JSON response
        try:
            import json
            
            # Clean the response text - remove any markdown formatting
            cleaned_response = response_text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]  # Remove ```json
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]  # Remove ```
            cleaned_response = cleaned_response.strip()
            
            # Check if response is empty
            if not cleaned_response:
                raise ValueError("Empty response from OpenAI")
            
            # Try to parse JSON
            flashcard_data = json.loads(cleaned_response)
            
            # Validate the structure
            if not isinstance(flashcard_data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "flashcards" not in flashcard_data:
                raise ValueError("Invalid response structure: missing 'flashcards' key")
            
            if not isinstance(flashcard_data["flashcards"], list):
                raise ValueError("'flashcards' should be a list")
            
            flashcards = []
            for i, card_data in enumerate(flashcard_data["flashcards"]):
                try:
                    # Validate required fields
                    required_fields = ["word", "translation", "pronunciation", "distractors"]
                    if not all(key in card_data for key in required_fields):
                        print(f"Skipping card {i}: missing required fields. Has keys: {list(card_data.keys())}")
                        continue  # Skip malformed cards
                    
                    if not isinstance(card_data["distractors"], list) or len(card_data["distractors"]) != 3:
                        print(f"Skipping card {i}: invalid distractors. Got: {card_data.get('distractors')}")
                        continue  # Skip cards without exactly 3 distractors
                    
                    flashcard = Flashcard(
                        word=str(card_data["word"]),
                        translation=str(card_data["translation"]),
                        pronunciation=str(card_data["pronunciation"]),
                        distractors=[str(d) for d in card_data["distractors"]]
                    )
                    flashcards.append(flashcard)
                except Exception as card_error:
                    print(f"Error processing card {i}: {card_error}")
                    continue
            
            if not flashcards:
                # If no valid flashcards were generated, create a fallback
                print("No valid flashcards generated, creating fallback")
                flashcards = create_fallback_flashcards(payload.language, payload.count)
            
            return FlashcardResponse(
                language=payload.language,
                flashcards=flashcards,
                tokens_used=tokens_used,
                user_progress=user_progress
            )
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response: {repr(response_text)}")
            
            # Use fallback flashcards instead of throwing error
            print("Using fallback flashcards due to JSON parsing failure")
            flashcards = create_fallback_flashcards(payload.language, payload.count)
            
            return FlashcardResponse(
                language=payload.language,
                flashcards=flashcards,
                tokens_used=tokens_used,
                user_progress=user_progress
            )
            
        except ValueError as e:
            print(f"Validation error: {e}")
            print(f"Raw response: {repr(response_text)}")
            
            # Use fallback flashcards instead of throwing error
            print("Using fallback flashcards due to validation failure")
            flashcards = create_fallback_flashcards(payload.language, payload.count)
            
            return FlashcardResponse(
                language=payload.language,
                flashcards=flashcards,
                tokens_used=tokens_used,
                user_progress=user_progress
            )
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate flashcards: {str(e)}"
        )


@router.post("/generate-content", response_model=ContentGenerationResponse)
async def generate_content(
    payload: ContentGenerationRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Generate various types of content from knowledge base, similar to NotebookLM Studio.
    
    Supports: summaries, study guides, FAQs, timelines, and briefings.
    """
    try:
        content_prompts = {
            'summary': """Create a comprehensive summary of the provided knowledge. Structure it with:
1. Key Topics Overview
2. Main Insights and Findings  
3. Important Details and Facts
4. Connections and Relationships

Make it well-organized and easy to understand.""",

            'study_guide': """Create a detailed study guide from the provided knowledge. Include:
1. Key Concepts and Definitions
2. Important Facts to Remember
3. Study Questions and Topics
4. Connections Between Ideas
5. Practical Applications

Format it for easy studying and review.""",

            'faq': """Generate a comprehensive FAQ based on the provided knowledge. Create:
1. Frequently Asked Questions about the topics
2. Clear, detailed answers based on the knowledge
3. Follow-up questions for deeper understanding
4. Related topics to explore

Make it conversational and helpful.""",

            'timeline': """Create a timeline or chronological overview from the provided knowledge. Include:
1. Key Events or Developments
2. Important Dates and Milestones  
3. Progression of Ideas or Concepts
4. Cause and Effect Relationships

Organize information chronologically where possible.""",

            'briefing': """Create an executive briefing from the provided knowledge. Include:
1. Executive Summary
2. Key Points and Takeaways
3. Important Data and Statistics
4. Actionable Insights
5. Recommendations or Next Steps

Keep it concise but comprehensive."""
        }

        if payload.content_type not in content_prompts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported content type: {payload.content_type}"
            )

        system_prompt = f"""You are an expert content creator, similar to NotebookLM's Studio feature. Your job is to transform knowledge into well-structured, useful content.

Guidelines:
- Base all content strictly on the provided knowledge
- Create well-organized, professional content
- Use clear headings and structure
- Be comprehensive but concise
- Maintain accuracy and cite specific information when relevant
- Make content engaging and easy to understand

Content Type: {payload.content_type.replace('_', ' ').title()}"""

        user_prompt = f"""{content_prompts[payload.content_type]}

Knowledge Base:
{payload.context}

{f"Additional Instructions: {payload.additional_instructions}" if payload.additional_instructions else ""}

{f"Context: This content is for {payload.pet_name}'s knowledge base." if payload.pet_name else ""}

Generate the {payload.content_type.replace('_', ' ')} based on the provided knowledge."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1200,
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        return ContentGenerationResponse(
            content=response.choices[0].message.content,
            content_type=payload.content_type,
            tokens_used=response.usage.total_tokens if response.usage else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate content: {str(e)}"
        )


@router.post("/complete-session", response_model=GameSessionResponse)
async def complete_flashcard_session(
    payload: GameSessionRequest,
    storage: Supabase = Depends(get_storage)
):
    """
    Complete a flashcard session and update user progress
    """
    try:
        # Calculate session metrics
        total_cards = len(payload.flashcards_data)
        correct_answers = sum(1 for answer in payload.answers_data if answer.get('is_correct', False))
        accuracy_rate = (correct_answers / total_cards * 100) if total_cards > 0 else 0
        
        # Record the session
        session_data = {
            'flashcards': payload.flashcards_data,
            'answers': payload.answers_data,
            'accuracy_rate': accuracy_rate
        }
        
        session_record = {
            'wallet_address': payload.wallet_address,
            'language': payload.language,
            'difficulty': payload.difficulty,
            'total_cards': total_cards,
            'correct_answers': correct_answers,
            'total_points': payload.total_points,
            'duration_seconds': payload.duration_seconds,
            'session_data': json.dumps(session_data),
            'completed_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Insert session record
        session_result = storage.client.table("flashcard_sessions").insert(session_record).execute()
        session_id = session_result.data[0]['id']
        
        # Update or create learned words
        words_learned = 0
        for i, flashcard in enumerate(payload.flashcards_data):
            word = flashcard['word']
            translation = flashcard['translation']
            pronunciation = flashcard['pronunciation']
            is_correct = payload.answers_data[i].get('is_correct', False)
            
            # Check if word already exists
            existing_word = storage.client.table("learned_words").select("*").eq(
                "wallet_address", payload.wallet_address
            ).eq(
                "language", payload.language
            ).eq(
                "word", word
            ).execute()
            
            correct_value = 1 if is_correct else 0
            
            if existing_word.data:
                # Update existing word
                current_word = existing_word.data[0]
                new_times_seen = current_word['times_seen'] + 1
                new_times_correct = current_word['times_correct'] + correct_value
                accuracy = new_times_correct / new_times_seen
                
                # Calculate new mastery level
                if accuracy >= 0.8:
                    new_mastery = min(100, current_word['mastery_level'] + 15)
                elif accuracy >= 0.6:
                    new_mastery = min(100, current_word['mastery_level'] + 10)
                else:
                    new_mastery = max(0, current_word['mastery_level'] - 5)
                
                storage.client.table("learned_words").update({
                    'times_seen': new_times_seen,
                    'times_correct': new_times_correct,
                    'mastery_level': new_mastery,
                    'last_seen': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }).eq('id', current_word['id']).execute()
            else:
                # Create new word
                initial_mastery = 20 if is_correct else 5
                new_word = {
                    'wallet_address': payload.wallet_address,
                    'language': payload.language,
                    'word': word,
                    'translation': translation,
                    'pronunciation': pronunciation,
                    'times_seen': 1,
                    'times_correct': correct_value,
                    'mastery_level': initial_mastery,
                    'last_seen': datetime.now(timezone.utc).isoformat(),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
                storage.client.table("learned_words").insert(new_word).execute()
            
            if is_correct:
                words_learned += 1
        
        # Get current progress
        current_progress = await get_user_progress(payload.wallet_address, payload.language, storage)
        if not current_progress:
            current_progress = await create_or_update_progress(payload.wallet_address, payload.language, storage)
        
        # Calculate new progress values
        new_experience = current_progress['experience_points'] + payload.total_points
        new_level = max(1, new_experience // 100)  # Level up every 100 XP
        new_sessions = current_progress['total_sessions_completed'] + 1
        new_words_learned = current_progress['total_words_learned'] + words_learned
        
        # Calculate new streak
        is_good_session = accuracy_rate >= 70  # Consider 70%+ accuracy as maintaining streak
        new_streak = current_progress['current_streak'] + 1 if is_good_session else 0
        new_best_streak = max(current_progress['best_streak'], new_streak)
        
        # Calculate overall accuracy rate
        total_sessions = new_sessions
        if total_sessions == 1:
            new_accuracy_rate = accuracy_rate
        else:
            # Weighted average with previous accuracy
            weight = 0.3  # Weight for current session
            new_accuracy_rate = (
                current_progress['accuracy_rate'] * (1 - weight) + 
                accuracy_rate * weight
            )
        
        # Determine new difficulty
        new_difficulty = determine_difficulty(new_level, new_accuracy_rate, current_progress['current_difficulty'])
        
        # Update progress
        progress_update = {
            'level': new_level,
            'experience_points': new_experience,
            'current_difficulty': new_difficulty,
            'total_words_learned': new_words_learned,
            'total_sessions_completed': new_sessions,
            'current_streak': new_streak,
            'best_streak': new_best_streak,
            'accuracy_rate': new_accuracy_rate,
            'last_played': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        storage.client.table("language_progress").update(progress_update).eq(
            'wallet_address', payload.wallet_address
        ).eq(
            'language', payload.language
        ).execute()
        
        return GameSessionResponse(
            session_id=str(session_id),
            progress_updated=True,
            new_level=new_level if new_level > current_progress['level'] else None,
            new_difficulty=new_difficulty if new_difficulty != current_progress['current_difficulty'] else None,
            words_learned=words_learned,
            accuracy_rate=accuracy_rate
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete session: {str(e)}"
        )


@router.get("/language-progress/{wallet_address}/{language}", response_model=LanguageProgressResponse)
async def get_language_progress(
    wallet_address: str, 
    language: str,
    storage: Supabase = Depends(get_storage)
):
    """Get user's progress for a specific language"""
    try:
        progress = await get_user_progress(wallet_address, language, storage)
        
        if not progress:
            # Create new progress if doesn't exist
            progress = await create_or_update_progress(wallet_address, language, storage)
        
        return LanguageProgressResponse(
            language=progress['language'],
            level=progress['level'],
            experience_points=progress['experience_points'],
            current_difficulty=progress['current_difficulty'],
            total_words_learned=progress['total_words_learned'],
            total_sessions_completed=progress['total_sessions_completed'],
            current_streak=progress['current_streak'],
            best_streak=progress['best_streak'],
            accuracy_rate=float(progress['accuracy_rate']),
            last_played=progress['last_played']
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get language progress: {str(e)}"
        )


@router.post("/generate-sentiment-texts", response_model=SentimentTextResponse)
async def generate_sentiment_texts(
    payload: SentimentTextRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Generate sentiment labeling texts using OpenAI for sentiment analysis training games.
    
    Creates a variety of texts with clear sentiment labels (positive, negative, neutral)
    for users to classify, helping train AI sentiment analysis models.
    """
    try:
        # Enhanced system prompt for sentiment text generation
        system_prompt = """You are an expert at creating text samples for sentiment analysis training.

Your task is to generate realistic text samples that clearly express specific sentiments:
- POSITIVE: Happy, excited, satisfied, grateful, enthusiastic emotions
- NEGATIVE: Sad, angry, frustrated, disappointed, upset emotions  
- NEUTRAL: Factual, balanced, informational, objective statements

Guidelines:
- Create natural, conversational text that people would actually write
- Make sentiments clear but not overly obvious or exaggerated
- Include various contexts: reviews, social media posts, messages, comments
- Ensure cultural appropriateness and avoid sensitive topics
- Mix different text lengths and styles
- CRITICAL: Return ONLY valid JSON, no additional text

CRITICAL: Your response MUST be valid JSON only. Do not include any text before or after the JSON.
Do not wrap the JSON in markdown code blocks or any other formatting.

Return ONLY this exact JSON structure:
{
  "texts": [
    {
      "text": "sample text here",
      "correct_sentiment": "positive/negative/neutral",
      "difficulty_level": "easy/medium/hard"
    }
  ]
}"""

        difficulty_instructions = {
            "easy": """
- Use clear, obvious sentiment words
- Simple sentence structures
- Straightforward emotions
- Examples: "I love this!" or "This is terrible" or "The weather is nice today"
""",
            "medium": """
- Mix obvious and subtle sentiment cues
- Some complexity in expression
- May require context understanding
- Examples: "Could be better but not the worst" or "Exceeded my expectations"
""",
            "hard": """
- Subtle sentiment expressions
- Sarcasm, irony, or complex emotions
- May require deeper interpretation
- Examples: "Well, that was... interesting" or "Another fantastic Monday morning"
"""
        }

        difficulty = payload.difficulty.lower()
        difficulty_text = difficulty_instructions.get(difficulty, difficulty_instructions["easy"])

        user_prompt = f"""Create {payload.count} sentiment labeling texts for {difficulty} difficulty level.

Difficulty Guidelines for {difficulty} level:
{difficulty_text}

Requirements:
- Generate exactly {payload.count} text samples
- Ensure balanced representation: mix positive, negative, and neutral sentiments
- Each text should be 1-3 sentences maximum
- Make them feel natural and realistic
- Vary the contexts (reviews, messages, social posts, comments)

Important: Ensure clear sentiment labels that would be agreed upon by most people.
The goal is to train AI models, so accuracy in labeling is crucial.

Return valid JSON only, no additional text."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.4,  # Lower temperature for more consistent results
            response_format={"type": "json_object"}  # Force JSON response format
        )
        
        response_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        # Debug logging
        print(f"OpenAI Response for sentiment texts: {response_text}")
        
        # Parse the JSON response
        try:
            import json
            
            # Clean the response text
            cleaned_response = response_text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            # Check if response is empty
            if not cleaned_response:
                raise ValueError("Empty response from OpenAI")
            
            # Try to parse JSON
            sentiment_data = json.loads(cleaned_response)
            
            # Validate the structure
            if not isinstance(sentiment_data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "texts" not in sentiment_data:
                raise ValueError("Invalid response structure: missing 'texts' key")
            
            if not isinstance(sentiment_data["texts"], list):
                raise ValueError("'texts' should be a list")
            
            sentiment_texts = []
            for i, text_data in enumerate(sentiment_data["texts"]):
                try:
                    # Validate required fields
                    required_fields = ["text", "correct_sentiment", "difficulty_level"]
                    if not all(key in text_data for key in required_fields):
                        print(f"Skipping text {i}: missing required fields. Has keys: {list(text_data.keys())}")
                        continue
                    
                    # Validate sentiment value
                    valid_sentiments = ["positive", "negative", "neutral"]
                    if text_data["correct_sentiment"].lower() not in valid_sentiments:
                        print(f"Skipping text {i}: invalid sentiment. Got: {text_data.get('correct_sentiment')}")
                        continue
                    
                    sentiment_text = SentimentText(
                        text=str(text_data["text"]),
                        correct_sentiment=str(text_data["correct_sentiment"]).lower(),
                        difficulty_level=str(text_data["difficulty_level"]).lower()
                    )
                    sentiment_texts.append(sentiment_text)
                except Exception as text_error:
                    print(f"Error processing text {i}: {text_error}")
                    continue
            
            if not sentiment_texts:
                # If no valid texts were generated, create fallback
                print("No valid sentiment texts generated, creating fallback")
                sentiment_texts = create_fallback_sentiment_texts(payload.count, difficulty)
            
            return SentimentTextResponse(
                texts=sentiment_texts,
                tokens_used=tokens_used
            )
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response: {repr(response_text)}")
            
            # Use fallback texts instead of throwing error
            print("Using fallback sentiment texts due to JSON parsing failure")
            sentiment_texts = create_fallback_sentiment_texts(payload.count, difficulty)
            
            return SentimentTextResponse(
                texts=sentiment_texts,
                tokens_used=tokens_used
            )
            
        except ValueError as e:
            print(f"Validation error: {e}")
            print(f"Raw response: {repr(response_text)}")
            
            # Use fallback texts instead of throwing error
            print("Using fallback sentiment texts due to validation failure")
            sentiment_texts = create_fallback_sentiment_texts(payload.count, difficulty)
            
            return SentimentTextResponse(
                texts=sentiment_texts,
                tokens_used=tokens_used
            )
            
    except Exception as e:
        print(f"Error generating sentiment texts: {e}")
        # Return fallback texts if AI generation fails
        sentiment_texts = create_fallback_sentiment_texts(payload.count, difficulty)
        return SentimentTextResponse(
            texts=sentiment_texts,
            tokens_used=None
        )


@router.post("/complete-sentiment-session", response_model=SentimentGameSessionResponse)
async def complete_sentiment_session(
    payload: SentimentGameSessionRequest,
    storage: Supabase = Depends(get_storage)
):
    """
    Complete a sentiment labeling session and record user progress
    """
    try:
        # Calculate session metrics
        total_texts = len(payload.texts_data)
        correct_answers = sum(1 for answer in payload.answers_data if answer.get('is_correct', False))
        accuracy_rate = (correct_answers / total_texts * 100) if total_texts > 0 else 0
        
        # Record the session
        session_data = {
            'texts': payload.texts_data,
            'answers': payload.answers_data,
            'accuracy_rate': accuracy_rate
        }
        
        session_record = {
            'wallet_address': payload.wallet_address,
            'total_texts': total_texts,
            'correct_answers': correct_answers,
            'total_score': payload.total_score,
            'duration_seconds': payload.duration_seconds,
            'session_data': json.dumps(session_data),
            'completed_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Insert session record
        session_result = storage.client.table("sentiment_sessions").insert(session_record).execute()
        session_id = session_result.data[0]['id']
        
        return SentimentGameSessionResponse(
            session_id=session_id,
            accuracy_rate=accuracy_rate,
            correct_answers=correct_answers,
            total_answers=total_texts,
            points_awarded=payload.total_score
        )
        
    except Exception as e:
        print(f"Error completing sentiment session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete sentiment session: {str(e)}"
        )


@router.post("/complete-trivia-session", response_model=TriviaGameSessionResponse)
async def complete_trivia_session(
    payload: TriviaGameSessionRequest,
    storage: Supabase = Depends(get_storage)
):
    """
    Complete a trivia game session and record user progress
    """
    try:
        # Calculate session metrics
        total_questions = len(payload.questions_data)
        correct_answers = sum(1 for answer in payload.answers_data if answer.get('is_correct', False))
        accuracy_rate = (correct_answers / total_questions * 100) if total_questions > 0 else 0
        
        # Record the session
        session_data = {
            'questions': payload.questions_data,
            'answers': payload.answers_data,
            'accuracy_rate': accuracy_rate
        }
        
        session_record = {
            'wallet_address': payload.wallet_address,
            'game_type': 'knowledge_trivia',
            'questions_data': json.dumps(payload.questions_data),  # Required field
            'answers_data': json.dumps(payload.answers_data),      # Required field
            'total_score': payload.total_score,
            'correct_answers': correct_answers,
            'total_questions': total_questions,
            'accuracy_rate': round(accuracy_rate, 2),              # Required field
            'duration_seconds': payload.duration_seconds,
            'session_data': json.dumps(session_data),              # Additional metadata
            'completed_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Insert session record
        session_result = storage.client.table("trivia_sessions").insert(session_record).execute()
        session_id = session_result.data[0]['id']
        
        return TriviaGameSessionResponse(
            session_id=session_id,
            accuracy_rate=accuracy_rate,
            correct_answers=correct_answers,
            total_questions=total_questions,
            points_awarded=payload.total_score
        )
        
    except Exception as e:
        print(f"Error completing trivia session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to complete trivia session: {str(e)}"
        )


# Helper functions
async def get_user_progress(wallet_address: str, language: str, storage: Supabase) -> Optional[dict]:
    """Get user's progress for a specific language"""
    result = storage.client.table("language_progress").select("*").eq(
        "wallet_address", wallet_address
    ).eq(
        "language", language
    ).execute()
    
    return result.data[0] if result.data else None


async def get_learned_words(wallet_address: str, language: str, storage: Supabase, mastery_threshold: int = 80) -> List[str]:
    """Get words the user has already mastered"""
    result = storage.client.table("learned_words").select("word").eq(
        "wallet_address", wallet_address
    ).eq(
        "language", language
    ).gte(
        "mastery_level", mastery_threshold
    ).execute()
    
    return [row['word'] for row in result.data]


async def get_recently_shown_words(wallet_address: str, language: str, storage: Supabase, last_sessions: int = 5) -> List[str]:
    """Get words shown in recent sessions"""
    result = storage.client.table("flashcard_sessions").select("session_data").eq(
        "wallet_address", wallet_address
    ).eq(
        "language", language
    ).order("completed_at", desc=True).limit(last_sessions).execute()
    
    shown_words = []
    for session in result.data:
        try:
            if session.get('session_data'):
                # Parse session_data which contains the flashcards and answers
                import json
                if isinstance(session['session_data'], str):
                    session_data = json.loads(session['session_data'])
                else:
                    session_data = session['session_data']
                
                # Extract words from flashcards in session_data
                if 'flashcards' in session_data:
                    for card in session_data['flashcards']:
                        if 'word' in card:
                            shown_words.append(card['word'])
        except (json.JSONDecodeError, KeyError, TypeError) as e:
            print(f"Error parsing session data: {e}")
            continue
    
    # Remove duplicates and return
    return list(set(shown_words))


async def create_or_update_progress(wallet_address: str, language: str, storage: Supabase) -> dict:
    """Create or get existing progress for user-language combination"""
    # Try to get existing progress
    progress = await get_user_progress(wallet_address, language, storage)
    
    if not progress:
        # Create new progress entry
        new_progress = {
            'wallet_address': wallet_address,
            'language': language,
            'level': 1,
            'experience_points': 0,
            'current_difficulty': 'beginner',
            'total_words_learned': 0,
            'total_sessions_completed': 0,
            'current_streak': 0,
            'best_streak': 0,
            'accuracy_rate': 0.0,
            'last_played': datetime.now(timezone.utc).isoformat(),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }
        
        result = storage.client.table("language_progress").insert(new_progress).execute()
        progress = result.data[0]
    
    return progress


def create_fallback_flashcards(language: str, count: int = 5) -> List[Flashcard]:
    """Create fallback flashcards when AI generation fails"""
    fallback_cards = {
        "spanish": [
            # Greetings & Basics
            {"word": "hola", "translation": "hello", "pronunciation": "OH-lah", "distractors": ["goodbye", "thank you", "please"]},
            {"word": "adiós", "translation": "goodbye", "pronunciation": "ah-DYOHS", "distractors": ["hello", "thank you", "water"]},
            {"word": "gracias", "translation": "thank you", "pronunciation": "GRAH-see-ahs", "distractors": ["hello", "sorry", "yes"]},
            # Family
            {"word": "familia", "translation": "family", "pronunciation": "fah-MEE-lyah", "distractors": ["house", "friend", "school"]},
            {"word": "madre", "translation": "mother", "pronunciation": "MAH-dreh", "distractors": ["father", "sister", "daughter"]},
            {"word": "hermano", "translation": "brother", "pronunciation": "er-MAH-noh", "distractors": ["sister", "cousin", "uncle"]},
            # Colors
            {"word": "rojo", "translation": "red", "pronunciation": "ROH-hoh", "distractors": ["blue", "green", "yellow"]},
            {"word": "azul", "translation": "blue", "pronunciation": "ah-SOOL", "distractors": ["red", "purple", "orange"]},
            {"word": "verde", "translation": "green", "pronunciation": "VER-deh", "distractors": ["red", "blue", "black"]},
            # Food
            {"word": "agua", "translation": "water", "pronunciation": "AH-gwah", "distractors": ["milk", "juice", "coffee"]},
            {"word": "pan", "translation": "bread", "pronunciation": "pahn", "distractors": ["meat", "rice", "soup"]},
            {"word": "manzana", "translation": "apple", "pronunciation": "man-SAH-nah", "distractors": ["orange", "banana", "grape"]},
            # Actions
            {"word": "comer", "translation": "to eat", "pronunciation": "koh-MER", "distractors": ["to drink", "to sleep", "to walk"]},
            {"word": "dormir", "translation": "to sleep", "pronunciation": "dor-MEER", "distractors": ["to wake", "to run", "to study"]},
            {"word": "hablar", "translation": "to speak", "pronunciation": "ah-BLAR", "distractors": ["to listen", "to write", "to read"]},
            # Numbers
            {"word": "uno", "translation": "one", "pronunciation": "OO-noh", "distractors": ["two", "three", "ten"]},
            {"word": "cinco", "translation": "five", "pronunciation": "SEEN-koh", "distractors": ["four", "six", "eight"]},
            {"word": "diez", "translation": "ten", "pronunciation": "dee-EHS", "distractors": ["nine", "eleven", "twenty"]},
            # Places
            {"word": "casa", "translation": "house", "pronunciation": "KAH-sah", "distractors": ["school", "store", "park"]},
            {"word": "escuela", "translation": "school", "pronunciation": "es-KWEH-lah", "distractors": ["home", "hospital", "office"]},
        ],
        "french": [
            # Greetings & Basics
            {"word": "bonjour", "translation": "hello", "pronunciation": "bon-ZHOOR", "distractors": ["goodbye", "thank you", "please"]},
            {"word": "au revoir", "translation": "goodbye", "pronunciation": "oh ruh-VWAHR", "distractors": ["hello", "thank you", "water"]},
            {"word": "merci", "translation": "thank you", "pronunciation": "mer-SEE", "distractors": ["hello", "sorry", "yes"]},
            # Family
            {"word": "famille", "translation": "family", "pronunciation": "fah-MEEL", "distractors": ["house", "friend", "school"]},
            {"word": "mère", "translation": "mother", "pronunciation": "mer", "distractors": ["father", "sister", "daughter"]},
            {"word": "frère", "translation": "brother", "pronunciation": "frer", "distractors": ["sister", "cousin", "uncle"]},
            # Colors
            {"word": "rouge", "translation": "red", "pronunciation": "roozh", "distractors": ["blue", "green", "yellow"]},
            {"word": "bleu", "translation": "blue", "pronunciation": "bluh", "distractors": ["red", "purple", "orange"]},
            {"word": "vert", "translation": "green", "pronunciation": "ver", "distractors": ["red", "blue", "black"]},
            # Food
            {"word": "eau", "translation": "water", "pronunciation": "oh", "distractors": ["milk", "juice", "coffee"]},
            {"word": "pain", "translation": "bread", "pronunciation": "pan", "distractors": ["meat", "rice", "soup"]},
            {"word": "pomme", "translation": "apple", "pronunciation": "pom", "distractors": ["orange", "banana", "grape"]},
            # Actions
            {"word": "manger", "translation": "to eat", "pronunciation": "man-ZHAY", "distractors": ["to drink", "to sleep", "to walk"]},
            {"word": "dormir", "translation": "to sleep", "pronunciation": "dor-MEER", "distractors": ["to wake", "to run", "to study"]},
            {"word": "parler", "translation": "to speak", "pronunciation": "par-LAY", "distractors": ["to listen", "to write", "to read"]},
            # Numbers
            {"word": "un", "translation": "one", "pronunciation": "un", "distractors": ["two", "three", "ten"]},
            {"word": "cinq", "translation": "five", "pronunciation": "sank", "distractors": ["four", "six", "eight"]},
            {"word": "dix", "translation": "ten", "pronunciation": "dees", "distractors": ["nine", "eleven", "twenty"]},
            # Places
            {"word": "maison", "translation": "house", "pronunciation": "may-ZOHN", "distractors": ["school", "store", "park"]},
            {"word": "école", "translation": "school", "pronunciation": "ay-KOHL", "distractors": ["home", "hospital", "office"]},
        ],
        "german": [
            # Greetings & Basics
            {"word": "hallo", "translation": "hello", "pronunciation": "HAH-loh", "distractors": ["goodbye", "thank you", "please"]},
            {"word": "auf wiedersehen", "translation": "goodbye", "pronunciation": "owf VEE-der-zayn", "distractors": ["hello", "thank you", "water"]},
            {"word": "danke", "translation": "thank you", "pronunciation": "DAHN-keh", "distractors": ["hello", "sorry", "yes"]},
            # Family
            {"word": "familie", "translation": "family", "pronunciation": "fah-MEE-lee-eh", "distractors": ["house", "friend", "school"]},
            {"word": "mutter", "translation": "mother", "pronunciation": "MUT-ter", "distractors": ["father", "sister", "daughter"]},
            {"word": "bruder", "translation": "brother", "pronunciation": "BROO-der", "distractors": ["sister", "cousin", "uncle"]},
            # Colors
            {"word": "rot", "translation": "red", "pronunciation": "roht", "distractors": ["blue", "green", "yellow"]},
            {"word": "blau", "translation": "blue", "pronunciation": "blau", "distractors": ["red", "purple", "orange"]},
            {"word": "grün", "translation": "green", "pronunciation": "grün", "distractors": ["red", "blue", "black"]},
            # Food
            {"word": "wasser", "translation": "water", "pronunciation": "VAH-ser", "distractors": ["milk", "juice", "coffee"]},
            {"word": "brot", "translation": "bread", "pronunciation": "broht", "distractors": ["meat", "rice", "soup"]},
            {"word": "apfel", "translation": "apple", "pronunciation": "AH-pfel", "distractors": ["orange", "banana", "grape"]},
            # Actions
            {"word": "essen", "translation": "to eat", "pronunciation": "ES-sen", "distractors": ["to drink", "to sleep", "to walk"]},
            {"word": "schlafen", "translation": "to sleep", "pronunciation": "SHLAH-fen", "distractors": ["to wake", "to run", "to study"]},
            {"word": "sprechen", "translation": "to speak", "pronunciation": "SHPRE-khen", "distractors": ["to listen", "to write", "to read"]},
            # Numbers
            {"word": "eins", "translation": "one", "pronunciation": "ines", "distractors": ["two", "three", "ten"]},
            {"word": "fünf", "translation": "five", "pronunciation": "fünf", "distractors": ["four", "six", "eight"]},
            {"word": "zehn", "translation": "ten", "pronunciation": "tsayn", "distractors": ["nine", "eleven", "twenty"]},
            # Places
            {"word": "haus", "translation": "house", "pronunciation": "house", "distractors": ["school", "store", "park"]},
            {"word": "schule", "translation": "school", "pronunciation": "SHOO-leh", "distractors": ["home", "hospital", "office"]},
        ]
    }
    
    # Get cards for the language, or default to Spanish
    cards_data = fallback_cards.get(language.lower(), fallback_cards["spanish"])
    
    # Shuffle and select random cards to avoid repetition
    random.shuffle(cards_data)
    selected_cards = cards_data[:min(count, len(cards_data))]
    
    # Convert to Flashcard objects
    flashcards = []
    for card_data in selected_cards:
        flashcard = Flashcard(
            word=card_data["word"],
            translation=card_data["translation"],
            pronunciation=card_data["pronunciation"],
            distractors=card_data["distractors"]
        )
        flashcards.append(flashcard)
    
    return flashcards


def create_fallback_sentiment_texts(count: int = 5, difficulty: str = "easy") -> List[SentimentText]:
    """Create fallback sentiment texts when AI generation fails"""
    fallback_texts = {
        "easy": [
            # Positive texts
            {"text": "I absolutely love this product! It exceeded all my expectations.", "sentiment": "positive"},
            {"text": "What a wonderful day! Everything is going perfectly.", "sentiment": "positive"},
            {"text": "This restaurant has amazing food and great service!", "sentiment": "positive"},
            {"text": "I'm so excited about my vacation next week!", "sentiment": "positive"},
            {"text": "Thank you so much for your help. You're incredible!", "sentiment": "positive"},
            
            # Negative texts
            {"text": "This is the worst experience I've ever had. Completely disappointed.", "sentiment": "negative"},
            {"text": "I hate waiting in long lines. This is so frustrating!", "sentiment": "negative"},
            {"text": "The service here is terrible and the food is cold.", "sentiment": "negative"},
            {"text": "I'm really upset about missing the concert.", "sentiment": "negative"},
            {"text": "This product broke after just one day. What a waste of money!", "sentiment": "negative"},
            
            # Neutral texts
            {"text": "The weather today is quite nice, not too hot or cold.", "sentiment": "neutral"},
            {"text": "The meeting is scheduled for 3 PM in the conference room.", "sentiment": "neutral"},
            {"text": "There are several coffee shops on this street.", "sentiment": "neutral"},
            {"text": "The report contains information about last quarter's results.", "sentiment": "neutral"},
            {"text": "The library closes at 8 PM on weekdays.", "sentiment": "neutral"},
        ],
        "medium": [
            # Positive texts
            {"text": "Despite the initial concerns, this turned out better than expected.", "sentiment": "positive"},
            {"text": "The staff went above and beyond to accommodate our requests.", "sentiment": "positive"},
            {"text": "While not perfect, this solution works well for our needs.", "sentiment": "positive"},
            {"text": "I'm pleasantly surprised by the quality given the price point.", "sentiment": "positive"},
            {"text": "The presentation could have been longer - it was quite engaging!", "sentiment": "positive"},
            
            # Negative texts
            {"text": "Unfortunately, this didn't live up to the promotional hype.", "sentiment": "negative"},
            {"text": "The service was okay, but the food left much to be desired.", "sentiment": "negative"},
            {"text": "I expected more for what we paid. Somewhat disappointing.", "sentiment": "negative"},
            {"text": "It's functional but lacks the features they advertised.", "sentiment": "negative"},
            {"text": "The wait time was longer than anticipated and poorly communicated.", "sentiment": "negative"},
            
            # Neutral texts
            {"text": "The product has both advantages and disadvantages to consider.", "sentiment": "neutral"},
            {"text": "According to the data, sales have remained relatively stable.", "sentiment": "neutral"},
            {"text": "Some users prefer option A while others choose option B.", "sentiment": "neutral"},
            {"text": "The process typically takes between 3-5 business days.", "sentiment": "neutral"},
            {"text": "Various factors contributed to the outcome we observed.", "sentiment": "neutral"},
        ],
        "hard": [
            # Positive texts (subtle)
            {"text": "Well, I suppose it could have been worse. Actually quite decent.", "sentiment": "positive"},
            {"text": "Not to sound overly dramatic, but this might just save my sanity.", "sentiment": "positive"},
            {"text": "I wasn't expecting much, but they've managed to impress me.", "sentiment": "positive"},
            {"text": "Finally, someone who actually knows what they're doing around here.", "sentiment": "positive"},
            {"text": "I guess all that worrying was for nothing. Things worked out.", "sentiment": "positive"},
            
            # Negative texts (subtle)
            {"text": "Well, that was certainly... an interesting approach to customer service.", "sentiment": "negative"},
            {"text": "I'm sure they tried their best. Bless their hearts.", "sentiment": "negative"},
            {"text": "Another fantastic Monday morning meeting. Just what I needed.", "sentiment": "negative"},
            {"text": "The 'express' checkout line is living up to its name beautifully.", "sentiment": "negative"},
            {"text": "I love how they describe 'minor delays' as two-hour waits.", "sentiment": "negative"},
            
            # Neutral texts (complex)
            {"text": "The implementation presents both opportunities and challenges for consideration.", "sentiment": "neutral"},
            {"text": "Research indicates mixed results across different demographic segments.", "sentiment": "neutral"},
            {"text": "The correlation between these variables remains subject to debate.", "sentiment": "neutral"},
            {"text": "Stakeholders have expressed varying perspectives on the proposed changes.", "sentiment": "neutral"},
            {"text": "The methodology employed yields statistically significant but practically modest effects.", "sentiment": "neutral"},
        ]
    }
    
    # Get texts for the difficulty level
    texts_data = fallback_texts.get(difficulty, fallback_texts["easy"])
    
    # Shuffle and select random texts to avoid repetition
    random.shuffle(texts_data)
    selected_texts = texts_data[:min(count, len(texts_data))]
    
    # Convert to SentimentText objects
    sentiment_texts = []
    for text_data in selected_texts:
        sentiment_text = SentimentText(
            text=text_data["text"],
            correct_sentiment=text_data["sentiment"],
            difficulty_level=difficulty
        )
        sentiment_texts.append(sentiment_text)
    
    return sentiment_texts


def create_fallback_trivia_questions(count: int = 6, difficulty: str = "easy") -> List[TriviaQuestion]:
    """Create fallback trivia questions when AI generation fails"""
    
    fallback_questions = {
        "easy": [
            # Natural Wonders & Geography
            {
                "question": "Which animal can survive in the vacuum of space for several minutes?",
                "correct_answer": "Tardigrade (Water Bear)",
                "options": ["Tardigrade (Water Bear)", "Cockroach", "Flea", "Ant"],
                "category": "Astrobiology",
                "fact": "Tardigrades can survive extreme conditions including the vacuum of space, radiation 1,000 times higher than lethal levels for humans, and temperatures from -458°F to 300°F!",
                "source": "Space Biology Research"
            },
            {
                "question": "What material found in nature is five times stronger than steel?",
                "correct_answer": "Spider silk",
                "options": ["Spider silk", "Shark skin", "Tree bark", "Butterfly wings"],
                "category": "Materials Science",
                "fact": "Spider silk is incredibly strong and elastic. If you could make a rope of spider silk as thick as your thumb, it could stop a Boeing 747 in flight!",
                "source": "Biomaterials Engineering"
            },
            {
                "question": "Which country has more time zones than any other?",
                "correct_answer": "France",
                "options": ["France", "Russia", "United States", "Australia"],
                "category": "Geography",
                "fact": "France spans 12 time zones due to its overseas territories, from French Polynesia in the Pacific to French Guiana in South America!",
                "source": "International Geography"
            },
            {
                "question": "What happens to your height in space?",
                "correct_answer": "You grow about 2 inches taller",
                "options": ["You grow about 2 inches taller", "You shrink slightly", "You stay the same", "You grow much taller"],
                "category": "Space Physiology",
                "fact": "Without gravity compressing your spine, astronauts temporarily grow 1-2 inches taller in space. Their height returns to normal after returning to Earth!",
                "source": "NASA Human Research"
            },
            {
                "question": "Which everyday food was once considered poisonous by Europeans?",
                "correct_answer": "Tomatoes",
                "options": ["Tomatoes", "Potatoes", "Carrots", "Onions"],
                "category": "Food History",
                "fact": "Rich Europeans got lead poisoning from tomatoes because the acid leached lead from their pewter plates, leading them to believe tomatoes were toxic for 200 years!",
                "source": "Culinary History"
            },
            {
                "question": "What color is a polar bear's skin under its fur?",
                "correct_answer": "Black",
                "options": ["Black", "White", "Pink", "Gray"],
                "category": "Zoology",
                "fact": "Polar bears have black skin to better absorb heat from the sun, while their hollow fur appears white but is actually transparent and reflects light!",
                "source": "Arctic Biology"
            },
            {
                "question": "Which musical instrument can be heard from the furthest distance?",
                "correct_answer": "Didgeridoo",
                "options": ["Didgeridoo", "Trumpet", "Violin", "Piano"],
                "category": "Acoustics",
                "fact": "The low-frequency sounds of a didgeridoo can travel for miles through the Australian outback, allowing Aboriginal communities to communicate across vast distances!",
                "source": "Cultural Acoustics"
            },
            {
                "question": "What percentage of your brain do you actually use?",
                "correct_answer": "Nearly 100%",
                "options": ["Nearly 100%", "10%", "25%", "50%"],
                "category": "Neuroscience",
                "fact": "The '10% of your brain' myth is completely false! Brain scans show we use virtually all of our brain, even during simple tasks. Damage to any area causes noticeable effects.",
                "source": "Modern Neuroscience"
            }
        ],
        "medium": [
            # Science & Discovery
            {
                "question": "What unusual property allows octopuses to taste with their arms?",
                "correct_answer": "They have taste receptors on their suckers",
                "options": ["They have taste receptors on their suckers", "They can smell underwater", "They sense electrical fields", "They feel chemical vibrations"],
                "category": "Marine Biology",
                "fact": "Octopus arms can taste anything they touch through chemoreceptors on their suckers, allowing them to identify objects and food without using their eyes!",
                "source": "Cephalopod Research"
            },
            {
                "question": "Which ancient civilization invented the concept of zero?",
                "correct_answer": "Ancient Indians (Brahmagupta)",
                "options": ["Ancient Indians (Brahmagupta)", "Ancient Greeks", "Ancient Egyptians", "Ancient Chinese"],
                "category": "Mathematics History",
                "fact": "The concept of zero as both a placeholder and a number was developed by Indian mathematician Brahmagupta around 628 CE, revolutionizing mathematics forever!",
                "source": "History of Mathematics"
            },
            {
                "question": "What psychological phenomenon makes people more creative when walking?",
                "correct_answer": "Bilateral brain synchronization",
                "options": ["Bilateral brain synchronization", "Increased oxygen flow", "Rhythmic meditation", "Visual stimulation"],
                "category": "Cognitive Psychology",
                "fact": "Walking synchronizes both brain hemispheres and increases creative thinking by up to 60%. Many famous thinkers like Einstein and Darwin were known for their long walks!",
                "source": "Creativity Research"
            },
            {
                "question": "Which programming language was named after a comedy group?",
                "correct_answer": "Python",
                "options": ["Python", "Ruby", "Java", "Perl"],
                "category": "Computer Science",
                "fact": "Python was named after Monty Python's Flying Circus, not the snake! Creator Guido van Rossum was a fan and wanted a short, unique, and mysterious name.",
                "source": "Programming History"
            },
            {
                "question": "What causes the northern lights (aurora borealis)?",
                "correct_answer": "Solar wind particles hitting Earth's magnetic field",
                "options": ["Solar wind particles hitting Earth's magnetic field", "Reflection of ice crystals", "Atmospheric pressure changes", "Moon's gravitational pull"],
                "category": "Atmospheric Physics",
                "fact": "Auroras occur when charged particles from the sun collide with Earth's magnetosphere, exciting atmospheric gases that emit light at altitudes of 50-400 miles high!",
                "source": "Space Weather Science"
            },
            {
                "question": "Which architectural wonder was built to honor a queen's love for astronomy?",
                "correct_answer": "Taj Mahal",
                "options": ["Taj Mahal", "Palace of Versailles", "Alhambra", "Neuschwanstein Castle"],
                "category": "Architecture History",
                "fact": "The Taj Mahal's dome is designed to look like a second moon in the sky, and its minarets are precisely positioned to frame the moon during certain times of year!",
                "source": "Islamic Architecture"
            },
            {
                "question": "What mysterious ability do some people have that lets them 'see' sounds?",
                "correct_answer": "Synesthesia",
                "options": ["Synesthesia", "Echolocation", "Perfect pitch", "Chromesthesia"],
                "category": "Neurological Phenomena",
                "fact": "People with synesthesia experience blended senses - they might see colors when hearing music or taste words. About 1 in 2,000 people have this fascinating condition!",
                "source": "Sensory Neuroscience"
            },
            {
                "question": "Which everyday object was inspired by burrs sticking to a dog's fur?",
                "correct_answer": "Velcro",
                "options": ["Velcro", "Zippers", "Safety pins", "Paper clips"],
                "category": "Biomimetic Innovation",
                "fact": "Swiss engineer George de Mestral invented Velcro after examining burr seeds under a microscope and discovering their tiny hooks that clung to fabric and fur!",
                "source": "Innovation History"
            }
        ],
        "hard": [
            # Advanced Knowledge
            {
                "question": "Which quantum mechanical principle allows particles to exist in multiple states simultaneously?",
                "correct_answer": "Quantum superposition",
                "options": ["Quantum superposition", "Quantum entanglement", "Wave-particle duality", "Heisenberg uncertainty"],
                "category": "Quantum Physics",
                "fact": "Quantum superposition allows particles to exist in all possible states until observed, enabling quantum computers to process multiple calculations simultaneously!",
                "source": "Quantum Mechanics"
            },
            {
                "question": "What linguistic phenomenon explains why 'flammable' and 'inflammable' mean the same thing?",
                "correct_answer": "Prefix semantics and etymological evolution",
                "options": ["Prefix semantics and etymological evolution", "Double negation rules", "Phonetic convergence", "Semantic drift"],
                "category": "Historical Linguistics",
                "fact": "'Inflammable' comes from Latin 'inflammare' (to set on fire), while 'flammable' was created later to avoid confusion. Both use 'in-' as an intensifier, not negation!",
                "source": "Etymology Studies"
            },
            {
                "question": "Which Byzantine emperor's legal code influenced modern legal systems worldwide?",
                "correct_answer": "Justinian I",
                "options": ["Justinian I", "Constantine I", "Theodosius I", "Basil II"],
                "category": "Legal History",
                "fact": "Justinian's Corpus Juris Civilis (529-534 CE) systematized Roman law and became the foundation for civil law systems used in most of Europe, Latin America, and parts of Asia today!",
                "source": "Legal History"
            },
            {
                "question": "What mathematical concept allows GPS satellites to maintain accuracy?",
                "correct_answer": "Relativistic time dilation corrections",
                "options": ["Relativistic time dilation corrections", "Trigonometric triangulation", "Fourier transform analysis", "Orbital mechanics calculations"],
                "category": "Applied Physics",
                "fact": "GPS satellites must account for Einstein's relativity - their clocks run faster due to weaker gravity and slower due to motion, requiring corrections of 38 microseconds per day!",
                "source": "Satellite Technology"
            },
            {
                "question": "Which neurotransmitter imbalance is most associated with Parkinson's disease?",
                "correct_answer": "Dopamine",
                "options": ["Dopamine", "Serotonin", "GABA", "Acetylcholine"],
                "category": "Medical Neuroscience",
                "fact": "Parkinson's disease involves the death of dopamine-producing neurons in the substantia nigra, leading to motor control problems and requiring L-DOPA treatment to replenish dopamine!",
                "source": "Neurological Medicine"
            },
            {
                "question": "What evolutionary advantage explains why humans are one of the few mammals that can't synthesize vitamin C?",
                "correct_answer": "Dietary abundance made the gene unnecessary",
                "options": ["Dietary abundance made the gene unnecessary", "It prevents toxic buildup", "It reduces metabolic cost", "It increases iron absorption"],
                "category": "Evolutionary Biology",
                "fact": "Most mammals produce vitamin C, but humans, apes, and guinea pigs lost this ability around 60 million years ago when fruit-rich diets made the gene redundant!",
                "source": "Molecular Evolution"
            },
            {
                "question": "Which cryptographic principle makes modern internet security possible?",
                "correct_answer": "Public-key asymmetric encryption",
                "options": ["Public-key asymmetric encryption", "Hash function irreversibility", "Symmetric key distribution", "Digital signature verification"],
                "category": "Computer Security",
                "fact": "RSA encryption uses the mathematical difficulty of factoring large prime numbers to create secure communication channels that protect everything from banking to messaging!",
                "source": "Cryptography"
            },
            {
                "question": "What causes the 'overview effect' experienced by astronauts?",
                "correct_answer": "Cognitive shift from seeing Earth's fragility and unity",
                "options": ["Cognitive shift from seeing Earth's fragility and unity", "Reduced gravity affecting the brain", "Increased radiation exposure", "Isolation-induced hallucinations"],
                "category": "Space Psychology",
                "fact": "The overview effect is a profound cognitive shift where astronauts see Earth as a tiny, fragile sphere without borders, often leading to increased environmental awareness and spirituality!",
                "source": "Psychological Research"
            }
        ]
    }
    
    # Get questions for the difficulty level
    questions_data = fallback_questions.get(difficulty, fallback_questions["easy"])
    
    # Shuffle and select random questions to ensure variety even in fallback
    random.shuffle(questions_data)
    selected_questions = questions_data[:min(count, len(questions_data))]
    
    # If we need more questions than available, add from other difficulties
    if len(selected_questions) < count:
        all_questions = []
        for diff_level in fallback_questions.values():
            all_questions.extend(diff_level)
        
        # Remove already selected questions
        remaining_questions = [q for q in all_questions if q not in selected_questions]
        random.shuffle(remaining_questions)
        
        # Add more questions to reach the desired count
        additional_needed = count - len(selected_questions)
        selected_questions.extend(remaining_questions[:additional_needed])
    
    # Convert to TriviaQuestion objects
    trivia_questions = []
    for question_data in selected_questions:
        trivia_question = TriviaQuestion(
            question=question_data["question"],
            correct_answer=question_data["correct_answer"],
            options=question_data["options"],
            category=question_data["category"],
            fact=question_data["fact"],
            source=question_data["source"]
        )
        trivia_questions.append(trivia_question)
    
    return trivia_questions


@router.post("/generate-trivia-questions", response_model=TriviaQuestionResponse)
async def generate_trivia_questions(
    payload: TriviaQuestionRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Generate trivia questions using OpenAI for knowledge trivia games.
    
    Creates a variety of trivia questions with random topics and interesting facts
    to make the game fun and educational with almost no repetition.
    """
    try:
        # Enhanced system prompt for trivia question generation with maximum diversity
        system_prompt = """You are a world-class trivia expert who creates INCREDIBLY DIVERSE and CHALLENGING questions.

Your mission: Generate questions that are COMPLETELY DIFFERENT from each other and span the vast spectrum of human knowledge.

CORE PRINCIPLES:
- MAXIMUM DIVERSITY: Every question must be from a totally different field of knowledge
- SURPRISE FACTOR: Include unexpected, fascinating, and lesser-known facts
- CHALLENGE LEVEL: Make questions thought-provoking but fair
- EDUCATIONAL VALUE: Each question should teach something amazing
- ZERO REPETITION: No similar themes, topics, or question structures

DIVERSITY REQUIREMENTS:
- Use COMPLETELY different categories for each question
- Mix time periods: ancient history, modern science, current events, future concepts
- Vary geographical regions: different continents, cultures, countries
- Include multiple disciplines: hard sciences, soft sciences, arts, culture, technology, nature, human achievement
- Alternate between well-known and obscure-but-fascinating facts
- Use different question formats and complexity levels

QUESTION QUALITY STANDARDS:
- Each question should make people go "Wow, I didn't know that!"
- Include both mainstream and niche knowledge areas
- Balance common knowledge with surprising discoveries
- Make facts genuinely memorable and conversation-worthy
- Ensure all 4 options are plausible but only one is correct

CRITICAL: Your response MUST be valid JSON only. No additional text before or after.

Return ONLY this exact JSON structure:
{
  "questions": [
    {
      "question": "Fascinating question that teaches something amazing?",
      "correct_answer": "The surprising correct answer",
      "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
      "category": "Specific field of knowledge",
      "fact": "Mind-blowing fact that expands understanding and makes people want to share it",
      "source": "Specific academic or scientific source area"
    }
  ]
}"""

        difficulty_instructions = {
            "easy": """
- Focus on surprising facts about familiar topics
- Use clear, accessible language
- Include amazing discoveries about everyday things
- Mix basic science, geography, animals, and human achievements
- Example complexity: "Which animal can survive in space?" or "What unexpected material is stronger than steel?"
""",
            "medium": """
- Combine multiple concepts or require reasoning
- Include fascinating historical connections
- Use moderately specialized knowledge
- Mix cutting-edge science with historical mysteries
- Example complexity: "What medieval invention revolutionized modern computing?" or "Which psychological phenomenon explains crowd behavior?"
""",
            "hard": """
- Require deep specialized knowledge or complex reasoning
- Include advanced scientific concepts, obscure historical events, or technical details
- Use precise terminology and nuanced distinctions
- Challenge even well-educated individuals
- Example complexity: "Which quantum property enables teleportation?" or "What linguistic phenomenon explains language evolution?"
"""
        }

        difficulty = payload.difficulty.lower()
        difficulty_text = difficulty_instructions.get(difficulty, difficulty_instructions["easy"])

        # Create randomized topic seeds to ensure maximum variety
        import random
        topic_pools = [
            # Natural Sciences
            ["Quantum Physics", "Marine Biology", "Astronomy", "Geology", "Chemistry", "Neuroscience", "Genetics", "Meteorology", "Ecology", "Paleontology"],
            # Human Sciences & Culture  
            ["Anthropology", "Archaeology", "Psychology", "Linguistics", "Philosophy", "Sociology", "Cognitive Science", "Cultural Studies", "Religious Studies", "Ethics"],
            # History & Civilizations
            ["Ancient History", "Medieval History", "Modern History", "Archaeological Discoveries", "Historical Mysteries", "Civilizations", "Wars & Conflicts", "Exploration", "Revolutions", "Historical Figures"],
            # Technology & Innovation
            ["Computer Science", "Engineering", "Biotechnology", "Artificial Intelligence", "Robotics", "Space Technology", "Medical Technology", "Transportation", "Communications", "Energy"],
            # Arts & Creativity
            ["Visual Arts", "Music Theory", "Literature", "Theater", "Film Studies", "Architecture", "Design", "Photography", "Sculpture", "Performance Art"],
            # Geography & Places
            ["Physical Geography", "Human Geography", "Climatology", "Oceanography", "Urban Studies", "Environmental Science", "Cartography", "Geopolitics", "Cultural Geography", "Economic Geography"],
            # Sports & Human Achievement
            ["Olympic History", "Extreme Sports", "Athletic Records", "Sports Science", "Adventure", "Human Limits", "Competitions", "Physical Feats", "Team Dynamics", "Sports Psychology"],
            # Mathematics & Logic
            ["Pure Mathematics", "Applied Mathematics", "Statistics", "Logic", "Game Theory", "Cryptography", "Mathematical History", "Probability", "Geometry", "Number Theory"],
            # Economics & Society
            ["Economics", "Business Innovation", "Social Movements", "Political Science", "International Relations", "Demographics", "Urban Planning", "Public Policy", "Globalization", "Development"],
            # Miscellaneous & Interdisciplinary
            ["Food Science", "Fashion History", "Games & Puzzles", "Unusual Records", "Paradoxes", "Optical Illusions", "Behavioral Economics", "Conspiracy Theories", "Future Predictions", "Strange Phenomena"]
        ]

        # Randomly select topics from different pools to ensure maximum diversity
        selected_topics = []
        random.shuffle(topic_pools)
        for i in range(min(payload.count, len(topic_pools))):
            pool = topic_pools[i]
            random.shuffle(pool)
            selected_topics.append(pool[0])

        # If we need more topics than pools, add more variety
        while len(selected_topics) < payload.count:
            random_pool = random.choice(topic_pools)
            random_topic = random.choice(random_pool)
            if random_topic not in selected_topics:
                selected_topics.append(random_topic)

        user_prompt = f"""Create {payload.count} INCREDIBLY DIVERSE trivia questions for {difficulty} difficulty level.

Difficulty Guidelines for {difficulty} level:
{difficulty_text}

MANDATORY DIVERSITY REQUIREMENTS:
- Each question MUST cover one of these specific topics (use different ones): {', '.join(selected_topics)}
- NO two questions can be from related fields or similar themes
- Use completely different question formats: "What", "Which", "Who", "Where", "When", "How many", "Why does"
- Mix different types of knowledge: scientific discoveries, historical events, cultural phenomena, natural wonders, human achievements, technological breakthroughs

CREATIVITY BOOSTERS for maximum interest:
- Include surprising connections between unrelated fields
- Focus on "wow factor" - things that sound impossible but are true
- Mix different scales: microscopic to cosmic, ancient to futuristic
- Include both human achievements and natural phenomena
- Use fascinating edge cases and exceptions to rules
- Include discoveries that changed how we understand the world

ENSURE TOTAL VARIETY:
- Different continents and cultures represented
- Mix of time periods from prehistoric to cutting-edge modern
- Various types of evidence: experimental, observational, theoretical, historical
- Different complexity levels within the difficulty range
- Include both widely known and surprisingly obscure facts

Remember: Every question should make someone think "I had no idea!" and want to share the fact with friends.

Return valid JSON only, no additional text."""

        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=2000,
            temperature=0.9,  # Maximum temperature for maximum creativity and variety
            response_format={"type": "json_object"}  # Force JSON response format
        )
        
        response_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        # Debug logging for troubleshooting
        print(f"OpenAI Trivia Response: {response_text}")
        
        # Parse the JSON response
        try:
            import json
            
            # Clean the response text - remove any markdown formatting
            cleaned_response = response_text.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]  # Remove ```json
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]  # Remove ```
            cleaned_response = cleaned_response.strip()
            
            # Check if response is empty
            if not cleaned_response:
                raise ValueError("Empty response from OpenAI")
            
            # Try to parse JSON
            trivia_data = json.loads(cleaned_response)
            
            # Validate the structure
            if not isinstance(trivia_data, dict):
                raise ValueError("Response is not a JSON object")
            
            if "questions" not in trivia_data:
                raise ValueError("Invalid response structure: missing 'questions' key")
            
            if not isinstance(trivia_data["questions"], list):
                raise ValueError("'questions' should be a list")
            
            trivia_questions = []
            for i, question_data in enumerate(trivia_data["questions"]):
                try:
                    # Validate required fields
                    required_fields = ["question", "correct_answer", "options", "category", "fact", "source"]
                    if not all(key in question_data for key in required_fields):
                        print(f"Skipping question {i}: missing required fields. Has keys: {list(question_data.keys())}")
                        continue
                    
                    # Validate options
                    if not isinstance(question_data["options"], list) or len(question_data["options"]) != 4:
                        print(f"Skipping question {i}: invalid options. Got: {question_data.get('options')}")
                        continue
                    
                    # Ensure correct answer is in options
                    if question_data["correct_answer"] not in question_data["options"]:
                        print(f"Skipping question {i}: correct answer not in options")
                        continue
                    
                    trivia_question = TriviaQuestion(
                        question=str(question_data["question"]),
                        correct_answer=str(question_data["correct_answer"]),
                        options=[str(opt) for opt in question_data["options"]],
                        category=str(question_data["category"]),
                        fact=str(question_data["fact"]),
                        source=str(question_data["source"])
                    )
                    trivia_questions.append(trivia_question)
                except Exception as question_error:
                    print(f"Error processing question {i}: {question_error}")
                    continue
            
            if not trivia_questions:
                # If no valid questions were generated, create fallback
                print("No valid trivia questions generated, creating fallback")
                trivia_questions = create_fallback_trivia_questions(payload.count, difficulty)
            
            return TriviaQuestionResponse(
                questions=trivia_questions,
                tokens_used=tokens_used
            )
            
        except json.JSONDecodeError as json_error:
            print(f"JSON parsing error: {json_error}")
            print(f"Raw response: {response_text}")
            # Return fallback questions if JSON parsing fails
            trivia_questions = create_fallback_trivia_questions(payload.count, difficulty)
            return TriviaQuestionResponse(
                questions=trivia_questions,
                tokens_used=tokens_used
            )
        
        except Exception as parse_error:
            print(f"Response parsing error: {parse_error}")
            # Return fallback questions if parsing fails
            trivia_questions = create_fallback_trivia_questions(payload.count, difficulty)
            return TriviaQuestionResponse(
                questions=trivia_questions,
                tokens_used=tokens_used
            )
    
    except Exception as e:
        print(f"Error generating trivia questions: {e}")
        # Return fallback questions if AI generation fails
        trivia_questions = create_fallback_trivia_questions(payload.count, difficulty)
        return TriviaQuestionResponse(
            questions=trivia_questions,
            tokens_used=None
        )