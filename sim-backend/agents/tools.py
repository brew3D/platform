"""
Tool functions that agents can use
"""

import json
import logging
from typing import Dict, Any, List
from datetime import datetime

def log_agent_action(agent_name: str, action: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Log an action taken by an agent
    """
    logger = logging.getLogger(f"agent.{agent_name}")
    
    log_entry = {
        "agent": agent_name,
        "action": action,
        "timestamp": datetime.utcnow().isoformat(),
        "details": details or {}
    }
    
    logger.info(f"Agent {agent_name} performed action: {action}")
    
    return {
        "success": True,
        "log_entry": log_entry
    }

def json_tool(data: Any) -> str:
    """
    Convert data to JSON string
    """
    try:
        return json.dumps(data, indent=2)
    except Exception as e:
        return f"Error converting to JSON: {str(e)}"

def validate_input(input_data: Dict[str, Any], required_fields: List[str]) -> Dict[str, Any]:
    """
    Validate that input data contains required fields
    """
    missing_fields = [field for field in required_fields if field not in input_data]
    
    if missing_fields:
        return {
            "valid": False,
            "missing_fields": missing_fields,
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }
    
    return {
        "valid": True,
        "message": "Input validation passed"
    }

def format_agent_output(output: Any, format_type: str = "text") -> str:
    """
    Format agent output based on type
    """
    if format_type == "json":
        return json_tool(output)
    elif format_type == "markdown":
        return f"# Agent Output\n\n{output}"
    else:
        return str(output)
