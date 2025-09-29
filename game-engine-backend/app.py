"""
Flask app bootstrap with CORS and SocketIO.

Endpoints:
- GET /health: Simple health check.
- POST /jobs: Enqueue a simple demo job. Body: {"prompt": "..."}
- GET /jobs/<id>: Retrieve job status and manifest JSON.
- GET /artifacts/<path>: Serve files from ARTIFACTS_DIR.

Environment:
- DEBUG: enable debug logging and Flask debug mode.
- USE_MOCKS: if "1", demo job runs in mock mode (no external calls).
- ARTIFACTS_DIR: root for artifacts; defaults to ./artifacts relative to this file.

The long-running demo job is executed asynchronously via ThreadPoolExecutor
through the job runner in jobs.py. Manifests are persisted under
artifacts/manifests/<job_id>.json
"""

import json
import os
import time
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO

from . import jobs as jobs_mod  # type: ignore
from .agents import (
    genai_asset, scripting, animation, helper, 
    levelgen, deploy, orchestrator
)
from .utils.auth import requires_auth


# Load environment variables
load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)

    # Config
    app.config["DEBUG"] = os.getenv("DEBUG", "0") == "1"
    app.config["USE_MOCKS"] = os.getenv("USE_MOCKS", "1") == "1"

    CORS(app)

    # Socket.IO for future realtime progress; namespace reserved
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

    artifacts_dir = Path(os.getenv("ARTIFACTS_DIR", Path(__file__).parent / "artifacts"))
    manifests_dir = artifacts_dir / "manifests"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    manifests_dir.mkdir(parents=True, exist_ok=True)

    # Health check
    @app.get("/health")
    def health():
        return jsonify({"ok": True, "ts": datetime.utcnow().isoformat() + "Z"})

    # Static artifacts serving
    @app.get("/artifacts/<path:subpath>")
    def get_artifact(subpath: str):
        # Serve files rooted at artifacts_dir
        directory = artifacts_dir
        return send_from_directory(directory, subpath, as_attachment=False)

    # Demo job function for Step 0
    def demo_job(job_id: str, prompt: str):
        """A short demo job that updates progress and completes.

        This simulates some work by sleeping. It writes simple artifacts
        data to the manifest via the job runner helpers.
        """
        jobs_mod.append_progress(job_id, f"Started demo job for prompt: {prompt}")
        for i in range(3):
            time.sleep(0.2)
            jobs_mod.append_progress(job_id, f"Working step {i+1}/3")
        # Attach a tiny artifact
        jobs_mod.attach_artifact(job_id, "demo", {"echo": prompt, "length": len(prompt or "")})
        jobs_mod.complete_job(job_id)

    # Create a job
    @app.post("/jobs")
    def create_job_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            prompt = data.get("prompt", "")
            job_id = jobs_mod.create_job(prompt, demo_job)
            return jsonify({"jobId": job_id, "status": "queued"}), 202
        except Exception as exc:  # pragma: no cover - safety net
            return jsonify({
                "error": "failed_to_create_job",
                "code": 500,
                "details": {"message": str(exc)},
            }), 500

    # Get job status
    @app.get("/jobs/<job_id>")
    def get_job_endpoint(job_id: str):
        manifest = jobs_mod.get_job(job_id)
        if not manifest:
            return jsonify({"error": "not_found", "code": 404}), 404
        return jsonify(manifest)

    # GenAI Asset Agent endpoints
    @app.post("/agent/genai/asset")
    def create_asset_job():
        try:
            data = request.get_json(force=True, silent=True) or {}
            job_id = genai_asset.start_asset_job(data)
            return jsonify({"jobId": job_id, "status": "queued"}), 202
        except Exception as exc:
            return jsonify({
                "error": "failed_to_create_asset_job",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Scripting Agent endpoints
    @app.post("/agent/scripting/generate")
    def generate_scene_script_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            prompt = data.get("prompt", "")
            options = data.get("options", {})
            
            scene_manifest = scripting.generate_scene_script(prompt, options)
            return jsonify({"scene_manifest": scene_manifest}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_generate_script",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Animation Agent endpoints
    @app.post("/agent/animation/create")
    def create_animation_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            model_ref = data.get("model_ref", {})
            animation_prompt = data.get("prompt", "")
            
            animation_data = animation.generate_animation_from_model(model_ref, animation_prompt)
            return jsonify({"animation": animation_data}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_create_animation",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.post("/agent/animation/from_asset")
    def create_animation_from_asset_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            asset_id = data.get("asset_id", "")
            animation_prompt = data.get("prompt", "")
            
            # Create model reference from asset
            model_ref = {"id": asset_id, "type": "asset", "properties": {"animated": True}}
            animation_data = animation.generate_animation_from_model(model_ref, animation_prompt)
            return jsonify({"animation": animation_data}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_create_asset_animation",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Helper Agent endpoints
    @app.post("/agent/helper/query")
    def query_help_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            context = data.get("context", {})
            question = data.get("question", "")
            
            help_response = helper.query_help(context, question)
            return jsonify(help_response), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_help",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/helper/templates")
    def get_help_templates():
        try:
            category = request.args.get("category")
            templates = helper.get_templates(category)
            return jsonify({"templates": templates}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_templates",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.post("/agent/helper/analyze")
    def analyze_project_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            project_data = data.get("project_data", {})
            
            analysis = helper.analyze_project_state(project_data)
            return jsonify(analysis), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_analyze_project",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Level Design Agent endpoints
    @app.post("/agent/levelgen/generate")
    def generate_level_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            seed = data.get("seed", 12345)
            size = data.get("size", [20, 15])
            theme = data.get("theme", "forest")
            difficulty = data.get("difficulty", "medium")
            
            level_data = levelgen.generate_level(seed, tuple(size), theme, difficulty)
            return jsonify({"level": level_data}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_generate_level",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.post("/agent/levelgen/preview")
    def create_level_preview_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            level_data = data.get("level_data", {})
            
            preview_path = levelgen.create_preview(level_data)
            return jsonify({"preview_path": preview_path}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_create_preview",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Deployment Agent endpoints
    @app.post("/agent/deploy/package")
    def package_build_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            scene_id = data.get("scene_id", "default_scene")
            
            build_path = deploy.package_build(scene_id)
            return jsonify({"build_path": build_path}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_package_build",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.post("/agent/deploy/publish")
    def publish_build_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            scene_id = data.get("scene_id", "default_scene")
            provider = data.get("provider", "vercel")
            options = data.get("options", {})
            
            deployment_info = deploy.publish_build(scene_id, provider, options)
            return jsonify(deployment_info), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_publish_build",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/deploy/status/<deployment_id>")
    def get_deployment_status_endpoint(deployment_id: str):
        try:
            status = deploy.get_deployment_status(deployment_id)
            return jsonify(status), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_deployment_status",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/deploy/list")
    def list_deployments_endpoint():
        try:
            scene_id = request.args.get("scene_id")
            deployments = deploy.list_deployments(scene_id)
            return jsonify({"deployments": deployments}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_list_deployments",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Orchestrator endpoints
    @app.post("/agent/orchestrator/workflow")
    def run_workflow_endpoint():
        try:
            data = request.get_json(force=True, silent=True) or {}
            prompt = data.get("prompt", "")
            pipeline_steps = data.get("pipeline_steps")
            
            job_id = orchestrator.run_composed_workflow(prompt, pipeline_steps)
            return jsonify({"jobId": job_id, "status": "queued"}), 202
        except Exception as exc:
            return jsonify({
                "error": "failed_to_start_workflow",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/orchestrator/workflow/<job_id>")
    def get_workflow_status_endpoint(job_id: str):
        try:
            status = orchestrator.get_workflow_status(job_id)
            if not status:
                return jsonify({"error": "workflow_not_found", "code": 404}), 404
            return jsonify(status), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_workflow_status",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/orchestrator/templates")
    def get_workflow_templates_endpoint():
        try:
            templates = orchestrator.list_available_workflows()
            return jsonify({"templates": templates}), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_templates",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    @app.get("/agent/orchestrator/templates/<template_id>")
    def get_workflow_template_endpoint(template_id: str):
        try:
            template = orchestrator.get_workflow_template(template_id)
            if not template:
                return jsonify({"error": "template_not_found", "code": 404}), 404
            return jsonify(template), 200
        except Exception as exc:
            return jsonify({
                "error": "failed_to_get_template",
                "code": 500,
                "details": {"message": str(exc)}
            }), 500

    # Stash socketio on app for external access if needed later
    app.socketio = socketio  # type: ignore[attr-defined]
    return app


app = create_app()


if __name__ == "__main__":
    # Run development server
    debug = app.config.get("DEBUG", False)
    # Use SocketIO run to ensure compatibility
    app.socketio.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 5050)), debug=debug)  # type: ignore[attr-defined]


