from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
import os
from openai import OpenAI

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


class Flashcard(BaseModel):
    word: str
    translation: str
    pronunciation: str
    distractors: List[str]


class FlashcardResponse(BaseModel):
    language: str
    flashcards: List[Flashcard]
    tokens_used: Optional[int] = None


def get_openai_client() -> OpenAI:
    """Get OpenAI client instance."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OpenAI API is not configured"
        )
    return OpenAI(api_key=api_key)


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
            temperature=0.7
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
    
    This endpoint provides a more conversational interface for exploring
    the pet's knowledge and getting answers to specific questions.
    """
    try:
        system_prompt = f"""You are a knowledgeable AI assistant helping a user explore their pet{' ' + payload.pet_name if payload.pet_name else ''}'s knowledge base. 

You have access to specific knowledge content that the pet has learned. Your job is to:
1. Answer questions directly based on the provided context
2. Explain concepts and make connections
3. Suggest related topics or areas to explore
4. Be helpful, friendly, and engaging

Keep responses focused and relevant to the available knowledge. If the context doesn't contain enough information to answer fully, say so and suggest what additional information might be helpful."""

        user_prompt = f"""Question: {payload.query}

Available Knowledge:
{payload.context}

Please provide a helpful response based on the available knowledge."""

        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=500,
            temperature=0.6
        )
        
        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens if response.usage else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat request: {str(e)}"
        )


@router.post("/generate-flashcards", response_model=FlashcardResponse)
async def generate_flashcards(
    payload: FlashcardRequest,
    openai_client: OpenAI = Depends(get_openai_client)
):
    """
    Generate language flashcards using OpenAI for educational language learning games.
    
    This endpoint creates vocabulary flashcards with pronunciation guides and 
    multiple choice distractors for interactive language learning.
    """
    try:
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
- Focus on common greetings, polite expressions, and basic vocabulary
- Ensure cultural appropriateness and accuracy

Return your response as a valid JSON object with this exact structure:
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

        user_prompt = f"""Create {payload.count} {payload.difficulty} level flashcards for {payload.language} language learning.

Requirements:
- Language: {payload.language}
- Difficulty: {payload.difficulty}
- Number of flashcards: {payload.count}

Focus on practical vocabulary that would be useful for beginners learning {payload.language}. Include common greetings, polite expressions, and essential daily vocabulary.

Each flashcard should have:
1. A word or phrase in {payload.language}
2. The English translation
3. Simple pronunciation guide (readable phonetics, not IPA)
4. Three incorrect English translations as distractors

Return valid JSON only, no additional text."""

        response = openai_client.chat.completions.create(
            model="gpt-4.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1200,
            temperature=0.7
        )
        
        response_text = response.choices[0].message.content
        tokens_used = response.usage.total_tokens if response.usage else None
        
        # Parse the JSON response
        try:
            import json
            flashcard_data = json.loads(response_text)
            
            # Validate the structure
            if "flashcards" not in flashcard_data:
                raise ValueError("Invalid response structure: missing 'flashcards' key")
            
            flashcards = []
            for card_data in flashcard_data["flashcards"]:
                if not all(key in card_data for key in ["word", "translation", "pronunciation", "distractors"]):
                    continue  # Skip malformed cards
                
                if len(card_data["distractors"]) != 3:
                    continue  # Skip cards without exactly 3 distractors
                
                flashcard = Flashcard(
                    word=card_data["word"],
                    translation=card_data["translation"],
                    pronunciation=card_data["pronunciation"],
                    distractors=card_data["distractors"]
                )
                flashcards.append(flashcard)
            
            if not flashcards:
                raise ValueError("No valid flashcards generated")
            
            return FlashcardResponse(
                language=payload.language,
                flashcards=flashcards,
                tokens_used=tokens_used
            )
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to parse AI response as JSON: {str(e)}"
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Invalid flashcard data structure: {str(e)}"
            )
            
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate flashcards: {str(e)}"
        ) 