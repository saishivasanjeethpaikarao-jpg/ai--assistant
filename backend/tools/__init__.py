"""
AIRIS Tools Layer — Clean, plugin-style tool execution.
Each tool is a module that can be called by the agent.
"""

from typing import Dict, Any
from enum import Enum


class ToolCategory(Enum):
    """Tool categories for routing."""
    SYSTEM = "system"          # poweroff, restart, volume, etc.
    BROWSER = "browser"        # open URL, search, etc.
    APP = "app"                # open apps, run programs
    FILE = "file"              # create, edit, delete files
    TRADING = "trading"        # market analysis, recommendations
    QUERY = "query"            # information lookup
    PERSONAL = "personal"      # reminders, calendar, notes


class ToolResult:
    """Standard tool execution result."""
    
    def __init__(self, success: bool, message: str, data: Dict[str, Any] = None):
        self.success = success
        self.message = message
        self.data = data or {}
    
    def __repr__(self):
        return f"ToolResult(success={self.success}, message='{self.message[:50]}'...)"


class ToolRegistry:
    """Register and execute tools."""
    
    def __init__(self):
        self.tools: Dict[str, callable] = {}
    
    def register(self, name: str, func: callable):
        """Register a tool."""
        self.tools[name] = func
    
    def execute(self, tool_name: str, **kwargs) -> ToolResult:
        """Execute a registered tool."""
        if tool_name not in self.tools:
            return ToolResult(
                success=False,
                message=f"Tool '{tool_name}' not found"
            )
        
        try:
            result = self.tools[tool_name](**kwargs)
            if isinstance(result, ToolResult):
                return result
            else:
                return ToolResult(success=True, message=str(result))
        except Exception as e:
            return ToolResult(success=False, message=f"Tool error: {str(e)}")
    
    def list_tools(self):
        """List all registered tools."""
        return list(self.tools.keys())


# Global registry
tool_registry = ToolRegistry()
