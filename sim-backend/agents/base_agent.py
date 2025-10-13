"""
Base Agent class with common functionality for all AI agents
"""

from typing import Dict, Any, List, Optional, Callable
import json
import logging
from datetime import datetime

# Import OpenAI Agents SDK
try:
    from agents import Agent, Runner
except ImportError:
    # Fallback for when agents module is not available
    Agent = None
    Runner = None

class BaseAgent:
    """
    Base class for all AI agents in the game development pipeline
    """

    def __init__(self, name: str, instructions: str, tools: List[Callable] = None):
        self.name = name
        self.instructions = instructions
        self.tools = tools or []

        if Agent is not None:
            self.agent = Agent(name=name, instructions=instructions, tools=self.tools)
        else:
            self.agent = None

        self.logger = logging.getLogger(f"agent.{name}")

    def run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Run the agent with input data and optional context
        """
        try:
            if self.agent is None or Runner is None:
                # Fallback when OpenAI Agents SDK is not available
                return self._fallback_run(input_data, context)

            # Prepare input for the agent
            agent_input = self._prepare_input(input_data, context)

            # Run the agent
            result = Runner.run_sync(self.agent, agent_input)

            # Process and return result
            return self._process_output(result, input_data, context)

        except Exception as e:
            self.logger.error(f"Error running agent {self.name}: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "agent": self.name,
                "timestamp": datetime.utcnow().isoformat()
            }

    def _fallback_run(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Fallback run method when OpenAI Agents SDK is not available
        """
        return {
            "success": True,
            "agent": self.name,
            "output": f"Agent {self.name} executed with fallback method",
            "timestamp": datetime.utcnow().isoformat(),
            "input_data": input_data,
            "note": "OpenAI Agents SDK not available, using fallback"
        }

    def _prepare_input(self, input_data: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> str:
        """
        Prepare input data for the agent
        Override in subclasses for custom input processing
        """
        # Default: convert input_data and context to JSON string
        combined_input = {"input_data": input_data}
        if context:
            combined_input["context"] = context
        return json.dumps(combined_input)

    def _process_output(self, result: Any, original_input: Dict[str, Any], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Process the output from the agent run
        Override in subclasses for custom output processing
        """
        # Default: return the final_output from the agent result
        return {
            "success": True,
            "agent": self.name,
            "output": result.final_output,
            "timestamp": datetime.utcnow().isoformat(),
            "input_data": original_input,
            "context": context
        }
