"""
PERSONAL AI ASSISTANT - SYSTEM COORDINATOR

This module brings together all 12 layers, the execution engine, and the 
adaptive memory into one unified, autonomous personal assistant system.

Complete workflow:
1. User Input
2. Intent Detection (Layer 1)
3. Planning & Execution (Layers 2-6)
4. Reflection & Learning (Layers 7-8)
5. Memory Storage
6. Re-planning if needed (Layer 9)

All layers work together seamlessly.
"""

import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'memory'))

from advanced_system import is_advanced_system_enabled, get_layer_count
from autonomous_executor import get_executor, AutonomousExecutor
from memory.adaptive_memory import get_memory, store_learning, get_memory_stats, AdaptiveMemory


class PersonalAssistantCoordinator:
    """Coordinates all 12 layers into a unified assistant system"""
    
    def __init__(self):
        self.executor = get_executor()
        self.memory = get_memory()
        self.session_start = datetime.now()
        self.session_interactions = 0
        self.advanced_enabled = is_advanced_system_enabled()
    
    def process_request(self, user_input: str) -> Dict[str, Any]:
        """Process a user request through the complete 12-layer system.
        
        This is the main entry point for all user interactions.
        """
        self.session_interactions += 1
        
        # Execute through all 12 layers
        result = self.executor.execute_goal(user_input)
        
        # Store learnings in adaptive memory
        if "status" in result and result["status"] == "complete":
            store_learning(result)
        
        # Add metadata
        result["session_info"] = {
            "interaction_number": self.session_interactions,
            "session_start": self.session_start.isoformat(),
            "timestamp": datetime.now().isoformat()
        }
        
        # Add memory insights
        result["memory_insights"] = self.memory.get_statistics()
        
        return result
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get complete system status and metrics."""
        executor_metrics = self.executor.get_metrics()
        memory_stats = self.memory.get_statistics()
        
        return {
            "system_enabled": self.advanced_enabled,
            "total_layers": get_layer_count(),
            "session": {
                "start_time": self.session_start.isoformat(),
                "interactions": self.session_interactions,
            },
            "execution": executor_metrics,
            "memory": memory_stats,
            "learning_summary": self.memory.get_learning_insights()
        }
    
    def get_execution_history(self, limit: int = 10) -> list:
        """Get recent execution history."""
        history = self.executor.get_execution_history()
        return history[-limit:]
    
    def get_learned_strategies(self) -> list:
        """Get all learned successful strategies."""
        return self.executor.get_learned_strategies()
    
    def get_user_preferences(self) -> Dict:
        """Get all stored user preferences."""
        return self.memory.get_all_preferences()
    
    def get_detected_patterns(self) -> list:
        """Get detected usage patterns."""
        return self.memory.get_most_common_patterns(5)
    
    def analyze_failures(self) -> Dict[str, Any]:
        """Analyze failure patterns and suggest improvements."""
        common_failures = self.memory.get_common_failure_reasons()
        
        return {
            "total_failures": len(self.memory.failures),
            "common_failure_reasons": common_failures,
            "recommendations": [
                "Review failures and update strategies",
                "Consider alternative approaches",
                "Ask for clarification on ambiguous requests"
            ]
        }
    
    def export_session(self) -> Dict[str, Any]:
        """Export complete session data."""
        return {
            "session_metadata": {
                "start": self.session_start.isoformat(),
                "interactions": self.session_interactions,
                "duration_seconds": (datetime.now() - self.session_start).total_seconds()
            },
            "execution_history": self.executor.get_execution_history(),
            "learned_strategies": self.executor.get_learned_strategies(),
            "memory_statistics": self.memory.get_statistics(),
            "user_preferences": self.memory.get_all_preferences(),
            "detected_patterns": self.memory.get_patterns(),
            "failures_analyzed": self.memory.failures[:10],
        }


# Global coordinator instance
_coordinator = None

def get_coordinator() -> PersonalAssistantCoordinator:
    """Get or create global coordinator instance."""
    global _coordinator
    if _coordinator is None:
        _coordinator = PersonalAssistantCoordinator()
    return _coordinator


def process_user_request(user_input: str) -> Dict[str, Any]:
    """Process user request through the complete system."""
    return get_coordinator().process_request(user_input)


def get_system_status() -> Dict[str, Any]:
    """Get system status."""
    return get_coordinator().get_system_status()


def get_session_info() -> Dict[str, Any]:
    """Get session information."""
    coordinator = get_coordinator()
    return {
        "start_time": coordinator.session_start.isoformat(),
        "interactions": coordinator.session_interactions,
        "status": "active",
        "system_enabled": coordinator.advanced_enabled
    }


def export_session() -> Dict[str, Any]:
    """Export complete session data."""
    return get_coordinator().export_session()


def reset_coordinator():
    """Reset coordinator state."""
    global _coordinator
    _coordinator = None


# ============================================================================
# CONVENIENCE FUNCTIONS FOR QUICK ACCESS
# ============================================================================

def get_all_statistics() -> Dict[str, Any]:
    """Get comprehensive statistics about the system."""
    return get_coordinator().get_system_status()


def show_learned_knowledge() -> Dict[str, Any]:
    """Show all learned knowledge."""
    coordinator = get_coordinator()
    return {
        "successful_strategies": coordinator.get_learned_strategies(),
        "user_preferences": coordinator.get_user_preferences(),
        "detected_patterns": coordinator.get_detected_patterns(),
        "failure_analysis": coordinator.analyze_failures()
    }


def get_recent_history(limit: int = 5) -> list:
    """Get recent execution history."""
    return get_coordinator().get_execution_history(limit)
