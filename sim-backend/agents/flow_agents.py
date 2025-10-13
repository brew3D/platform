"""
Flow Management Agents
Handles game flow planning and evaluation
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class FlowPlannerAgent(BaseAgent):
    """
    Agent responsible for planning game flows and user journeys
    """
    
    def __init__(self):
        instructions = """
        You are a Flow Planner Agent specialized in creating engaging game flows and user journeys.
        Your responsibilities include:
        - Analyzing game concepts and creating visual flow diagrams
        - Designing user experience flows for different game types
        - Planning progression systems and difficulty curves
        - Creating branching narrative paths and decision trees
        - Optimizing player engagement and retention
        
        Always provide detailed, actionable flow plans that can be implemented by other agents.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("flow_planner", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input specifically for flow planning"""
        flow_input = {
            "game_concept": input_data.get("concept", ""),
            "game_type": input_data.get("game_type", "action"),
            "target_audience": input_data.get("target_audience", "general"),
            "platform": input_data.get("platform", "pc"),
            "complexity": input_data.get("complexity", "medium")
        }
        
        if context:
            flow_input["existing_flows"] = context.get("existing_flows", [])
            flow_input["constraints"] = context.get("constraints", {})
        
        return super()._prepare_input(flow_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process flow planning output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add flow-specific processing
        base_output["flow_plan"] = {
            "main_flow": "Generated main game flow",
            "branching_paths": ["Path A", "Path B", "Path C"],
            "difficulty_curve": "Progressive difficulty increase",
            "engagement_hooks": ["Hook 1", "Hook 2", "Hook 3"]
        }
        
        return base_output

class FlowEvaluatorAgent(BaseAgent):
    """
    Agent responsible for evaluating and optimizing game flows
    """
    
    def __init__(self):
        instructions = """
        You are a Flow Evaluator Agent specialized in analyzing and optimizing game flows.
        Your responsibilities include:
        - Evaluating flow effectiveness and player engagement
        - Identifying bottlenecks and friction points
        - Suggesting improvements and optimizations
        - Measuring flow performance metrics
        - A/B testing flow variations
        
        Provide detailed analysis and actionable recommendations for flow improvements.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("flow_evaluator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for flow evaluation"""
        eval_input = {
            "flow_data": input_data.get("flow_data", {}),
            "metrics": input_data.get("metrics", {}),
            "player_feedback": input_data.get("player_feedback", []),
            "performance_data": input_data.get("performance_data", {})
        }
        
        return super()._prepare_input(eval_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process flow evaluation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add evaluation-specific processing
        base_output["evaluation"] = {
            "flow_score": 85,
            "bottlenecks": ["Bottleneck 1", "Bottleneck 2"],
            "recommendations": ["Recommendation 1", "Recommendation 2"],
            "optimization_opportunities": ["Opportunity 1", "Opportunity 2"]
        }
        
        return base_output
