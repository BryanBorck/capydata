from typing import List, Dict, Any, Optional
from supabase import create_client
import hashlib
from openai import OpenAI
import numpy as np
import json

from .schemas import DataInstance, Knowledge, Image
from src.scraper.notte import NotteScraper

class Supabase:
    def __init__(self, url: str, key: str, openai_api_key: str = None):
        """    
        -- Enable pgVector extension
        CREATE EXTENSION IF NOT EXISTS vector;
        
        CREATE TABLE IF NOT EXISTS public.datainstances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_hash TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Knowledge table (many-to-many with datainstances) with embeddings
        CREATE TABLE IF NOT EXISTS public.knowledge (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url TEXT,  -- Made optional, can be NULL for text-only knowledge
            content TEXT NOT NULL,
            title TEXT,
            content_hash TEXT NOT NULL,
            embeddings vector(1536),  -- OpenAI Ada-002 produces 1536-dimensional embeddings
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(url, content_hash)  -- Ensure uniqueness on URL+content_hash combination, allows NULL URLs
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
        
        -- Vector similarity search index for embeddings
        CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings ON public.knowledge USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);
        """
        self.client = create_client(url, key)
        self.scraper = NotteScraper()
        
        # Initialize OpenAI client with new 1.0.0+ API
        if openai_api_key:
            self.openai_client = OpenAI(api_key=openai_api_key)
            self.openai_enabled = True
        else:
            self.openai_client = None
            self.openai_enabled = False
    
    def _hash_content(self, content: str) -> str:
        """Generate hash of content for deduplication."""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()[:16]
    
    def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embeddings using OpenAI's text-embedding-ada-002 model."""
        if not self.openai_enabled or not self.openai_client:
            return None
        
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error generating embedding: {str(e)}")
            return None
    
    def _prepare_text_for_embedding(self, content: str, title: str = "", url: str = "") -> str:
        """Prepare text for embedding by combining title, content, and optionally URL."""
        parts = []
        if title:
            parts.append(f"Title: {title}")
        if content:
            parts.append(f"Content: {content}")
        if url:
            parts.append(f"Source: {url}")
        
        return "\n".join(parts)
    
    def _scrape_url_content(self, url: str, instruction: Optional[str] = None) -> Dict[str, str]:
        """Scrape content from URL using NotteScraper."""
        try:
            result = self.scraper.scrape(url=url, instruction=instruction)
            # Extract relevant content from scraper result
            if isinstance(result, dict) and 'data' in result:
                data = result['data']
                content = ""
                title = ""
                
                # Try to extract content and title from the scraped data
                if isinstance(data, dict):
                    # Look for common content fields
                    content = (data.get('content') or 
                             data.get('text') or 
                             data.get('body') or 
                             str(data))
                    title = (data.get('title') or 
                           data.get('heading') or 
                           data.get('name') or 
                           "")
                else:
                    content = str(data)
                
                return {
                    "content": content,
                    "title": title
                }
            else:
                return {
                    "content": str(result),
                    "title": ""
                }
        except Exception as e:
            # If scraping fails, return error info
            return {
                "content": f"Failed to scrape content: {str(e)}",
                "title": ""
            }
    
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
    
    def get_pet_knowledge(self, pet_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all knowledge items associated with a specific pet."""
        # First get all data instances for this pet
        instances = self.get_pet_instances(pet_id, limit=1000)  # Get all instances
        instance_ids = [inst["id"] for inst in instances]
        
        if not instance_ids:
            return []
        
        # Get all knowledge associated with these datainstances
        knowledge_result = self.client.table("datainstance_knowledge").select(
            "knowledge:knowledge_id(id, url, title, content, metadata, created_at, embeddings)"
        ).in_("datainstance_id", instance_ids).order(
            "knowledge(created_at)", desc=True
        ).limit(limit).execute()
        
        # Extract unique knowledge items (avoid duplicates)
        seen_knowledge_ids = set()
        unique_knowledge = []
        
        for item in knowledge_result.data:
            knowledge = item["knowledge"]
            if knowledge and knowledge["id"] not in seen_knowledge_ids:
                seen_knowledge_ids.add(knowledge["id"])
                unique_knowledge.append(knowledge)
        
        return unique_knowledge
    
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
        # Validate that we have either URL or content
        if not knowledge.url and (not knowledge.content or knowledge.content.strip() == ""):
            raise ValueError("Knowledge must have either a URL or content")
        
        # If content is not provided or empty, and we have a URL, scrape it
        if knowledge.url and (not knowledge.content or knowledge.content.strip() == ""):
            scraped = self._scrape_url_content(knowledge.url)
            knowledge.content = scraped["content"]
            # Use scraped title if no title was provided
            if not knowledge.title:
                knowledge.title = scraped["title"]
        
        # If we still don't have content, raise an error
        if not knowledge.content or knowledge.content.strip() == "":
            raise ValueError("Could not obtain content from URL or provided content")
        
        # Generate embeddings for the knowledge content
        embedding_text = self._prepare_text_for_embedding(
            content=knowledge.content,
            title=knowledge.title or "",
            url=str(knowledge.url) if knowledge.url else ""
        )
        embeddings = self._generate_embedding(embedding_text)
        
        knowledge_data = {
            "url": str(knowledge.url) if knowledge.url else None,
            "content": knowledge.content,
            "title": knowledge.title,
            "content_hash": self._hash_content(knowledge.content),
            "metadata": knowledge.metadata,
            "created_at": knowledge.created_at.isoformat()
        }
        
        # Add embeddings if available
        if embeddings:
            knowledge_data["embeddings"] = embeddings
        
        # Upsert knowledge (insert or update if URL+content_hash combination already exists)
        knowledge_result = self.client.table("knowledge").upsert(
            knowledge_data,
            on_conflict="url,content_hash"
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
            # Handle cases where URL and/or content might be provided
            url = k.get("url")
            content = k.get("content", "")
            title = k.get("title", "")
            
            # Skip entries that have neither URL nor content
            if not url and not content.strip():
                continue
                
            knowledge = Knowledge(
                url=url,
                content=content,
                title=title,
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
    
    def add_knowledge_from_urls(
        self,
        datainstance_id: str,
        urls: List[str],
        instruction: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Add knowledge to a DataInstance from a list of URLs (content will be scraped)."""
        results = []
        
        for url in urls:
            knowledge = Knowledge(
                url=url,
                content="",
                title="",  
                metadata={"scraped": True, "instruction": instruction} if instruction else {"scraped": True}
            )
            result = self.add_knowledge_to_instance(datainstance_id, knowledge)
            results.append(result)
        
        return results

    def semantic_search_knowledge(
        self,
        query: str,
        limit: int = 20,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search across all knowledge using embeddings.
        
        Args:
            query: Search query text
            limit: Maximum number of results to return
            similarity_threshold: Minimum similarity score (0-1)
        
        Returns:
            List of knowledge items with similarity scores
        """
        if not self.openai_enabled:
            raise ValueError("OpenAI is not enabled. Cannot perform semantic search.")
        
        # Generate embedding for the query
        query_embedding = self._generate_embedding(query)
        if not query_embedding:
            return []
        
        try:
            # Get all knowledge items (filter out null embeddings in Python)
            result = self.client.table("knowledge").select("*").execute()
            
            # Calculate similarities manually using numpy
            import numpy as np
            
            filtered_results = []
            query_vec = np.array(query_embedding)
            
            for item in result.data:
                # Skip items without embeddings
                if not item.get('embeddings') or item['embeddings'] is None:
                    continue
                    
                try:
                    # Handle different embedding formats (string vs list)
                    embeddings = item['embeddings']
                    if isinstance(embeddings, str):
                        # If it's a string, try to parse it as JSON
                        import json
                        try:
                            embeddings = json.loads(embeddings)
                        except json.JSONDecodeError:
                            print(f"Failed to parse embeddings as JSON for item {item.get('id')}")
                            continue
                    
                    # Convert to numpy array
                    item_vec = np.array(embeddings, dtype=np.float32)
                    query_vec_float = np.array(query_vec, dtype=np.float32)
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_vec_float, item_vec) / (np.linalg.norm(query_vec_float) * np.linalg.norm(item_vec))
                    
                    if similarity >= similarity_threshold:
                        item['similarity'] = float(similarity)
                        filtered_results.append(item)
                except Exception as e:
                    print(f"Error calculating similarity for item {item.get('id')}: {e}")
                    continue
            
            # Sort by similarity descending
            filtered_results.sort(key=lambda x: x['similarity'], reverse=True)
            
            return filtered_results[:limit]
            
        except Exception as e:
            print(f"Error in semantic search: {str(e)}")
            return []
    
    def semantic_search_pet_knowledge(
        self,
        pet_id: str,
        query: str,
        limit: int = 20,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search across a specific pet's knowledge.
        """
        if not self.openai_enabled:
            raise ValueError("OpenAI is not enabled. Cannot perform semantic search.")
        
        query_embedding = self._generate_embedding(query)
        if not query_embedding:
            return []
        
        # Get all datainstance IDs for this pet
        instances = self.get_pet_instances(pet_id, limit=1000)
        instance_ids = [inst["id"] for inst in instances]
        
        if not instance_ids:
            return []
        
        try:
            # First get knowledge IDs associated with this pet's instances
            knowledge_relations = self.client.table("datainstance_knowledge").select(
                "knowledge_id"
            ).in_("datainstance_id", instance_ids).execute()
            
            knowledge_ids = [rel["knowledge_id"] for rel in knowledge_relations.data]
            
            if not knowledge_ids:
                return []
            
            # Now search within those knowledge items using vector similarity
            result = self.client.table("knowledge").select(
                "*"
            ).in_(
                "id", knowledge_ids
            ).execute()
            
            import numpy as np
            
            filtered_results = []
            query_vec = np.array(query_embedding)
            
            for item in result.data:
                # Skip items without embeddings
                if not item.get('embeddings') or item['embeddings'] is None:
                    continue
                    
                try:
                    # Handle different embedding formats (string vs list)
                    embeddings = item['embeddings']
                    if isinstance(embeddings, str):
                        # If it's a string, try to parse it as JSON
                        try:
                            embeddings = json.loads(embeddings)
                        except json.JSONDecodeError:
                            print(f"Failed to parse embeddings as JSON for item {item.get('id')}")
                            continue
                    
                    # Convert to numpy array
                    item_vec = np.array(embeddings, dtype=np.float32)
                    query_vec_float = np.array(query_vec, dtype=np.float32)
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_vec_float, item_vec) / (np.linalg.norm(query_vec_float) * np.linalg.norm(item_vec))
                    
                    if similarity >= similarity_threshold:
                        item['similarity'] = float(similarity)
                        filtered_results.append(item)
                except Exception as e:
                    print(f"Error calculating similarity for item {item.get('id')}: {e}")
                    continue
            
            # Sort by similarity descending
            filtered_results.sort(key=lambda x: x['similarity'], reverse=True)
            
            return filtered_results[:limit]
            
        except Exception as e:
            print(f"Error in pet semantic search: {str(e)}")
            return []
    
    def semantic_search_user_knowledge(
        self,
        wallet_address: str,
        query: str,
        limit: int = 20,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic search across all knowledge for a user's pets.
        """
        if not self.openai_enabled:
            raise ValueError("OpenAI is not enabled. Cannot perform semantic search.")
        
        # Get all user's pets
        pets = self.get_user_pets(wallet_address)
        pet_ids = [pet["id"] for pet in pets]
        
        if not pet_ids:
            return []
        
        query_embedding = self._generate_embedding(query)
        if not query_embedding:
            return []
        
        # Get all datainstance IDs for all user's pets
        all_instance_ids = []
        for pet_id in pet_ids:
            instances = self.get_pet_instances(pet_id, limit=1000)
            all_instance_ids.extend([inst["id"] for inst in instances])
        
        if not all_instance_ids:
            return []
        
        try:
            # Get knowledge IDs associated with user's instances
            knowledge_relations = self.client.table("datainstance_knowledge").select(
                "knowledge_id"
            ).in_("datainstance_id", all_instance_ids).execute()
            
            knowledge_ids = [rel["knowledge_id"] for rel in knowledge_relations.data]
            
            if not knowledge_ids:
                return []
            
            # Search within those knowledge items
            result = self.client.table("knowledge").select(
                "*"
            ).in_(
                "id", knowledge_ids
            ).execute()
            
            import numpy as np
            
            filtered_results = []
            query_vec = np.array(query_embedding)
            
            for item in result.data:
                # Skip items without embeddings
                if not item.get('embeddings') or item['embeddings'] is None:
                    continue
                    
                try:
                    # Handle different embedding formats (string vs list)
                    embeddings = item['embeddings']
                    if isinstance(embeddings, str):
                        # If it's a string, try to parse it as JSON
                        try:
                            embeddings = json.loads(embeddings)
                        except json.JSONDecodeError:
                            print(f"Failed to parse embeddings as JSON for item {item.get('id')}")
                            continue
                    
                    # Convert to numpy array
                    item_vec = np.array(embeddings, dtype=np.float32)
                    query_vec_float = np.array(query_vec, dtype=np.float32)
                    
                    # Calculate cosine similarity
                    similarity = np.dot(query_vec_float, item_vec) / (np.linalg.norm(query_vec_float) * np.linalg.norm(item_vec))
                    
                    if similarity >= similarity_threshold:
                        item['similarity'] = float(similarity)
                        filtered_results.append(item)
                except Exception as e:
                    print(f"Error calculating similarity for item {item.get('id')}: {e}")
                    continue
            
            # Sort by similarity descending
            filtered_results.sort(key=lambda x: x['similarity'], reverse=True)
            
            return filtered_results[:limit]
            
        except Exception as e:
            print(f"Error in user semantic search: {str(e)}")
            return []


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
                # content will be automatically scraped
            },
            {
                "url": "https://tensorflow.org/guide",
                "content": "TensorFlow guide content...",  # provided content (won't be scraped)
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
    
    # Add knowledge from URLs only (content will be scraped)
    additional_knowledge = storage.add_knowledge_from_urls(
        datainstance_id=instance["id"],
        urls=[
            "https://scikit-learn.org/stable/",
            "https://keras.io/"
        ],
        instruction="Extract the main content and title from this machine learning documentation"
    )
    
    print(f"Added {len(additional_knowledge)} additional knowledge items from URLs")
    
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