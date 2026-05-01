"""
Self-Improvement Logger — Logs interactions, errors, and feedback.
Used for generating improvement patches.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path


class SelfImproveLogger:
    """Logs interactions for self-improvement analysis."""
    
    def __init__(self, log_dir: str = "logs/self_improve"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)
        self.session_file = self.log_dir / f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jsonl"
        self.session_log = []
    
    def log_interaction(self, user_input: str, assistant_response: str, success: bool = True):
        """Log a user-assistant interaction."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "interaction",
            "user_input": user_input,
            "assistant_response": assistant_response,
            "success": success
        }
        self.session_log.append(entry)
        self._write_entry(entry)
    
    def log_error(self, error: str, context: Dict[str, Any] = None):
        """Log an error with context."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "error",
            "error": error,
            "context": context or {}
        }
        self.session_log.append(entry)
        self._write_entry(entry)
    
    def log_feedback(self, feedback: str, rating: int = None):
        """Log user feedback."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "feedback",
            "feedback": feedback,
            "rating": rating
        }
        self.session_log.append(entry)
        self._write_entry(entry)
    
    def log_tool_execution(self, tool_name: str, success: bool, result: str = None):
        """Log tool execution."""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": "tool_execution",
            "tool_name": tool_name,
            "success": success,
            "result": result
        }
        self.session_log.append(entry)
        self._write_entry(entry)
    
    def _write_entry(self, entry: Dict[str, Any]):
        """Write entry to session file."""
        with open(self.session_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(entry) + '\n')
    
    def get_recent_errors(self, limit: int = 10) -> list:
        """Get recent error entries."""
        errors = [e for e in self.session_log if e.get('type') == 'error']
        return errors[-limit:]
    
    def get_failed_interactions(self, limit: int = 10) -> list:
        """Get recent failed interactions."""
        failed = [e for e in self.session_log if e.get('type') == 'interaction' and not e.get('success')]
        return failed[-limit:]
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get summary of current session."""
        return {
            "total_interactions": len([e for e in self.session_log if e.get('type') == 'interaction']),
            "total_errors": len([e for e in self.session_log if e.get('type') == 'error']),
            "total_tool_executions": len([e for e in self.session_log if e.get('type') == 'tool_execution']),
            "total_feedback": len([e for e in self.session_log if e.get('type') == 'feedback']),
            "session_file": str(self.session_file)
        }


# Singleton instance
self_improve_logger = SelfImproveLogger()
