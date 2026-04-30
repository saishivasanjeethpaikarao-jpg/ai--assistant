"""
ADAPTIVE MEMORY & LEARNING SYSTEM

Stores and learns from all interactions to improve over time.
Tracks successful strategies, user preferences, patterns, and failures.
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from collections import Counter
from config_paths import user_data_dir


class AdaptiveMemory:
    """Manages long-term learning and memory"""
    
    def __init__(self):
        self.memory_dir = os.path.join(user_data_dir(), "adaptive_memory")
        os.makedirs(self.memory_dir, exist_ok=True)
        
        self.strategies_file = os.path.join(self.memory_dir, "strategies.json")
        self.preferences_file = os.path.join(self.memory_dir, "preferences.json")
        self.patterns_file = os.path.join(self.memory_dir, "patterns.json")
        self.failures_file = os.path.join(self.memory_dir, "failures.json")
        
        self.strategies = self._load_json(self.strategies_file, [])
        self.preferences = self._load_json(self.preferences_file, {})
        self.patterns = self._load_json(self.patterns_file, [])
        self.failures = self._load_json(self.failures_file, [])
    
    def _load_json(self, filepath: str, default: Any) -> Any:
        """Load JSON file or return default."""
        try:
            if os.path.isfile(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except (OSError, json.JSONDecodeError):
            pass
        return default
    
    def _save_json(self, filepath: str, data: Any) -> None:
        """Save data to JSON file."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    
    # ========================================================================
    # STRATEGY LEARNING
    # ========================================================================
    
    def store_successful_strategy(self, goal: str, steps: List[str], result: Dict) -> None:
        """Store a successful execution strategy."""
        if result.get("status") == "ACHIEVED":
            strategy = {
                "goal": goal,
                "steps": steps,
                "result_summary": result.get("analysis", ""),
                "importance": "high",
                "timestamp": datetime.now().isoformat(),
                "success_count": 1
            }
            self.strategies.append(strategy)
            self._save_json(self.strategies_file, self.strategies)
    
    def get_strategies_for_goal(self, goal: str) -> List[Dict]:
        """Find successful strategies for a goal."""
        matching = []
        goal_lower = goal.lower()
        
        for strategy in self.strategies:
            strategy_goal_lower = strategy["goal"].lower()
            # Simple matching - can be improved with semantic search
            if goal_lower in strategy_goal_lower or strategy_goal_lower in goal_lower:
                matching.append(strategy)
        
        # Sort by recency and success count
        return sorted(matching, key=lambda x: (x.get("success_count", 1), x["timestamp"]), reverse=True)
    
    def update_strategy_success(self, goal: str) -> None:
        """Increment success count for a strategy."""
        for strategy in self.strategies:
            if strategy["goal"].lower() == goal.lower():
                strategy["success_count"] = strategy.get("success_count", 1) + 1
        self._save_json(self.strategies_file, self.strategies)
    
    # ========================================================================
    # PREFERENCE LEARNING
    # ========================================================================
    
    def store_preference(self, preference_key: str, value: Any, importance: str = "medium") -> None:
        """Store a user preference."""
        self.preferences[preference_key] = {
            "value": value,
            "importance": importance,
            "timestamp": datetime.now().isoformat(),
            "frequency": self.preferences.get(preference_key, {}).get("frequency", 0) + 1
        }
        self._save_json(self.preferences_file, self.preferences)
    
    def get_preference(self, key: str) -> Optional[Any]:
        """Retrieve a stored preference."""
        if key in self.preferences:
            return self.preferences[key].get("value")
        return None
    
    def get_all_preferences(self) -> Dict:
        """Get all preferences."""
        return {k: v["value"] for k, v in self.preferences.items()}
    
    # ========================================================================
    # PATTERN LEARNING
    # ========================================================================
    
    def store_pattern(self, pattern_description: str, pattern_type: str = "usage") -> None:
        """Store an observed pattern."""
        pattern = {
            "description": pattern_description,
            "type": pattern_type,
            "timestamp": datetime.now().isoformat(),
            "occurrences": 1
        }
        
        # Check if pattern already exists
        for existing in self.patterns:
            if existing["description"].lower() == pattern_description.lower():
                existing["occurrences"] = existing.get("occurrences", 1) + 1
                self._save_json(self.patterns_file, self.patterns)
                return
        
        self.patterns.append(pattern)
        self._save_json(self.patterns_file, self.patterns)
    
    def get_patterns(self, pattern_type: Optional[str] = None) -> List[Dict]:
        """Get patterns, optionally filtered by type."""
        if pattern_type:
            return [p for p in self.patterns if p.get("type") == pattern_type]
        return self.patterns
    
    def get_most_common_patterns(self, limit: int = 5) -> List[Dict]:
        """Get most frequently occurring patterns."""
        return sorted(self.patterns, key=lambda x: x.get("occurrences", 1), reverse=True)[:limit]
    
    # ========================================================================
    # FAILURE LEARNING
    # ========================================================================
    
    def store_failure(self, goal: str, failure_reason: str, suggested_fix: str = "") -> None:
        """Store a failure for learning purposes."""
        failure = {
            "goal": goal,
            "failure_reason": failure_reason,
            "suggested_fix": suggested_fix,
            "timestamp": datetime.now().isoformat(),
            "retry_count": 0
        }
        
        self.failures.append(failure)
        self._save_json(self.failures_file, self.failures)
    
    def get_failures_for_goal(self, goal: str) -> List[Dict]:
        """Get all failures for a specific goal."""
        goal_lower = goal.lower()
        return [f for f in self.failures if goal_lower in f["goal"].lower()]
    
    def get_common_failure_reasons(self) -> List[Tuple[str, int]]:
        """Get most common failure reasons."""
        reasons = [f["failure_reason"] for f in self.failures]
        counter = Counter(reasons)
        return counter.most_common(5)
    
    # ========================================================================
    # KNOWLEDGE EXTRACTION
    # ========================================================================
    
    def extract_knowledge_from_execution(self, execution_result: Dict) -> List[Dict]:
        """Extract learnings from an execution result."""
        learnings = []
        
        reflection = execution_result.get("reflection", {})
        status = reflection.get("status", "UNKNOWN")
        
        # Extract based on success/failure
        if status == "ACHIEVED":
            learning = {
                "type": "successful_strategy",
                "goal": execution_result.get("input", ""),
                "steps": execution_result.get("plan", []),
                "importance": "high"
            }
            learnings.append(learning)
            self.store_successful_strategy(
                execution_result.get("input", ""),
                execution_result.get("plan", []),
                reflection
            )
        
        elif status == "FAILED":
            failures = [r for r in execution_result.get("results", []) 
                       if r.get("status") != "executed"]
            for failure in failures:
                learning = {
                    "type": "failure",
                    "goal": execution_result.get("input", ""),
                    "reason": failure.get("output", ""),
                    "importance": "high"
                }
                learnings.append(learning)
                self.store_failure(
                    execution_result.get("input", ""),
                    failure.get("output", ""),
                    "Try alternative approach"
                )
        
        # Extract patterns
        if execution_result.get("type") == "GOAL":
            learning = {
                "type": "pattern",
                "pattern": f"Goal-type request: {execution_result.get('complexity')} complexity",
                "importance": "medium"
            }
            learnings.append(learning)
            self.store_pattern(
                f"User executing {execution_result.get('complexity')} complexity goals",
                "usage"
            )
        
        return learnings
    
    # ========================================================================
    # MEMORY STATISTICS & INSIGHTS
    # ========================================================================
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get memory and learning statistics."""
        return {
            "total_strategies": len(self.strategies),
            "successful_executions": sum(s.get("success_count", 1) for s in self.strategies),
            "total_preferences": len(self.preferences),
            "total_patterns": len(self.patterns),
            "total_failures": len(self.failures),
            "most_common_patterns": [p["description"] for p in self.get_most_common_patterns(3)],
            "common_failures": [r[0] for r in self.get_common_failure_reasons()],
        }
    
    def get_learning_insights(self) -> str:
        """Generate insight summary about what the system has learned."""
        stats = self.get_statistics()
        
        insights = [
            f"Stored {stats['total_strategies']} successful strategies",
            f"Learned {stats['total_preferences']} user preferences",
            f"Detected {stats['total_patterns']} recurring patterns",
            f"Analyzed {stats['total_failures']} failures",
        ]
        
        if stats['most_common_patterns']:
            insights.append(f"Most common pattern: {stats['most_common_patterns'][0]}")
        
        if stats['common_failures']:
            insights.append(f"Most common failure: {stats['common_failures'][0]}")
        
        return " | ".join(insights)
    
    def clear_all_memory(self) -> None:
        """Clear all stored memory (use with caution)."""
        self.strategies = []
        self.preferences = {}
        self.patterns = []
        self.failures = []
        
        self._save_json(self.strategies_file, [])
        self._save_json(self.preferences_file, {})
        self._save_json(self.patterns_file, [])
        self._save_json(self.failures_file, [])


# Global memory instance
_memory = None

def get_memory() -> AdaptiveMemory:
    """Get or create global memory instance."""
    global _memory
    if _memory is None:
        _memory = AdaptiveMemory()
    return _memory


def store_learning(execution_result: Dict) -> None:
    """Store learnings from an execution."""
    memory = get_memory()
    memory.extract_knowledge_from_execution(execution_result)


def get_memory_stats() -> Dict[str, Any]:
    """Get memory statistics."""
    return get_memory().get_statistics()


def get_learning_summary() -> str:
    """Get learning insights."""
    return get_memory().get_learning_insights()


def reset_memory():
    """Reset memory state."""
    global _memory
    _memory = None
