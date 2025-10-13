"""
Collaboration Management Agents
Handles real-time collaboration and change management
"""

from .base_agent import BaseAgent
from .tools import log_agent_action, validate_input, format_agent_output

class CollaborationCoordinatorAgent(BaseAgent):
    """
    Agent responsible for coordinating real-time collaboration
    """
    
    def __init__(self):
        instructions = """
        You are a Collaboration Coordinator Agent specialized in managing real-time collaboration.
        Your responsibilities include:
        - Coordinating multiple users working on the same project
        - Managing user permissions and access levels
        - Facilitating communication between team members
        - Resolving conflicts and merge issues
        - Ensuring smooth collaborative workflows
        
        Always maintain clear communication and resolve conflicts efficiently.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("collaboration_coordinator", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for collaboration coordination"""
        collab_input = {
            "active_users": input_data.get("users", []),
            "project_id": input_data.get("project_id", ""),
            "permissions": input_data.get("permissions", {}),
            "conflicts": input_data.get("conflicts", []),
            "workflow": input_data.get("workflow", "standard")
        }
        
        if context:
            collab_input["project_state"] = context.get("project_state", {})
            collab_input["user_actions"] = context.get("user_actions", [])
        
        return super()._prepare_input(collab_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process collaboration coordination output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add collaboration-specific processing
        base_output["collaboration_status"] = {
            "active_users": [
                {"id": "user1", "name": "Alice", "role": "designer", "status": "active"},
                {"id": "user2", "name": "Bob", "role": "developer", "status": "idle"}
            ],
            "permissions": {
                "user1": ["edit", "comment", "review"],
                "user2": ["edit", "build", "deploy"]
            },
            "conflicts": [],
            "sync_status": "up_to_date"
        }
        
        return base_output

class ChangeMergeAgent(BaseAgent):
    """
    Agent responsible for merging changes and resolving conflicts
    """
    
    def __init__(self):
        instructions = """
        You are a Change Merge Agent specialized in merging changes and resolving conflicts.
        Your responsibilities include:
        - Detecting and analyzing changes from multiple users
        - Automatically merging compatible changes
        - Identifying and flagging conflicts for resolution
        - Suggesting conflict resolution strategies
        - Maintaining project integrity during merges
        
        Always prioritize project stability and user productivity during merges.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("change_merge", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for change merging"""
        merge_input = {
            "changes": input_data.get("changes", []),
            "base_version": input_data.get("base_version", ""),
            "merge_strategy": input_data.get("strategy", "automatic"),
            "conflict_resolution": input_data.get("conflict_resolution", "manual"),
            "backup_required": input_data.get("backup", True)
        }
        
        return super()._prepare_input(merge_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process change merge output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add merge-specific processing
        base_output["merge_result"] = {
            "status": "success",
            "merged_changes": 15,
            "conflicts": 2,
            "resolved_conflicts": 2,
            "backup_created": True,
            "new_version": "v1.2.3"
        }
        
        return base_output

class CommentReviewAgent(BaseAgent):
    """
    Agent responsible for managing comments and reviews
    """
    
    def __init__(self):
        instructions = """
        You are a Comment Review Agent specialized in managing comments and reviews.
        Your responsibilities include:
        - Managing comment threads and discussions
        - Facilitating code reviews and feedback
        - Tracking review status and approvals
        - Notifying relevant users of comments
        - Maintaining review history and context
        
        Always facilitate constructive feedback and clear communication.
        """
        
        tools = [log_agent_action, validate_input, format_agent_output]
        super().__init__("comment_review", instructions, tools)
    
    def _prepare_input(self, input_data, context=None):
        """Prepare input for comment management"""
        comment_input = {
            "comment_type": input_data.get("type", "general"),
            "content": input_data.get("content", ""),
            "target": input_data.get("target", ""),
            "author": input_data.get("author", ""),
            "priority": input_data.get("priority", "normal")
        }
        
        if context:
            comment_input["existing_comments"] = context.get("existing_comments", [])
            comment_input["review_context"] = context.get("review_context", {})
        
        return super()._prepare_input(comment_input, context)
    
    def _process_output(self, result, original_input, context=None):
        """Process comment management output"""
        base_output = super()._process_output(result, original_input, context)
        
        # Add comment-specific processing
        base_output["comment_management"] = {
            "comment_id": "cmt_123",
            "thread_id": "thread_456",
            "status": "active",
            "replies": 3,
            "mentions": ["@alice", "@bob"],
            "review_status": "pending"
        }
        
        return base_output
