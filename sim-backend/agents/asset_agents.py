"""
Asset Management Agents
Handles asset creation, curation, and import/export
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class AssetCuratorAgent(BaseAgent):
    """
    Agent responsible for curating and organizing game assets
    """
    
    def __init__(self):
        instructions = """
        You are an Asset Curator Agent specialized in organizing and managing game assets.
        Your responsibilities include:
        - Categorizing and tagging game assets
        - Creating asset libraries and collections
        - Managing asset metadata and properties
        - Optimizing asset organization and searchability
        - Ensuring asset quality and consistency
        
        Always maintain well-organized, searchable asset collections.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("asset_curator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for asset curation"""
        curator_input = {
            "assets": input_data.get("assets", []),
            "categories": input_data.get("categories", []),
            "tags": input_data.get("tags", []),
            "style": input_data.get("style", "realistic"),
            "quality_standards": input_data.get("quality", {})
        }
        
        if context:
            curator_input["existing_library"] = context.get("existing_library", [])
            curator_input["project_requirements"] = context.get("requirements", {})
        
        return super()._prepare_input(curator_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process asset curation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add curation-specific processing
        base_output["curated_assets"] = {
            "categories": {
                "characters": ["player", "enemy", "npc"],
                "environments": ["terrain", "buildings", "props"],
                "ui": ["buttons", "icons", "panels"]
            },
            "tags": ["medieval", "fantasy", "low_poly", "textured"],
            "quality_scores": {"player": 9.2, "enemy": 8.7, "terrain": 9.0}
        }
        
        return base_output

class AssetCreatorAgent(BaseAgent):
    """
    Agent responsible for creating new game assets
    """
    
    def __init__(self):
        instructions = """
        You are an Asset Creator Agent specialized in generating new game assets.
        Your responsibilities include:
        - Creating 2D and 3D game assets
        - Generating textures and materials
        - Creating sound effects and music
        - Designing UI elements and icons
        - Optimizing assets for different platforms
        
        Always create high-quality, optimized assets that fit the game's style.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("asset_creator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for asset creation"""
        creator_input = {
            "asset_type": input_data.get("type", "character"),
            "style": input_data.get("style", "realistic"),
            "specifications": input_data.get("specs", {}),
            "target_platform": input_data.get("platform", "web"),
            "quality": input_data.get("quality", "high")
        }
        
        if context:
            creator_input["reference_assets"] = context.get("references", [])
            creator_input["project_style"] = context.get("project_style", {})
        
        return super()._prepare_input(creator_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process asset creation output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add creation-specific processing
        base_output["created_asset"] = {
            "type": "character",
            "name": "player_character",
            "files": ["model.glb", "texture.png", "normal.png"],
            "specifications": {
                "polygons": 1500,
                "texture_size": "1024x1024",
                "file_size": "2.3MB"
            },
            "metadata": {
                "created_by": "asset_creator",
                "version": "1.0",
                "tags": ["player", "human", "medieval"]
            }
        }
        
        return base_output

class AssetImportExportAgent(BaseAgent):
    """
    Agent responsible for importing and exporting game assets
    """
    
    def __init__(self):
        instructions = """
        You are an Asset Import/Export Agent specialized in handling asset file operations.
        Your responsibilities include:
        - Importing assets from various formats
        - Converting between different file formats
        - Optimizing assets for different platforms
        - Managing asset dependencies and references
        - Exporting assets in required formats
        
        Always ensure seamless asset import/export with proper format conversion.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("asset_import_export", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for asset import/export"""
        io_input = {
            "operation": input_data.get("operation", "import"),
            "source_format": input_data.get("source_format", "fbx"),
            "target_format": input_data.get("target_format", "glb"),
            "assets": input_data.get("assets", []),
            "optimization_settings": input_data.get("optimization", {})
        }
        
        return super()._prepare_input(io_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process asset import/export output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add import/export-specific processing
        base_output["io_result"] = {
            "operation": "import",
            "processed_assets": 5,
            "successful": 4,
            "failed": 1,
            "output_files": ["asset1.glb", "asset2.glb", "asset3.glb", "asset4.glb"],
            "errors": ["asset5.fbx: Unsupported format"]
        }
        
        return base_output
