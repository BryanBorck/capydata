from typing import List, Dict, Any, Optional
from supabase import create_client
import hashlib

from .schemas import DataPack, DataInstance, Knowledge, Image

class Supabase:
    def __init__(self, url: str, key: str):
        """    
        CREATE TABLE IF NOT EXISTS datapacks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id, name)
        );
        
        -- DataInstances table
        CREATE TABLE IF NOT EXISTS datainstances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            datapack_id UUID NOT NULL REFERENCES datapacks(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Knowledge table (many-to-many with datainstances)
        CREATE TABLE IF NOT EXISTS knowledge (
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
        CREATE TABLE IF NOT EXISTS images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            image_url TEXT NOT NULL,
            alt_text TEXT,
            url_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(image_url)
        );
        
        -- Junction table for DataInstance ↔ Knowledge relationship
        CREATE TABLE IF NOT EXISTS datainstance_knowledge (
            datainstance_id UUID NOT NULL REFERENCES datainstances(id) ON DELETE CASCADE,
            knowledge_id UUID NOT NULL REFERENCES knowledge(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (datainstance_id, knowledge_id)
        );
        
        -- Junction table for DataInstance ↔ Image relationship
        CREATE TABLE IF NOT EXISTS datainstance_images (
            datainstance_id UUID NOT NULL REFERENCES datainstances(id) ON DELETE CASCADE,
            image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (datainstance_id, image_id)
        );
        
        -- Indexes for performance
        CREATE INDEX idx_datapacks_user_id ON datapacks(user_id);
        CREATE INDEX idx_datainstances_datapack_id ON datainstances(datapack_id);
        CREATE INDEX idx_datainstance_knowledge_datainstance ON datainstance_knowledge(datainstance_id);
        CREATE INDEX idx_datainstance_images_datainstance ON datainstance_images(datainstance_id);
        CREATE INDEX idx_knowledge_url ON knowledge(url);
        CREATE INDEX idx_images_url ON images(image_url);
        
        -- Full text search indexes
        CREATE INDEX idx_datainstances_content_fts ON datainstances USING gin(to_tsvector('english', content));
        CREATE INDEX idx_knowledge_content_fts ON knowledge USING gin(to_tsvector('english', content));
        
        -- Updated_at trigger for datapacks
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_datapacks_updated_at BEFORE UPDATE
        ON datapacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        """
        self.client = create_client(url, key)
    
    def _hash_content(self, content: str) -> str:
        """Generate hash of content for deduplication."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    def create_datapack(self, datapack: DataPack) -> Dict[str, Any]:
        """Create a new DataPack for a user."""
        data = {
            "user_id": datapack.user_id,
            "name": datapack.name,
            "description": datapack.description,
            "metadata": datapack.metadata,
            "created_at": datapack.created_at.isoformat(),
            "updated_at": datapack.updated_at.isoformat()
        }
        
        result = self.client.table("datapacks").upsert(
            data,
            on_conflict="user_id,name"
        ).execute()
        
        return result.data[0]
    
    def get_user_datapacks(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all DataPacks for a user."""
        result = self.client.table("datapacks").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        
        return result.data
    
    def get_datapack(self, datapack_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific DataPack by ID."""
        result = self.client.table("datapacks").select("*").eq(
            "id", datapack_id
        ).execute()
        
        return result.data[0] if result.data else None
    
    def delete_datapack(self, datapack_id: str) -> bool:
        """Delete a DataPack and all its associated data."""
        result = self.client.table("datapacks").delete().eq(
            "id", datapack_id
        ).execute()
        
        return len(result.data) > 0
    
    def create_datainstance(self, datainstance: DataInstance) -> Dict[str, Any]:
        """Create a new DataInstance within a DataPack."""
        data = {
            "datapack_id": datainstance.datapack_id,
            "content": datainstance.content,
            "content_type": datainstance.content_type,
            "content_hash": self._hash_content(datainstance.content),
            "metadata": datainstance.metadata,
            "created_at": datainstance.created_at.isoformat()
        }
        
        result = self.client.table("datainstances").insert(data).execute()
        return result.data[0]
    
    def get_datapack_instances(
        self, 
        datapack_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get all DataInstances for a DataPack."""
        result = self.client.table("datainstances").select("*").eq(
            "datapack_id", datapack_id
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
        
        knowledge_result = self.client.table("datainstance_knowledge").select(
            "knowledge:knowledge_id(id, url, title, content, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        images_result = self.client.table("datainstance_images").select(
            "images:image_id(id, image_url, alt_text, metadata, created_at)"
        ).eq("datainstance_id", datainstance_id).execute()
        
        datainstance["knowledge"] = [item["knowledge"] for item in knowledge_result.data]
        datainstance["images"] = [item["images"] for item in images_result.data]
        
        return datainstance
    
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
        
        knowledge_result = self.client.table("knowledge").upsert(
            knowledge_data,
            on_conflict="url"
        ).execute()
        
        knowledge_id = knowledge_result.data[0]["id"]
        
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
                datainstance_id=datainstance_id,
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
        
        image_result = self.client.table("images").upsert(
            image_data,
            on_conflict="image_url"
        ).execute()
        
        image_id = image_result.data[0]["id"]
        
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
                datainstance_id=datainstance_id,
                image_url=url
            )
            result = self.add_image_to_instance(datainstance_id, image)
            results.append(result)
        
        return results
    
    def search_user_content(
        self,
        user_id: str,
        search_query: str,
        limit: int = 20
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Search across all user's content (DataInstances and Knowledge).
        
        Returns results grouped by type.
        """
        # Get user's datapacks first
        datapacks = self.client.table("datapacks").select("id").eq(
            "user_id", user_id
        ).execute()
        
        datapack_ids = [dp["id"] for dp in datapacks.data]
        
        # Search in DataInstances
        instances_result = self.client.table("datainstances").select("*").in_(
            "datapack_id", datapack_ids
        ).text_search(
            "content", search_query
        ).limit(limit).execute()
        
        # Search in Knowledge (that belongs to user's datainstances)
        # This is a complex query that would need a custom RPC function in Supabase
        # For now, we'll search all knowledge and filter
        knowledge_result = self.client.table("knowledge").select("*").text_search(
            "content", search_query
        ).limit(limit).execute()
        
        return {
            "datainstances": instances_result.data,
            "knowledge": knowledge_result.data
        }
        
    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive statistics for a user."""
        datapacks = self.client.table("datapacks").select(
            "id", count="exact"
        ).eq("user_id", user_id).execute()
        
        datapack_data = self.client.table("datapacks").select("id").eq(
            "user_id", user_id
        ).execute()
        datapack_ids = [dp["id"] for dp in datapack_data.data]
        
        instances_count = 0
        if datapack_ids:
            instances = self.client.table("datainstances").select(
                "id", count="exact"
            ).in_("datapack_id", datapack_ids).execute()
            instances_count = instances.count
        
        return {
            "user_id": user_id,
            "datapack_count": datapacks.count,
            "datainstance_count": instances_count,
            "total_datapacks": datapacks.count
        }
    
    def create_complete_datainstance(
        self,
        datapack_id: str,
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
            datapack_id=datapack_id,
            content=content,
            content_type=content_type,
            metadata=metadata
        )
        
        instance_result = self.create_datainstance(datainstance)
        instance_id = instance_result["id"]
        
        if knowledge_list:
            self.bulk_add_knowledge(instance_id, knowledge_list)
        
        if image_urls:
            self.bulk_add_images(instance_id, image_urls)
        
        return self.get_datainstance_with_content(instance_id)
    
    def export_datapack(self, datapack_id: str) -> Dict[str, Any]:
        """
        Export a complete DataPack with all instances, knowledge, and images.
        """
        datapack = self.get_datapack(datapack_id)
        if not datapack:
            return None
        
        instances = self.get_datapack_instances(datapack_id, limit=1000)
        
        complete_instances = []
        for instance in instances:
            complete = self.get_datainstance_with_content(instance["id"])
            complete_instances.append(complete)
        
        datapack["instances"] = complete_instances
        return datapack


# Example usage
if __name__ == "__main__":
    storage = Supabase(
        url="https://your-project.supabase.co",
        key="your-anon-key"
    )
    
    # Create a DataPack
    datapack = DataPack(
        user_id="user_123",
        name="Research Papers 2024",
        description="Collection of AI research papers",
        metadata={"category": "research", "year": 2024}
    )
    
    pack_result = storage.create_datapack(datapack)
    datapack_id = pack_result["id"]
    print(f"Created DataPack: {datapack_id}")
    
    # Create a complete DataInstance with knowledge and images
    instance = storage.create_complete_datainstance(
        datapack_id=datapack_id,
        content="This paper explores the intersection of AI and robotics...",
        content_type="text",
        knowledge_list=[
            {
                "url": "https://arxiv.org/paper1",
                "content": "Full paper content here...",
                "title": "AI Robotics Paper"
            },
            {
                "url": "https://blog.openai.com/robotics",
                "content": "Blog post about robotics...",
                "title": "OpenAI Robotics"
            }
        ],
        image_urls=[
            "https://example.com/figure1.png",
            "https://example.com/diagram.jpg"
        ],
        metadata={"tags": ["AI", "robotics"], "importance": "high"}
    )
    
    print(f"Created DataInstance with {len(instance['knowledge'])} knowledge items and {len(instance['images'])} images")
    
    # Search user content
    search_results = storage.search_user_content("user_123", "robotics")
    print(f"Found {len(search_results['datainstances'])} instances and {len(search_results['knowledge'])} knowledge items")
    
    # Export complete datapack
    export = storage.export_datapack(datapack_id)
    print(f"Exported DataPack with {len(export['instances'])} instances")
    
    # Get user statistics
    stats = storage.get_user_statistics("user_123")
    print(f"User statistics: {stats}")