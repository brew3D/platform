# AI Agent System for Game Development

A comprehensive AI agent system built with the OpenAI Agents SDK for automated game development workflows.

## 🎯 Overview

This system provides 28 specialized AI agents that work together to create games from natural language prompts. Each agent handles specific aspects of game development, from initial concept planning to final asset creation and documentation.

## 🏗️ Architecture

### Agent Categories

#### 1. Flow Management (2 agents)
- **FlowPlannerAgent**: Creates game flows and user journeys
- **FlowEvaluatorAgent**: Evaluates and optimizes game flows

#### 2. Script Generation (2 agents)
- **ScriptGeneratorAgent**: Generates executable game code
- **ScriptRefinerAgent**: Refines and optimizes generated code

#### 3. Scene Management (3 agents)
- **SceneLayoutAgent**: Designs scene layouts and spatial arrangements
- **AnimatorAgent**: Creates animations and visual effects
- **SceneSequencerAgent**: Sequences scenes and manages transitions

#### 4. Map Design (3 agents)
- **MapDesignerAgent**: Creates game maps and level designs
- **NavigationAgent**: Implements pathfinding and navigation systems
- **MapEvaluatorAgent**: Evaluates map quality and balance

#### 5. Asset Management (3 agents)
- **AssetCuratorAgent**: Organizes and manages game assets
- **AssetCreatorAgent**: Creates new game assets
- **AssetImportExportAgent**: Handles asset import/export operations

#### 6. Character Management (3 agents)
- **CharacterDesignerAgent**: Designs characters and NPCs
- **CharacterRiggingAgent**: Sets up character animation systems
- **CharacterLogicAgent**: Creates character AI and behavior logic

#### 7. Settings Management (2 agents)
- **SettingsManagerAgent**: Manages project settings and configuration
- **BuildTargetAgent**: Manages build targets and deployment

#### 8. Collaboration (3 agents)
- **CollaborationCoordinatorAgent**: Coordinates real-time collaboration
- **ChangeMergeAgent**: Merges changes and resolves conflicts
- **CommentReviewAgent**: Manages comments and reviews

#### 9. 3D Modeling (4 agents)
- **SculptingAgent**: Creates detailed 3D models and sculptures
- **RetopologyAgent**: Optimizes 3D meshes and topology
- **TextureMaterialCreatorAgent**: Creates textures and materials
- **ModelEvaluatorAgent**: Evaluates 3D models and provides feedback

#### 10. Orchestration (3 agents)
- **ProjectOrchestratorAgent**: Orchestrates the entire project workflow
- **FeedbackIterationAgent**: Manages feedback and iteration cycles
- **DocumentationAgent**: Creates and maintains project documentation

## 🚀 Quick Start

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
export OPENAI_API_KEY="your-api-key-here"
```

### Basic Usage

```python
from agents.agent_runner import agent_runner

# Run a single agent
result = agent_runner.run_agent('flow_planner', {
    'concept': 'Create a simple platformer game',
    'game_type': 'platformer',
    'platform': 'web'
})

# Run a complete workflow
workflow_config = {
    'name': 'game_creation',
    'steps': [
        {
            'name': 'orchestrate',
            'agent': 'project_orchestrator',
            'input': {'project_request': 'Build me Pacman'}
        },
        {
            'name': 'plan_flow',
            'agent': 'flow_planner',
            'dependencies': ['orchestrate'],
            'input': {'concept': 'Build me Pacman'}
        }
    ]
}

result = agent_runner.run_workflow(workflow_config)
```

## 🔧 API Reference

### AgentRunner

The central orchestrator for all agents.

#### Methods

- `get_agent(agent_name)`: Get a specific agent by name
- `list_agents()`: Get list of all available agent names
- `run_agent(agent_name, input_data, context)`: Run a specific agent
- `run_workflow(workflow_config)`: Run a complete workflow
- `get_agent_status()`: Get status of all agents
- `shutdown()`: Shutdown the agent runner

### BaseAgent

Base class for all agents with common functionality.

#### Methods

- `run(input_data, context)`: Run the agent with input data
- `_prepare_input(input_data, context)`: Prepare input for the agent
- `_process_output(result, original_input, context)`: Process agent output

## 🌐 Web API

The system provides RESTful API endpoints:

- `GET /api/agents/status` - Get agent system status
- `GET /api/agents/list` - List all available agents
- `POST /api/agents/run/<agent_name>` - Run a specific agent
- `POST /api/agents/workflow` - Run a complete workflow
- `POST /api/agents/character/create` - Create a character
- `POST /api/agents/scene/create` - Create a scene
- `POST /api/agents/map/create` - Create a map

## 🎮 Game Creation Workflow

### Typical Workflow

1. **Project Orchestration**: Analyze the request and plan the workflow
2. **Flow Planning**: Create game flow and user journey
3. **Script Generation**: Generate executable game code
4. **Scene Design**: Create scene layouts and arrangements
5. **Map Creation**: Design game maps and levels
6. **Character Design**: Create characters and NPCs
7. **Asset Creation**: Generate game assets and resources
8. **Animation**: Create animations and visual effects
9. **Documentation**: Generate project documentation

### Example: Creating a Pacman Game

```python
workflow_config = {
    'name': 'pacman_creation',
    'steps': [
        {
            'name': 'orchestrate',
            'agent': 'project_orchestrator',
            'input': {
                'project_request': 'Build me Pacman',
                'available_agents': ['flow_planner', 'script_generator', 'map_designer'],
                'project_status': {}
            }
        },
        {
            'name': 'plan_flow',
            'agent': 'flow_planner',
            'dependencies': ['orchestrate'],
            'input': {
                'concept': 'Build me Pacman',
                'game_type': 'arcade',
                'platform': 'web'
            }
        },
        {
            'name': 'create_map',
            'agent': 'map_designer',
            'dependencies': ['plan_flow'],
            'input': {
                'game_genre': 'arcade',
                'map_size': {'width': 20, 'height': 20},
                'difficulty': 'medium',
                'theme': 'maze'
            }
        },
        {
            'name': 'design_character',
            'agent': 'character_designer',
            'dependencies': ['plan_flow'],
            'input': {
                'character_type': 'hero',
                'game_genre': 'arcade',
                'visual_style': 'cartoon',
                'role': 'protagonist'
            }
        },
        {
            'name': 'generate_script',
            'agent': 'script_generator',
            'dependencies': ['plan_flow', 'create_map', 'design_character'],
            'input': {
                'mechanics': ['movement', 'collision', 'collectibles', 'enemies'],
                'language': 'javascript',
                'framework': 'vanilla'
            }
        }
    ]
}
```

## 🧪 Testing

Run the test suite:

```bash
python test_agents.py
```

This will test:
- Agent imports
- Agent runner creation
- Single agent execution
- Workflow execution
- Agent status
- Tool functions

## 📊 Monitoring

### Agent Status

The system provides real-time monitoring of agent status:

```python
status = agent_runner.get_agent_status()
print(f"Total agents: {status['total_agents']}")
print(f"Available agents: {status['available_agents']}")
```

### Logging

All agents use structured logging:

```python
import logging
logger = logging.getLogger('agent.flow_planner')
logger.info('Flow planning started')
```

## 🔧 Configuration

### Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for agent execution
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)
- `AGENT_TIMEOUT`: Agent execution timeout in seconds

### Agent Configuration

Each agent can be configured with custom instructions and tools:

```python
agent = FlowPlannerAgent()
agent.instructions = "Custom instructions for flow planning"
agent.tools = [custom_tool_function]
```

## 🚀 Deployment

### Docker

```dockerfile
FROM python:3.9-slim
COPY . /app
WORKDIR /app
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
```

### Production Considerations

- Use Redis for agent state management
- Implement agent result caching
- Set up monitoring and alerting
- Configure load balancing for multiple instances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your agent implementation
4. Write tests
5. Submit a pull request

### Adding New Agents

1. Create a new agent class inheriting from `BaseAgent`
2. Implement the required methods
3. Add the agent to `agent_runner.py`
4. Write tests for the new agent
5. Update documentation

## 📚 Examples

See the `examples/` directory for:
- Basic usage examples
- Workflow examples
- Integration examples
- Custom agent examples

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **API Key Issues**: Check your OpenAI API key configuration
3. **Agent Failures**: Check agent logs for detailed error messages
4. **Workflow Timeouts**: Increase timeout settings for complex workflows

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for the Agents SDK
- The game development community for inspiration
- Contributors and testers

---

For more information, see the individual agent documentation or contact the development team.
