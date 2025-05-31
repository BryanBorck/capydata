from typing import List, Dict, Any, Optional
from supabase import create_client
import hashlib

from .schemas import DataInstance, Knowledge, Image

class Supabase:
    def __init__(self, url: str, key: str):
        """    
        CREATE TABLE IF NOT EXISTS public.datainstances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Knowledge table (many-to-many with datainstances)
        CREATE TABLE IF NOT EXISTS public.knowledge (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url TEXT NOT NULL,
            content TEXT NOT NULL,
            title TEXT,
            content_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(url)
        );
        
        -- Images table (many-to-many with datainstances)
        CREATE TABLE IF NOT EXISTS public.images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            image_url TEXT NOT NULL,
            alt_text TEXT,
            url_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(image_url)
        );
        
        -- Junction table for DataInstance ↔ Knowledge relationship
        CREATE TABLE IF NOT EXISTS public.datainstance_knowledge (
            datainstance_id UUID NOT NULL REFERENCES public.datainstances(id) ON DELETE CASCADE,
            knowledge_id UUID NOT NULL REFERENCES public.knowledge(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (datainstance_id, knowledge_id)
        );
        
        -- Junction table for DataInstance ↔ Image relationship
        CREATE TABLE IF NOT EXISTS public.datainstance_images (
            datainstance_id UUID NOT NULL REFERENCES public.datainstances(id) ON DELETE CASCADE,
            image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (datainstance_id, image_id)
        );
        
        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_datainstances_pet_id ON public.datainstances(pet_id);
        CREATE INDEX IF NOT EXISTS idx_datainstance_knowledge_datainstance ON public.datainstance_knowledge(datainstance_id);
        CREATE INDEX IF NOT EXISTS idx_datainstance_images_datainstance ON public.datainstance_images(datainstance_id);
        CREATE INDEX IF NOT EXISTS idx_knowledge_url ON public.knowledge(url);
        CREATE INDEX IF NOT EXISTS idx_images_url ON public.images(image_url);
        
        -- Full text search indexes
        CREATE INDEX IF NOT EXISTS idx_datainstances_content_fts ON public.datainstances USING gin(to_tsvector('english', content));
        CREATE INDEX IF NOT EXISTS idx_knowledge_content_fts ON public.knowledge USING gin(to_tsvector('english', content));
        """
        self.client = create_client(url, key)
    
    def _hash_content(self, content: str) -> str:
        """Generate hash of content for deduplication."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    def get_pet(self, pet_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific pet by ID."""
        result = self.client.table("pets").select("*").eq(
            "id", pet_id
        ).execute()
        
        return result.data[0] if result.data else None
    
    def get_user_pets(self, wallet_address: str) -> List[Dict[str, Any]]:
        """Get all pets for a user by wallet address."""
        result = self.client.table("pets").select("*").eq(
            "owner_wallet", wallet_address
        ).order("created_at", desc=True).execute()
        
        return result.data
    
    def create_datainstance(self, datainstance: DataInstance) -> Dict[str, Any]:
        """Create a new DataInstance for a pet."""
        data = {
            "pet_id": datainstance.pet_id,
            "content": datainstance.content,
            "content_type": datainstance.content_type,
            "content_hash": self._hash_content(datainstance.content),
            "metadata": datainstance.metadata,
            "created_at": datainstance.created_at.isoformat()
        }
        
        result = self.client.table("datainstances").insert(data).execute()
        return result.data[0]
    
    def get_pet_instances(
        self, 
        pet_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all DataInstances for a pet."""
        result = self.client.table("datainstances").select("*").eq(
            "pet_id", pet_id
        ).order(
            "created_at", desc=True
        ).range(
            offset, offset + limit - 1
        ).execute()
        
        return result.data
    
    def get_datainstance_with_content(self, datainstance_id: str) -> Dict[str, Any]:
        """Get a DataInstance with all its associated Knowledge and Images."""
        instance_result = self.client.table("datainstances").select("*").eq(
            "id", datainstance_id
        ).execute()
        
        if not instance_result.data:
            return None
        
        datainstance = instance_result.data[0]
        
        # Get associated knowledge
        knowledge_result = self.client.table("datainstance_knowledge").select(
            "knowledge:knowledge_id(id, url, title, content, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        # Get associated images
        images_result = self.client.table("datainstance_images").select(
            "images:image_id(id, image_url, alt_text, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        datainstance["knowledge"] = [item["knowledge"] for item in knowledge_result.data]
        datainstance["images"] = [item["images"] for item in images_result.data]
        
        return datainstance
    
    def get_datainstance_knowledge(self, datainstance_id: str) -> List[Dict[str, Any]]:
        """Get all knowledge associated with a specific DataInstance."""
        knowledge_result = self.client.table("datainstance_knowledge").select(
            "knowledge:knowledge_id(id, url, title, content, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        return [item["knowledge"] for item in knowledge_result.data]
    
    def get_datainstance_images(self, datainstance_id: str) -> List[Dict[str, Any]]:
        """Get all images associated with a specific DataInstance."""
        images_result = self.client.table("datainstance_images").select(
            "images:image_id(id, image_url, alt_text, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        return [item["images"] for item in images_result.data]
    
    def add_knowledge_to_instance(
        self, 
        datainstance_id: str,
        knowledge: Knowledge
    ) -> Dict[str, Any]:
        """Add knowledge to a DataInstance (creates if not exists)."""
        knowledge_data = {
            "url": knowledge.url,
            "content": knowledge.content,
            "title": knowledge.title,
            "content_hash": self._hash_content(knowledge.content),
            "metadata": knowledge.metadata,
            "created_at": knowledge.created_at.isoformat()
        }
        
        # Upsert knowledge (insert or update if URL already exists)
        knowledge_result = self.client.table("knowledge").upsert(
            knowledge_data,
            on_conflict="url"
        ).execute()
        
        knowledge_id = knowledge_result.data[0]["id"]
        
        # Create relationship
        relation_data = {
            "datainstance_id": datainstance_id,
            "knowledge_id": knowledge_id
        }
        
        self.client.table("datainstance_knowledge").upsert(
            relation_data,
            on_conflict="datainstance_id,knowledge_id"
        ).execute()
        
        return knowledge_result.data[0]
    
    def bulk_add_knowledge(
        self,
        datainstance_id: str,
        knowledge_list: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """Add multiple knowledge entities to a DataInstance."""
        results = []
        
        for k in knowledge_list:
            knowledge = Knowledge(
                url=k["url"],
                content=k["content"],
                title=k.get("title"),
                metadata=k.get("metadata", {})
            )
            result = self.add_knowledge_to_instance(datainstance_id, knowledge)
            results.append(result)
        
        return results
    
    def add_image_to_instance(
        self,
        datainstance_id: str,
        image: Image
    ) -> Dict[str, Any]:
        """Add an image to a DataInstance (creates if not exists)."""
        image_data = {
            "image_url": image.image_url,
            "alt_text": image.alt_text,
            "url_hash": self._hash_content(image.image_url),
            "metadata": image.metadata,
            "created_at": image.created_at.isoformat()
        }
        
        # Upsert image (insert or update if URL already exists)
        image_result = self.client.table("images").upsert(
            image_data,
            on_conflict="image_url"
        ).execute()
        
        image_id = image_result.data[0]["id"]
        
        # Create relationship
        relation_data = {
            "datainstance_id": datainstance_id,
            "image_id": image_id
        }
        
        self.client.table("datainstance_images").upsert(
            relation_data,
            on_conflict="datainstance_id,image_id"
        ).execute()
        
        return image_result.data[0]
    
    def bulk_add_images(
        self,
        datainstance_id: str,
        image_urls: List[str]
    ) -> List[Dict[str, Any]]:
        """Add multiple images to a DataInstance."""
        results = []
        
        for url in image_urls:
            image = Image(
                image_url=url
            )
            result = self.add_image_to_instance(datainstance_id, image)
            results.append(result)
        
        return results
    
    def search_pet_content(
        self,
        pet_id: str,
        search_query: str,
        limit: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search across a pet's content (DataInstances and Knowledge).
        
        Returns results grouped by type.
        """
        # Search in DataInstances for this pet
        instances_result = self.client.table("datainstances").select("*").eq(
            "pet_id", pet_id
        ).ilike(
            "content", f"%{search_query}%"
        ).limit(limit).execute()
        
        # Get datainstance IDs to search related knowledge
        instance_ids = [inst["id"] for inst in instances_result.data]
        
        knowledge_results = []
        if instance_ids:
            # Get knowledge associated with these datainstances
            knowledge_relations = self.client.table("datainstance_knowledge").select(
                "knowledge:knowledge_id(id, url, title, content, metadata, created_at)"
            ).in_("datainstance_id", instance_ids).execute()
            
            # Also search knowledge content directly
            knowledge_content = self.client.table("knowledge").select("*").ilike(
                "content", f"%{search_query}%"
            ).limit(limit).execute()
            
            knowledge_results = ([item["knowledge"] for item in knowledge_relations.data] + 
                               knowledge_content.data)
        
        return {
            "datainstances": instances_result.data,
            "knowledge": knowledge_results
        }
    
    def search_user_content(
        self,
        wallet_address: str,
        search_query: str,
        limit: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search across all user's pets content.
        """
        # Get user's pets first
        pets = self.get_user_pets(wallet_address)
        pet_ids = [pet["id"] for pet in pets]
        
        if not pet_ids:
            return {"datainstances": [], "knowledge": []}
        
        # Search in DataInstances for all user's pets
        instances_result = self.client.table("datainstances").select("*").in_(
            "pet_id", pet_ids
        ).ilike(
            "content", f"%{search_query}%"
        ).limit(limit).execute()
        
        # Search in Knowledge (related to user's datainstances)
        instance_ids = [inst["id"] for inst in instances_result.data]
        knowledge_results = []
        
        if instance_ids:
            knowledge_relations = self.client.table("datainstance_knowledge").select(
                "knowledge:knowledge_id(id, url, title, content, metadata, created_at)"
            ).in_("datainstance_id", instance_ids).execute()
            
            knowledge_results = [item["knowledge"] for item in knowledge_relations.data]
        
        return {
            "datainstances": instances_result.data,
            "knowledge": knowledge_results
        }
        
    def get_user_statistics(self, wallet_address: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a user."""
        pets = self.get_user_pets(wallet_address)
        pet_ids = [pet["id"] for pet in pets]
        
        instances_count = 0
        if pet_ids:
            instances = self.client.table("datainstances").select(
                "id", count="exact"
            ).in_("pet_id", pet_ids).execute()
            instances_count = instances.count
        
        return {
            "wallet_address": wallet_address,
            "pet_count": len(pets),
            "datainstance_count": instances_count,
            "pets": pets
        }
    
    def create_complete_datainstance(
        self,
        pet_id: str,
        content: str,
        content_type: str,
        knowledge_list: List[Dict[str, str]] = None,
        image_urls: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Convenience method to create a DataInstance with all its relations at once.
        """
        datainstance = DataInstance(
            pet_id=pet_id,
            content=content,
            content_type=content_type,
            metadata=metadata or {}
        )
        
        instance_result = self.create_datainstance(datainstance)
        instance_id = instance_result["id"]
        
        if knowledge_list:
            self.bulk_add_knowledge(instance_id, knowledge_list)
        
        if image_urls:
            self.bulk_add_images(instance_id, image_urls)
        
        return self.get_datainstance_with_content(instance_id)
    
    def export_pet_data(self, pet_id: str) -> Dict[str, Any]:
        """
        Export complete pet data with all instances, knowledge, and images.
        """
        pet = self.get_pet(pet_id)
        if not pet:
            return None
        
        instances = self.get_pet_instances(pet_id, limit=1000)
        
        complete_instances = []
        for instance in instances:
            complete = self.get_datainstance_with_content(instance["id"])
            complete_instances.append(complete)
        
        pet["instances"] = complete_instances
        return pet


# Example usage for testing
if __name__ == "__main__":
    import os
    from datetime import datetime
    
    # You'll need to set these environment variables
    storage = Supabase(
        url=os.getenv("SUPABASE_URL", "https://your-project.supabase.co"),
        key=os.getenv("SUPABASE_KEY", "your-anon-key")
    )
    
    # Test with a sample pet ID (replace with actual pet ID)
    pet_id = "sample-pet-id"
    wallet_address = "sample-wallet-address"
    
    # Create a complete DataInstance with knowledge and images
    instance = storage.create_complete_datainstance(
        pet_id=pet_id,
        content="My pet learned about machine learning today from various sources...",
        content_type="text",
        knowledge_list=[
            {
                "url": "https://pytorch.org/tutorials/",
                "content": "PyTorch tutorial content...",
                "title": "PyTorch Tutorials"
            },
            {
                "url": "https://tensorflow.org/guide",
                "content": "TensorFlow guide content...",
                "title": "TensorFlow Guide"
            }
        ],
        image_urls=[
            "https://pytorch.org/assets/images/pytorch-logo.png",
            "https://tensorflow.org/images/tf-logo.png"
        ],
        metadata={"tags": ["ML", "learning"], "importance": "high"}
    )
    
    print(f"Created DataInstance with {len(instance['knowledge'])} knowledge items and {len(instance['images'])} images")
    
    # Search pet content
    search_results = storage.search_pet_content(pet_id, "machine learning")
    print(f"Found {len(search_results['datainstances'])} instances and {len(search_results['knowledge'])} knowledge items")
    
    # Export complete pet data
    export = storage.export_pet_data(pet_id)
    if export:
        print(f"Exported pet data with {len(export['instances'])} instances")
    
    # Get user statistics
    stats = storage.get_user_statistics(wallet_address)
    print(f"User statistics: {stats}")