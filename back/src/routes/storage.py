from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
import os

from src.services.storage.supabase import Supabase
from src.services.storage.schemas import DataPack 

def get_storage() -> Supabase:
    """Return a singleton instance of the Supabase storage helper configured
    from environment variables `SUPABASE_URL` and `SUPABASE_KEY`."""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY environment variables must be set.")

    # Re-use a single instance to avoid recreating connections on every request
    if not hasattr(get_storage, "_instance"):
        get_storage._instance = Supabase(url, key)
    return get_storage._instance


class DataPackCreate(BaseModel):
    user_id: str = Field(..., description="ID of the user that owns the DataPack")
    name: str = Field(..., description="Human-readable name of the DataPack")
    description: Optional[str] = Field(None, description="Optional description")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary JSON metadata")


class DataPackResponse(DataPackCreate):
    id: str
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True


class KnowledgeCreate(BaseModel):
    url: HttpUrl
    content: str
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ImageCreate(BaseModel):
    image_url: HttpUrl
    alt_text: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class DataInstanceCreate(BaseModel):
    content: str
    content_type: str = Field(..., examples=["text", "markdown", "json"])
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    knowledge_list: Optional[List[KnowledgeCreate]] = Field(None, description="List of knowledge objects to attach to this instance")
    image_urls: Optional[List[HttpUrl]] = Field(None, description="List of image URLs to attach to this instance")


class DataInstanceResponse(BaseModel):
    id: str
    datapack_id: str
    content: str
    content_type: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: str
    knowledge: Optional[List[Dict[str, Any]]]
    images: Optional[List[Dict[str, Any]]]

    class Config:
        orm_mode = True


router = APIRouter(prefix="/storage", tags=["Storage"])


@router.post("/datapacks", response_model=DataPackResponse, status_code=status.HTTP_201_CREATED)
async def create_datapack(payload: DataPackCreate, storage: Supabase = Depends(get_storage)):
    """Create a new DataPack owned by a user."""
    try:
        dp_obj = DataPack(**payload.model_dump())
        result = storage.create_datapack(dp_obj)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return result


@router.get("/users/{user_id}/datapacks", response_model=List[DataPackResponse])
async def list_user_datapacks(user_id: str, storage: Supabase = Depends(get_storage)):
    """Return all DataPacks belonging to `user_id` (ordered by creation date DESC)."""
    try:
        return storage.get_user_datapacks(user_id)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.get("/datapacks/{datapack_id}", response_model=DataPackResponse)
async def get_datapack(datapack_id: str, storage: Supabase = Depends(get_storage)):
    """Retrieve a single DataPack by its ID."""
    result = storage.get_datapack(datapack_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DataPack not found")
    return result


@router.delete("/datapacks/{datapack_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_datapack(datapack_id: str, storage: Supabase = Depends(get_storage)):
    """Delete a DataPack and **all** cascading data (instances, knowledge, images)."""
    deleted = storage.delete_datapack(datapack_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DataPack not found or already deleted")
    return None 


@router.get("/datapacks/{datapack_id}/export", response_model=Dict[str, Any])
async def export_datapack(datapack_id: str, storage: Supabase = Depends(get_storage)):
    """Export a complete DataPack including all nested instances, knowledge, and images."""
    result = storage.export_datapack(datapack_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DataPack not found")
    return result


@router.post("/datapacks/{datapack_id}/instances", response_model=DataInstanceResponse, status_code=status.HTTP_201_CREATED)
async def create_datainstance(datapack_id: str, payload: DataInstanceCreate, storage: Supabase = Depends(get_storage)):
    """Create a DataInstance inside the specified DataPack. Optionally attach knowledge items and images in one request."""
    try:
        instance = storage.create_complete_datainstance(
            datapack_id=datapack_id,
            content=payload.content,
            content_type=payload.content_type,
            knowledge_list=[k.model_dump() for k in payload.knowledge_list] if payload.knowledge_list else None,
            image_urls=[str(url) for url in payload.image_urls] if payload.image_urls else None,
            metadata=payload.metadata,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))
    return instance


@router.get("/datapacks/{datapack_id}/instances", response_model=List[Dict[str, Any]])
async def list_datapack_instances(
    datapack_id: str,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    storage: Supabase = Depends(get_storage),
):
    """Return basic information for DataInstances contained in the DataPack (paginated)."""
    return storage.get_datapack_instances(datapack_id, limit=limit, offset=offset)


@router.get("/datainstances/{datainstance_id}", response_model=DataInstanceResponse)
async def get_datainstance(datainstance_id: str, storage: Supabase = Depends(get_storage)):
    """Retrieve a DataInstance along with its related knowledge and images."""
    instance = storage.get_datainstance_with_content(datainstance_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="DataInstance not found")
    return instance


@router.post("/datainstances/{datainstance_id}/knowledge", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def add_knowledge(datainstance_id: str, payload: List[KnowledgeCreate], storage: Supabase = Depends(get_storage)):
    """Attach one or more Knowledge documents to an existing DataInstance."""
    results = storage.bulk_add_knowledge(datainstance_id, [k.model_dump() for k in payload])
    return results


@router.post("/datainstances/{datainstance_id}/images", response_model=List[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def add_images(datainstance_id: str, payload: List[ImageCreate], storage: Supabase = Depends(get_storage)):
    """Attach one or more Images to an existing DataInstance."""
    urls = [str(img.image_url) for img in payload]
    results = storage.bulk_add_images(datainstance_id, urls)
    return results


@router.get("/users/{user_id}/search", response_model=Dict[str, List[Dict[str, Any]]])
async def search_user_content(user_id: str, q: str = Query(..., description="Search query"), limit: int = Query(20, ge=1, le=100), storage: Supabase = Depends(get_storage)):
    """Full-text search across a user's DataInstances and Knowledge documents."""
    return storage.search_user_content(user_id=user_id, search_query=q, limit=limit)


@router.get("/users/{user_id}/statistics", response_model=Dict[str, Any])
async def user_statistics(user_id: str, storage: Supabase = Depends(get_storage)):
    """Aggregate statistics for the specified user (number of datapacks, instances, etc.)."""
    return storage.get_user_statistics(user_id)