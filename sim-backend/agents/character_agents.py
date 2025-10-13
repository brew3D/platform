"""
Character Management Agents
Handles character design, rigging, and logic
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class CharacterDesignerAgent(BaseAgent):
    """
    Agent responsible for designing characters and NPCs
    """
    
    def __init__(self):
        instructions = """
        You are a Character Designer Agent specialized in creating engaging game characters.
        Your responsibilities include:
        - Designing character appearance and personality
        - Creating character backstories and motivations
        - Designing character abilities and stats
        - Creating character animations and expressions
        - Ensuring character consistency and appeal
        
        Always create memorable, well-designed characters that enhance the game experience.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("character_designer", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for character design"""
        design_input = {
            "character_type": input_data.get("type", "hero"),
            "game_genre": input_data.get("genre", "action"),
            "visual_style": input_data.get("style", "realistic"),
            "role": input_data.get("role", "protagonist"),
            "personality": input_data.get("personality", "neutral")
        }
        
        if context:
            design_input["existing_characters"] = context.get("existing_characters", [])
            design_input["world_setting"] = context.get("world_setting", {})
        
        return super()._prepare_input(design_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process character design output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add design-specific processing
        base_output["character_design"] = {
            "appearance": {
                "race": "human",
                "gender": "male",
                "age": 25,
                "height": "6'0\"",
                "build": "athletic",
                "hair_color": "brown",
                "eye_color": "blue"
            },
            "personality": {
                "traits": ["brave", "loyal", "determined"],
                "motivations": ["protect the innocent", "seek justice"],
                "fears": ["failure", "losing loved ones"]
            },
            "abilities": {
                "strength": 8,
                "agility": 7,
                "intelligence": 6,
                "charisma": 5
            }
        }
        
        return base_output

class CharacterRiggingAgent(BaseAgent):
    """
    Agent responsible for character rigging and animation setup
    """
    
    def __init__(self):
        instructions = """
        You are a Character Rigging Agent specialized in setting up character animation systems.
        Your responsibilities include:
        - Creating character rigs and skeletons
        - Setting up bone weights and constraints
        - Creating animation controllers and systems
        - Optimizing rigs for performance
        - Ensuring smooth character animations
        
        Always create efficient, well-structured rigs that enable smooth animations.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("character_rigging", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for character rigging"""
        rig_input = {
            "character_model": input_data.get("model", {}),
            "animation_requirements": input_data.get("animations", []),
            "platform": input_data.get("platform", "web"),
            "performance_target": input_data.get("performance", "medium"),
            "rig_type": input_data.get("rig_type", "humanoid")
        }
        
        return super()._prepare_input(rig_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process character rigging output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add rigging-specific processing
        base_output["rig_setup"] = {
            "skeleton": {
                "bones": 45,
                "hierarchy": "humanoid",
                "constraints": ["ik_legs", "ik_arms", "spine_twist"]
            },
            "weights": {
                "smooth_weights": True,
                "max_influences": 4,
                "weight_painting": "completed"
            },
            "controllers": {
                "ik_controllers": 8,
                "fk_controllers": 12,
                "blend_shapes": 15
            }
        }
        
        return base_output

class CharacterLogicAgent(BaseAgent):
    """
    Agent responsible for character AI and behavior logic
    """
    
    def __init__(self):
        instructions = """
        You are a Character Logic Agent specialized in creating intelligent character behaviors.
        Your responsibilities include:
        - Creating AI behavior trees and state machines
        - Implementing character decision-making logic
        - Creating dialogue and interaction systems
        - Implementing character progression and growth
        - Creating dynamic character relationships
        
        Always create believable, engaging character behaviors that enhance gameplay.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("character_logic", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for character logic"""
        logic_input = {
            "character_type": input_data.get("type", "npc"),
            "behavior_goals": input_data.get("goals", []),
            "interaction_type": input_data.get("interaction", "friendly"),
            "ai_complexity": input_data.get("complexity", "medium"),
            "dialogue_style": input_data.get("dialogue", "casual")
        }
        
        if context:
            logic_input["game_world"] = context.get("game_world", {})
            logic_input["player_actions"] = context.get("player_actions", [])
        
        return super()._prepare_input(logic_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process character logic output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add logic-specific processing
        base_output["character_logic"] = {
            "behavior_tree": {
                "root": "selector",
                "children": [
                    {"type": "sequence", "name": "patrol"},
                    {"type": "sequence", "name": "investigate"},
                    {"type": "sequence", "name": "attack"}
                ]
            },
            "dialogue_system": {
                "greetings": ["Hello there!", "Good to see you!", "How can I help?"],
                "responses": {
                    "quest": "I have a task for you...",
                    "trade": "What would you like to trade?",
                    "combat": "You'll regret this!"
                }
            },
            "ai_states": ["idle", "patrol", "investigate", "attack", "flee"]
        }
        
        return base_output
