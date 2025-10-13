"""
AI Agent System for Game Development Pipeline
Using OpenAI Agents SDK for orchestration and coordination
"""

# Import the OpenAI Agent class directly to avoid circular imports
try:
    from agents import Agent, Runner
except ImportError:
    # Fallback if agents module is not available
    Agent = None
    Runner = None

# Export the main classes that are needed
__all__ = [
    'Agent',
    'Runner'
]
