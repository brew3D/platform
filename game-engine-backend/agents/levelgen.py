"""
Level Design Agent for procedural level generation.

Responsibilities:
- Generate procedural levels with tilemaps and entity placement
- Create difficulty progression and pacing metadata
- Generate visual previews of levels
- Support different themes and game types

API:
- generate_level(seed, size, theme, difficulty) -> level_data: Generate procedural level
- create_preview(level_data) -> preview_path: Generate visual preview
- validate_level(level_data) -> (is_valid, error): Validate level structure

Environment:
- USE_OPENAI: Enable OpenAI for complex level generation (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import hashlib
import json
import math
import os
import random
from typing import Any, Dict, List, Optional, Tuple

from .. import jobs
from ..utils.openai_client import call_chat_model
from ..utils.storage import get_artifact_path, write_json
from ..utils.validators import validate_level_data, sanitize_string


def generate_level(seed: int, size: Tuple[int, int], theme: str, difficulty: str) -> Dict[str, Any]:
    """Generate a procedural level.
    
    Args:
        seed: Random seed for deterministic generation
        size: Level dimensions (width, height)
        theme: Level theme (forest, dungeon, city, space, etc.)
        difficulty: Difficulty level (easy, medium, hard)
        
    Returns:
        Level data with tiles, entities, and metadata
    """
    # Set random seed for deterministic generation
    random.seed(seed)
    
    clean_theme = sanitize_string(theme, max_length=50)
    clean_difficulty = sanitize_string(difficulty, max_length=20)
    
    # Check if we should use OpenAI
    use_openai = (os.getenv("USE_OPENAI", "0") == "1" and 
                  os.getenv("USE_MOCKS", "1") != "1")
    
    if use_openai:
        return _generate_with_openai(seed, size, clean_theme, clean_difficulty)
    else:
        return _generate_procedural(seed, size, clean_theme, clean_difficulty)


def _generate_with_openai(seed: int, size: Tuple[int, int], theme: str, difficulty: str) -> Dict[str, Any]:
    """Generate level using OpenAI."""
    system_prompt = (
        "You are a procedural level generator. Create level data in JSON format:\n"
        "{\n"
        '  "tiles": [[tile_type, ...], ...],\n'
        '  "entities": [{"id": "string", "type": "string", "position": [x, y], "properties": {}}],\n'
        '  "metadata": {"name": "string", "difficulty": "string", "theme": "string", "target_time": 120}\n'
        "}\n"
        "Use appropriate tile types and entity placement for the theme and difficulty."
    )
    
    user_prompt = (
        f"Generate a {theme} level with {difficulty} difficulty.\n"
        f"Size: {size[0]}x{size[1]} tiles\n"
        f"Seed: {seed}\n"
        "Include appropriate tiles, enemies, collectibles, and obstacles."
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
            level_data = json.loads(content[start:end+1])
            
            # Validate level
            is_valid, error = validate_level_data(level_data)
            if is_valid:
                return level_data
            else:
                print(f"OpenAI generated invalid level: {error}")
    except Exception as e:
        print(f"OpenAI generation failed: {e}")
    
    # Fallback to procedural
    return _generate_procedural(seed, size, theme, difficulty)


def _generate_procedural(seed: int, size: Tuple[int, int], theme: str, difficulty: str) -> Dict[str, Any]:
    """Generate level using procedural algorithms."""
    width, height = size
    
    # Generate tilemap
    tiles = _generate_tilemap(width, height, theme, difficulty)
    
    # Generate entities
    entities = _generate_entities(width, height, theme, difficulty)
    
    # Calculate metadata
    metadata = _calculate_metadata(tiles, entities, theme, difficulty)
    
    level_data = {
        "tiles": tiles,
        "entities": entities,
        "metadata": metadata
    }
    
    return level_data


def _generate_tilemap(width: int, height: int, theme: str, difficulty: str) -> List[List[int]]:
    """Generate tilemap based on theme and difficulty."""
    tiles = []
    
    # Tile types: 0=empty, 1=floor, 2=wall, 3=water, 4=lava, 5=grass, 6=sand, 7=stone
    theme_tiles = {
        "forest": {"floor": 5, "wall": 2, "obstacle": 1},  # grass, trees, rocks
        "dungeon": {"floor": 7, "wall": 2, "obstacle": 1},  # stone, walls, traps
        "city": {"floor": 1, "wall": 2, "obstacle": 1},    # concrete, buildings, debris
        "space": {"floor": 1, "wall": 2, "obstacle": 3},   # metal, walls, energy
        "desert": {"floor": 6, "wall": 2, "obstacle": 1},  # sand, rocks, cacti
        "cave": {"floor": 7, "wall": 2, "obstacle": 4}     # stone, walls, lava
    }
    
    tile_config = theme_tiles.get(theme, theme_tiles["forest"])
    
    # Initialize with floor tiles
    for y in range(height):
        row = []
        for x in range(width):
            row.append(tile_config["floor"])
        tiles.append(row)
    
    # Add walls around edges
    for y in range(height):
        tiles[y][0] = tile_config["wall"]
        tiles[y][width-1] = tile_config["wall"]
    for x in range(width):
        tiles[0][x] = tile_config["wall"]
        tiles[height-1][x] = tile_config["wall"]
    
    # Add obstacles based on difficulty
    obstacle_count = _get_obstacle_count(width, height, difficulty)
    for _ in range(obstacle_count):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        tiles[y][x] = tile_config["obstacle"]
    
    # Add some random walls for complexity
    wall_count = _get_wall_count(width, height, difficulty)
    for _ in range(wall_count):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        if tiles[y][x] == tile_config["floor"]:
            tiles[y][x] = tile_config["wall"]
    
    return tiles


def _generate_entities(width: int, height: int, theme: str, difficulty: str) -> List[Dict[str, Any]]:
    """Generate entities for the level."""
    entities = []
    entity_id = 0
    
    # Add player spawn point
    spawn_x = random.randint(1, width-2)
    spawn_y = random.randint(1, height-2)
    entities.append({
        "id": f"player_spawn_{entity_id}",
        "type": "spawn_point",
        "position": [spawn_x, spawn_y],
        "properties": {"player": True}
    })
    entity_id += 1
    
    # Add enemies based on difficulty
    enemy_count = _get_enemy_count(width, height, difficulty)
    enemy_types = _get_enemy_types(theme)
    
    for _ in range(enemy_count):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        enemy_type = random.choice(enemy_types)
        
        entities.append({
            "id": f"enemy_{entity_id}",
            "type": enemy_type,
            "position": [x, y],
            "properties": {
                "health": _get_enemy_health(enemy_type, difficulty),
                "damage": _get_enemy_damage(enemy_type, difficulty),
                "ai_type": "patrol"
            }
        })
        entity_id += 1
    
    # Add collectibles
    collectible_count = _get_collectible_count(width, height, difficulty)
    collectible_types = ["coin", "health_pack", "power_up", "key"]
    
    for _ in range(collectible_count):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        collectible_type = random.choice(collectible_types)
        
        entities.append({
            "id": f"collectible_{entity_id}",
            "type": collectible_type,
            "position": [x, y],
            "properties": {
                "value": _get_collectible_value(collectible_type),
                "rarity": random.choice(["common", "uncommon", "rare"])
            }
        })
        entity_id += 1
    
    # Add checkpoints
    checkpoint_count = _get_checkpoint_count(width, height, difficulty)
    for i in range(checkpoint_count):
        x = random.randint(1, width-2)
        y = random.randint(1, height-2)
        
        entities.append({
            "id": f"checkpoint_{entity_id}",
            "type": "checkpoint",
            "position": [x, y],
            "properties": {"checkpoint_id": i}
        })
        entity_id += 1
    
    return entities


def _get_obstacle_count(width: int, height: int, difficulty: str) -> int:
    """Get obstacle count based on difficulty."""
    area = width * height
    base_count = int(area * 0.05)  # 5% of tiles
    
    multipliers = {"easy": 0.5, "medium": 1.0, "hard": 1.5}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return max(0, int(base_count * multiplier))


def _get_wall_count(width: int, height: int, difficulty: str) -> int:
    """Get wall count based on difficulty."""
    area = width * height
    base_count = int(area * 0.03)  # 3% of tiles
    
    multipliers = {"easy": 0.3, "medium": 1.0, "hard": 2.0}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return max(0, int(base_count * multiplier))


def _get_enemy_count(width: int, height: int, difficulty: str) -> int:
    """Get enemy count based on difficulty."""
    area = width * height
    base_count = int(area * 0.02)  # 2% of tiles
    
    multipliers = {"easy": 0.5, "medium": 1.0, "hard": 2.0}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return max(0, int(base_count * multiplier))


def _get_enemy_types(theme: str) -> List[str]:
    """Get enemy types for theme."""
    theme_enemies = {
        "forest": ["goblin", "wolf", "spider"],
        "dungeon": ["skeleton", "zombie", "bat"],
        "city": ["thug", "robot", "drone"],
        "space": ["alien", "robot", "asteroid"],
        "desert": ["scorpion", "snake", "cactus"],
        "cave": ["bat", "spider", "slime"]
    }
    
    return theme_enemies.get(theme, ["enemy"])


def _get_enemy_health(enemy_type: str, difficulty: str) -> int:
    """Get enemy health based on type and difficulty."""
    base_health = {
        "goblin": 20, "wolf": 30, "spider": 15,
        "skeleton": 25, "zombie": 35, "bat": 10,
        "thug": 30, "robot": 40, "drone": 15,
        "alien": 50, "asteroid": 60, "scorpion": 25,
        "slime": 20, "enemy": 25
    }
    
    health = base_health.get(enemy_type, 25)
    
    multipliers = {"easy": 0.7, "medium": 1.0, "hard": 1.5}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return int(health * multiplier)


def _get_enemy_damage(enemy_type: str, difficulty: str) -> int:
    """Get enemy damage based on type and difficulty."""
    base_damage = {
        "goblin": 5, "wolf": 8, "spider": 3,
        "skeleton": 6, "zombie": 10, "bat": 2,
        "thug": 8, "robot": 12, "drone": 4,
        "alien": 15, "asteroid": 20, "scorpion": 7,
        "slime": 4, "enemy": 6
    }
    
    damage = base_damage.get(enemy_type, 6)
    
    multipliers = {"easy": 0.7, "medium": 1.0, "hard": 1.5}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return int(damage * multiplier)


def _get_collectible_count(width: int, height: int, difficulty: str) -> int:
    """Get collectible count based on difficulty."""
    area = width * height
    base_count = int(area * 0.03)  # 3% of tiles
    
    multipliers = {"easy": 1.5, "medium": 1.0, "hard": 0.7}
    multiplier = multipliers.get(difficulty, 1.0)
    
    return max(0, int(base_count * multiplier))


def _get_collectible_value(collectible_type: str) -> int:
    """Get collectible value based on type."""
    values = {
        "coin": 10,
        "health_pack": 25,
        "power_up": 50,
        "key": 100
    }
    
    return values.get(collectible_type, 10)


def _get_checkpoint_count(width: int, height: int, difficulty: str) -> int:
    """Get checkpoint count based on difficulty."""
    # More checkpoints for harder levels
    multipliers = {"easy": 0.5, "medium": 1.0, "hard": 1.5}
    multiplier = multipliers.get(difficulty, 1.0)
    
    base_count = max(1, int(math.sqrt(width * height) * 0.1))
    return int(base_count * multiplier)


def _calculate_metadata(tiles: List[List[int]], entities: List[Dict[str, Any]], theme: str, difficulty: str) -> Dict[str, Any]:
    """Calculate level metadata."""
    # Count different tile types
    tile_counts = {}
    for row in tiles:
        for tile in row:
            tile_counts[tile] = tile_counts.get(tile, 0) + 1
    
    # Count entities by type
    entity_counts = {}
    for entity in entities:
        entity_type = entity["type"]
        entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
    
    # Calculate difficulty score
    enemy_count = entity_counts.get("enemy", 0)
    obstacle_count = tile_counts.get(2, 0)  # walls
    difficulty_score = enemy_count * 2 + obstacle_count * 0.5
    
    # Estimate target time based on level size and difficulty
    area = len(tiles) * len(tiles[0])
    base_time = area * 0.1  # 0.1 seconds per tile
    difficulty_multiplier = {"easy": 0.8, "medium": 1.0, "hard": 1.3}
    target_time = int(base_time * difficulty_multiplier.get(difficulty, 1.0))
    
    return {
        "name": f"{theme.title()} Level",
        "theme": theme,
        "difficulty": difficulty,
        "difficulty_score": int(difficulty_score),
        "target_time": target_time,
        "size": [len(tiles[0]), len(tiles)],
        "tile_counts": tile_counts,
        "entity_counts": entity_counts,
        "created_at": "2024-01-01T00:00:00Z"
    }


def create_preview(level_data: Dict[str, Any]) -> str:
    """Create visual preview of level.
    
    Args:
        level_data: Level data to preview
        
    Returns:
        Path to preview image
    """
    # For now, create a simple JSON preview
    # In a real implementation, this would generate an actual image
    
    preview_data = {
        "level": level_data,
        "preview_type": "json",
        "created_at": "2024-01-01T00:00:00Z"
    }
    
    # Create filename based on level hash
    content_hash = hashlib.sha256(
        json.dumps(level_data, sort_keys=True).encode()
    ).hexdigest()[:12]
    
    filename = f"level_preview_{content_hash}.json"
    file_path = get_artifact_path("previews", filename)
    
    # Write preview
    write_json(file_path, preview_data)
    
    return f"/artifacts/previews/{filename}"


def validate_level(level_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate level data.
    
    Args:
        level_data: Level data to validate
        
    Returns:
        (is_valid, error_message)
    """
    return validate_level_data(level_data)
