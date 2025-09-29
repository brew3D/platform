"""
File storage utilities for manifests and artifacts.

Provides:
- write_json(path, data): Write JSON data to file atomically
- read_json(path): Read JSON data from file
- make_dirs(path): Ensure directory exists
- get_artifact_path(artifact_type, filename): Get full path for artifact
"""

import json
import os
from pathlib import Path
from typing import Any, Optional

from dotenv import load_dotenv

load_dotenv()

ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", Path(__file__).parent.parent / "artifacts"))


def make_dirs(path: Path) -> None:
    """Ensure directory exists."""
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, data: Any) -> None:
    """Write JSON data to file atomically.
    
    Args:
        path: File path to write to
        data: Data to serialize as JSON
    """
    make_dirs(path.parent)
    tmp_path = path.with_suffix(".json.tmp")
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp_path.replace(path)


def read_json(path: Path) -> Optional[Any]:
    """Read JSON data from file.
    
    Args:
        path: File path to read from
        
    Returns:
        Parsed JSON data or None if file doesn't exist/invalid
    """
    if not path.exists():
        return None
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return None


def get_artifact_path(artifact_type: str, filename: str) -> Path:
    """Get full path for artifact file.
    
    Args:
        artifact_type: Type of artifact (manifests, glb, voxels, previews)
        filename: Filename
        
    Returns:
        Full path to artifact file
    """
    artifact_dir = ARTIFACTS_DIR / artifact_type
    make_dirs(artifact_dir)
    return artifact_dir / filename


def list_artifacts(artifact_type: str, pattern: str = "*") -> list[Path]:
    """List artifacts of given type matching pattern.
    
    Args:
        artifact_type: Type of artifact directory
        pattern: Glob pattern to match
        
    Returns:
        List of matching artifact paths
    """
    artifact_dir = ARTIFACTS_DIR / artifact_type
    if not artifact_dir.exists():
        return []
    return list(artifact_dir.glob(pattern))
