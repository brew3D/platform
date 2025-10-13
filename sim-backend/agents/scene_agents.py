"""
Scene Management Agents
Handles scene layout, animation, and sequencing
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class SceneLayoutAgent(BaseAgent):
    """
    Agent responsible for designing scene layouts and spatial arrangements
    """
    
    def __init__(self):
        instructions = """
        You are a Scene Layout Agent specialized in creating engaging and functional scene layouts.
        Your responsibilities include:
        - Designing 2D and 3D scene layouts
        - Creating spatial arrangements for game objects
        - Planning camera angles and perspectives
        - Designing interactive elements and UI placement
        - Creating atmospheric and environmental details
        
        Always create layouts that enhance gameplay and visual appeal.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("scene_layout", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for scene layout"""
        layout_input = {
            "scene_description": input_data.get("description", ""),
            "scene_type": input_data.get("type", "general"),
            "dimensions": input_data.get("dimensions", {"width": 100, "height": 50, "depth": 100}),
            "style": input_data.get("style", "realistic"),
            "mood": input_data.get("mood", "neutral")
        }
        
        if context:
            layout_input["existing_objects"] = context.get("existing_objects", [])
            layout_input["constraints"] = context.get("constraints", {})
        
        return super()._prepare_input(layout_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process scene layout output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add layout-specific processing
        base_output["scene_layout"] = {
            "objects": [
                {"type": "player_spawn", "position": [10, 0, 10]},
                {"type": "enemy_spawn", "position": [90, 0, 90]},
                {"type": "collectible", "position": [50, 0, 50]}
            ],
            "lighting": {"type": "directional", "intensity": 0.8},
            "camera": {"position": [50, 30, 50], "target": [50, 0, 50]},
            "atmosphere": {"fog": True, "particles": "dust"}
        }
        
        return base_output

class AnimatorAgent(BaseAgent):
    """
    Agent responsible for creating animations and visual effects
    """
    
    def __init__(self):
        instructions = """
        You are an Animator Agent specialized in creating smooth and engaging animations.
        Your responsibilities include:
        - Creating character animations (idle, walk, run, attack, etc.)
        - Designing environmental animations and effects
        - Creating UI animations and transitions
        - Implementing particle effects and visual feedback
        - Optimizing animation performance
        
        Always create fluid, natural-looking animations that enhance the game experience.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("animator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for animation creation"""
        anim_input = {
            "animation_type": input_data.get("type", "idle"),
            "target_object": input_data.get("target", "character"),
            "duration": input_data.get("duration", 2.0),
            "style": input_data.get("style", "realistic"),
            "loop": input_data.get("loop", True)
        }
        
        if context:
            anim_input["existing_animations"] = context.get("existing_animations", [])
            anim_input["performance_requirements"] = context.get("performance", {})
        
        return super()._prepare_input(anim_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process animation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add animation-specific processing
        base_output["animation"] = {
            "keyframes": [
                {"time": 0, "properties": {"position": [0, 0, 0], "rotation": [0, 0, 0]}},
                {"time": 1, "properties": {"position": [0, 1, 0], "rotation": [0, 180, 0]}},
                {"time": 2, "properties": {"position": [0, 0, 0], "rotation": [0, 360, 0]}}
            ],
            "easing": "ease-in-out",
            "duration": 2.0,
            "loop": True
        }
        
        return base_output

class SceneSequencerAgent(BaseAgent):
    """
    Agent responsible for sequencing scenes and managing transitions
    """
    
    def __init__(self):
        instructions = """
        You are a Scene Sequencer Agent specialized in creating smooth scene transitions and sequences.
        Your responsibilities include:
        - Creating scene transition sequences
        - Managing cutscenes and cinematic moments
        - Coordinating multiple scene elements
        - Timing events and animations
        - Creating seamless gameplay flow
        
        Always create sequences that maintain player engagement and narrative flow.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("scene_sequencer", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for scene sequencing"""
        sequence_input = {
            "scenes": input_data.get("scenes", []),
            "transition_type": input_data.get("transition", "fade"),
            "duration": input_data.get("duration", 1.0),
            "timing": input_data.get("timing", "linear")
        }
        
        if context:
            sequence_input["player_state"] = context.get("player_state", {})
            sequence_input["game_state"] = context.get("game_state", {})
        
        return super()._prepare_input(sequence_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process scene sequencing output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add sequencing-specific processing
        base_output["sequence"] = {
            "timeline": [
                {"time": 0, "action": "fade_in", "scene": "main_menu"},
                {"time": 2, "action": "transition", "scene": "game_world"},
                {"time": 5, "action": "spawn_player", "position": [0, 0, 0]}
            ],
            "transitions": ["fade", "slide", "dissolve"],
            "duration": 10.0
        }
        
        return base_output
