"""
OpenAI client wrapper with mocking support.

Provides:
- call_chat_model(messages, model): Call OpenAI chat completion
- call_shapee(prompt): Call Shape-E for 3D generation
- Mock responses when USE_OPENAI=0 or USE_SHAPE_E=0

Environment:
- USE_OPENAI: Enable real OpenAI calls (default: 0)
- USE_SHAPE_E: Enable real Shape-E calls (default: 0)
- OPENAI_API_KEY: OpenAI API key
"""

import os
import time
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

USE_OPENAI = os.getenv("USE_OPENAI", "0") == "1"
USE_SHAPE_E = os.getenv("USE_SHAPE_E", "0") == "1"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

# Mock responses for development
MOCK_CHAT_RESPONSE = {
    "choices": [{
        "message": {
            "content": "This is a mock response. Set USE_OPENAI=1 and provide OPENAI_API_KEY for real calls."
        }
    }]
}

MOCK_SHAPEE_RESPONSE = {
    "status": "completed",
    "artifact_path": "/artifacts/glb/mock_model.glb",
    "metadata": {
        "prompt": "mock_prompt",
        "generated_at": "2024-01-01T00:00:00Z"
    }
}


def call_chat_model(messages: List[Dict[str, str]], model: str = "gpt-4") -> Dict[str, Any]:
    """Call OpenAI chat completion API.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        model: Model name (default: gpt-4)
        
    Returns:
        OpenAI API response or mock response
    """
    if not USE_OPENAI or not OPENAI_API_KEY:
        # Simulate API delay
        time.sleep(0.1)
        return MOCK_CHAT_RESPONSE.copy()
    
    try:
        import openai
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=1000,
            temperature=0.7
        )
        
        return {
            "choices": [{
                "message": {
                    "content": response.choices[0].message.content
                }
            }]
        }
    except Exception as e:
        # Fallback to mock on error
        return MOCK_CHAT_RESPONSE.copy()


def call_shapee(prompt: str, resolution: int = 64) -> Dict[str, Any]:
    """Call Shape-E for 3D model generation.
    
    Args:
        prompt: Text description of 3D model
        resolution: Voxel resolution (default: 64)
        
    Returns:
        Shape-E response or mock response
    """
    if not USE_SHAPE_E:
        # Simulate generation delay
        time.sleep(0.5)
        mock_response = MOCK_SHAPEE_RESPONSE.copy()
        mock_response["metadata"]["prompt"] = prompt
        mock_response["metadata"]["resolution"] = resolution
        return mock_response
    
    try:
        # Placeholder for actual Shape-E integration
        # This would call the Shape-E API or local service
        time.sleep(1.0)  # Simulate real generation time
        
        return {
            "status": "completed",
            "artifact_path": f"/artifacts/glb/shapee_{hash(prompt) % 10000}.glb",
            "metadata": {
                "prompt": prompt,
                "resolution": resolution,
                "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        }
    except Exception as e:
        # Fallback to mock on error
        mock_response = MOCK_SHAPEE_RESPONSE.copy()
        mock_response["metadata"]["prompt"] = prompt
        return mock_response


def is_openai_enabled() -> bool:
    """Check if OpenAI is enabled and configured."""
    return USE_OPENAI and bool(OPENAI_API_KEY)


def is_shapee_enabled() -> bool:
    """Check if Shape-E is enabled."""
    return USE_SHAPE_E
