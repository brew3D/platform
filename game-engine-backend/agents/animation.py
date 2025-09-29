"""
Animation Agent for timeline and keyframe generation.

Responsibilities:
- Create animation timelines with keyframes
- Generate cutscene compositions
- Produce exportable animation metadata
- Apply animations to scene entities

API:
- generate_animation_from_model(model_ref, animation_prompt) -> animation_data
- apply_animation_to_scene(scene, animation) -> modified_scene
- create_walk_cycle(entity_type) -> walk_animation
- create_idle_animation(entity_type) -> idle_animation

Environment:
- USE_OPENAI: Enable OpenAI for complex animations (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import json
import math
import os
from typing import Any, Dict, List, Optional

from .. import jobs
from ..utils.openai_client import call_chat_model
from ..utils.validators import validate_animation_data, sanitize_string


def generate_animation_from_model(model_ref: Dict[str, Any], animation_prompt: str) -> Dict[str, Any]:
    """Generate animation from model reference and prompt.
    
    Args:
        model_ref: Model or scene reference
        animation_prompt: Description of desired animation
        
    Returns:
        Animation data with keyframes and metadata
    """
    clean_prompt = sanitize_string(animation_prompt, max_length=200)
    
    # Check if we should use OpenAI
    use_openai = (os.getenv("USE_OPENAI", "0") == "1" and 
                  os.getenv("USE_MOCKS", "1") != "1")
    
    if use_openai:
        return _generate_with_openai(model_ref, clean_prompt)
    else:
        return _generate_mock_animation(model_ref, clean_prompt)


def _generate_with_openai(model_ref: Dict[str, Any], prompt: str) -> Dict[str, Any]:
    """Generate animation using OpenAI."""
    system_prompt = (
        "You are an animation generator. Create keyframe data for 3D animations.\n"
        "Output JSON with this structure:\n"
        "{\n"
        '  "keyframes": [{"time": 0.0, "property": "position", "target": "entity_id", "value": [x,y,z], "easing": "linear"}],\n'
        '  "duration": 2.0,\n'
        '  "target": "entity_id",\n'
        '  "loop": true,\n'
        '  "metadata": {"name": "string", "type": "string"}\n'
        "}\n"
        "Create smooth, realistic animations with appropriate easing."
    )
    
    user_prompt = (
        f"Model: {json.dumps(model_ref, indent=2)}\n"
        f"Animation prompt: {prompt}\n"
        "Generate keyframe data for this animation."
    )
    
    try:
        response = call_chat_model([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        content = response["choices"][0]["message"]["content"]
        
        # Extract JSON from response
        start = content.find("{")
        end = content.rfind("}")
        
        if start >= 0 and end > start:
            animation_data = json.loads(content[start:end+1])
            
            # Validate animation
            is_valid, error = validate_animation_data(animation_data)
            if is_valid:
                return animation_data
            else:
                print(f"OpenAI generated invalid animation: {error}")
    except Exception as e:
        print(f"OpenAI generation failed: {e}")
    
    # Fallback to mock
    return _generate_mock_animation(model_ref, prompt)


def _generate_mock_animation(model_ref: Dict[str, Any], prompt: str) -> Dict[str, Any]:
    """Generate mock animation based on prompt keywords."""
    prompt_lower = prompt.lower()
    
    # Determine animation type from prompt
    if "walk" in prompt_lower or "run" in prompt_lower:
        return create_walk_cycle("character")
    elif "idle" in prompt_lower or "stand" in prompt_lower:
        return create_idle_animation("character")
    elif "jump" in prompt_lower:
        return create_jump_animation("character")
    elif "fly" in prompt_lower or "hover" in prompt_lower:
        return create_flying_animation("character")
    elif "rotate" in prompt_lower or "spin" in prompt_lower:
        return create_rotation_animation("character")
    else:
        # Default to a simple movement animation
        return create_simple_movement_animation("character")


def create_walk_cycle(entity_type: str) -> Dict[str, Any]:
    """Create a walk cycle animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Walk cycle animation data
    """
    keyframes = []
    duration = 2.0  # 2 seconds for full cycle
    steps = 8  # Number of keyframes
    
    for i in range(steps + 1):
        time = (i / steps) * duration
        
        # Forward movement
        x = (i / steps) * 4.0  # Move 4 units forward
        
        # Vertical bounce (walking rhythm)
        y = 0.1 * math.sin(i * math.pi / 4) if i > 0 and i < steps else 0
        
        # Leg swing (rotation)
        rotation_y = 5 * math.sin(i * math.pi / 2)  # Slight rotation
        
        keyframes.extend([
            {
                "time": time,
                "property": "position",
                "target": entity_type,
                "value": [x, y, 0],
                "easing": "linear"
            },
            {
                "time": time,
                "property": "rotation",
                "target": entity_type,
                "value": [0, rotation_y, 0],
                "easing": "ease-in-out"
            }
        ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": True,
        "metadata": {
            "name": "Walk Cycle",
            "type": "movement",
            "description": "Standard walking animation"
        }
    }


def create_idle_animation(entity_type: str) -> Dict[str, Any]:
    """Create an idle animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Idle animation data
    """
    keyframes = []
    duration = 3.0  # 3 seconds for idle cycle
    steps = 12  # Number of keyframes
    
    for i in range(steps + 1):
        time = (i / steps) * duration
        
        # Gentle breathing motion
        y = 0.05 * math.sin(i * math.pi / 6)
        
        # Slight sway
        rotation_z = 1 * math.sin(i * math.pi / 8)
        
        keyframes.extend([
            {
                "time": time,
                "property": "position",
                "target": entity_type,
                "value": [0, y, 0],
                "easing": "ease-in-out"
            },
            {
                "time": time,
                "property": "rotation",
                "target": entity_type,
                "value": [0, 0, rotation_z],
                "easing": "ease-in-out"
            }
        ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": True,
        "metadata": {
            "name": "Idle Animation",
            "type": "idle",
            "description": "Gentle idle breathing animation"
        }
    }


def create_jump_animation(entity_type: str) -> Dict[str, Any]:
    """Create a jump animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Jump animation data
    """
    keyframes = []
    duration = 1.0  # 1 second for jump
    
    # Jump up
    keyframes.extend([
        {
            "time": 0.0,
            "property": "position",
            "target": entity_type,
            "value": [0, 0, 0],
            "easing": "ease-out"
        },
        {
            "time": 0.5,
            "property": "position",
            "target": entity_type,
            "value": [0, 3, 0],
            "easing": "ease-in"
        },
        {
            "time": 1.0,
            "property": "position",
            "target": entity_type,
            "value": [0, 0, 0],
            "easing": "ease-in"
        }
    ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": False,
        "metadata": {
            "name": "Jump Animation",
            "type": "movement",
            "description": "Single jump animation"
        }
    }


def create_flying_animation(entity_type: str) -> Dict[str, Any]:
    """Create a flying animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Flying animation data
    """
    keyframes = []
    duration = 4.0  # 4 seconds for flying cycle
    steps = 16  # Number of keyframes
    
    for i in range(steps + 1):
        time = (i / steps) * duration
        
        # Circular flight path
        radius = 5.0
        angle = (i / steps) * 2 * math.pi
        
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        y = 2 + 0.5 * math.sin(i * math.pi / 4)  # Gentle vertical movement
        
        # Wing flapping rotation
        wing_rotation = 10 * math.sin(i * math.pi / 2)
        
        keyframes.extend([
            {
                "time": time,
                "property": "position",
                "target": entity_type,
                "value": [x, y, z],
                "easing": "linear"
            },
            {
                "time": time,
                "property": "rotation",
                "target": entity_type,
                "value": [wing_rotation, angle * 180 / math.pi, 0],
                "easing": "ease-in-out"
            }
        ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": True,
        "metadata": {
            "name": "Flying Animation",
            "type": "movement",
            "description": "Circular flying pattern with wing movement"
        }
    }


def create_rotation_animation(entity_type: str) -> Dict[str, Any]:
    """Create a rotation animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Rotation animation data
    """
    keyframes = []
    duration = 2.0  # 2 seconds for full rotation
    
    keyframes.extend([
        {
            "time": 0.0,
            "property": "rotation",
            "target": entity_type,
            "value": [0, 0, 0],
            "easing": "linear"
        },
        {
            "time": 1.0,
            "property": "rotation",
            "target": entity_type,
            "value": [0, 180, 0],
            "easing": "linear"
        },
        {
            "time": 2.0,
            "property": "rotation",
            "target": entity_type,
            "value": [0, 360, 0],
            "easing": "linear"
        }
    ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": True,
        "metadata": {
            "name": "Rotation Animation",
            "type": "rotation",
            "description": "Continuous Y-axis rotation"
        }
    }


def create_simple_movement_animation(entity_type: str) -> Dict[str, Any]:
    """Create a simple movement animation.
    
    Args:
        entity_type: Type of entity to animate
        
    Returns:
        Simple movement animation data
    """
    keyframes = []
    duration = 2.0  # 2 seconds
    
    keyframes.extend([
        {
            "time": 0.0,
            "property": "position",
            "target": entity_type,
            "value": [0, 0, 0],
            "easing": "ease-in-out"
        },
        {
            "time": 1.0,
            "property": "position",
            "target": entity_type,
            "value": [2, 0, 0],
            "easing": "ease-in-out"
        },
        {
            "time": 2.0,
            "property": "position",
            "target": entity_type,
            "value": [0, 0, 0],
            "easing": "ease-in-out"
        }
    ])
    
    return {
        "keyframes": keyframes,
        "duration": duration,
        "target": entity_type,
        "loop": True,
        "metadata": {
            "name": "Simple Movement",
            "type": "movement",
            "description": "Basic back-and-forth movement"
        }
    }


def apply_animation_to_scene(scene: Dict[str, Any], animation: Dict[str, Any]) -> Dict[str, Any]:
    """Apply animation to scene entities.
    
    Args:
        scene: Scene manifest
        animation: Animation data
        
    Returns:
        Modified scene with animation applied
    """
    # Create a copy of the scene
    modified_scene = json.loads(json.dumps(scene))
    
    # Find target entity
    target_id = animation.get("target")
    if not target_id:
        return modified_scene
    
    # Add animation to entity
    for entity in modified_scene.get("entities", []):
        if entity.get("id") == target_id:
            if "animations" not in entity:
                entity["animations"] = []
            entity["animations"].append(animation)
            break
    
    return modified_scene


def validate_animation(animation: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate animation data.
    
    Args:
        animation: Animation data to validate
        
    Returns:
        (is_valid, error_message)
    """
    return validate_animation_data(animation)
