"""
Basic usage example for the AI Agent system
"""

import sys
import os

# Add the parent directory to the path so we can import the agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agent_runner import agent_runner

def main():
    """
    Basic example of using the AI Agent system
    """
    print("🤖 AI Agent System - Basic Usage Example")
    print("=" * 50)
    
    # Get agent status
    print("\n📊 Agent Status:")
    status = agent_runner.get_agent_status()
    print(f"Total agents: {status['total_agents']}")
    print(f"Available agents: {', '.join(status['available_agents'])}")
    
    # List agent categories
    print("\n🏷️ Agent Categories:")
    for category, agents in status['agent_categories'].items():
        print(f"  {category.title()}: {', '.join(agents)}")
    
    # Run a single agent
    print("\n🚀 Running Flow Planner Agent:")
    result = agent_runner.run_agent('flow_planner', {
        'concept': 'Create a simple platformer game',
        'game_type': 'platformer',
        'target_audience': 'casual',
        'platform': 'web'
    })
    
    if result['success']:
        print("✅ Flow planning completed successfully!")
        print(f"Output: {result['output']}")
    else:
        print(f"❌ Flow planning failed: {result['error']}")
    
    # Run a complete workflow
    print("\n🔄 Running Complete Game Creation Workflow:")
    workflow_config = {
        'name': 'simple_game_creation',
        'steps': [
            {
                'name': 'orchestrate',
                'agent': 'project_orchestrator',
                'input': {
                    'project_request': 'Create a simple maze game',
                    'available_agents': list(status['available_agents']),
                    'project_status': {}
                }
            },
            {
                'name': 'plan_flow',
                'agent': 'flow_planner',
                'dependencies': ['orchestrate'],
                'input': {
                    'concept': 'Create a simple maze game',
                    'game_type': 'puzzle',
                    'platform': 'web'
                }
            },
            {
                'name': 'generate_script',
                'agent': 'script_generator',
                'dependencies': ['plan_flow'],
                'input': {
                    'mechanics': ['movement', 'collision', 'goal'],
                    'language': 'javascript',
                    'framework': 'vanilla'
                }
            }
        ]
    }
    
    workflow_result = agent_runner.run_workflow(workflow_config)
    
    if workflow_result['success']:
        print("✅ Workflow completed successfully!")
        print(f"Completed steps: {list(workflow_result['results'].keys())}")
    else:
        print(f"❌ Workflow failed: {workflow_result['error']}")
    
    print("\n🎉 Basic usage example completed!")

if __name__ == "__main__":
    main()
