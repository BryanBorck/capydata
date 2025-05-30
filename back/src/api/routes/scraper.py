from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, HttpUrl

from src.api.scraper.notte import NotteScraper

router = APIRouter(prefix="/scraper", tags=["Scraper"])


class ScrapeRequest(BaseModel):
    url: HttpUrl
    instruction: str


class ScrapeResponse(BaseModel):
    data: dict  # Adjust according to actual NotteClient response schema


scraper_service = NotteScraper()


@router.post("/", response_model=ScrapeResponse, status_code=status.HTTP_200_OK)
async def scrape_endpoint(payload: ScrapeRequest):
    """Scrape a webpage using Notte and return the structured data."""

    try:
        result = scraper_service.scrape(url=str(payload.url), instruction=payload.instruction)
    except Exception as exc: 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return result

@router.post("/scrape/twitter")
async def scrape_twitter_endpoint(payload: ScrapeRequest):
    """Scrape a twitter post using Notte and return the structured data."""

    try:
        result = scraper_service.scrape(url=str(payload.url), instruction="Extract the text from the tweet above")
    except Exception as exc: 
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return result
