from notte_sdk import NotteClient
from src.config import settings
from urllib.parse import urlparse, urlunparse

class NotteScraper:
    def __init__(self):
        self.notte = NotteClient(api_key=settings.NOTTE_API_KEY)

    def _normalize_url(self, url: str) -> str:
        parsed = urlparse(url)
        if parsed.netloc in {"x.com", "www.x.com"}:
            # Convert to twitter.com since x.com might block unauthenticated scraping
            parsed = parsed._replace(netloc="twitter.com")
        return urlunparse(parsed)

    def scrape(self, url: str, instruction: str):
        normalized = self._normalize_url(url)
        response = self.notte.scrape(
            url=normalized,
            instruction=instruction,
        )
        return response