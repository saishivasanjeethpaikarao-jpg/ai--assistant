"""
Executor Agent - Command conversion specialist
Converts natural language steps into executable commands.
"""

import logging
from typing import Optional
from assistant_core import generate_text

logger = logging.getLogger(__name__)


class ExecutorAgent:
    """Execution agent that converts steps to commands."""
    
    def __init__(self):
        self.role = "Executor"
        self.system_prompt = """You are an execution agent.

Your task: Convert natural language steps into executable commands.

Available command types:
- open <app/file/url>
- run <command>
- search <query>
- create file <path>
- read file <path>
- launch <app>

Rules:
- Output ONLY the command
- No explanations
- No extra text
- Be precise with paths and names"""
    
    def execute(self, step: str) -> str:
        """
        Convert a step into an executable command.
        
        Args:
            step: Natural language step description
            
        Returns:
            Executable command string
        """
        prompt = f"""{self.system_prompt}

Step to convert:
{step}

Command:"""
        
        try:
            result = generate_text(prompt)
            if result:
                command = result.strip()
                # Extract command if wrapped in explanation
                lines = command.split("\n")
                for line in lines:
                    if any(cmd in line.lower() for cmd in ["open", "run", "search", "create", "read", "launch"]):
                        return line.strip()
                return command
        except Exception as e:
            logger.error(f"Executor failed: {e}")
        
        # Fallback: return step as-is
        return step
    
    def execute_with_context(self, step: str, previous_commands: list) -> str:
        """
        Convert step with context of previous commands.
        
        Args:
            step: Natural language step
            previous_commands: List of previously executed commands
            
        Returns:
            Executable command
        """
        context = "\n".join([f"- {cmd}" for cmd in previous_commands[-3:]])
        
        prompt = f"""{self.system_prompt}

Previous commands:
{context}

Step to convert:
{step}

Command:"""
        
        try:
            result = generate_text(prompt)
            if result:
                command = result.strip()
                lines = command.split("\n")
                for line in lines:
                    if any(cmd in line.lower() for cmd in ["open", "run", "search", "create", "read", "launch"]):
                        return line.strip()
                return command
        except Exception as e:
            logger.error(f"Executor with context failed: {e}")
        
        return self.execute(step)
