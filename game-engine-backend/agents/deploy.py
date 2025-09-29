"""
Deployment Agent for build packaging and deployment.

Responsibilities:
- Package web builds with artifacts
- Deploy to hosting providers (Vercel, Netlify, GitHub Pages)
- Generate deployment manifests
- Manage build versions and rollbacks

API:
- package_build(scene_id) -> build_path: Package build for deployment
- publish_build(scene_id, provider, options) -> deployment_info: Deploy to provider
- get_deployment_status(deployment_id) -> status: Check deployment status

Environment:
- USE_CLOUD_DEPLOY: Enable real cloud deployment (default: 0)
- USE_MOCKS: Use mock responses (default: 1)
"""

import json
import os
import shutil
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from .. import jobs
from ..utils.storage import get_artifact_path, write_json, list_artifacts


def package_build(scene_id: str) -> str:
    """Package build for deployment.
    
    Args:
        scene_id: Scene identifier
        
    Returns:
        Path to packaged build zip file
    """
    # Create build directory
    build_dir = Path(f"builds/{scene_id}")
    build_dir.mkdir(parents=True, exist_ok=True)
    
    # Create basic HTML structure
    html_content = _generate_html_template(scene_id)
    (build_dir / "index.html").write_text(html_content)
    
    # Copy artifacts
    _copy_artifacts_to_build(build_dir, scene_id)
    
    # Create package.json for web dependencies
    package_json = _generate_package_json(scene_id)
    (build_dir / "package.json").write_text(json.dumps(package_json, indent=2))
    
    # Create deployment manifest
    manifest = _create_deployment_manifest(scene_id, build_dir)
    (build_dir / "deployment.json").write_text(json.dumps(manifest, indent=2))
    
    # Create zip file
    zip_path = f"builds/{scene_id}_build.zip"
    _create_zip_file(build_dir, zip_path)
    
    return zip_path


def _generate_html_template(scene_id: str) -> str:
    """Generate HTML template for the build."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Scene - {scene_id}</title>
    <style>
        body {{
            margin: 0;
            padding: 0;
            background: #1a1a1a;
            color: white;
            font-family: Arial, sans-serif;
            overflow: hidden;
        }}
        #gameContainer {{
            width: 100vw;
            height: 100vh;
            position: relative;
        }}
        #loading {{
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
        }}
        #gameCanvas {{
            width: 100%;
            height: 100%;
            display: none;
        }}
        .controls {{
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
        }}
        .info {{
            position: absolute;
            bottom: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 5px;
        }}
    </style>
</head>
<body>
    <div id="gameContainer">
        <div id="loading">
            <h2>Loading Game Scene...</h2>
            <p>Scene ID: {scene_id}</p>
            <div id="progress">0%</div>
        </div>
        <canvas id="gameCanvas"></canvas>
        <div class="controls">
            <button onclick="startGame()">Start Game</button>
            <button onclick="pauseGame()">Pause</button>
        </div>
        <div class="info">
            <p>Scene: {scene_id}</p>
            <p>Build: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
    </div>

    <script>
        // Basic game initialization
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const loading = document.getElementById('loading');
        const progress = document.getElementById('progress');
        
        let gameState = 'loading';
        let gameObjects = [];
        
        function resizeCanvas() {{
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }}
        
        function updateProgress(percent) {{
            progress.textContent = percent + '%';
        }}
        
        function startGame() {{
            gameState = 'running';
            loading.style.display = 'none';
            canvas.style.display = 'block';
            gameLoop();
        }}
        
        function pauseGame() {{
            gameState = gameState === 'running' ? 'paused' : 'running';
        }}
        
        function gameLoop() {{
            if (gameState === 'running') {{
                update();
                render();
                requestAnimationFrame(gameLoop);
            }}
        }}
        
        function update() {{
            // Update game objects
            gameObjects.forEach(obj => {{
                if (obj.update) obj.update();
            }});
        }}
        
        function render() {{
            // Clear canvas
            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Render game objects
            gameObjects.forEach(obj => {{
                if (obj.render) obj.render(ctx);
            }});
        }}
        
        // Initialize
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Simulate loading
        let loadProgress = 0;
        const loadInterval = setInterval(() => {{
            loadProgress += Math.random() * 20;
            if (loadProgress >= 100) {{
                loadProgress = 100;
                clearInterval(loadInterval);
                updateProgress(100);
            }} else {{
                updateProgress(Math.floor(loadProgress));
            }}
        }}, 100);
        
        // Load scene data
        fetch('/artifacts/scenes/{scene_id}.json')
            .then(response => response.json())
            .then(data => {{
                console.log('Scene loaded:', data);
                // Initialize game objects from scene data
                if (data.entities) {{
                    data.entities.forEach(entity => {{
                        gameObjects.push(createGameObject(entity));
                    }});
                }}
            }})
            .catch(error => {{
                console.error('Failed to load scene:', error);
            }});
        
        function createGameObject(entity) {{
            return {{
                id: entity.id,
                type: entity.type,
                position: entity.position || [0, 0],
                properties: entity.properties || {{}},
                update: function() {{
                    // Update logic based on entity type
                }},
                render: function(ctx) {{
                    // Render logic based on entity type
                    ctx.fillStyle = '#4CAF50';
                    ctx.fillRect(this.position[0], this.position[1], 20, 20);
                }}
            }};
        }}
    </script>
</body>
</html>"""


def _copy_artifacts_to_build(build_dir: Path, scene_id: str):
    """Copy artifacts to build directory."""
    # Create artifacts directory in build
    artifacts_dir = build_dir / "artifacts"
    artifacts_dir.mkdir(exist_ok=True)
    
    # Copy different artifact types
    artifact_types = ["voxels", "glb", "previews", "scenes"]
    
    for artifact_type in artifact_types:
        source_dir = Path(f"artifacts/{artifact_type}")
        if source_dir.exists():
            dest_dir = artifacts_dir / artifact_type
            dest_dir.mkdir(exist_ok=True)
            
            # Copy files
            for file_path in source_dir.iterdir():
                if file_path.is_file():
                    shutil.copy2(file_path, dest_dir / file_path.name)


def _generate_package_json(scene_id: str) -> Dict[str, Any]:
    """Generate package.json for the build."""
    return {
        "name": f"game-scene-{scene_id}",
        "version": "1.0.0",
        "description": f"Game scene build for {scene_id}",
        "main": "index.html",
        "scripts": {
            "start": "python -m http.server 8000",
            "build": "echo 'Build already packaged'"
        },
        "dependencies": {},
        "devDependencies": {},
        "engines": {
            "node": ">=14.0.0"
        }
    }


def _create_deployment_manifest(scene_id: str, build_dir: Path) -> Dict[str, Any]:
    """Create deployment manifest."""
    return {
        "scene_id": scene_id,
        "build_id": f"build_{scene_id}_{int(datetime.now().timestamp())}",
        "created_at": datetime.now().isoformat() + "Z",
        "version": "1.0.0",
        "artifacts": {
            "html": "index.html",
            "package": "package.json",
            "artifacts_dir": "artifacts/"
        },
        "deployment": {
            "status": "packaged",
            "providers": ["vercel", "netlify", "github_pages"],
            "requirements": {
                "node": ">=14.0.0",
                "python": ">=3.8"
            }
        }
    }


def _create_zip_file(source_dir: Path, zip_path: str):
    """Create zip file from directory."""
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(source_dir)
                zipf.write(file_path, arcname)


def publish_build(scene_id: str, provider: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Publish build to hosting provider.
    
    Args:
        scene_id: Scene identifier
        provider: Hosting provider (vercel, netlify, github_pages)
        options: Provider-specific options
        
    Returns:
        Deployment information
    """
    options = options or {}
    
    # Check if we should use real cloud deployment
    use_cloud = (os.getenv("USE_CLOUD_DEPLOY", "0") == "1" and 
                 os.getenv("USE_MOCKS", "1") != "1")
    
    if use_cloud:
        return _publish_to_cloud(scene_id, provider, options)
    else:
        return _publish_mock(scene_id, provider, options)


def _publish_to_cloud(scene_id: str, provider: str, options: Dict[str, Any]) -> Dict[str, Any]:
    """Publish to real cloud provider."""
    # This would integrate with actual cloud providers
    # For now, return a mock response
    return _publish_mock(scene_id, provider, options)


def _publish_mock(scene_id: str, provider: str, options: Dict[str, Any]) -> Dict[str, Any]:
    """Publish to mock provider."""
    deployment_id = f"deploy_{scene_id}_{int(datetime.now().timestamp())}"
    
    # Generate mock URLs based on provider
    mock_urls = {
        "vercel": f"https://{scene_id}-game.vercel.app",
        "netlify": f"https://{scene_id}-game.netlify.app",
        "github_pages": f"https://username.github.io/{scene_id}-game"
    }
    
    return {
        "deployment_id": deployment_id,
        "status": "deployed",
        "provider": provider,
        "url": mock_urls.get(provider, f"https://mock-{provider}.com/{scene_id}"),
        "created_at": datetime.now().isoformat() + "Z",
        "options": options,
        "mock": True
    }


def get_deployment_status(deployment_id: str) -> Dict[str, Any]:
    """Get deployment status.
    
    Args:
        deployment_id: Deployment identifier
        
    Returns:
        Deployment status information
    """
    # In a real implementation, this would check the actual deployment status
    return {
        "deployment_id": deployment_id,
        "status": "deployed",
        "url": f"https://mock-deployment.com/{deployment_id}",
        "last_updated": datetime.now().isoformat() + "Z",
        "health": "healthy"
    }


def list_deployments(scene_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """List deployments.
    
    Args:
        scene_id: Filter by scene ID (optional)
        
    Returns:
        List of deployment information
    """
    # In a real implementation, this would query a database
    return [
        {
            "deployment_id": f"deploy_{scene_id or 'unknown'}_123456",
            "scene_id": scene_id or "unknown",
            "status": "deployed",
            "provider": "vercel",
            "url": f"https://{scene_id or 'unknown'}-game.vercel.app",
            "created_at": datetime.now().isoformat() + "Z"
        }
    ]
