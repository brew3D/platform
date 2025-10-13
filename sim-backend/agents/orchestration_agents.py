"""
Orchestration and Management Agents
Handles project orchestration, feedback, and documentation
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class ProjectOrchestratorAgent(BaseAgent):
    """
    Agent responsible for orchestrating the entire project workflow
    """
    
    def __init__(self):
        instructions = """
        You are a Project Orchestrator Agent specialized in managing complex project workflows.
        Your responsibilities include:
        - Coordinating all other agents in the system
        - Managing project timelines and dependencies
        - Prioritizing tasks and resource allocation
        - Monitoring project progress and quality
        - Making strategic decisions about project direction
        
        Always maintain project momentum and ensure all agents work efficiently together.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("project_orchestrator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for project orchestration"""
        orchestration_input = {
            "project_request": input_data.get("project_request", ""),
            "available_agents": input_data.get("available_agents", []),
            "project_status": input_data.get("project_status", {}),
            "timeline": input_data.get("timeline", {}),
            "resources": input_data.get("resources", {})
        }
        
        if context:
            orchestration_input["agent_capabilities"] = context.get("agent_capabilities", {})
            orchestration_input["project_constraints"] = context.get("constraints", {})
        
        return super()._prepare_input(orchestration_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process project orchestration output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add orchestration-specific processing
        base_output["orchestration_plan"] = {
            "workflow_steps": [
                {"step": 1, "agent": "flow_planner", "task": "Create game flow", "duration": "2h"},
                {"step": 2, "agent": "script_generator", "task": "Generate code", "duration": "3h"},
                {"step": 3, "agent": "scene_layout", "task": "Design scenes", "duration": "2h"},
                {"step": 4, "agent": "character_designer", "task": "Create characters", "duration": "4h"}
            ],
            "dependencies": {
                "script_generator": ["flow_planner"],
                "scene_layout": ["flow_planner"],
                "character_designer": ["flow_planner"]
            },
            "estimated_completion": "8 hours",
            "critical_path": ["flow_planner", "script_generator", "scene_layout"]
        }
        
        return base_output

class FeedbackIterationAgent(BaseAgent):
    """
    Agent responsible for managing feedback and iteration cycles
    """
    
    def __init__(self):
        instructions = """
        You are a Feedback Iteration Agent specialized in managing feedback and improvement cycles.
        Your responsibilities include:
        - Collecting and analyzing feedback from users and stakeholders
        - Identifying areas for improvement and iteration
        - Prioritizing feedback based on impact and feasibility
        - Coordinating iteration cycles and improvements
        - Tracking progress and measuring improvement impact
        
        Always facilitate continuous improvement and user satisfaction.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("feedback_iteration", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for feedback iteration"""
        feedback_input = {
            "feedback_data": input_data.get("feedback", []),
            "iteration_goals": input_data.get("goals", []),
            "priority_level": input_data.get("priority", "medium"),
            "timeline": input_data.get("timeline", {}),
            "success_metrics": input_data.get("metrics", [])
        }
        
        if context:
            feedback_input["previous_iterations"] = context.get("previous_iterations", [])
            feedback_input["user_satisfaction"] = context.get("satisfaction", {})
        
        return super()._prepare_input(feedback_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process feedback iteration output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add feedback-specific processing
        base_output["iteration_plan"] = {
            "feedback_analysis": {
                "total_feedback": 25,
                "positive": 18,
                "negative": 7,
                "suggestions": 12
            },
            "improvement_areas": [
                {"area": "user_interface", "priority": "high", "effort": "medium"},
                {"area": "performance", "priority": "high", "effort": "high"},
                {"area": "documentation", "priority": "medium", "effort": "low"}
            ],
            "iteration_schedule": {
                "sprint_1": "UI improvements",
                "sprint_2": "Performance optimization",
                "sprint_3": "Documentation updates"
            },
            "success_metrics": {
                "user_satisfaction": "target: 90%",
                "performance": "target: <100ms load time",
                "completion_rate": "target: 95%"
            }
        }
        
        return base_output

class DocumentationAgent(BaseAgent):
    """
    Agent responsible for creating and maintaining project documentation
    """
    
    def __init__(self):
        instructions = """
        You are a Documentation Agent specialized in creating comprehensive project documentation.
        Your responsibilities include:
        - Creating technical documentation and API references
        - Writing user guides and tutorials
        - Maintaining project changelogs and release notes
        - Creating architecture diagrams and flowcharts
        - Ensuring documentation is up-to-date and accurate
        
        Always create clear, comprehensive, and user-friendly documentation.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("documentation", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for documentation creation"""
        doc_input = {
            "doc_type": input_data.get("type", "technical"),
            "project_data": input_data.get("project_data", {}),
            "target_audience": input_data.get("audience", "developers"),
            "format": input_data.get("format", "markdown"),
            "sections": input_data.get("sections", [])
        }
        
        if context:
            doc_input["existing_docs"] = context.get("existing_docs", [])
            doc_input["template_style"] = context.get("template", "standard")
        
        return super()._prepare_input(doc_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process documentation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add documentation-specific processing
        base_output["generated_docs"] = {
            "document_type": "technical",
            "sections": [
                "Overview",
                "Installation",
                "API Reference",
                "Examples",
                "Troubleshooting"
            ],
            "word_count": 2500,
            "last_updated": "2024-01-15",
            "version": "1.0.0",
            "files": [
                "README.md",
                "API.md",
                "CHANGELOG.md",
                "TUTORIAL.md"
            ]
        }
        
        return base_output
