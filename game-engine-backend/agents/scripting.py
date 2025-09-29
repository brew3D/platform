"""
Scripting Agent for scene and game logic generation.

Responsibilities:
- Convert text prompts into structured scene manifests
- Generate game logic code (JavaScript/TypeScript)
- Create entity definitions, systems, and event triggers
- Provide URDF/JSON scene templates

API:
- generate_scene_script(prompt, options) -> scene_manifest: Generate scene from prompt
- validate_scene_manifest(manifest) -> (is_valid, error): Validate scene structure

Environment:
- USE_OPENAI: Enable OpenAI for script generation (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import json
import os
from typing import Any, Dict, List, Optional, Tuple

from .. import jobs
from ..utils.openai_client import call_chat_model
from ..utils.validators import validate_scene_manifest, sanitize_string


def generate_scene_script(prompt: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate scene script from text prompt.
    
    Args:
        prompt: Text description of desired scene
        options: Generation options
            - format: "json"|"urdf" (default: "json")
            - complexity: "simple"|"medium"|"complex" (default: "simple")
            - game_type: "platformer"|"puzzle"|"action"|"rpg" (default: "platformer")
            
    Returns:
        Scene manifest dictionary
    """
    options = options or {}
    format_type = options.get("format", "json")
    complexity = options.get("complexity", "simple")
    game_type = options.get("game_type", "platformer")
    
    # Sanitize prompt
    clean_prompt = sanitize_string(prompt, max_length=500)
    
    if format_type == "urdf":
        return _generate_urdf_scene(clean_prompt, complexity, game_type)
    else:
        return _generate_json_scene(clean_prompt, complexity, game_type)


def _generate_json_scene(prompt: str, complexity: str, game_type: str) -> Dict[str, Any]:
    """Generate JSON scene manifest."""
    # Check if we should use OpenAI
    use_openai = (os.getenv("USE_OPENAI", "0") == "1" and 
                  os.getenv("USE_MOCKS", "1") != "1")
    
    if use_openai:
        return _generate_with_openai(prompt, complexity, game_type)
    else:
        return _generate_mock_scene(prompt, complexity, game_type)


def _generate_with_openai(prompt: str, complexity: str, game_type: str) -> Dict[str, Any]:
    """Generate scene using OpenAI."""
    system_prompt = (
        "You are a game scene generator. Generate a JSON scene manifest with the following structure:\n"
        "{\n"
        '  "entities": [{"id": "string", "type": "string", "position": [x,y,z], "properties": {}}],\n'
        '  "systems": {"physics": {}, "rendering": {}, "input": {}},\n'
        '  "events": [{"id": "string", "trigger": "string", "action": "string"}],\n'
        '  "metadata": {"name": "string", "description": "string", "difficulty": "string"}\n'
        "}\n"
        "Create entities appropriate for the game type and complexity level."
    )
    
    user_prompt = (
        f"Generate a {game_type} scene with {complexity} complexity.\n"
        f"Prompt: {prompt}\n"
        "Include appropriate entities, systems, and events for the scene."
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
            scene_data = json.loads(content[start:end+1])
            
            # Validate scene
            is_valid, error = validate_scene_manifest(scene_data)
            if is_valid:
                return scene_data
            else:
                print(f"OpenAI generated invalid scene: {error}")
    except Exception as e:
        print(f"OpenAI generation failed: {e}")
    
    # Fallback to mock
    return _generate_mock_scene(prompt, complexity, game_type)


def _generate_mock_scene(prompt: str, complexity: str, game_type: str) -> Dict[str, Any]:
    """Generate mock scene based on prompt keywords."""
    entities = []
    events = []
    
    # Add entities based on game type and prompt keywords
    if game_type == "platformer":
        entities.extend([
            {
                "id": "player",
                "type": "character",
                "position": [0, 1, 0],
                "properties": {
                    "health": 100,
                    "speed": 5.0,
                    "jump_force": 10.0
                }
            },
            {
                "id": "ground_1",
                "type": "platform",
                "position": [0, 0, 0],
                "properties": {
                    "width": 10,
                    "height": 1,
                    "depth": 2
                }
            }
        ])
        
        # Add more platforms for complex scenes
        if complexity in ["medium", "complex"]:
            entities.extend([
                {
                    "id": "platform_1",
                    "type": "platform",
                    "position": [5, 2, 0],
                    "properties": {"width": 3, "height": 0.5, "depth": 1}
                },
                {
                    "id": "platform_2",
                    "type": "platform",
                    "position": [10, 4, 0],
                    "properties": {"width": 2, "height": 0.5, "depth": 1}
                }
            ])
    
    elif game_type == "puzzle":
        entities.extend([
            {
                "id": "player",
                "type": "character",
                "position": [0, 0, 0],
                "properties": {"health": 100}
            },
            {
                "id": "switch_1",
                "type": "interactive",
                "position": [2, 0, 0],
                "properties": {"action": "open_door"}
            },
            {
                "id": "door_1",
                "type": "obstacle",
                "position": [5, 0, 0],
                "properties": {"locked": True, "switch_id": "switch_1"}
            }
        ])
    
    # Add enemies if mentioned in prompt
    if any(word in prompt.lower() for word in ["enemy", "monster", "boss", "dragon"]):
        entities.append({
            "id": "enemy_1",
            "type": "enemy",
            "position": [8, 1, 0],
            "properties": {
                "health": 50,
                "damage": 10,
                "ai_type": "patrol"
            }
        })
    
    # Add collectibles if mentioned
    if any(word in prompt.lower() for word in ["coin", "item", "collect", "treasure"]):
        entities.append({
            "id": "coin_1",
            "type": "collectible",
            "position": [3, 2, 0],
            "properties": {"value": 10, "type": "coin"}
        })
    
    # Create events
    if game_type == "platformer":
        events.extend([
            {
                "id": "jump_event",
                "trigger": "key_press",
                "action": "jump",
                "target": "player"
            },
            {
                "id": "move_event",
                "trigger": "key_hold",
                "action": "move",
                "target": "player"
            }
        ])
    
    # Create systems
    systems = {
        "physics": {
            "gravity": -9.81,
            "collision_detection": True,
            "friction": 0.8
        },
        "rendering": {
            "camera": {"position": [0, 5, 10], "target": [0, 0, 0]},
            "lighting": {"ambient": 0.3, "directional": 0.7}
        },
        "input": {
            "keyboard": True,
            "mouse": True,
            "gamepad": False
        }
    }
    
    # Create metadata
    metadata = {
        "name": f"Generated {game_type.title()} Scene",
        "description": prompt[:100] + "..." if len(prompt) > 100 else prompt,
        "difficulty": complexity,
        "game_type": game_type,
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    scene_manifest = {
        "entities": entities,
        "systems": systems,
        "events": events,
        "metadata": metadata
    }
    
    return scene_manifest


def _generate_urdf_scene(prompt: str, complexity: str, game_type: str) -> Dict[str, Any]:
    """Generate URDF scene description."""
    # For now, return a simple URDF template
    # In a real implementation, this would generate proper URDF XML
    
    urdf_template = f"""<?xml version="1.0"?>
<robot name="generated_scene">
  <link name="base_link">
    <visual>
      <geometry>
        <box size="1 1 1"/>
      </geometry>
      <material name="blue">
        <color rgba="0 0 1 1"/>
      </material>
    </visual>
    <collision>
      <geometry>
        <box size="1 1 1"/>
      </geometry>
    </collision>
  </link>
  
  <!-- Generated from prompt: {prompt} -->
  <!-- Game type: {game_type}, Complexity: {complexity} -->
</robot>"""
    
    return {
        "type": "urdf",
        "content": urdf_template,
        "metadata": {
            "prompt": prompt,
            "game_type": game_type,
            "complexity": complexity
        }
    }


def validate_scene_script(manifest: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate scene script manifest.
    
    Args:
        manifest: Scene manifest to validate
        
    Returns:
        (is_valid, error_message)
    """
    return validate_scene_manifest(manifest)
