"""
Map Design Agents
Handles map creation, navigation, and evaluation
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class MapDesignerAgent(BaseAgent):
    """
    Agent responsible for creating game maps and level designs
    """
    
    def __init__(self):
        instructions = """
        You are a Map Designer Agent specialized in creating engaging and functional game maps.
        Your responsibilities include:
        - Designing 2D and 3D game maps and levels
        - Creating balanced difficulty progression
        - Designing interactive elements and obstacles
        - Creating atmospheric and thematic environments
        - Ensuring optimal gameplay flow and pacing
        
        Always create maps that provide engaging challenges and visual appeal.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("map_designer", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for map design"""
        map_input = {
            "game_genre": input_data.get("genre", "action"),
            "map_size": input_data.get("size", {"width": 50, "height": 50}),
            "difficulty": input_data.get("difficulty", "medium"),
            "theme": input_data.get("theme", "generic"),
            "style": input_data.get("style", "realistic")
        }
        
        if context:
            map_input["existing_maps"] = context.get("existing_maps", [])
            map_input["player_abilities"] = context.get("player_abilities", [])
        
        return super()._prepare_input(map_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process map design output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add map-specific processing
        base_output["map_design"] = {
            "tiles": [
                {"type": "floor", "position": [0, 0], "texture": "stone"},
                {"type": "wall", "position": [1, 0], "texture": "brick"},
                {"type": "door", "position": [2, 0], "texture": "wood"}
            ],
            "spawn_points": [
                {"type": "player", "position": [5, 5]},
                {"type": "enemy", "position": [45, 45]},
                {"type": "collectible", "position": [25, 25]}
            ],
            "lighting": {"ambient": 0.3, "directional": 0.7},
            "atmosphere": {"fog": True, "particles": "dust"}
        }
        
        return base_output

class NavigationAgent(BaseAgent):
    """
    Agent responsible for creating navigation systems and pathfinding
    """
    
    def __init__(self):
        instructions = """
        You are a Navigation Agent specialized in creating intelligent navigation systems.
        Your responsibilities include:
        - Implementing pathfinding algorithms (A*, Dijkstra, etc.)
        - Creating waypoint systems and navigation meshes
        - Designing AI movement patterns and behaviors
        - Optimizing navigation performance
        - Creating dynamic obstacle avoidance
        
        Always create efficient and intelligent navigation systems.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("navigation", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for navigation system"""
        nav_input = {
            "map_data": input_data.get("map", {}),
            "start_position": input_data.get("start", [0, 0]),
            "end_position": input_data.get("end", [10, 10]),
            "algorithm": input_data.get("algorithm", "astar"),
            "obstacles": input_data.get("obstacles", [])
        }
        
        return super()._prepare_input(nav_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process navigation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add navigation-specific processing
        base_output["navigation"] = {
            "path": [[0, 0], [2, 2], [4, 4], [6, 6], [8, 8], [10, 10]],
            "waypoints": [[2, 2], [4, 4], [6, 6], [8, 8]],
            "cost": 14.14,
            "algorithm": "astar"
        }
        
        return base_output

class MapEvaluatorAgent(BaseAgent):
    """
    Agent responsible for evaluating map quality and balance
    """
    
    def __init__(self):
        instructions = """
        You are a Map Evaluator Agent specialized in analyzing map quality and balance.
        Your responsibilities include:
        - Evaluating map difficulty and progression
        - Analyzing player flow and engagement
        - Identifying balance issues and bottlenecks
        - Measuring map performance metrics
        - Suggesting improvements and optimizations
        
        Provide detailed analysis and actionable recommendations for map improvements.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("map_evaluator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for map evaluation"""
        eval_input = {
            "map_data": input_data.get("map", {}),
            "player_data": input_data.get("player_data", {}),
            "metrics": input_data.get("metrics", {}),
            "feedback": input_data.get("feedback", [])
        }
        
        return super()._prepare_input(eval_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process map evaluation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add evaluation-specific processing
        base_output["evaluation"] = {
            "difficulty_score": 7.5,
            "flow_score": 8.2,
            "balance_score": 6.8,
            "issues": ["Too many enemies in area 3", "Missing cover in area 2"],
            "recommendations": ["Add more cover", "Reduce enemy density", "Improve lighting"]
        }
        
        return base_output
