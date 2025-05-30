from __future__ import annotations

from pathlib import Path

from fastapi import HTTPException, status
from fastapi.responses import FileResponse

from src.config import settings


class ImageProvider:
    """Serve images stored in *settings.images_dir* to the API layer."""

    def __init__(self, images_root: str | Path | None = None):
        self._root = Path(images_root or settings.images_dir).expanduser().resolve()
        self._root.mkdir(parents=True, exist_ok=True)

    def get(self, image_id: str) -> FileResponse: 
        """Return a FastAPI FileResponse for *image_id* or raise 404."""
        for ext in (".png", ".jpg", ".jpeg", ""):  # naive ext detection
            candidate = self._root / f"{image_id}{ext}"
            if candidate.exists():
                return FileResponse(candidate)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found") 
    
    # Integrate multiple AI providers with entropic parameters
    def generate_image(self, prompt: str) -> FileResponse:
        """Generate an image from a prompt."""
        pass