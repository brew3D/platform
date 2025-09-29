"""
Orchestrator for multi-agent workflow composition.

Responsibilities:
- Compose agents into higher-level workflows
- Manage multi-step job execution
- Coordinate agent outputs and dependencies
- Provide idempotent workflow execution

API:
- run_composed_workflow(prompt, pipeline_steps) -> job_id: Run multi-agent workflow
- get_workflow_status(job_id) -> status: Get workflow execution status
- list_available_workflows() -> workflows: List available workflow templates

Environment:
- USE_MOCKS: Use mock responses (default: 1)
"""

import json
from typing import Any, Dict, List, Optional

from .. import jobs
from .genai_asset import start_asset_job
from .scripting import generate_scene_script
from .animation import generate_animation_from_model
from .helper import query_help, analyze_project_state
from .levelgen import generate_level
from .deploy import package_build, publish_build


def run_composed_workflow(prompt: str, pipeline_steps: Optional[List[str]] = None) -> str:
    """Run a composed multi-agent workflow.
    
    Args:
        prompt: High-level description of what to create
        pipeline_steps: List of steps to execute (optional, auto-detected if None)
        
    Returns:
        job_id for tracking workflow progress
    """
    # Auto-detect pipeline steps if not provided
    if pipeline_steps is None:
        pipeline_steps = _detect_pipeline_steps(prompt)
    
    # Create workflow job
    job_id = jobs.create_job(f"Workflow: {prompt}", 
                            lambda jid, _: _run_workflow(jid, prompt, pipeline_steps))
    
    return job_id


def _detect_pipeline_steps(prompt: str) -> List[str]:
    """Detect appropriate pipeline steps from prompt."""
    prompt_lower = prompt.lower()
    steps = []
    
    # Always start with scene generation
    steps.append("scripting")
    
    # Add level generation if mentioned
    if any(word in prompt_lower for word in ["level", "world", "environment", "map"]):
        steps.append("levelgen")
    
    # Add asset generation if mentioned
    if any(word in prompt_lower for word in ["dragon", "character", "model", "3d", "asset"]):
        steps.append("genai_asset")
    
    # Add animation if mentioned
    if any(word in prompt_lower for word in ["animate", "movement", "walk", "fly", "jump"]):
        steps.append("animation")
    
    # Add deployment if mentioned
    if any(word in prompt_lower for word in ["deploy", "publish", "build", "export"]):
        steps.append("deploy")
    
    return steps


def _run_workflow(job_id: str, prompt: str, pipeline_steps: List[str]):
    """Execute the workflow steps."""
    try:
        jobs.append_progress(job_id, f"Starting workflow with steps: {', '.join(pipeline_steps)}")
        
        workflow_state = {
            "prompt": prompt,
            "steps": pipeline_steps,
            "completed_steps": [],
            "artifacts": {},
            "errors": []
        }
        
        # Execute each step
        for step in pipeline_steps:
            jobs.append_progress(job_id, f"Executing step: {step}")
            
            try:
                step_result = _execute_step(step, prompt, workflow_state)
                workflow_state["completed_steps"].append(step)
                workflow_state["artifacts"][step] = step_result
                
                jobs.append_progress(job_id, f"Completed step: {step}")
                
            except Exception as e:
                error_msg = f"Step {step} failed: {str(e)}"
                workflow_state["errors"].append(error_msg)
                jobs.append_progress(job_id, error_msg)
                
                # Continue with other steps unless it's a critical step
                if step in ["scripting"]:  # Critical steps
                    raise e
        
        # Attach final workflow state
        jobs.attach_artifact(job_id, "workflow_state", workflow_state)
        
        # Generate summary
        summary = _generate_workflow_summary(workflow_state)
        jobs.attach_artifact(job_id, "summary", summary)
        
        jobs.append_progress(job_id, "Workflow completed successfully")
        jobs.complete_job(job_id)
        
    except Exception as e:
        jobs.fail_job(job_id, f"Workflow failed: {str(e)}")


def _execute_step(step: str, prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a single workflow step."""
    if step == "scripting":
        return _execute_scripting_step(prompt, workflow_state)
    elif step == "levelgen":
        return _execute_levelgen_step(prompt, workflow_state)
    elif step == "genai_asset":
        return _execute_asset_step(prompt, workflow_state)
    elif step == "animation":
        return _execute_animation_step(prompt, workflow_state)
    elif step == "deploy":
        return _execute_deploy_step(prompt, workflow_state)
    else:
        raise ValueError(f"Unknown step: {step}")


def _execute_scripting_step(prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute scripting step."""
    # Determine game type from prompt
    prompt_lower = prompt.lower()
    if "platformer" in prompt_lower:
        game_type = "platformer"
    elif "puzzle" in prompt_lower:
        game_type = "puzzle"
    elif "rpg" in prompt_lower or "role" in prompt_lower:
        game_type = "rpg"
    else:
        game_type = "platformer"  # Default
    
    # Generate scene script
    scene_manifest = generate_scene_script(prompt, {
        "format": "json",
        "complexity": "medium",
        "game_type": game_type
    })
    
    return {
        "type": "scene_manifest",
        "data": scene_manifest,
        "step": "scripting"
    }


def _execute_levelgen_step(prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute level generation step."""
    # Extract theme from prompt
    prompt_lower = prompt.lower()
    if "forest" in prompt_lower:
        theme = "forest"
    elif "dungeon" in prompt_lower or "cave" in prompt_lower:
        theme = "dungeon"
    elif "city" in prompt_lower or "urban" in prompt_lower:
        theme = "city"
    elif "space" in prompt_lower or "sci-fi" in prompt_lower:
        theme = "space"
    else:
        theme = "forest"  # Default
    
    # Generate level
    level_data = generate_level(
        seed=hash(prompt) % 10000,
        size=(20, 15),
        theme=theme,
        difficulty="medium"
    )
    
    return {
        "type": "level_data",
        "data": level_data,
        "step": "levelgen"
    }


def _execute_asset_step(prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute asset generation step."""
    # Extract asset type from prompt
    prompt_lower = prompt.lower()
    if "dragon" in prompt_lower:
        subject = "dragon"
        style = "cartoony"
        pose = "flying"
    elif "character" in prompt_lower or "player" in prompt_lower:
        subject = "character"
        style = "realistic"
        pose = "standing"
    else:
        subject = "object"
        style = "simple"
        pose = "default"
    
    # Start asset generation job
    asset_job_id = start_asset_job({
        "type": "model",
        "subject": subject,
        "mode": "voxel",
        "resolution": 64,
        "style": style,
        "pose": pose,
        "seed": hash(prompt) % 10000
    })
    
    return {
        "type": "asset_job",
        "job_id": asset_job_id,
        "step": "genai_asset"
    }


def _execute_animation_step(prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute animation step."""
    # Get scene manifest from previous steps
    scene_manifest = None
    if "scripting" in workflow_state["artifacts"]:
        scene_manifest = workflow_state["artifacts"]["scripting"]["data"]
    
    # Create model reference
    model_ref = {
        "type": "character",
        "id": "main_character",
        "properties": {"animated": True}
    }
    
    # Generate animation
    animation_data = generate_animation_from_model(model_ref, prompt)
    
    return {
        "type": "animation_data",
        "data": animation_data,
        "step": "animation"
    }


def _execute_deploy_step(prompt: str, workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Execute deployment step."""
    # Generate scene ID
    scene_id = f"scene_{hash(prompt) % 10000}"
    
    # Package build
    build_path = package_build(scene_id)
    
    # Publish build (mock)
    deployment_info = publish_build(scene_id, "vercel", {})
    
    return {
        "type": "deployment",
        "build_path": build_path,
        "deployment_info": deployment_info,
        "step": "deploy"
    }


def _generate_workflow_summary(workflow_state: Dict[str, Any]) -> Dict[str, Any]:
    """Generate workflow execution summary."""
    completed_steps = workflow_state["completed_steps"]
    artifacts = workflow_state["artifacts"]
    errors = workflow_state["errors"]
    
    summary = {
        "total_steps": len(workflow_state["steps"]),
        "completed_steps": len(completed_steps),
        "failed_steps": len(errors),
        "artifacts_generated": len(artifacts),
        "errors": errors,
        "success_rate": len(completed_steps) / len(workflow_state["steps"]) if workflow_state["steps"] else 0
    }
    
    # Add step-specific summaries
    if "scripting" in completed_steps:
        scene_data = artifacts["scripting"]["data"]
        summary["entities_created"] = len(scene_data.get("entities", []))
        summary["systems_configured"] = len(scene_data.get("systems", {}))
    
    if "levelgen" in completed_steps:
        level_data = artifacts["levelgen"]["data"]
        summary["level_size"] = level_data.get("metadata", {}).get("size", [0, 0])
        summary["difficulty"] = level_data.get("metadata", {}).get("difficulty", "unknown")
    
    if "genai_asset" in completed_steps:
        summary["assets_generated"] = 1
    
    if "animation" in completed_steps:
        summary["animations_created"] = 1
    
    if "deploy" in completed_steps:
        summary["deployment_url"] = artifacts["deploy"]["deployment_info"].get("url", "unknown")
    
    return summary


def get_workflow_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get workflow execution status.
    
    Args:
        job_id: Workflow job identifier
        
    Returns:
        Workflow status information or None if not found
    """
    job_manifest = jobs.get_job(job_id)
    if not job_manifest:
        return None
    
    return {
        "job_id": job_id,
        "status": job_manifest.get("status", "unknown"),
        "progress": job_manifest.get("progress", []),
        "artifacts": job_manifest.get("artifacts", {}),
        "created_at": job_manifest.get("created_at"),
        "updated_at": job_manifest.get("updated_at")
    }


def list_available_workflows() -> List[Dict[str, Any]]:
    """List available workflow templates.
    
    Returns:
        List of workflow templates
    """
    return [
        {
            "id": "complete_game",
            "name": "Complete Game Creation",
            "description": "Create a complete game with scene, level, assets, and deployment",
            "steps": ["scripting", "levelgen", "genai_asset", "animation", "deploy"],
            "estimated_time": "5-10 minutes"
        },
        {
            "id": "scene_only",
            "name": "Scene Generation",
            "description": "Generate just a game scene with entities and systems",
            "steps": ["scripting"],
            "estimated_time": "1-2 minutes"
        },
        {
            "id": "level_design",
            "name": "Level Design",
            "description": "Create procedural levels with assets",
            "steps": ["scripting", "levelgen", "genai_asset"],
            "estimated_time": "3-5 minutes"
        },
        {
            "id": "asset_pipeline",
            "name": "Asset Pipeline",
            "description": "Generate 3D assets with animations",
            "steps": ["genai_asset", "animation"],
            "estimated_time": "2-4 minutes"
        },
        {
            "id": "quick_deploy",
            "name": "Quick Deploy",
            "description": "Package and deploy existing scene",
            "steps": ["deploy"],
            "estimated_time": "1-2 minutes"
        }
    ]


def get_workflow_template(template_id: str) -> Optional[Dict[str, Any]]:
    """Get specific workflow template.
    
    Args:
        template_id: Template identifier
        
    Returns:
        Workflow template or None if not found
    """
    workflows = list_available_workflows()
    for workflow in workflows:
        if workflow["id"] == template_id:
            return workflow
    return None
