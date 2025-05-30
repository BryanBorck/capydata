
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass
class DataPack:
    """Represents a collection of data instances for a user."""
    user_id: str
    name: str
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.updated_at is None:
            self.updated_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}


@dataclass
class DataInstance:
    """Represents a single data instance within a DataPack."""
    datapack_id: str
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
    """Represents knowledge (URL-content) associated with a data instance."""
    datainstance_id: str
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
    """Represents an image associated with a data instance."""
    datainstance_id: str
    image_url: str
    alt_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}
