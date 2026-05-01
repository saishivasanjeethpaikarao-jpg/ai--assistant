"""AI Assistant Mode Router - Intelligently routes inputs to correct operating mode

This module handles:
1. Input classification (COMMAND/GOAL/CHAT)
2. Mode selection based on request type
3. Prompt generation for each mode
4. Result routing and aggregation
"""

import re
from typing import Dict, Any, Optional
from system_prompt_config import (
    classify_input,
    get_mode_prompt,
    is_multi_mode_enabled,
    list_available_modes,
)


class AIAssistantRouter:
    """Intelligent router for AI assistant modes"""
    
    def __init__(self):
        self.last_mode = None
        self.last_classification = None
        self.mode_history = []
    
    def route(self, user_input: str) -> Dict[str, Any]:
        """Route user input to appropriate mode and return response structure.
        
        Args:
            user_input: User's request
        
        Returns:
            {
                "classification": "COMMAND|GOAL|CHAT",
                "mode": "classifier|planner|executor|critic|memory_extractor|safety_validator",
                "prompt": formatted prompt for the mode,
                "next_steps": recommended next steps
            }
        """
        if not is_multi_mode_enabled():
            return {"mode": "disabled", "error": "Multi-mode framework disabled"}
        
        # Step 1: Classify input
        classification = classify_input(user_input)
        self.last_classification = classification
        
        # Step 2: Select appropriate mode based on classification
        selected_mode = self._select_mode(classification, user_input)
        self.last_mode = selected_mode
        self.mode_history.append(selected_mode)
        
        # Step 3: Generate mode-specific prompt
        mode_prompt = self._generate_mode_prompt(selected_mode, user_input, classification)
        
        # Step 4: Determine next steps
        next_steps = self._get_next_steps(selected_mode)
        
        return {
            "classification": classification,
            "mode": selected_mode,
            "prompt": mode_prompt,
            "next_steps": next_steps,
            "user_input": user_input,
        }
    
    def _select_mode(self, classification: str, user_input: str) -> str:
        """Select the most appropriate operating mode."""
        if classification == "COMMAND":
            return "executor"
        elif classification == "GOAL":
            # Check if it's a complex goal needing planning
            if any(word in user_input.lower() for word in ['analyze', 'prepare', 'build', 'debug']):
                return "planner"
            else:
                return "executor"
        else:  # CHAT
            return "chat"  # Default chat mode
    
    def _generate_mode_prompt(self, mode: str, user_input: str, classification: str) -> str:
        """Generate formatted prompt for the selected mode."""
        try:
            if mode == "executor":
                return get_mode_prompt("executor", step=user_input)
            elif mode == "planner":
                return get_mode_prompt("planner", goal=user_input)
            elif mode == "chat":
                # Chat mode returns the master prompt
                from system_prompt_config import load_system_prompt
                return load_system_prompt()
            else:
                return get_mode_prompt(mode)
        except (KeyError, ValueError):
            # Fallback for chat or unknown modes
            from system_prompt_config import load_system_prompt
            return load_system_prompt()
    
    def _get_next_steps(self, mode: str) -> list:
        """Recommend next steps after current mode."""
        next_steps_map = {
            "classifier": ["Route to appropriate mode", "Execute or plan"],
            "planner": ["Get user confirmation", "Route each step to executor"],
            "executor": ["Collect results", "Route to critic for evaluation"],
            "critic": ["Extract memory", "Store lessons learned"],
            "memory_extractor": ["Update knowledge base", "Continue conversation"],
            "safety_validator": ["Execute if safe", "Block if unsafe"],
            "chat": ["Respond naturally", "Extract facts if applicable"],
        }
        return next_steps_map.get(mode, [])
    
    def validate_command(self, command: str) -> Dict[str, Any]:
        """Validate if a command is safe using safety validator mode.
        
        Args:
            command: Command to validate
        
        Returns:
            {
                "status": "SAFE|BLOCKED|UNKNOWN",
                "reason": explanation,
                "command": original command
            }
        """
        # Check for dangerous patterns
        dangerous_patterns = [
            r'shutdown',
            r'restart\s+/s',
            r'del\s+/s\s+/q',
            r'Remove-Item.*-Recurse',
            r'rm\s+-rf\s+/',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return {
                    "status": "BLOCKED",
                    "reason": "Command contains dangerous operation",
                    "command": command
                }
        
        # Check for credential exposure
        if any(cred in command.lower() for cred in ['password', 'api_key', 'secret', 'token']):
            if '=' in command or ':' in command:
                return {
                    "status": "UNKNOWN",
                    "reason": "Potential credential exposure - requires human review",
                    "command": command
                }
        
        return {
            "status": "SAFE",
            "reason": "Command passed safety checks",
            "command": command
        }
    
    def extract_metrics(self) -> Dict[str, Any]:
        """Extract metrics about router usage."""
        return {
            "modes_used": len(set(self.mode_history)),
            "total_routes": len(self.mode_history),
            "most_common_mode": max(set(self.mode_history), key=self.mode_history.count) if self.mode_history else None,
            "last_mode": self.last_mode,
            "last_classification": self.last_classification,
        }


# Global router instance
_router = None

def get_router() -> AIAssistantRouter:
    """Get or create global router instance."""
    global _router
    if _router is None:
        _router = AIAssistantRouter()
    return _router


def route_input(user_input: str) -> Dict[str, Any]:
    """Convenience function to route user input."""
    return get_router().route(user_input)


def validate_command(command: str) -> Dict[str, Any]:
    """Convenience function to validate a command."""
    return get_router().validate_command(command)


def reset_router():
    """Reset router state (useful for testing)."""
    global _router
    _router = None
