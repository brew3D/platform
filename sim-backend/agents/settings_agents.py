"""
Settings Management Agents
Handles project settings and build targets
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class SettingsManagerAgent(BaseAgent):
    """
    Agent responsible for managing project settings and configuration
    """
    
    def __init__(self):
        instructions = """
        You are a Settings Manager Agent specialized in configuring game projects.
        Your responsibilities include:
        - Managing project settings and preferences
        - Configuring game parameters and variables
        - Setting up build configurations
        - Managing platform-specific settings
        - Optimizing project performance settings
        
        Always create well-organized, maintainable project configurations.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("settings_manager", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for settings management"""
        settings_input = {
            "project_type": input_data.get("type", "game"),
            "platform": input_data.get("platform", "web"),
            "engine": input_data.get("engine", "custom"),
            "requirements": input_data.get("requirements", {}),
            "optimization_level": input_data.get("optimization", "medium")
        }
        
        if context:
            settings_input["existing_settings"] = context.get("existing_settings", {})
            settings_input["user_preferences"] = context.get("user_preferences", {})
        
        return super()._prepare_input(settings_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process settings management output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add settings-specific processing
        base_output["project_settings"] = {
            "general": {
                "name": "My Game",
                "version": "1.0.0",
                "description": "An amazing game created with AI",
                "author": "AI Game Builder"
            },
            "graphics": {
                "resolution": "1920x1080",
                "quality": "high",
                "shadows": True,
                "particles": True,
                "post_processing": True
            },
            "audio": {
                "master_volume": 1.0,
                "music_volume": 0.8,
                "sfx_volume": 0.9,
                "voice_volume": 1.0
            },
            "controls": {
                "keyboard": True,
                "mouse": True,
                "gamepad": True,
                "touch": False
            }
        }
        
        return base_output

class BuildTargetAgent(BaseAgent):
    """
    Agent responsible for managing build targets and deployment
    """
    
    def __init__(self):
        instructions = """
        You are a Build Target Agent specialized in creating and managing build configurations.
        Your responsibilities include:
        - Creating platform-specific build targets
        - Configuring build scripts and processes
        - Managing asset optimization for different platforms
        - Setting up deployment pipelines
        - Ensuring cross-platform compatibility
        
        Always create efficient, reliable build processes for all target platforms.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("build_target", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for build target management"""
        build_input = {
            "target_platforms": input_data.get("platforms", ["web"]),
            "build_type": input_data.get("type", "release"),
            "optimization": input_data.get("optimization", "medium"),
            "assets": input_data.get("assets", []),
            "dependencies": input_data.get("dependencies", [])
        }
        
        if context:
            build_input["project_structure"] = context.get("project_structure", {})
            build_input["build_requirements"] = context.get("requirements", {})
        
        return super()._prepare_input(build_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process build target output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add build-specific processing
        base_output["build_configuration"] = {
            "web": {
                "format": "html5",
                "compression": "gzip",
                "optimization": "high",
                "compatibility": "modern_browsers"
            },
            "mobile": {
                "format": "apk",
                "target_sdk": 33,
                "min_sdk": 21,
                "permissions": ["internet", "storage"]
            },
            "desktop": {
                "format": "executable",
                "platform": "windows",
                "architecture": "x64",
                "dependencies": ["vcredist"]
            }
        }
        
        return base_output
