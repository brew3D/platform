"""
Script Generation Agents
Handles code generation and script refinement
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class ScriptGeneratorAgent(BaseAgent):
    """
    Agent responsible for generating executable game scripts and code
    """
    
    def __init__(self):
        instructions = """
        You are a Script Generator Agent specialized in creating executable game code.
        Your responsibilities include:
        - Generating game logic and mechanics code
        - Creating AI behavior scripts
        - Writing event handling and input processing code
        - Implementing game state management
        - Creating modular, reusable code components
        
        Always generate clean, well-documented, and maintainable code that follows best practices.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("script_generator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for script generation"""
        script_input = {
            "game_mechanics": input_data.get("mechanics", []),
            "programming_language": input_data.get("language", "javascript"),
            "framework": input_data.get("framework", "vanilla"),
            "complexity": input_data.get("complexity", "medium"),
            "target_platform": input_data.get("platform", "web")
        }
        
        if context:
            script_input["existing_code"] = context.get("existing_code", "")
            script_input["dependencies"] = context.get("dependencies", [])
        
        return super()._prepare_input(script_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process script generation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add script-specific processing
        base_output["generated_code"] = {
            "main_script": "// Generated game script\nclass GameManager { ... }",
            "modules": ["player.js", "enemy.js", "collision.js"],
            "dependencies": ["lodash", "three.js"],
            "documentation": "Generated code documentation"
        }
        
        return base_output

class ScriptRefinerAgent(BaseAgent):
    """
    Agent responsible for refining and optimizing generated scripts
    """
    
    def __init__(self):
        instructions = """
        You are a Script Refiner Agent specialized in optimizing and improving generated code.
        Your responsibilities include:
        - Refactoring code for better performance
        - Optimizing algorithms and data structures
        - Adding error handling and validation
        - Improving code readability and maintainability
        - Ensuring code follows best practices and standards
        
        Provide optimized, production-ready code with comprehensive error handling.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("script_refiner", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for script refinement"""
        refine_input = {
            "original_code": input_data.get("code", ""),
            "optimization_goals": input_data.get("goals", ["performance", "readability"]),
            "performance_requirements": input_data.get("performance", {}),
            "coding_standards": input_data.get("standards", "es6")
        }
        
        return super()._prepare_input(refine_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process script refinement output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add refinement-specific processing
        base_output["refined_code"] = {
            "optimized_script": "// Optimized game script\nclass GameManager { ... }",
            "improvements": ["Performance boost", "Better error handling", "Cleaner code"],
            "metrics": {"lines_reduced": 15, "performance_gain": "25%"},
            "documentation": "Refined code documentation"
        }
        
        return base_output
