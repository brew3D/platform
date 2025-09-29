# Game Engine Backend

A production-lean Flask backend providing six MVP agents for an agentic, web-based game engine.

## Features

### Six Core Agents

1. **Scripting Agent** - Convert text prompts into structured scene manifests and game logic
2. **GenAI Asset Agent** - Generate 3D models using voxel-based or Shape-E approaches
3. **Animation Agent** - Create animation timelines, keyframes, and cutscene compositions
4. **Helper Agent** - Provide context-aware help, suggestions, and code snippets
5. **Level Design Agent** - Generate procedural levels with tilemaps and entity placement
6. **Deployment Agent** - Package builds and deploy to hosting providers

### Orchestrator

Multi-agent workflow composition that can route and compose agents for complex multi-step workflows.

## Quick Start

### Installation

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
```

### Configuration

Edit `.env` file:

```bash
# Core runtime
DEBUG=1
PORT=5050

# Feature toggles
USE_MOCKS=1          # Use mock responses (set to 0 for real API calls)
USE_OPENAI=0         # Enable OpenAI API calls
USE_SHAPE_E=0        # Enable Shape-E 3D generation
USE_CLOUD_DEPLOY=0   # Enable real cloud deployment

# Secrets (required for real API calls)
SECRET_KEY=change-me-in-prod
OPENAI_API_KEY=your_openai_key_here

# Paths
ARTIFACTS_DIR=./artifacts

# Jobs
JOB_WORKERS=4
```

### Running the Server

```bash
# Development mode
python -m game-engine-backend.app

# Or with environment variables
export $(grep -v '^#' .env | xargs) && python -m game-engine-backend.app
```

The server will start on `http://localhost:5050`

## API Endpoints

### Core Endpoints

- `GET /health` - Health check
- `POST /jobs` - Create a job
- `GET /jobs/<id>` - Get job status
- `GET /artifacts/<path>` - Serve artifacts

### Agent Endpoints

#### GenAI Asset Agent
- `POST /agent/genai/asset` - Create asset generation job

#### Scripting Agent
- `POST /agent/scripting/generate` - Generate scene script

#### Animation Agent
- `POST /agent/animation/create` - Create animation
- `POST /agent/animation/from_asset` - Create animation from asset

#### Helper Agent
- `POST /agent/helper/query` - Query help
- `GET /agent/helper/templates` - Get prompt templates
- `POST /agent/helper/analyze` - Analyze project state

#### Level Design Agent
- `POST /agent/levelgen/generate` - Generate procedural level
- `POST /agent/levelgen/preview` - Create level preview

#### Deployment Agent
- `POST /agent/deploy/package` - Package build
- `POST /agent/deploy/publish` - Publish build
- `GET /agent/deploy/status/<id>` - Get deployment status
- `GET /agent/deploy/list` - List deployments

#### Orchestrator
- `POST /agent/orchestrator/workflow` - Run multi-agent workflow
- `GET /agent/orchestrator/workflow/<id>` - Get workflow status
- `GET /agent/orchestrator/templates` - List workflow templates
- `GET /agent/orchestrator/templates/<id>` - Get workflow template

## Example Usage

### Create Asset Job

```bash
curl -X POST http://localhost:5050/agent/genai/asset \
  -H "Content-Type: application/json" \
  -d '{
    "type": "model",
    "subject": "dragon",
    "mode": "voxel",
    "resolution": 64,
    "style": "cartoony",
    "pose": "flying"
  }'
```

### Generate Scene Script

```bash
curl -X POST http://localhost:5050/agent/scripting/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a 2D platformer with a dragon boss",
    "options": {
      "format": "json",
      "complexity": "medium",
      "game_type": "platformer"
    }
  }'
```

### Create Animation

```bash
curl -X POST http://localhost:5050/agent/animation/create \
  -H "Content-Type: application/json" \
  -d '{
    "model_ref": {"id": "character", "type": "character"},
    "prompt": "Create a walking animation"
  }'
```

### Generate Level

```bash
curl -X POST http://localhost:5050/agent/levelgen/generate \
  -H "Content-Type: application/json" \
  -d '{
    "seed": 12345,
    "size": [20, 15],
    "theme": "forest",
    "difficulty": "medium"
  }'
```

### Run Multi-Agent Workflow

```bash
curl -X POST http://localhost:5050/agent/orchestrator/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a flying dragon level with assets and animations",
    "pipeline_steps": ["scripting", "levelgen", "genai_asset", "animation"]
  }'
```

### Check Job Status

```bash
curl http://localhost:5050/jobs/job_1234567890ab
```

## Testing

Run the test suite:

```bash
# Install test dependencies
pip install pytest

# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_agents.py

# Run with coverage
pytest --cov=game-engine-backend tests/
```

## Project Structure

```
game-engine-backend/
├── app.py                     # Flask app bootstrap + socketio
├── jobs.py                    # Job runner, ThreadPoolExecutor wrapper
├── agents/
│   ├── __init__.py
│   ├── scripting.py           # Scripting Agent
│   ├── genai_asset.py         # GenAI Asset Agent
│   ├── animation.py           # Animation Agent
│   ├── helper.py              # Helper Agent
│   ├── levelgen.py            # Level Design Agent
│   ├── deploy.py              # Deployment Agent
│   └── orchestrator.py        # Multi-agent orchestrator
├── utils/
│   ├── __init__.py
│   ├── auth.py                # JWT authentication
│   ├── storage.py             # File operations
│   ├── validators.py          # JSON schema validation
│   └── openai_client.py       # OpenAI/Shape-E client with mocking
├── tests/
│   ├── test_jobs.py           # Job system tests
│   ├── test_agents.py         # Agent tests
│   └── test_app.py            # Flask app tests
├── artifacts/                 # Runtime artifacts
│   ├── manifests/             # Job manifests
│   ├── glb/                   # 3D models
│   ├── voxels/                # Voxel data
│   └── previews/              # Level previews
├── requirements.txt           # Python dependencies
├── env.example               # Environment variables template
└── README.md                 # This file
```

## Architecture

### Job System

- **ThreadPoolExecutor** for background job execution
- **Manifest persistence** to disk under `artifacts/manifests/`
- **Progress tracking** with real-time updates
- **Artifact management** with automatic cleanup

### Agent Design

- **Modular architecture** - each agent is self-contained
- **Mocking support** - all external calls can be mocked for development
- **Validation** - comprehensive input/output validation
- **Error handling** - graceful fallbacks and error reporting

### Orchestrator

- **Workflow composition** - combine multiple agents into complex workflows
- **Step detection** - automatically determine required pipeline steps
- **Progress tracking** - monitor multi-step execution
- **Template system** - pre-defined workflow templates

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `0` | Enable debug mode |
| `PORT` | `5050` | Server port |
| `USE_MOCKS` | `1` | Use mock responses |
| `USE_OPENAI` | `0` | Enable OpenAI API calls |
| `USE_SHAPE_E` | `0` | Enable Shape-E 3D generation |
| `USE_CLOUD_DEPLOY` | `0` | Enable real cloud deployment |
| `SECRET_KEY` | `change-me-in-prod` | JWT signing secret |
| `OPENAI_API_KEY` | - | OpenAI API key |
| `ARTIFACTS_DIR` | `./artifacts` | Artifacts directory |
| `JOB_WORKERS` | `4` | Number of worker threads |

## Development

### Adding New Agents

1. Create agent module in `agents/`
2. Implement required functions with proper error handling
3. Add validation using `utils/validators`
4. Add endpoints to `app.py`
5. Write tests in `tests/`

### Adding New Workflow Steps

1. Add step detection logic in `orchestrator.py`
2. Implement step execution function
3. Update workflow templates
4. Add tests

## Production Deployment

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5050

CMD ["python", "-m", "game-engine-backend.app"]
```

### Environment Setup

```bash
# Production environment variables
DEBUG=0
USE_MOCKS=0
USE_OPENAI=1
USE_SHAPE_E=1
USE_CLOUD_DEPLOY=1
SECRET_KEY=your-secure-secret-key
OPENAI_API_KEY=your-openai-key
ARTIFACTS_DIR=/app/artifacts
JOB_WORKERS=8
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
