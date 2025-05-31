from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class DataInstance:
    """Represents a single data instance for a pet."""
    pet_id: str
    content: str
    content_type: str  # 'text', 'json', 'markdown', etc.
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}


@dataclass
class Knowledge:
    """Represents knowledge (URL-content) that can be associated with data instances."""
    url: str
    content: str
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}


@dataclass
class Image:
    """Represents an image that can be associated with data instances."""
    image_url: str
    alt_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}
