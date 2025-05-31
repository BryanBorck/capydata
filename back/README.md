# Datagotchi Backend - Pet Data Storage System

A FastAPI backend service for managing pet data, knowledge, and images for the Datagotchi project.

## 🚀 Features

- **Pet-Based Data Storage**: Store and manage data instances linked to specific pets
- **Knowledge Management**: Associate web content and URLs with pet data
- **Image Storage**: Link images to pet data instances
- **Full-Text Search**: Search across pet content and knowledge base
- **User Statistics**: Get comprehensive stats for users and their pets
- **Data Export**: Export complete pet data with all associations

## 📋 Prerequisites

- Python 3.8+
- Poetry (for dependency management)
- Supabase account and project
- PostgreSQL database (via Supabase)

## 🔧 Setup

1. **Clone and navigate to backend**:
   ```bash
   cd back
   ```

2. **Install dependencies**:
   ```bash
   poetry install
   ```

3. **Configure environment**:
   ```bash
   ./setup_env.sh
   ```

4. **Edit `.env` file** with your actual values:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key_here
   NOTTE_API_KEY=your_notte_api_key_here  # Optional
   ```

5. **Apply database migration**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the migration in `client/supabase/migrations/20240101000003_add_data_structures.sql`

## 🏃‍♂️ Running the API

```bash
poetry run uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Set your environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your_supabase_anon_key"

# Run all tests
./test_endpoints.sh
```

The test script includes 8 comprehensive tests:
1. Get user pets
2. Create complete data instance with knowledge and images
3. Get pet data instances
4. Search pet content
5. Search all user content
6. Get user statistics
7. Export pet data
8. Add individual knowledge and images

## 📚 API Endpoints

### Pet Management
- `GET /api/v1/storage/users/{wallet_address}/pets` - List user's pets
- `GET /api/v1/storage/pets/{pet_id}` - Get specific pet
- `GET /api/v1/storage/pets/{pet_id}/export` - Export complete pet data

### Data Instance Management
- `POST /api/v1/storage/pets/{pet_id}/instances` - Create data instance for pet
- `GET /api/v1/storage/pets/{pet_id}/instances` - List pet's data instances
- `GET /api/v1/storage/datainstances/{datainstance_id}` - Get data instance with content

### Knowledge & Image Management
- `POST /api/v1/storage/datainstances/{datainstance_id}/knowledge` - Add knowledge to instance
- `POST /api/v1/storage/datainstances/{datainstance_id}/images` - Add images to instance

### Search & Analytics
- `GET /api/v1/storage/pets/{pet_id}/search?q=query` - Search pet content
- `GET /api/v1/storage/users/{wallet_address}/search?q=query` - Search all user content
- `GET /api/v1/storage/users/{wallet_address}/statistics` - Get user statistics

## 🗄️ Database Schema

The system uses the following main tables:

- **pets**: Core pet data (linked to wallet addresses)
- **datainstances**: Content storage linked to pets
- **knowledge**: URL-based knowledge storage
- **images**: Image metadata and URLs
- **datainstance_knowledge**: Many-to-many relationship
- **datainstance_images**: Many-to-many relationship

## 📝 Data Models

### Creating a Data Instance with Knowledge and Images

```python
{
    "content": "My pet learned about machine learning...",
    "content_type": "text",
    "metadata": {"tags": ["ml", "ai"], "difficulty": "intermediate"},
    "knowledge_list": [
        {
            "url": "https://pytorch.org/tutorials/",
            "content": "PyTorch tutorial content...",
            "title": "PyTorch Basics"
        }
    ],
    "image_urls": [
        "https://pytorch.org/assets/images/pytorch-logo.png"
    ]
}
```

### Search Results Format

```python
{
    "datainstances": [
        {
            "id": "uuid",
            "content": "content text...",
            "content_type": "text",
            "metadata": {},
            "created_at": "2024-01-01T00:00:00Z"
        }
    ],
    "knowledge": [
        {
            "id": "uuid",
            "url": "https://example.com",
            "title": "Page Title",
            "content": "page content...",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

## 🔍 Example Usage

### Python Client Example

```python
from src.services.storage.supabase import Supabase

# Initialize client
storage = Supabase(supabase_url, supabase_key)

# Get user's pets
pets = storage.get_user_pets("0x1234...")

# Create data instance with knowledge
instance = storage.create_complete_datainstance(
    pet_id=pets[0]["id"],
    content="Learning session about Python",
    content_type="text",
    knowledge_list=[{
        "url": "https://python.org",
        "content": "Python programming language...",
        "title": "Python.org"
    }],
    image_urls=["https://python.org/logo.png"]
)

# Search pet content
results = storage.search_pet_content(pets[0]["id"], "python")
```

### cURL Examples

```bash
# Get user pets
curl "http://localhost:8000/api/v1/storage/users/0x1234.../pets"

# Search pet content
curl "http://localhost:8000/api/v1/storage/pets/{pet_id}/search?q=machine%20learning"

# Get user statistics
curl "http://localhost:8000/api/v1/storage/users/0x1234.../statistics"
```

## 🏗️ Architecture

The system follows a clean architecture pattern:

- **FastAPI Routes** (`src/routes/storage.py`): API endpoint definitions
- **Storage Service** (`src/services/storage/supabase.py`): Business logic and database operations
- **Data Schemas** (`src/services/storage/schemas.py`): Pydantic models for data validation
- **Configuration** (`src/config.py`): Environment-based settings management

## 🔧 Development

### Adding New Endpoints

1. Add the endpoint to `src/routes/storage.py`
2. Implement the logic in `src/services/storage/supabase.py`
3. Add tests to `test_endpoints.sh`
4. Update this README

### Database Migrations

New migrations should be added to `client/supabase/migrations/` and applied via the Supabase dashboard.

## 🐛 Troubleshooting

### Common Issues

1. **"SUPABASE_URL and SUPABASE_KEY environment variables must be set"**
   - Make sure your `.env` file has the correct values
   - Verify environment variables are exported: `echo $SUPABASE_URL`

2. **"No pets found"**
   - Create pets in your database first
   - Verify the wallet address matches your test data

3. **Database connection errors**
   - Check your Supabase project is active
   - Verify the URL and key are correct
   - Ensure database migrations have been applied

### Debug Mode

Set `DEBUG=true` in your `.env` file for detailed error messages.

## 📄 License

This project is part of the Datagotchi ecosystem.
