"""
Test Flask application endpoints.
"""

import json
import os
import tempfile
from pathlib import Path

import pytest
from flask import Flask

from ..app import create_app


@pytest.fixture
def app():
    """Create test Flask app."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Set test environment variables
        os.environ["ARTIFACTS_DIR"] = temp_dir
        os.environ["USE_MOCKS"] = "1"
        os.environ["DEBUG"] = "1"
        
        app = create_app()
        app.config["TESTING"] = True
        
        yield app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test health endpoint returns OK."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.get_json()
        assert data["ok"] is True
        assert "ts" in data


class TestJobEndpoints:
    """Test job management endpoints."""
    
    def test_create_job(self, client):
        """Test job creation."""
        response = client.post("/jobs", json={"prompt": "test prompt"})
        assert response.status_code == 202
        
        data = response.get_json()
        assert "jobId" in data
        assert data["status"] == "queued"
    
    def test_get_job_status(self, client):
        """Test job status retrieval."""
        # Create a job first
        create_response = client.post("/jobs", json={"prompt": "test prompt"})
        job_id = create_response.get_json()["jobId"]
        
        # Get job status
        response = client.get(f"/jobs/{job_id}")
        assert response.status_code == 200
        
        data = response.get_json()
        assert data["id"] == job_id
        assert "status" in data
        assert "progress" in data
    
    def test_get_nonexistent_job(self, client):
        """Test getting non-existent job."""
        response = client.get("/jobs/nonexistent")
        assert response.status_code == 404
        
        data = response.get_json()
        assert data["error"] == "not_found"


class TestGenAIAssetEndpoints:
    """Test GenAI Asset Agent endpoints."""
    
    def test_create_asset_job(self, client):
        """Test asset job creation."""
        payload = {
            "type": "model",
            "subject": "dragon",
            "mode": "voxel",
            "resolution": 64,
            "style": "cartoony",
            "pose": "flying"
        }
        
        response = client.post("/agent/genai/asset", json=payload)
        assert response.status_code == 202
        
        data = response.get_json()
        assert "jobId" in data
        assert data["status"] == "queued"


class TestScriptingEndpoints:
    """Test Scripting Agent endpoints."""
    
    def test_generate_scene_script(self, client):
        """Test scene script generation."""
        payload = {
            "prompt": "Create a 2D platformer with a dragon boss",
            "options": {
                "format": "json",
                "complexity": "medium",
                "game_type": "platformer"
            }
        }
        
        response = client.post("/agent/scripting/generate", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "scene_manifest" in data
        assert "entities" in data["scene_manifest"]
        assert "systems" in data["scene_manifest"]


class TestAnimationEndpoints:
    """Test Animation Agent endpoints."""
    
    def test_create_animation(self, client):
        """Test animation creation."""
        payload = {
            "model_ref": {"id": "character", "type": "character"},
            "prompt": "Create a walking animation"
        }
        
        response = client.post("/agent/animation/create", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "animation" in data
        assert "keyframes" in data["animation"]
        assert "duration" in data["animation"]
    
    def test_create_animation_from_asset(self, client):
        """Test animation creation from asset."""
        payload = {
            "asset_id": "dragon_asset",
            "prompt": "Create a flying animation"
        }
        
        response = client.post("/agent/animation/from_asset", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "animation" in data


class TestHelperEndpoints:
    """Test Helper Agent endpoints."""
    
    def test_query_help(self, client):
        """Test help querying."""
        payload = {
            "context": {"entities": [], "voxels": []},
            "question": "How to reduce polycount?"
        }
        
        response = client.post("/agent/helper/query", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "answer" in data
        assert "actions" in data
    
    def test_get_templates(self, client):
        """Test template retrieval."""
        response = client.get("/agent/helper/templates")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "templates" in data
        assert "assets" in data["templates"]
    
    def test_analyze_project(self, client):
        """Test project analysis."""
        payload = {
            "project_data": {
                "entities": [{"id": "test", "type": "character"}],
                "voxels": [1, 2, 3, 4, 5]
            }
        }
        
        response = client.post("/agent/helper/analyze", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "suggestions" in data
        assert "warnings" in data


class TestLevelGenEndpoints:
    """Test Level Design Agent endpoints."""
    
    def test_generate_level(self, client):
        """Test level generation."""
        payload = {
            "seed": 12345,
            "size": [20, 15],
            "theme": "forest",
            "difficulty": "medium"
        }
        
        response = client.post("/agent/levelgen/generate", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "level" in data
        assert "tiles" in data["level"]
        assert "entities" in data["level"]
    
    def test_create_level_preview(self, client):
        """Test level preview creation."""
        level_data = {
            "tiles": [[1, 1], [1, 1]],
            "entities": [{"id": "test", "type": "character", "position": [0, 0]}],
            "metadata": {"name": "Test Level"}
        }
        
        payload = {"level_data": level_data}
        response = client.post("/agent/levelgen/preview", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "preview_path" in data


class TestDeployEndpoints:
    """Test Deployment Agent endpoints."""
    
    def test_package_build(self, client):
        """Test build packaging."""
        payload = {"scene_id": "test_scene"}
        
        response = client.post("/agent/deploy/package", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "build_path" in data
        assert data["build_path"].endswith(".zip")
    
    def test_publish_build(self, client):
        """Test build publishing."""
        payload = {
            "scene_id": "test_scene",
            "provider": "vercel",
            "options": {}
        }
        
        response = client.post("/agent/deploy/publish", json=payload)
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_id" in data
        assert "status" in data
        assert "url" in data
    
    def test_get_deployment_status(self, client):
        """Test deployment status retrieval."""
        deployment_id = "test_deployment"
        
        response = client.get(f"/agent/deploy/status/{deployment_id}")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployment_id" in data
        assert "status" in data
    
    def test_list_deployments(self, client):
        """Test deployment listing."""
        response = client.get("/agent/deploy/list")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "deployments" in data
        assert isinstance(data["deployments"], list)


class TestOrchestratorEndpoints:
    """Test Orchestrator endpoints."""
    
    def test_run_workflow(self, client):
        """Test workflow execution."""
        payload = {
            "prompt": "Create a flying dragon level",
            "pipeline_steps": ["scripting", "levelgen", "genai_asset"]
        }
        
        response = client.post("/agent/orchestrator/workflow", json=payload)
        assert response.status_code == 202
        
        data = response.get_json()
        assert "jobId" in data
        assert data["status"] == "queued"
    
    def test_get_workflow_status(self, client):
        """Test workflow status retrieval."""
        # Create a workflow first
        create_response = client.post("/agent/orchestrator/workflow", 
                                    json={"prompt": "test workflow"})
        job_id = create_response.get_json()["jobId"]
        
        # Get workflow status
        response = client.get(f"/agent/orchestrator/workflow/{job_id}")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "job_id" in data
        assert "status" in data
    
    def test_get_workflow_templates(self, client):
        """Test workflow template listing."""
        response = client.get("/agent/orchestrator/templates")
        assert response.status_code == 200
        
        data = response.get_json()
        assert "templates" in data
        assert len(data["templates"]) > 0
    
    def test_get_workflow_template(self, client):
        """Test workflow template retrieval."""
        response = client.get("/agent/orchestrator/templates/complete_game")
        assert response.status_code == 200
        
        data = response.get_json()
        assert data["id"] == "complete_game"
        assert "steps" in data


class TestArtifactsEndpoint:
    """Test artifacts serving endpoint."""
    
    def test_get_artifact(self, client):
        """Test artifact retrieval."""
        # This would test serving files from the artifacts directory
        # For now, just test that the endpoint exists
        response = client.get("/artifacts/test_file.json")
        # Should return 404 for non-existent file, which is expected
        assert response.status_code == 404


if __name__ == "__main__":
    pytest.main([__file__])
