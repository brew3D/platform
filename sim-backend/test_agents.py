"""
Test script for the AI Agent system
"""

import sys
import os
import traceback

# Add the parent directory to the path so we can import the agents
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_agent_imports():
    """Test that all agent modules can be imported"""
    print("🧪 Testing agent imports...")
    
    try:
        from agents.flow_agents import FlowPlannerAgent, FlowEvaluatorAgent
        from agents.script_agents import ScriptGeneratorAgent, ScriptRefinerAgent
        from agents.scene_agents import SceneLayoutAgent, AnimatorAgent, SceneSequencerAgent
        from agents.map_agents import MapDesignerAgent, NavigationAgent, MapEvaluatorAgent
        from agents.asset_agents import AssetCuratorAgent, AssetCreatorAgent, AssetImportExportAgent
        from agents.character_agents import CharacterDesignerAgent, CharacterRiggingAgent, CharacterLogicAgent
        from agents.settings_agents import SettingsManagerAgent, BuildTargetAgent
        from agents.collab_agents import CollaborationCoordinatorAgent, ChangeMergeAgent, CommentReviewAgent
        from agents.carve_agents import SculptingAgent, RetopologyAgent, TextureMaterialCreatorAgent, ModelEvaluatorAgent
        from agents.orchestration_agents import ProjectOrchestratorAgent, FeedbackIterationAgent, DocumentationAgent
        from agents.agent_runner import agent_runner
        
        print("✅ All agent imports successful")
        return True
    except Exception as e:
        print(f"❌ Agent import failed: {str(e)}")
        traceback.print_exc()
        return False

def test_agent_runner_creation():
    """Test that the agent runner can be created"""
    print("\n🧪 Testing agent runner creation...")
    
    try:
        from agents.agent_runner import agent_runner
        
        # Test basic properties
        assert hasattr(agent_runner, 'agents'), "Agent runner should have agents attribute"
        assert hasattr(agent_runner, 'get_agent_status'), "Agent runner should have get_agent_status method"
        assert hasattr(agent_runner, 'run_agent'), "Agent runner should have run_agent method"
        assert hasattr(agent_runner, 'run_workflow'), "Agent runner should have run_workflow method"
        
        print("✅ Agent runner creation successful")
        return True
    except Exception as e:
        print(f"❌ Agent runner creation failed: {str(e)}")
        traceback.print_exc()
        return False

def test_single_agent_execution():
    """Test running a single agent"""
    print("\n🧪 Testing single agent execution...")
    
    try:
        from agents.agent_runner import agent_runner
        
        # Test running flow planner agent
        result = agent_runner.run_agent('flow_planner', {
            'concept': 'Test game concept',
            'game_type': 'action',
            'target_audience': 'general',
            'platform': 'web'
        })
        
        assert 'success' in result, "Result should have success field"
        assert 'agent' in result, "Result should have agent field"
        assert 'timestamp' in result, "Result should have timestamp field"
        
        print("✅ Single agent execution successful")
        return True
    except Exception as e:
        print(f"❌ Single agent execution failed: {str(e)}")
        traceback.print_exc()
        return False

def test_workflow_execution():
    """Test running a complete workflow"""
    print("\n🧪 Testing workflow execution...")
    
    try:
        from agents.agent_runner import agent_runner
        
        # Test simple workflow
        workflow_config = {
            'name': 'test_workflow',
            'steps': [
                {
                    'name': 'orchestrate',
                    'agent': 'project_orchestrator',
                    'input': {
                        'project_request': 'Test project',
                        'available_agents': ['flow_planner', 'script_generator'],
                        'project_status': {}
                    }
                },
                {
                    'name': 'plan_flow',
                    'agent': 'flow_planner',
                    'dependencies': ['orchestrate'],
                    'input': {
                        'concept': 'Test concept',
                        'game_type': 'action',
                        'platform': 'web'
                    }
                }
            ]
        }
        
        result = agent_runner.run_workflow(workflow_config)
        
        assert 'success' in result, "Result should have success field"
        assert 'workflow' in result, "Result should have workflow field"
        assert 'results' in result, "Result should have results field"
        
        print("✅ Workflow execution successful")
        return True
    except Exception as e:
        print(f"❌ Workflow execution failed: {str(e)}")
        traceback.print_exc()
        return False

def test_agent_status():
    """Test getting agent status"""
    print("\n🧪 Testing agent status...")
    
    try:
        from agents.agent_runner import agent_runner
        
        status = agent_runner.get_agent_status()
        
        assert 'total_agents' in status, "Status should have total_agents field"
        assert 'available_agents' in status, "Status should have available_agents field"
        assert 'agent_categories' in status, "Status should have agent_categories field"
        assert 'timestamp' in status, "Status should have timestamp field"
        
        assert status['total_agents'] > 0, "Should have at least one agent"
        assert len(status['available_agents']) > 0, "Should have available agents"
        
        print("✅ Agent status test successful")
        return True
    except Exception as e:
        print(f"❌ Agent status test failed: {str(e)}")
        traceback.print_exc()
        return False

def test_tool_functions():
    """Test that tool functions work"""
    print("\n🧪 Testing tool functions...")
    
    try:
        from agents.tools import log_agent_action, json_tool, validate_input, format_agent_output
        
        # Test log_agent_action
        log_result = log_agent_action('test_agent', 'test_action', {'test': 'data'})
        assert log_result['success'] == True, "Log action should succeed"
        
        # Test json_tool
        json_result = json_tool({'test': 'data'})
        assert 'test' in json_result, "JSON tool should work"
        
        # Test validate_input
        validation_result = validate_input({'required': 'value'}, ['required'])
        assert validation_result['valid'] == True, "Validation should pass"
        
        # Test format_agent_output
        formatted = format_agent_output('test output', 'text')
        assert 'test output' in formatted, "Format output should work"
        
        print("✅ Tool functions test successful")
        return True
    except Exception as e:
        print(f"❌ Tool functions test failed: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🧪 AI Agent System Test Suite")
    print("=" * 50)
    
    tests = [
        test_agent_imports,
        test_agent_runner_creation,
        test_single_agent_execution,
        test_workflow_execution,
        test_agent_status,
        test_tool_functions
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {str(e)}")
            traceback.print_exc()
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The AI Agent system is working correctly.")
        return True
    else:
        print("⚠️ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
