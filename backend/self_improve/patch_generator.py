"""
Self-Improvement Patch Generator — Asks LLM to propose code changes from logs.
Safe, human-reviewed approach to self-improvement.
"""

import json
from typing import Dict, Any, Optional, List
from .logger import self_improve_logger


class PatchGenerator:
    """Generates improvement patches based on logged interactions."""
    
    def __init__(self):
        self.logger = self_improve_logger
    
    def generate_error_patch(self, error: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Generate a patch to fix a specific error."""
        # In a real implementation, this would call the LLM
        # For now, return a structured placeholder
        return {
            "type": "error_fix",
            "error": error,
            "context": context,
            "suggested_changes": [
                {
                    "file": "backend/assistant_core.py",
                    "line": 100,
                    "change": "Add error handling for this case",
                    "code_diff": "- except Exception as e:\n+ except (ValueError, KeyError) as e:"
                }
            ],
            "reasoning": "Based on the error pattern, this change should prevent similar issues."
        }
    
    def generate_interaction_patch(self, failed_interactions: List[Dict]) -> Dict[str, Any]:
        """Generate patches based on failed interactions."""
        if not failed_interactions:
            return {"type": "no_changes", "reason": "No failed interactions found"}
        
        # Analyze patterns in failed interactions
        patterns = self._analyze_patterns(failed_interactions)
        
        return {
            "type": "interaction_improvement",
            "patterns_found": patterns,
            "suggested_changes": [
                {
                    "file": "backend/voice_pipeline.py",
                    "line": 50,
                    "change": "Improve voice recognition accuracy",
                    "code_diff": "- recognizer.adjust_for_ambient_noise(source, duration=0.5)\n+ recognizer.adjust_for_ambient_noise(source, duration=1.0)"
                }
            ],
            "reasoning": "Failed interactions suggest voice recognition needs adjustment."
        }
    
    def generate_tool_patch(self, tool_name: str, failures: List[Dict]) -> Dict[str, Any]:
        """Generate patches for a specific tool."""
        return {
            "type": "tool_improvement",
            "tool": tool_name,
            "failures": len(failures),
            "suggested_changes": [
                {
                    "file": f"backend/tools/{tool_name}.py",
                    "line": 30,
                    "change": "Add retry logic",
                    "code_diff": "+ retries = 3\n+ for attempt in range(retries):\n+     try:"
                }
            ],
            "reasoning": f"Tool {tool_name} failed {len(failures)} times. Adding retry logic."
        }
    
    def _analyze_patterns(self, interactions: List[Dict]) -> List[str]:
        """Analyze patterns in interactions."""
        patterns = []
        
        # Check for common error types
        error_types = {}
        for interaction in interactions:
            if 'error' in interaction:
                error_type = interaction['error'].split(':')[0]
                error_types[error_type] = error_types.get(error_type, 0) + 1
        
        for error_type, count in error_types.items():
            if count > 2:
                patterns.append(f"Repeated error: {error_type} ({count} times)")
        
        return patterns
    
    def generate_full_patch(self) -> Dict[str, Any]:
        """Generate a comprehensive patch based on all logs."""
        recent_errors = self.logger.get_recent_errors()
        failed_interactions = self.logger.get_failed_interactions()
        
        patches = []
        
        if recent_errors:
            for error in recent_errors:
                patches.append(self.generate_error_patch(error['error'], error.get('context')))
        
        if failed_interactions:
            patches.append(self.generate_interaction_patch(failed_interactions))
        
        return {
            "type": "comprehensive_patch",
            "timestamp": self.logger.session_log[-1]['timestamp'] if self.logger.session_log else None,
            "patches": patches,
            "summary": self.logger.get_session_summary()
        }
    
    def format_patch_for_review(self, patch: Dict[str, Any]) -> str:
        """Format patch for human review."""
        output = []
        output.append(f"=== PATCH REVIEW ===")
        output.append(f"Type: {patch.get('type')}")
        output.append(f"Reasoning: {patch.get('reasoning', 'N/A')}")
        output.append(f"\nSuggested Changes:")
        
        if 'suggested_changes' in patch:
            for i, change in enumerate(patch['suggested_changes'], 1):
                output.append(f"\n{i}. File: {change.get('file')}")
                output.append(f"   Line: {change.get('line')}")
                output.append(f"   Change: {change.get('change')}")
                output.append(f"   Diff:")
                for line in change.get('code_diff', '').split('\n'):
                    output.append(f"     {line}")
        
        return '\n'.join(output)


# Singleton instance
patch_generator = PatchGenerator()
