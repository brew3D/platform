"""
GenAI Asset Agent for 3D model generation.

Responsibilities:
- Generate 3D models from text prompts using voxel-based or Shape-E approaches
- Create multiple LODs (Level of Detail) for performance optimization
- Export artifacts in various formats (GLB, VOX, JSON)
- Provide deterministic generation with seed support

API:
- start_asset_job(prompt) -> job_id: Start asset generation job
- generate_part_voxels(part, plan) -> voxels: Generate voxels for a part
- assemble_and_optimize(parts_voxels, plan) -> artifact: Combine parts into final model
- export_artifact(artifact) -> path: Export artifact to file system

Environment:
- USE_OPENAI_VOXELS: Enable OpenAI for voxel generation (default: 0)
- USE_SHAPE_E: Enable Shape-E for 3D generation (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import hashlib
import json
import os
import time
from typing import Any, Dict, List, Optional

from .. import jobs
from ..utils.openai_client import call_chat_model, call_shapee, is_openai_enabled, is_shapee_enabled
from ..utils.storage import get_artifact_path, write_json
from ..utils.validators import validate_asset_artifact, sanitize_string


def start_asset_job(prompt: Dict[str, Any]) -> str:
    """Start asset generation job.
    
    Args:
        prompt: Asset generation parameters
            - type: "model"|"sprite"|"music"|"sfx"
            - subject: Description of the asset
            - mode: "voxel"|"shapee" (default: "voxel")
            - resolution: Voxel resolution (default: 64)
            - style: Visual style description
            - pose: Pose description
            - seed: Random seed for deterministic generation
            
    Returns:
        job_id for tracking progress
    """
    # Validate and sanitize prompt
    subject = sanitize_string(prompt.get("subject", "object"))
    style = sanitize_string(prompt.get("style", ""))
    pose = sanitize_string(prompt.get("pose", ""))
    
    # Create job
    job_id = jobs.create_job(f"Generate {subject} asset", lambda jid, _: _run_asset_generation(jid, prompt))
    return job_id


def _run_asset_generation(job_id: str, prompt: Dict[str, Any]):
    """Run the asset generation pipeline."""
    try:
        jobs.append_progress(job_id, "Starting asset generation")
        
        # Determine generation mode
        mode = prompt.get("mode", "voxel").lower()
        use_shapee = (mode == "shapee" or is_shapee_enabled()) and not os.getenv("USE_MOCKS", "1") == "1"
        
        if use_shapee:
            _run_shapee_generation(job_id, prompt)
        else:
            _run_voxel_generation(job_id, prompt)
            
    except Exception as e:
        jobs.fail_job(job_id, f"Asset generation failed: {str(e)}")


def _run_shapee_generation(job_id: str, prompt: Dict[str, Any]):
    """Run Shape-E based generation."""
    jobs.append_progress(job_id, "Initializing Shape-E generation")
    
    subject = prompt.get("subject", "object")
    style = prompt.get("style", "")
    pose = prompt.get("pose", "")
    
    # Build full prompt
    full_prompt = subject
    if style:
        full_prompt += f" in {style} style"
    if pose:
        full_prompt += f", pose: {pose}"
    
    jobs.append_progress(job_id, f"Generating 3D model: {full_prompt}")
    
    # Call Shape-E
    result = call_shapee(full_prompt, prompt.get("resolution", 64))
    
    if result.get("status") == "completed":
        artifact_path = result.get("artifact_path", "")
        jobs.attach_artifact(job_id, "shapee", {
            "type": "glb",
            "path": artifact_path,
            "metadata": result.get("metadata", {})
        })
        jobs.append_progress(job_id, "Shape-E generation completed")
        jobs.complete_job(job_id)
    else:
        jobs.fail_job(job_id, "Shape-E generation failed")


def _run_voxel_generation(job_id: str, prompt: Dict[str, Any]):
    """Run voxel-based generation pipeline."""
    jobs.append_progress(job_id, "Planning asset generation")
    
    # Create generation plan
    plan = _create_generation_plan(prompt)
    jobs.append_progress(job_id, f"Generated plan with {len(plan['parts'])} parts")
    
    # Generate parts for each LOD
    artifacts = {}
    for lod in plan.get("lods", [plan["resolution"]]):
        jobs.append_progress(job_id, f"Generating LOD {lod}")
        
        # Generate parts in parallel
        parts_voxels = {}
        for part in plan["parts"]:
            part_voxels = generate_part_voxels(part, {**plan, "resolution": lod})
            parts_voxels[part["id"]] = part_voxels
            jobs.append_progress(job_id, f"Generated {part['id']} ({len(part_voxels)} voxels)")
        
        # Assemble and optimize
        jobs.append_progress(job_id, f"Assembling LOD {lod}")
        artifact = assemble_and_optimize(parts_voxels, {**plan, "resolution": lod})
        
        # Export artifact
        artifact_path = export_artifact(artifact, lod)
        artifacts[f"lod_{lod}"] = {
            "type": "voxel",
            "path": artifact_path,
            "resolution": lod,
            "voxel_count": len(artifact.get("voxels", []))
        }
        
        jobs.append_progress(job_id, f"Exported LOD {lod} to {artifact_path}")
    
    # Attach all artifacts
    jobs.attach_artifact(job_id, "lods", artifacts)
    jobs.complete_job(job_id)


def _create_generation_plan(prompt: Dict[str, Any]) -> Dict[str, Any]:
    """Create generation plan from prompt."""
    subject = prompt.get("subject", "object").lower()
    resolution = prompt.get("resolution", 64)
    style = prompt.get("style", "")
    pose = prompt.get("pose", "")
    
    # Determine LODs based on resolution
    base_res = min(resolution, 512)  # Cap base resolution
    lods = [base_res]
    if resolution > base_res:
        lods.append(resolution)
    
    # Create parts based on subject
    parts = []
    if "dragon" in subject:
        parts = [
            {"id": "body", "bbox": {"min": [0, 0, 0], "max": [32, 16, 16]}},
            {"id": "left_wing", "bbox": {"min": [-16, 8, 0], "max": [0, 16, 8]}},
            {"id": "right_wing", "bbox": {"min": [32, 8, 0], "max": [48, 16, 8]}},
            {"id": "left_leg", "bbox": {"min": [8, 0, 0], "max": [12, 16, 4]}},
            {"id": "right_leg", "bbox": {"min": [20, 0, 0], "max": [24, 16, 4]}},
            {"id": "neck", "bbox": {"min": [16, 16, 4], "max": [20, 24, 8]}},
            {"id": "tail", "bbox": {"min": [0, 4, 8], "max": [16, 8, 12]}}
        ]
    else:
        # Generic object - single part
        parts = [{"id": "main", "bbox": {"min": [0, 0, 0], "max": [16, 16, 16]}}]
    
    return {
        "subject": subject,
        "style": style,
        "pose": pose,
        "resolution": resolution,
        "lods": lods,
        "parts": parts,
        "palette": [
            [0, 0, 0, 0],      # Transparent
            [255, 255, 255, 255],  # White
            [255, 100, 100, 255],  # Red
            [100, 255, 100, 255],  # Green
            [100, 100, 255, 255],  # Blue
            [255, 255, 100, 255],  # Yellow
            [255, 100, 255, 255],  # Magenta
            [100, 255, 255, 255]   # Cyan
        ]
    }


def generate_part_voxels(part: Dict[str, Any], plan: Dict[str, Any]) -> List[List[int]]:
    """Generate voxels for a specific part.
    
    Args:
        part: Part definition with id and bbox
        plan: Generation plan with resolution and subject
        
    Returns:
        List of voxel coordinates [x, y, z, color_index]
    """
    bbox = part["bbox"]
    resolution = plan["resolution"]
    subject = plan["subject"]
    
    # Check if we should use OpenAI for voxel generation
    use_openai = (os.getenv("USE_OPENAI_VOXELS", "0") == "1" and 
                  is_openai_enabled() and 
                  "dragon" not in subject.lower())
    
    if use_openai:
        return _generate_voxels_with_openai(part, plan)
    else:
        return _generate_voxels_procedural(part, plan)


def _generate_voxels_with_openai(part: Dict[str, Any], plan: Dict[str, Any]) -> List[List[int]]:
    """Generate voxels using OpenAI."""
    bbox = part["bbox"]
    resolution = plan["resolution"]
    subject = plan["subject"]
    style = plan.get("style", "")
    pose = plan.get("pose", "")
    
    system_prompt = (
        "You generate voxel coordinates for a 3D model part. "
        "Output STRICT JSON: {\"voxels\": Array<{x:int,y:int,z:int,c:int}>}. "
        "Prefer dense fill to form a solid, chunky object. Up to 200000 voxels if needed. "
        "Palette indices 0-7. Coordinates must be within the bounding box."
    )
    
    user_prompt = (
        f"Subject: {subject}. Part: {part['id']}. Resolution: {resolution}. "
        f"BBox min:{bbox['min']} max:{bbox['max']}. "
        f"Style: {style}. Pose: {pose}. "
        "Return dense geometry voxels filling the interior of the shape."
    )
    
    try:
        response = call_chat_model([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        content = response["choices"][0]["message"]["content"]
        start = content.find("{")
        end = content.rfind("}")
        
        if start >= 0 and end > start:
            parsed = json.loads(content[start:end+1])
            voxels = parsed.get("voxels", [])
            
            result = []
            for v in voxels:
                x = int(v.get("x", 0))
                y = int(v.get("y", 0))
                z = int(v.get("z", 0))
                c = max(0, min(7, int(v.get("c", 0))))
                result.append([x, y, z, c])
            
            return result[:200000]  # Limit voxel count
    except Exception:
        pass  # Fall back to procedural
    
    return _generate_voxels_procedural(part, plan)


def _generate_voxels_procedural(part: Dict[str, Any], plan: Dict[str, Any]) -> List[List[int]]:
    """Generate voxels using procedural algorithms."""
    bbox = part["bbox"]
    resolution = plan["resolution"]
    part_id = part["id"]
    
    min_coords = bbox["min"]
    max_coords = bbox["max"]
    
    # Calculate center and dimensions
    cx = (min_coords[0] + max_coords[0]) / 2
    cy = (min_coords[1] + max_coords[1]) / 2
    cz = (min_coords[2] + max_coords[2]) / 2
    sx = max(1, max_coords[0] - min_coords[0])
    sy = max(1, max_coords[1] - min_coords[1])
    sz = max(1, max_coords[2] - min_coords[2])
    
    # Calculate radii
    rx = max(1, sx / 2)
    ry = max(1, sy / 2)
    rz = max(1, sz / 2)
    
    # Choose step size based on resolution
    step = max(1, int(resolution / 512))
    
    voxels = []
    
    def add_voxel(x, y, z, c):
        if len(voxels) < 200000:  # Limit voxel count
            voxels.append([int(x), int(y), int(z), int(c % 8)])
    
    # Generate based on part type
    if part_id == "body":
        # Solid ellipsoid
        for x in range(min_coords[0], max_coords[0], step):
            for y in range(min_coords[1], max_coords[1], step):
                for z in range(min_coords[2], max_coords[2], step):
                    dx = (x - cx) / rx
                    dy = (y - cy) / ry
                    dz = (z - cz) / rz
                    if dx*dx + dy*dy + dz*dz <= 1.0:
                        add_voxel(x, y, z, 2)  # Red
                        
    elif part_id in ("left_wing", "right_wing"):
        # Wing shape
        thickness = max(2, int(0.25 * sy))
        for x in range(min_coords[0], max_coords[0], step):
            for z in range(min_coords[2], max_coords[2], step):
                for y in range(int(cy - thickness/2), int(cy + thickness/2) + 1, max(1, step)):
                    add_voxel(x, y, z, 4)  # Yellow
                    
    elif part_id in ("left_leg", "right_leg", "neck"):
        # Cylindrical parts
        r_cyl = max(2, int(min(rx, rz) * 0.45))
        for y in range(min_coords[1], max_coords[1], step):
            for x in range(min_coords[0], max_coords[0], step):
                for z in range(min_coords[2], max_coords[2], step):
                    if (x - cx)**2 + (z - cz)**2 <= r_cyl * r_cyl:
                        add_voxel(x, y, z, 6)  # Magenta
                        
    elif part_id == "tail":
        # Tapered cone
        length = max(1, sx)
        for x in range(min_coords[0], max_coords[0], step):
            for y in range(min_coords[1], max_coords[1], step):
                for z in range(min_coords[2], max_coords[2], step):
                    progress = (x - min_coords[0]) / length
                    radius = max(1, rz * (1 - progress * 0.5))
                    if (y - cy)**2 + (z - cz)**2 <= radius * radius:
                        add_voxel(x, y, z, 3)  # Green
    else:
        # Default: solid box
        for x in range(min_coords[0], max_coords[0], step):
            for y in range(min_coords[1], max_coords[1], step):
                for z in range(min_coords[2], max_coords[2], step):
                    add_voxel(x, y, z, 1)  # White
    
    return voxels


def assemble_and_optimize(parts_voxels: Dict[str, List[List[int]]], plan: Dict[str, Any]) -> Dict[str, Any]:
    """Assemble parts into final model and optimize.
    
    Args:
        parts_voxels: Dictionary mapping part_id to voxel list
        plan: Generation plan
        
    Returns:
        Assembled artifact dictionary
    """
    # Merge all voxels
    merged_voxels = []
    seen_positions = set()
    
    for part_id, voxels in parts_voxels.items():
        for voxel in voxels:
            x, y, z, c = voxel
            pos_key = (x, y, z)
            if pos_key not in seen_positions:
                merged_voxels.append(voxel)
                seen_positions.add(pos_key)
    
    # Create artifact
    artifact = {
        "type": "voxel_model",
        "metadata": {
            "subject": plan.get("subject", ""),
            "style": plan.get("style", ""),
            "pose": plan.get("pose", ""),
            "resolution": plan.get("resolution", 64),
            "part_count": len(parts_voxels),
            "voxel_count": len(merged_voxels)
        },
        "palette": plan.get("palette", []),
        "voxels": merged_voxels
    }
    
    # Validate artifact
    is_valid, error = validate_asset_artifact(artifact)
    if not is_valid:
        raise ValueError(f"Invalid artifact: {error}")
    
    return artifact


def export_artifact(artifact: Dict[str, Any], lod: int) -> str:
    """Export artifact to file system.
    
    Args:
        artifact: Artifact dictionary
        lod: Level of detail
        
    Returns:
        Path to exported file
    """
    # Create filename based on content hash
    content_hash = hashlib.sha256(
        json.dumps(artifact, sort_keys=True).encode()
    ).hexdigest()[:12]
    
    filename = f"asset_{content_hash}_lod{lod}.json"
    file_path = get_artifact_path("voxels", filename)
    
    # Write artifact
    write_json(file_path, artifact)
    
    return f"/artifacts/voxels/{filename}"
