"""
Agent Runner - Manages and orchestrates all AI agents
"""

from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

# Import all agent classes
from .flow_agents import FlowPlannerAgent, FlowEvaluatorAgent
from .script_agents import ScriptGeneratorAgent, ScriptRefinerAgent
from .scene_agents import SceneLayoutAgent, AnimatorAgent, SceneSequencerAgent
from .map_agents import MapDesignerAgent, NavigationAgent, MapEvaluatorAgent
from .asset_agents import AssetCuratorAgent, AssetCreatorAgent, AssetImportExportAgent
from .character_agents import CharacterDesignerAgent, CharacterRiggingAgent, CharacterLogicAgent
from .settings_agents import SettingsManagerAgent, BuildTargetAgent
from .collab_agents import CollaborationCoordinatorAgent, ChangeMergeAgent, CommentReviewAgent
from .carve_agents import SculptingAgent, RetopologyAgent, TextureMaterialCreatorAgent, ModelEvaluatorAgent
from .orchestration_agents import ProjectOrchestratorAgent, FeedbackIterationAgent, DocumentationAgent

class AgentRunner:
    """
    Central orchestrator for all AI agents in the system
    """
    
    def __init__(self):
        self.agents = {}
        self.workflows = {}
        self.logger = logging.getLogger("agent_runner")
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all available agents"""
        try:
            # Flow Management Agents
            self.agents['flow_planner'] = FlowPlannerAgent()
            self.agents['flow_evaluator'] = FlowEvaluatorAgent()
            
            # Script Generation Agents
            self.agents['script_generator'] = ScriptGeneratorAgent()
            self.agents['script_refiner'] = ScriptRefinerAgent()
            
            # Scene Management Agents
            self.agents['scene_layout'] = SceneLayoutAgent()
            self.agents['animator'] = AnimatorAgent()
            self.agents['scene_sequencer'] = SceneSequencerAgent()
            
            # Map Design Agents
            self.agents['map_designer'] = MapDesignerAgent()
            self.agents['navigation'] = NavigationAgent()
            self.agents['map_evaluator'] = MapEvaluatorAgent()
            
            # Asset Management Agents
            self.agents['asset_curator'] = AssetCuratorAgent()
            self.agents['asset_creator'] = AssetCreatorAgent()
            self.agents['asset_import_export'] = AssetImportExportAgent()
            
            # Character Management Agents
            self.agents['character_designer'] = CharacterDesignerAgent()
            self.agents['character_rigging'] = CharacterRiggingAgent()
            self.agents['character_logic'] = CharacterLogicAgent()
            
            # Settings Management Agents
            self.agents['settings_manager'] = SettingsManagerAgent()
            self.agents['build_target'] = BuildTargetAgent()
            
            # Collaboration Agents
            self.agents['collaboration_coordinator'] = CollaborationCoordinatorAgent()
            self.agents['change_merge'] = ChangeMergeAgent()
            self.agents['comment_review'] = CommentReviewAgent()
            
            # 3D Modeling Agents
            self.agents['sculpting'] = SculptingAgent()
            self.agents['retopology'] = RetopologyAgent()
            self.agents['texture_material_creator'] = TextureMaterialCreatorAgent()
            self.agents['model_evaluator'] = ModelEvaluatorAgent()
            
            # Orchestration Agents
            self.agents['project_orchestrator'] = ProjectOrchestratorAgent()
            self.agents['feedback_iteration'] = FeedbackIterationAgent()
            self.agents['documentation'] = DocumentationAgent()
            
            self.logger.info(f"Initialized {len(self.agents)} agents successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize agents: {str(e)}")
            raise
    
    def get_agent(self, agent_name: str) -> Optional[Any]:
        """Get a specific agent by name"""
        return self.agents.get(agent_name)
    
    def list_agents(self) -> List[str]:
        """Get list of all available agent names"""
        return list(self.agents.keys())
    
    def run_agent(self, agent_name: str, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run a specific agent with input data"""
        agent = self.get_agent(agent_name)
        if not agent:
            return {
                "success": False,
                "error": f"Agent '{agent_name}' not found",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        try:
            self.logger.info(f"Running agent: {agent_name}")
            result = agent.run(input_data, context)
            self.logger.info(f"Agent {agent_name} completed successfully")
            return result
        except Exception as e:
            self.logger.error(f"Error running agent {agent_name}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "agent": agent_name,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def run_workflow(self, workflow_config: Dict[str, Any]) -> Dict[str, Any]:
        """Run a complete workflow with multiple agents"""
        try:
            workflow_name = workflow_config.get("name", "unnamed_workflow")
            steps = workflow_config.get("steps", [])
            
            self.logger.info(f"Starting workflow: {workflow_name}")
            
            results = {}
            context = {}
            
            for step in steps:
                step_name = step.get("name", "unnamed_step")
                agent_name = step.get("agent")
                input_data = step.get("input", {})
                dependencies = step.get("dependencies", [])
                
                # Check dependencies
                for dep in dependencies:
                    if dep not in results:
                        return {
                            "success": False,
                            "error": f"Dependency '{dep}' not satisfied for step '{step_name}'",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                
                # Add dependency results to context
                for dep in dependencies:
                    if dep in results:
                        context[f"{dep}_result"] = results[dep]
                
                # Run the agent
                result = self.run_agent(agent_name, input_data, context)
                results[step_name] = result
                
                if not result.get("success", False):
                    return {
                        "success": False,
                        "error": f"Step '{step_name}' failed: {result.get('error', 'Unknown error')}",
                        "workflow": workflow_name,
                        "completed_steps": list(results.keys()),
                        "timestamp": datetime.utcnow().isoformat()
                    }
            
            self.logger.info(f"Workflow {workflow_name} completed successfully")
            return {
                "success": True,
                "workflow": workflow_name,
                "results": results,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error running workflow: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        status = {
            "total_agents": len(self.agents),
            "available_agents": list(self.agents.keys()),
            "agent_categories": {
                "flow": ["flow_planner", "flow_evaluator"],
                "script": ["script_generator", "script_refiner"],
                "scene": ["scene_layout", "animator", "scene_sequencer"],
                "map": ["map_designer", "navigation", "map_evaluator"],
                "asset": ["asset_curator", "asset_creator", "asset_import_export"],
                "character": ["character_designer", "character_rigging", "character_logic"],
                "settings": ["settings_manager", "build_target"],
                "collab": ["collaboration_coordinator", "change_merge", "comment_review"],
                "carve": ["sculpting", "retopology", "texture_material_creator", "model_evaluator"],
                "orchestration": ["project_orchestrator", "feedback_iteration", "documentation"]
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return status
    
    def shutdown(self):
        """Shutdown the agent runner"""
        self.logger.info("Shutting down agent runner")
        self.agents.clear()
        self.workflows.clear()

# Global agent runner instance
agent_runner = AgentRunner()
