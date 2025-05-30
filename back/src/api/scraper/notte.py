from notte_sdk import NotteClient
from src.config import settings

class NotteScraper:
    def __init__(self):
        self.notte = NotteClient(api_key=settings.NOTTE_API_KEY)


    def scrape(self, url: str, instruction: str):
        response = self.notte.scrape(
            url=url,
            instruction=instruction,
        )
        return response