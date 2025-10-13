"""
3D Modeling and Sculpting Agents
Handles 3D asset creation and modification
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class SculptingAgent(BaseAgent):
    """
    Agent responsible for 3D sculpting and modeling
    """
    
    def __init__(self):
        instructions = """
        You are a Sculpting Agent specialized in 3D modeling and sculpting.
        Your responsibilities include:
        - Creating detailed 3D models and sculptures
        - Sculpting organic shapes and characters
        - Creating high-poly models for baking
        - Adding fine details and surface textures
        - Optimizing models for different use cases
        
        Always create high-quality, detailed 3D models that meet project requirements.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("sculpting", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for 3D sculpting"""
        sculpt_input = {
            "model_type": input_data.get("type", "character"),
            "style": input_data.get("style", "realistic"),
            "complexity": input_data.get("complexity", "high"),
            "target_polycount": input_data.get("polycount", 10000),
            "reference_images": input_data.get("references", [])
        }
        
        if context:
            sculpt_input["existing_models"] = context.get("existing_models", [])
            sculpt_input["project_requirements"] = context.get("requirements", {})
        
        return super()._prepare_input(sculpt_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process sculpting output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add sculpting-specific processing
        base_output["sculpted_model"] = {
            "type": "character",
            "polycount": 12500,
            "vertices": 6250,
            "faces": 12500,
            "materials": ["skin", "clothing", "hair"],
            "texture_resolution": "4K",
            "file_formats": ["blend", "obj", "fbx"]
        }
        
        return base_output

class RetopologyAgent(BaseAgent):
    """
    Agent responsible for retopology and mesh optimization
    """
    
    def __init__(self):
        instructions = """
        You are a Retopology Agent specialized in optimizing 3D meshes.
        Your responsibilities include:
        - Creating clean topology for 3D models
        - Optimizing mesh flow for animation
        - Reducing polycount while maintaining detail
        - Creating proper edge loops and quads
        - Preparing models for rigging and animation
        
        Always create clean, efficient topology that's suitable for animation.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("retopology", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for retopology"""
        retopo_input = {
            "source_model": input_data.get("model", {}),
            "target_polycount": input_data.get("target_polycount", 2000),
            "animation_requirements": input_data.get("animation", True),
            "quality_level": input_data.get("quality", "high"),
            "edge_flow_priority": input_data.get("edge_flow", True)
        }
        
        return super()._prepare_input(retopo_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process retopology output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add retopology-specific processing
        base_output["retopologized_model"] = {
            "original_polycount": 12500,
            "optimized_polycount": 1950,
            "reduction_percentage": 84.4,
            "edge_flow": "clean",
            "quads_percentage": 95.2,
            "animation_ready": True,
            "uv_unwrapped": True
        }
        
        return base_output

class TextureMaterialCreatorAgent(BaseAgent):
    """
    Agent responsible for creating textures and materials
    """
    
    def __init__(self):
        instructions = """
        You are a Texture Material Creator Agent specialized in creating textures and materials.
        Your responsibilities include:
        - Creating diffuse, normal, and specular maps
        - Designing material shaders and properties
        - Creating procedural textures and patterns
        - Baking high-poly details to low-poly models
        - Optimizing textures for different platforms
        
        Always create high-quality, optimized textures and materials.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("texture_material_creator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for texture creation"""
        texture_input = {
            "material_type": input_data.get("type", "character_skin"),
            "style": input_data.get("style", "realistic"),
            "resolution": input_data.get("resolution", "2048x2048"),
            "texture_maps": input_data.get("maps", ["diffuse", "normal", "specular"]),
            "target_platform": input_data.get("platform", "web")
        }
        
        if context:
            texture_input["reference_materials"] = context.get("references", [])
            texture_input["lighting_setup"] = context.get("lighting", {})
        
        return super()._prepare_input(texture_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process texture creation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add texture-specific processing
        base_output["created_materials"] = {
            "material_name": "character_skin",
            "texture_maps": {
                "diffuse": "skin_diffuse_2k.png",
                "normal": "skin_normal_2k.png",
                "specular": "skin_specular_2k.png",
                "roughness": "skin_roughness_2k.png"
            },
            "shader_properties": {
                "metallic": 0.0,
                "roughness": 0.3,
                "subsurface": 0.1,
                "specular": 0.5
            },
            "file_size": "8.2MB",
            "optimized": True
        }
        
        return base_output

class ModelEvaluatorAgent(BaseAgent):
    """
    Agent responsible for evaluating 3D models and providing feedback
    """
    
    def __init__(self):
        instructions = """
        You are a Model Evaluator Agent specialized in analyzing 3D models.
        Your responsibilities include:
        - Evaluating model quality and technical specifications
        - Checking for common modeling issues and errors
        - Providing feedback on topology and geometry
        - Suggesting improvements and optimizations
        - Ensuring models meet project requirements
        
        Always provide detailed, actionable feedback for model improvements.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("model_evaluator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for model evaluation"""
        eval_input = {
            "model_data": input_data.get("model", {}),
            "evaluation_criteria": input_data.get("criteria", []),
            "target_use": input_data.get("use", "game_asset"),
            "quality_standards": input_data.get("standards", {}),
            "performance_requirements": input_data.get("performance", {})
        }
        
        return super()._prepare_input(eval_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process model evaluation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add evaluation-specific processing
        base_output["model_evaluation"] = {
            "overall_score": 8.5,
            "technical_score": 9.0,
            "artistic_score": 8.0,
            "issues": [
                "Some n-gons present in mesh",
                "UV seams could be better hidden"
            ],
            "recommendations": [
                "Convert n-gons to quads",
                "Optimize UV layout",
                "Add more edge loops for better deformation"
            ],
            "polycount_analysis": {
                "current": 1950,
                "recommended": 1500,
                "efficiency": "good"
            }
        }
        
        return base_output
