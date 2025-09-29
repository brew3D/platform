"""
Helper Agent for context-aware assistance and suggestions.

Responsibilities:
- Provide contextual help and suggestions
- Generate prompt templates for UI
- Offer code snippets and best practices
- Analyze project state and suggest improvements

API:
- query_help(context, question) -> help_response: Get contextual help
- get_templates(category) -> templates: Get prompt templates
- analyze_project_state(project_data) -> suggestions: Analyze and suggest improvements

Environment:
- USE_OPENAI: Enable OpenAI for natural language responses (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import json
import os
from typing import Any, Dict, List, Optional

from .. import jobs
from ..utils.openai_client import call_chat_model
from ..utils.validators import sanitize_string


def query_help(context: Dict[str, Any], question: str) -> Dict[str, Any]:
    """Get contextual help for a question.
    
    Args:
        context: Current project/editor context
        question: User's question or request
        
    Returns:
        Help response with answer and suggested actions
    """
    clean_question = sanitize_string(question, max_length=300)
    
    # Check if we should use OpenAI
    use_openai = (os.getenv("USE_OPENAI", "0") == "1" and 
                  os.getenv("USE_MOCKS", "1") != "1")
    
    if use_openai:
        return _generate_help_with_openai(context, clean_question)
    else:
        return _generate_mock_help(context, clean_question)


def _generate_help_with_openai(context: Dict[str, Any], question: str) -> Dict[str, Any]:
    """Generate help using OpenAI."""
    system_prompt = (
        "You are a helpful game development assistant. Provide concise, actionable advice.\n"
        "Format your response as JSON:\n"
        "{\n"
        '  "answer": "Brief explanation",\n'
        '  "actions": ["action1", "action2"],\n'
        '  "code_example": "optional code snippet",\n'
        '  "related_topics": ["topic1", "topic2"]\n'
        "}\n"
        "Keep responses short and practical."
    )
    
    context_str = json.dumps(context, indent=2) if context else "No context provided"
    
    user_prompt = (
        f"Context: {context_str}\n"
        f"Question: {question}\n"
        "Provide helpful advice and suggested actions."
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
            help_data = json.loads(content[start:end+1])
            return help_data
    except Exception as e:
        print(f"OpenAI help generation failed: {e}")
    
    # Fallback to mock
    return _generate_mock_help(context, question)


def _generate_mock_help(context: Dict[str, Any], question: str) -> Dict[str, Any]:
    """Generate mock help based on question keywords."""
    question_lower = question.lower()
    
    # Analyze context for suggestions
    suggestions = []
    if context.get("entities"):
        entity_count = len(context["entities"])
        if entity_count == 0:
            suggestions.append("add_entities")
        elif entity_count > 20:
            suggestions.append("optimize_entities")
    
    if context.get("voxels"):
        voxel_count = len(context.get("voxels", []))
        if voxel_count > 10000:
            suggestions.append("reduce_polycount")
    
    # Generate response based on question keywords
    if "polycount" in question_lower or "performance" in question_lower:
        return {
            "answer": "To reduce polycount: 1) Use LODs for distant objects, 2) Simplify geometry, 3) Use texture atlases, 4) Remove hidden faces.",
            "actions": ["create_lods", "simplify_geometry", "optimize_textures"],
            "code_example": "// Use LOD system\nif (distance < 100) renderHighPoly();\nelse renderLowPoly();",
            "related_topics": ["optimization", "rendering", "performance"]
        }
    
    elif "animation" in question_lower:
        return {
            "answer": "For smooth animations: 1) Use keyframe interpolation, 2) Apply easing functions, 3) Keep frame rate consistent, 4) Use animation curves.",
            "actions": ["add_keyframes", "apply_easing", "check_framerate"],
            "code_example": "// Easing function\neaseInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }",
            "related_topics": ["animation", "interpolation", "timing"]
        }
    
    elif "collision" in question_lower:
        return {
            "answer": "For collision detection: 1) Use appropriate collision shapes, 2) Implement spatial partitioning, 3) Check broad phase first, 4) Optimize narrow phase.",
            "actions": ["setup_collision_shapes", "implement_spatial_hash", "optimize_collision"],
            "code_example": "// Broad phase collision check\nif (aabbOverlap(obj1.bounds, obj2.bounds)) {\n  // Narrow phase check\n}",
            "related_topics": ["physics", "collision", "optimization"]
        }
    
    elif "lighting" in question_lower:
        return {
            "answer": "For good lighting: 1) Use multiple light types, 2) Implement shadows, 3) Use light probes, 4) Consider performance impact.",
            "actions": ["add_ambient_light", "setup_shadows", "configure_lighting"],
            "code_example": "// Basic lighting setup\nambientLight(0.3);\ndirectionalLight(0.7, [1, 1, 1]);",
            "related_topics": ["lighting", "shadows", "rendering"]
        }
    
    elif "texture" in question_lower or "material" in question_lower:
        return {
            "answer": "For textures: 1) Use power-of-2 dimensions, 2) Create texture atlases, 3) Use appropriate compression, 4) Consider mipmaps.",
            "actions": ["resize_textures", "create_atlas", "optimize_compression"],
            "code_example": "// Texture atlas coordinates\nuv.x = (x % atlasWidth) / atlasWidth;\nuv.y = (y / atlasWidth) / atlasHeight;",
            "related_topics": ["textures", "materials", "optimization"]
        }
    
    else:
        # Generic help
        return {
            "answer": "I can help with game development topics like optimization, animation, collision detection, lighting, and more. What specific area would you like help with?",
            "actions": ["ask_specific_question", "browse_templates", "check_documentation"],
            "code_example": None,
            "related_topics": ["general", "getting_started", "documentation"]
        }


def get_templates(category: Optional[str] = None) -> Dict[str, List[Dict[str, str]]]:
    """Get prompt templates for UI.
    
    Args:
        category: Template category filter (optional)
        
    Returns:
        Dictionary of templates organized by category
    """
    templates = {
        "assets": [
            {
                "name": "Dragon Model",
                "prompt": "Create a cartoony dragon with wings, scales, and fire breath",
                "description": "Generate a 3D dragon model for fantasy games"
            },
            {
                "name": "Medieval Castle",
                "prompt": "Build a detailed medieval castle with towers, walls, and gates",
                "description": "Create architectural assets for historical games"
            },
            {
                "name": "Sci-Fi Spaceship",
                "prompt": "Design a futuristic spaceship with engines, weapons, and cockpit",
                "description": "Generate sci-fi vehicle assets"
            }
        ],
        "scenes": [
            {
                "name": "Platformer Level",
                "prompt": "Create a 2D platformer level with platforms, enemies, and collectibles",
                "description": "Generate a complete platformer scene"
            },
            {
                "name": "Puzzle Room",
                "prompt": "Design a puzzle room with switches, doors, and interactive elements",
                "description": "Create a puzzle-based scene"
            },
            {
                "name": "Racing Track",
                "prompt": "Build a racing track with curves, obstacles, and checkpoints",
                "description": "Generate a racing game environment"
            }
        ],
        "animations": [
            {
                "name": "Character Walk",
                "prompt": "Create a smooth walking animation for a humanoid character",
                "description": "Generate a standard walk cycle"
            },
            {
                "name": "Flying Dragon",
                "prompt": "Animate a dragon flying with wing flapping and soaring motion",
                "description": "Create a flying creature animation"
            },
            {
                "name": "Idle Animation",
                "prompt": "Make a gentle idle animation with breathing and slight movement",
                "description": "Generate a natural idle state"
            }
        ],
        "levels": [
            {
                "name": "Forest Level",
                "prompt": "Generate a forest level with trees, paths, and hidden areas",
                "description": "Create a natural outdoor environment"
            },
            {
                "name": "Dungeon Level",
                "prompt": "Design a dungeon with rooms, corridors, and treasure chambers",
                "description": "Generate an underground exploration area"
            },
            {
                "name": "City Level",
                "prompt": "Build a city street with buildings, vehicles, and pedestrians",
                "description": "Create an urban environment"
            }
        ]
    }
    
    if category and category in templates:
        return {category: templates[category]}
    
    return templates


def analyze_project_state(project_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze project state and provide suggestions.
    
    Args:
        project_data: Current project data
        
    Returns:
        Analysis results with suggestions and warnings
    """
    suggestions = []
    warnings = []
    optimizations = []
    
    # Analyze entities
    entities = project_data.get("entities", [])
    if len(entities) == 0:
        suggestions.append({
            "type": "missing_content",
            "message": "No entities found. Consider adding characters, objects, or interactive elements.",
            "action": "add_entities"
        })
    elif len(entities) > 50:
        warnings.append({
            "type": "performance",
            "message": f"High entity count ({len(entities)}). Consider using object pooling or LODs.",
            "action": "optimize_entities"
        })
    
    # Analyze animations
    animations = project_data.get("animations", [])
    if len(animations) == 0:
        suggestions.append({
            "type": "missing_content",
            "message": "No animations found. Add movement, idle, or interaction animations.",
            "action": "add_animations"
        })
    
    # Analyze voxels/geometry
    voxels = project_data.get("voxels", [])
    if len(voxels) > 50000:
        warnings.append({
            "type": "performance",
            "message": f"High voxel count ({len(voxels)}). Consider reducing detail or using LODs.",
            "action": "reduce_polycount"
        })
    
    # Analyze lighting
    lighting = project_data.get("lighting", {})
    if not lighting.get("ambient") and not lighting.get("directional"):
        suggestions.append({
            "type": "missing_content",
            "message": "No lighting setup found. Add ambient and directional lights.",
            "action": "setup_lighting"
        })
    
    # Analyze physics
    physics = project_data.get("physics", {})
    if not physics.get("gravity") and not physics.get("collision_detection"):
        suggestions.append({
            "type": "missing_content",
            "message": "No physics configuration found. Set up gravity and collision detection.",
            "action": "setup_physics"
        })
    
    # Performance optimizations
    if len(entities) > 10:
        optimizations.append({
            "type": "performance",
            "message": "Consider implementing frustum culling for better performance.",
            "action": "implement_culling"
        })
    
    if len(voxels) > 10000:
        optimizations.append({
            "type": "performance",
            "message": "Consider using instanced rendering for repeated objects.",
            "action": "use_instancing"
        })
    
    return {
        "suggestions": suggestions,
        "warnings": warnings,
        "optimizations": optimizations,
        "summary": {
            "entity_count": len(entities),
            "animation_count": len(animations),
            "voxel_count": len(voxels),
            "has_lighting": bool(lighting),
            "has_physics": bool(physics)
        }
    }
