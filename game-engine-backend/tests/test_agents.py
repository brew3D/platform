"""
Comprehensive tests for all agents.
"""

import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

from ..agents import (
    genai_asset, scripting, animation, helper, 
    levelgen, deploy, orchestrator
)
from ..utils import auth, storage, openai_client, validators


class TestGenAIAssetAgent:
    """Test GenAI Asset Agent."""
    
    def test_start_asset_job(self):
        """Test starting an asset generation job."""
        prompt = {
            "type": "model",
            "subject": "dragon",
            "mode": "voxel",
            "resolution": 64,
            "style": "cartoony",
            "pose": "flying"
        }
        
        job_id = genai_asset.start_asset_job(prompt)
        assert job_id.startswith("job_")
        assert len(job_id) > 10
    
    def test_generate_part_voxels(self):
        """Test voxel generation for a part."""
        part = {
            "id": "body",
            "bbox": {"min": [0, 0, 0], "max": [16, 16, 16]}
        }
        plan = {
            "subject": "dragon",
            "resolution": 64,
            "style": "cartoony",
            "pose": "flying"
        }
        
        voxels = genai_asset.generate_part_voxels(part, plan)
        assert isinstance(voxels, list)
        assert len(voxels) > 0
        assert all(len(v) == 4 for v in voxels)  # x, y, z, color
    
    def test_assemble_and_optimize(self):
        """Test assembling parts into final model."""
        parts_voxels = {
            "body": [[0, 0, 0, 1], [1, 0, 0, 1]],
            "wing": [[8, 0, 0, 2], [9, 0, 0, 2]]
        }
        plan = {
            "subject": "dragon",
            "resolution": 64,
            "palette": [[0, 0, 0, 0], [255, 255, 255, 255]]
        }
        
        artifact = genai_asset.assemble_and_optimize(parts_voxels, plan)
        assert "type" in artifact
        assert "metadata" in artifact
        assert "voxels" in artifact
        assert len(artifact["voxels"]) > 0


class TestScriptingAgent:
    """Test Scripting Agent."""
    
    def test_generate_scene_script(self):
        """Test scene script generation."""
        prompt = "Create a 2D platformer with a dragon boss"
        options = {
            "format": "json",
            "complexity": "medium",
            "game_type": "platformer"
        }
        
        scene_manifest = scripting.generate_scene_script(prompt, options)
        assert "entities" in scene_manifest
        assert "systems" in scene_manifest
        assert "metadata" in scene_manifest
        assert isinstance(scene_manifest["entities"], list)
        assert isinstance(scene_manifest["systems"], dict)
    
    def test_validate_scene_script(self):
        """Test scene script validation."""
        valid_manifest = {
            "entities": [
                {"id": "player", "type": "character", "position": [0, 0, 0]}
            ],
            "systems": {"physics": {}},
            "metadata": {"name": "Test Scene"}
        }
        
        is_valid, error = scripting.validate_scene_script(valid_manifest)
        assert is_valid
        assert error is None
        
        # Test invalid manifest
        invalid_manifest = {"entities": "not_a_list"}
        is_valid, error = scripting.validate_scene_script(invalid_manifest)
        assert not is_valid
        assert error is not None


class TestAnimationAgent:
    """Test Animation Agent."""
    
    def test_generate_animation_from_model(self):
        """Test animation generation from model."""
        model_ref = {
            "id": "character",
            "type": "character",
            "properties": {"animated": True}
        }
        animation_prompt = "Create a walking animation"
        
        animation_data = animation.generate_animation_from_model(model_ref, animation_prompt)
        assert "keyframes" in animation_data
        assert "duration" in animation_data
        assert "target" in animation_data
        assert isinstance(animation_data["keyframes"], list)
        assert animation_data["duration"] > 0
    
    def test_create_walk_cycle(self):
        """Test walk cycle creation."""
        walk_cycle = animation.create_walk_cycle("character")
        assert walk_cycle["target"] == "character"
        assert walk_cycle["loop"] is True
        assert len(walk_cycle["keyframes"]) > 0
    
    def test_apply_animation_to_scene(self):
        """Test applying animation to scene."""
        scene = {
            "entities": [
                {"id": "character", "type": "character", "position": [0, 0, 0]}
            ]
        }
        animation_data = {
            "keyframes": [],
            "duration": 2.0,
            "target": "character"
        }
        
        modified_scene = animation.apply_animation_to_scene(scene, animation_data)
        assert "animations" in modified_scene["entities"][0]
        assert len(modified_scene["entities"][0]["animations"]) == 1


class TestHelperAgent:
    """Test Helper Agent."""
    
    def test_query_help(self):
        """Test help querying."""
        context = {"entities": [], "voxels": []}
        question = "How to reduce polycount?"
        
        help_response = helper.query_help(context, question)
        assert "answer" in help_response
        assert "actions" in help_response
        assert isinstance(help_response["actions"], list)
    
    def test_get_templates(self):
        """Test template retrieval."""
        templates = helper.get_templates()
        assert "assets" in templates
        assert "scenes" in templates
        assert "animations" in templates
        assert "levels" in templates
        
        # Test category filtering
        asset_templates = helper.get_templates("assets")
        assert "assets" in asset_templates
        assert len(asset_templates["assets"]) > 0
    
    def test_analyze_project_state(self):
        """Test project state analysis."""
        project_data = {
            "entities": [{"id": "test", "type": "character"}],
            "voxels": [1, 2, 3, 4, 5],
            "lighting": {"ambient": 0.3},
            "physics": {"gravity": -9.81}
        }
        
        analysis = helper.analyze_project_state(project_data)
        assert "suggestions" in analysis
        assert "warnings" in analysis
        assert "optimizations" in analysis
        assert "summary" in analysis


class TestLevelGenAgent:
    """Test Level Design Agent."""
    
    def test_generate_level(self):
        """Test level generation."""
        level_data = levelgen.generate_level(
            seed=12345,
            size=(20, 15),
            theme="forest",
            difficulty="medium"
        )
        
        assert "tiles" in level_data
        assert "entities" in level_data
        assert "metadata" in level_data
        assert len(level_data["tiles"]) == 15  # height
        assert len(level_data["tiles"][0]) == 20  # width
        assert len(level_data["entities"]) > 0
    
    def test_create_preview(self):
        """Test level preview creation."""
        level_data = {
            "tiles": [[1, 1], [1, 1]],
            "entities": [{"id": "test", "type": "character", "position": [0, 0]}],
            "metadata": {"name": "Test Level"}
        }
        
        preview_path = levelgen.create_preview(level_data)
        assert preview_path.startswith("/artifacts/previews/")
        assert preview_path.endswith(".json")
    
    def test_validate_level(self):
        """Test level validation."""
        valid_level = {
            "tiles": [[1, 1], [1, 1]],
            "entities": [{"id": "test", "type": "character", "position": [0, 0]}],
            "metadata": {"name": "Test Level"}
        }
        
        is_valid, error = levelgen.validate_level(valid_level)
        assert is_valid
        assert error is None


class TestDeployAgent:
    """Test Deployment Agent."""
    
    def test_package_build(self):
        """Test build packaging."""
        scene_id = "test_scene"
        build_path = deploy.package_build(scene_id)
        
        assert build_path.endswith(".zip")
        assert "test_scene" in build_path
        assert os.path.exists(build_path)
    
    def test_publish_build(self):
        """Test build publishing."""
        scene_id = "test_scene"
        provider = "vercel"
        options = {}
        
        deployment_info = deploy.publish_build(scene_id, provider, options)
        assert "deployment_id" in deployment_info
        assert "status" in deployment_info
        assert "provider" in deployment_info
        assert "url" in deployment_info
    
    def test_get_deployment_status(self):
        """Test deployment status retrieval."""
        deployment_id = "test_deployment"
        status = deploy.get_deployment_status(deployment_id)
        
        assert "deployment_id" in status
        assert "status" in status
        assert "url" in status


class TestOrchestrator:
    """Test Orchestrator."""
    
    def test_run_composed_workflow(self):
        """Test workflow execution."""
        prompt = "Create a flying dragon level"
        pipeline_steps = ["scripting", "levelgen", "genai_asset"]
        
        job_id = orchestrator.run_composed_workflow(prompt, pipeline_steps)
        assert job_id.startswith("job_")
    
    def test_detect_pipeline_steps(self):
        """Test pipeline step detection."""
        # Test with level mention
        prompt = "Create a forest level with enemies"
        steps = orchestrator._detect_pipeline_steps(prompt)
        assert "scripting" in steps
        assert "levelgen" in steps
        
        # Test with asset mention
        prompt = "Create a dragon character with animation"
        steps = orchestrator._detect_pipeline_steps(prompt)
        assert "scripting" in steps
        assert "genai_asset" in steps
        assert "animation" in steps
    
    def test_list_available_workflows(self):
        """Test workflow template listing."""
        workflows = orchestrator.list_available_workflows()
        assert len(workflows) > 0
        
        workflow_ids = [w["id"] for w in workflows]
        assert "complete_game" in workflow_ids
        assert "scene_only" in workflow_ids
    
    def test_get_workflow_template(self):
        """Test workflow template retrieval."""
        template = orchestrator.get_workflow_template("complete_game")
        assert template is not None
        assert template["id"] == "complete_game"
        assert "steps" in template
        
        # Test non-existent template
        template = orchestrator.get_workflow_template("nonexistent")
        assert template is None


class TestUtils:
    """Test utility functions."""
    
    def test_auth_functions(self):
        """Test authentication functions."""
        user_id = "test_user"
        token = auth.generate_token(user_id)
        assert isinstance(token, str)
        assert len(token) > 0
        
        decoded_user_id = auth.verify_token(token)
        assert decoded_user_id == user_id
        
        # Test invalid token
        invalid_token = "invalid_token"
        decoded_user_id = auth.verify_token(invalid_token)
        assert decoded_user_id is None
    
    def test_storage_functions(self):
        """Test storage functions."""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Test directory creation
            test_dir = Path(temp_dir) / "test_dir"
            storage.make_dirs(test_dir)
            assert test_dir.exists()
            
            # Test JSON writing and reading
            test_data = {"test": "data", "number": 42}
            test_file = test_dir / "test.json"
            storage.write_json(test_file, test_data)
            assert test_file.exists()
            
            read_data = storage.read_json(test_file)
            assert read_data == test_data
            
            # Test non-existent file
            non_existent = test_dir / "nonexistent.json"
            read_data = storage.read_json(non_existent)
            assert read_data is None
    
    def test_openai_client_mocking(self):
        """Test OpenAI client mocking."""
        # Test chat model call
        messages = [{"role": "user", "content": "Hello"}]
        response = openai_client.call_chat_model(messages)
        assert "choices" in response
        assert len(response["choices"]) > 0
        
        # Test Shape-E call
        response = openai_client.call_shapee("test prompt")
        assert "status" in response
        assert "artifact_path" in response
    
    def test_validators(self):
        """Test validation functions."""
        # Test scene manifest validation
        valid_scene = {
            "entities": [{"id": "test", "type": "character", "position": [0, 0, 0]}],
            "systems": {"physics": {}},
            "metadata": {"name": "Test"}
        }
        is_valid, error = validators.validate_scene_manifest(valid_scene)
        assert is_valid
        assert error is None
        
        # Test animation validation
        valid_animation = {
            "keyframes": [{"time": 0, "property": "position", "value": [0, 0, 0]}],
            "duration": 2.0,
            "target": "character"
        }
        is_valid, error = validators.validate_animation_data(valid_animation)
        assert is_valid
        assert error is None
        
        # Test string sanitization
        dirty_string = "Test\x00string\nwith\ttabs"
        clean_string = validators.sanitize_string(dirty_string)
        assert "\x00" not in clean_string
        assert "\n" in clean_string  # Should preserve newlines
        assert "\t" in clean_string  # Should preserve tabs


if __name__ == "__main__":
    pytest.main([__file__])
