#!/usr/bin/env python3
"""
Script to create mock data for testing the Datagotchi Pet Data API
"""
import os
import sys
import json
from datetime import datetime
from dotenv import load_dotenv
# Add src to path
sys.path.append('src')

from src.services.storage.supabase import Supabase

load_dotenv()

def create_mock_data():
    """Create comprehensive mock data for testing."""
    
    # Get Supabase connection
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("❌ SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        return None
    
    storage = Supabase(url, key)
    
    # Test wallet address
    wallet_address = "0x6b84bba6e67a124093933aba8f5b6beb96307d99"
    
    print(f"🚀 Creating mock data for wallet: {wallet_address}")
    
    # First, let's create a profile if it doesn't exist
    try:
        profile_data = {
            "wallet_address": wallet_address,
            "username": "TestUser",
            "created_at": datetime.now().isoformat()
        }
        storage.client.table("profiles").upsert(profile_data, on_conflict="wallet_address").execute()
        print("✅ Created/updated profile")
    except Exception as e:
        print(f"⚠️  Profile creation failed (might already exist): {e}")
    
    # Create mock pets
    pets_data = [
        {
            "owner_wallet": wallet_address,
            "name": "CodeBuddy",
            "rarity": "epic",
            "health": 85,
            "strength": 70,
            "social": 90
        },
        {
            "owner_wallet": wallet_address,
            "name": "DataDragon",
            "rarity": "legendary",
            "health": 95,
            "strength": 88,
            "social": 75
        },
        {
            "owner_wallet": wallet_address,
            "name": "AlgoAnimal",
            "rarity": "rare",
            "health": 70,
            "strength": 85,
            "social": 65
        }
    ]
    
    created_pets = []
    for pet_data in pets_data:
        try:
            result = storage.client.table("pets").insert(pet_data).execute()
            pet = result.data[0]
            created_pets.append(pet)
            print(f"✅ Created pet '{pet['name']}' with ID: {pet['id']}")
        except Exception as e:
            print(f"❌ Failed to create pet {pet_data['name']}: {e}")
    
    if not created_pets:
        print("❌ No pets created, stopping mock data creation")
        return None
    
    # Create comprehensive data instances with knowledge and images
    mock_instances = [
        {
            "pet": created_pets[0],  # CodeBuddy
            "content": "CodeBuddy learned advanced Python programming techniques today, focusing on async/await patterns, decorators, and metaclasses. The session covered practical applications in web development and data processing.",
            "content_type": "learning_session",
            "metadata": {
                "tags": ["python", "programming", "async", "web-dev"],
                "difficulty": "advanced",
                "duration_minutes": 120,
                "session_type": "hands-on_coding"
            },
            "knowledge": [
                {
                    "url": "https://docs.python.org/3/library/asyncio.html",
                    "content": "asyncio is a library to write concurrent code using the async/await syntax. It provides high-level APIs for running Python coroutines concurrently and managing event loops.",
                    "title": "Python Asyncio Documentation"
                },
                {
                    "url": "https://realpython.com/python-decorators/",
                    "content": "Decorators provide a simple syntax for calling higher-order functions. They are very powerful and useful tool in Python since it allows programmers to modify the behavior of function or class.",
                    "title": "Python Decorators - Real Python"
                },
                {
                    "url": "https://fastapi.tiangolo.com/async/",
                    "content": "FastAPI has support for async/await syntax for path operation functions. When you declare a path operation function with async def, FastAPI will know to await it.",
                    "title": "FastAPI Async Support"
                }
            ],
            "images": [
                "https://docs.python.org/3/_static/py.svg",
                "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png",
                "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/200px-Python-logo-notext.svg.png"
            ]
        },
        {
            "pet": created_pets[1],  # DataDragon
            "content": "DataDragon explored machine learning fundamentals and neural network architectures. The study session included hands-on work with PyTorch, TensorFlow, and understanding backpropagation algorithms.",
            "content_type": "ai_learning",
            "metadata": {
                "tags": ["machine-learning", "neural-networks", "pytorch", "tensorflow"],
                "difficulty": "intermediate",
                "duration_minutes": 180,
                "session_type": "theory_and_practice"
            },
            "knowledge": [
                {
                    "url": "https://pytorch.org/tutorials/beginner/basics/intro.html",
                    "content": "PyTorch is an optimized tensor library for deep learning using GPUs and CPUs. Learn the basics of tensors, autograd, and building neural networks.",
                    "title": "PyTorch Basics Tutorial"
                },
                {
                    "url": "https://www.tensorflow.org/guide/keras",
                    "content": "Keras is TensorFlow's high-level API for building and training deep learning models. It's user-friendly, modular, and composable.",
                    "title": "TensorFlow Keras Guide"
                },
                {
                    "url": "https://towardsdatascience.com/understanding-backpropagation-algorithm-7bb3aa2f95fd",
                    "content": "Backpropagation is the central mechanism by which neural networks learn. It efficiently computes gradients of the loss function with respect to network parameters.",
                    "title": "Understanding Backpropagation Algorithm"
                }
            ],
            "images": [
                "https://pytorch.org/assets/images/pytorch-logo.png",
                "https://www.tensorflow.org/images/tf_logo_social.png",
                "https://miro.medium.com/max/1200/1*SJPacPhP4KDEB1AdhyFiWA.png"
            ]
        },
        {
            "pet": created_pets[2],  # AlgoAnimal
            "content": "AlgoAnimal mastered data structures and algorithms, with deep dives into graph theory, dynamic programming, and sorting algorithms. Applied these concepts to solve complex computational problems.",
            "content_type": "algorithm_study",
            "metadata": {
                "tags": ["algorithms", "data-structures", "graphs", "dynamic-programming"],
                "difficulty": "advanced",
                "duration_minutes": 150,
                "session_type": "problem_solving"
            },
            "knowledge": [
                {
                    "url": "https://en.wikipedia.org/wiki/Graph_theory",
                    "content": "Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects. Applications include network analysis, shortest path algorithms, and more.",
                    "title": "Graph Theory - Wikipedia"
                },
                {
                    "url": "https://www.geeksforgeeks.org/dynamic-programming/",
                    "content": "Dynamic Programming is mainly an optimization over plain recursion. It stores the results of subproblems to avoid computing the same results again.",
                    "title": "Dynamic Programming - GeeksforGeeks"
                },
                {
                    "url": "https://visualgo.net/en/sorting",
                    "content": "Sorting algorithms visualization helps understand how different sorting techniques work. Compare time complexities and see algorithms in action.",
                    "title": "Sorting Algorithms Visualization"
                }
            ],
            "images": [
                "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/6n-graf.svg/200px-6n-graf.svg.png",
                "https://cdn.programiz.com/sites/tutorial2program/files/dynamic-programming.png",
                "https://visualgo.net/img/png/sorting.png"
            ]
        },
        {
            "pet": created_pets[0],  # CodeBuddy - second session
            "content": "CodeBuddy explored web scraping and API development, building robust data collection pipelines and RESTful services. Learned about rate limiting, authentication, and data validation.",
            "content_type": "web_development",
            "metadata": {
                "tags": ["web-scraping", "api", "rest", "data-pipeline"],
                "difficulty": "intermediate",
                "duration_minutes": 90,
                "session_type": "project_based"
            },
            "knowledge": [
                {
                    "url": "https://requests.readthedocs.io/en/latest/",
                    "content": "Requests is an elegant and simple HTTP library for Python, built for human beings. It allows you to send HTTP requests extremely easily.",
                    "title": "Python Requests Documentation"
                },
                {
                    "url": "https://fastapi.tiangolo.com/",
                    "content": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+ based on standard Python type hints.",
                    "title": "FastAPI Framework"
                }
            ],
            "images": [
                "https://requests.readthedocs.io/en/latest/_static/requests-sidebar.png",
                "https://fastapi.tiangolo.com/img/logo-margin/logo-teal.png"
            ]
        }
    ]
    
    created_instances = []
    
    for i, instance_data in enumerate(mock_instances):
        try:
            print(f"\n📚 Creating instance {i+1} for {instance_data['pet']['name']}")
            
            # Create the complete data instance
            result = storage.create_complete_datainstance(
                pet_id=instance_data["pet"]["id"],
                content=instance_data["content"],
                content_type=instance_data["content_type"],
                knowledge_list=instance_data["knowledge"],
                image_urls=instance_data["images"],
                metadata=instance_data["metadata"]
            )
            
            created_instances.append(result)
            print(f"✅ Created data instance with ID: {result['id']}")
            print(f"   - Knowledge items: {len(result['knowledge'])}")
            print(f"   - Images: {len(result['images'])}")
            
        except Exception as e:
            print(f"❌ Failed to create instance {i+1}: {e}")
    
    # Create some individual knowledge and images for testing
    print(f"\n🔗 Adding additional knowledge and images...")
    
    if created_instances:
        try:
            # Add extra knowledge to first instance
            first_instance_id = created_instances[0]["id"]
            
            extra_knowledge = [
                {
                    "url": "https://peps.python.org/pep-8/",
                    "content": "PEP 8 is the de-facto code style guide for Python. It provides coding conventions for the Python code comprising the standard library.",
                    "title": "PEP 8 – Style Guide for Python Code"
                }
            ]
            
            storage.bulk_add_knowledge(first_instance_id, extra_knowledge)
            
            # Add extra images
            extra_images = [
                "https://peps.python.org/pep-0008/",
                "https://www.python.org/static/img/python-logo.png"
            ]
            
            storage.bulk_add_images(first_instance_id, extra_images)
            print("✅ Added extra knowledge and images")
            
        except Exception as e:
            print(f"⚠️  Failed to add extra content: {e}")
    
    # Summary
    print(f"\n🎉 Mock data creation completed!")
    print(f"Created:")
    print(f"  - {len(created_pets)} pets")
    print(f"  - {len(created_instances)} data instances")
    
    # Export IDs for test script
    test_ids = {
        "wallet_address": wallet_address,
        "pets": [{"id": pet["id"], "name": pet["name"]} for pet in created_pets],
        "instances": [{"id": inst["id"], "pet_name": next(p["name"] for p in created_pets if p["id"] == inst["pet_id"])} for inst in created_instances]
    }
    
    # Save IDs to file for test script
    with open("test_ids.json", "w") as f:
        json.dump(test_ids, f, indent=2)
    
    print(f"\n📋 Test IDs saved to test_ids.json")
    print(f"Sample pet ID: {created_pets[0]['id']}")
    print(f"Sample instance ID: {created_instances[0]['id'] if created_instances else 'None'}")
    
    return test_ids

if __name__ == "__main__":
    create_mock_data() 