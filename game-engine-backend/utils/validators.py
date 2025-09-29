"""
JSON schema validation utilities.

Provides validation schemas and functions for agent outputs.
"""

from typing import Any, Dict, List, Optional


def validate_scene_manifest(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate scene manifest JSON structure.
    
    Args:
        data: Scene manifest data
        
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Scene manifest must be a dictionary"
    
    # Required fields
    required_fields = ["entities", "systems", "metadata"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate entities array
    entities = data.get("entities", [])
    if not isinstance(entities, list):
        return False, "Entities must be an array"
    
    for i, entity in enumerate(entities):
        if not isinstance(entity, dict):
            return False, f"Entity {i} must be a dictionary"
        if "id" not in entity:
            return False, f"Entity {i} missing required field: id"
        if "type" not in entity:
            return False, f"Entity {i} missing required field: type"
    
    # Validate systems object
    systems = data.get("systems", {})
    if not isinstance(systems, dict):
        return False, "Systems must be a dictionary"
    
    # Validate metadata
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        return False, "Metadata must be a dictionary"
    
    return True, None


def validate_animation_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate animation keyframe data.
    
    Args:
        data: Animation data
        
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Animation data must be a dictionary"
    
    # Required fields
    required_fields = ["keyframes", "duration", "target"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate keyframes array
    keyframes = data.get("keyframes", [])
    if not isinstance(keyframes, list):
        return False, "Keyframes must be an array"
    
    for i, keyframe in enumerate(keyframes):
        if not isinstance(keyframe, dict):
            return False, f"Keyframe {i} must be a dictionary"
        
        required_keyframe_fields = ["time", "property", "value"]
        for field in required_keyframe_fields:
            if field not in keyframe:
                return False, f"Keyframe {i} missing required field: {field}"
    
    # Validate duration
    duration = data.get("duration")
    if not isinstance(duration, (int, float)) or duration <= 0:
        return False, "Duration must be a positive number"
    
    return True, None


def validate_level_data(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate level generation data.
    
    Args:
        data: Level data
        
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Level data must be a dictionary"
    
    # Required fields
    required_fields = ["tiles", "entities", "metadata"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate tiles grid
    tiles = data.get("tiles", [])
    if not isinstance(tiles, list):
        return False, "Tiles must be an array"
    
    for i, row in enumerate(tiles):
        if not isinstance(row, list):
            return False, f"Tile row {i} must be an array"
    
    # Validate entities array
    entities = data.get("entities", [])
    if not isinstance(entities, list):
        return False, "Entities must be an array"
    
    for i, entity in enumerate(entities):
        if not isinstance(entity, dict):
            return False, f"Entity {i} must be a dictionary"
        if "id" not in entity:
            return False, f"Entity {i} missing required field: id"
        if "position" not in entity:
            return False, f"Entity {i} missing required field: position"
    
    return True, None


def validate_asset_artifact(data: Dict[str, Any]) -> tuple[bool, Optional[str]]:
    """Validate asset generation artifact.
    
    Args:
        data: Asset artifact data
        
    Returns:
        (is_valid, error_message)
    """
    if not isinstance(data, dict):
        return False, "Asset artifact must be a dictionary"
    
    # Required fields
    required_fields = ["type", "metadata"]
    for field in required_fields:
        if field not in data:
            return False, f"Missing required field: {field}"
    
    # Validate type
    asset_type = data.get("type")
    valid_types = ["model", "sprite", "music", "sfx"]
    if asset_type not in valid_types:
        return False, f"Invalid asset type: {asset_type}. Must be one of {valid_types}"
    
    # Validate metadata
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        return False, "Metadata must be a dictionary"
    
    return True, None


def sanitize_string(value: Any, max_length: int = 1000) -> str:
    """Sanitize string value for safe storage.
    
    Args:
        value: Value to sanitize
        max_length: Maximum string length
        
    Returns:
        Sanitized string
    """
    if not isinstance(value, str):
        value = str(value)
    
    # Remove control characters and limit length
    sanitized = "".join(char for char in value if ord(char) >= 32 or char in "\n\t")
    return sanitized[:max_length]
