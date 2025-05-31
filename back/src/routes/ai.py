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


class ContentGenerationRequest(BaseModel):
    content_type: str  # 'summary', 'study_guide', 'faq', 'timeline', 'briefing'
    context: str
    pet_name: Optional[str] = None
    additional_instructions: Optional[str] = None


class ContentGenerationResponse(BaseModel):
    content: str
    content_type: str
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
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=600,
            temperature=0.6
        )
        
        return {
            "response": response.choices[0].message.content,
            "tokens_used": response.usage.total_tokens if response.usage else None,
            "model": "gpt-4o"
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
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1200,
            temperature=0.7
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