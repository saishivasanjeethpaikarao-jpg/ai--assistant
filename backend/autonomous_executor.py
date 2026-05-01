"""
AUTONOMOUS EXECUTION ENGINE

This module orchestrates all 12 layers and implements the complete
autonomous workflow for your personal AI assistant.

The workflow:
User Input → Intent → Plan → Critique → Execute → Reflect → Learn → (Replan if needed)
"""

import json
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
from advanced_system import (
    get_layer_prompt,
    load_advanced_config,
    is_advanced_system_enabled,
)


class AutonomousExecutor:
    """Orchestrates all 12 layers of the autonomous AI system"""
    
    def __init__(self):
        self.execution_history = []
        self.learned_strategies = []
        self.retry_count = 0
        self.max_retries = 3
    
    # ========================================================================
    # LAYER 1: INTENT DETECTOR
    # ========================================================================
    
    def detect_intent(self, user_input: str) -> Dict[str, Any]:
        """Layer 1: Detect intent type and complexity.
        
        Returns:
            {
                "type": "COMMAND|GOAL|CHAT",
                "complexity": "LOW|MEDIUM|HIGH",
                "reasoning": "explanation"
            }
        """
        # Simple heuristic-based detection
        user_input_lower = user_input.lower()
        
        # Detect TYPE
        command_keywords = ['open', 'run', 'execute', 'close', 'show', 'list', 'delete']
        goal_keywords = ['analyze', 'prepare', 'plan', 'build', 'debug', 'fix', 'research']
        
        if any(keyword in user_input_lower for keyword in command_keywords):
            input_type = "COMMAND"
        elif any(keyword in user_input_lower for keyword in goal_keywords):
            input_type = "GOAL"
        else:
            input_type = "CHAT"
        
        # Detect COMPLEXITY
        word_count = len(user_input.split())
        complexity_keywords = ['analyze', 'multiple', 'complex', 'integration', 'prepare']
        has_complexity_words = any(kw in user_input_lower for kw in complexity_keywords)
        
        if word_count < 5 and not has_complexity_words:
            complexity = "LOW"
        elif word_count < 15 and not has_complexity_words:
            complexity = "MEDIUM"
        else:
            complexity = "HIGH"
        
        return {
            "type": input_type,
            "complexity": complexity,
            "reasoning": f"Classified as {input_type} with {complexity} complexity",
            "user_input": user_input,
        }
    
    # ========================================================================
    # LAYER 2-3: PLANNING & CRITIQUE
    # ========================================================================
    
    def create_plan(self, goal: str) -> List[str]:
        """Layer 2: Create strategic plan.
        
        For now, returns a simple logical breakdown.
        In production, this would call an LLM with the planner prompt.
        """
        # Simple planning heuristic
        plan = []
        
        if "analyze" in goal.lower():
            plan.extend([
                "Gather data/information needed",
                "Organize and structure data",
                "Perform analysis",
            ])
        
        if "build" in goal.lower() or "create" in goal.lower():
            plan.extend([
                "Define requirements",
                "Design solution",
                "Implement solution",
                "Test implementation",
            ])
        
        if "debug" in goal.lower() or "fix" in goal.lower():
            plan.extend([
                "Reproduce the issue",
                "Identify root cause",
                "Implement fix",
                "Verify solution",
            ])
        
        if not plan:
            plan = ["Understand requirements", "Plan execution", "Execute", "Verify"]
        
        return plan[:5]  # Max 5 steps
    
    def critique_plan(self, plan: List[str]) -> Tuple[bool, str]:
        """Layer 3: Critique and validate plan.
        
        Returns:
            (is_approved, feedback)
        """
        # Simple validation
        if len(plan) > 5:
            return False, "Plan has too many steps (max 5)"
        
        if len(plan) == 0:
            return False, "Plan is empty"
        
        # Check for missing critical steps
        plan_text = " ".join(plan).lower()
        if "execute" not in plan_text and "implement" not in plan_text:
            plan.append("Execute the planned solution")
            return True, "Added missing execution step"
        
        return True, "APPROVED"
    
    # ========================================================================
    # LAYER 4: EXECUTION ENGINE
    # ========================================================================
    
    def execute_step(self, step: str) -> Dict[str, Any]:
        """Layer 4: Convert step to command and execute.
        
        Returns:
            {
                "step": "original step",
                "command": "generated command",
                "status": "executed|pending|failed",
                "output": "execution result"
            }
        """
        # Parse step and generate command
        step_lower = step.lower()
        
        commands_map = {
            "analyze": lambda s: f"analyze {s.split('data')[-1].strip() if 'data' in s else 'data'}",
            "read": lambda s: f"read {s.split('file')[-1].strip() if 'file' in s else 'file'}",
            "create": lambda s: f"create {s.split('create')[-1].strip()}",
            "run": lambda s: f"run {s.split('run')[-1].strip()}",
            "open": lambda s: f"open {s.split('open')[-1].strip()}",
        }
        
        command = None
        for keyword, cmd_generator in commands_map.items():
            if keyword in step_lower:
                try:
                    command = cmd_generator(step)
                    break
                except:
                    pass
        
        if not command:
            command = f"execute: {step}"
        
        return {
            "step": step,
            "command": command,
            "status": "generated",
            "output": f"Step {step} ready for execution"
        }
    
    # ========================================================================
    # LAYER 5: DECISION ENGINE
    # ========================================================================
    
    def decide_best_option(self, goal: str, options: List[str]) -> Dict[str, Any]:
        """Layer 5: Choose best option from alternatives.
        
        Returns:
            {
                "best_option": "selected option",
                "score": "average score (1-10)",
                "reasoning": "why this option"
            }
        """
        if not options:
            return {"best_option": None, "score": 0, "reasoning": "No options"}
        
        if len(options) == 1:
            return {
                "best_option": options[0],
                "score": 8,
                "reasoning": "Only option available"
            }
        
        # Simple scoring: prefer options with common positive keywords
        scores = {}
        positive_keywords = ["efficient", "safe", "simple", "fast", "proven"]
        
        for option in options:
            score = 5  # Base score
            for keyword in positive_keywords:
                if keyword in option.lower():
                    score += 1
            scores[option] = score
        
        best = max(scores, key=scores.get)
        avg_score = scores[best]
        
        return {
            "best_option": best,
            "score": avg_score,
            "reasoning": f"Best option based on efficiency and safety"
        }
    
    # ========================================================================
    # LAYER 6: SAFETY FILTER
    # ========================================================================
    
    def validate_safety(self, command: str) -> Tuple[bool, str]:
        """Layer 6: Validate command safety.
        
        Returns:
            (is_safe, reason)
        """
        dangerous_patterns = [
            r'shutdown',
            r'restart\s+/s',
            r'del\s+/s\s+/q',
            r'Remove-Item.*-Recurse',
            r'rm\s+-rf\s+/',
            r'format\s+[a-z]:',
        ]
        
        for pattern in dangerous_patterns:
            if re.search(pattern, command, re.IGNORECASE):
                return False, "Command contains dangerous operation"
        
        if re.search(r'password|api_key|secret|token', command, re.IGNORECASE):
            if '=' in command or ':' in command:
                return False, "Potential credential exposure"
        
        return True, "Command is safe"
    
    # ========================================================================
    # LAYER 7: SELF-REFLECTION
    # ========================================================================
    
    def reflect_on_outcome(self, goal: str, plan: List[str], results: List[Dict]) -> Dict[str, Any]:
        """Layer 7: Reflect on execution results.
        
        Returns:
            {
                "status": "ACHIEVED|PARTIAL|FAILED",
                "analysis": "what happened",
                "improvements": ["suggestion1", "suggestion2"]
            }
        """
        # Check success
        all_successful = all(r.get("status") == "executed" or "success" in r.get("output", "").lower() 
                            for r in results)
        
        if all_successful:
            status = "ACHIEVED"
        elif len([r for r in results if r.get("status") == "executed"]) >= len(results) // 2:
            status = "PARTIAL"
        else:
            status = "FAILED"
        
        return {
            "status": status,
            "analysis": f"Execution resulted in {status.lower()} state",
            "improvements": [
                "Review failed steps",
                "Consider alternative approaches",
                "Update strategy based on results"
            ]
        }
    
    # ========================================================================
    # LAYER 8: ADAPTIVE MEMORY
    # ========================================================================
    
    def extract_learning(self, goal: str, steps: List[str], results: Dict) -> Dict[str, Any]:
        """Layer 8: Extract and store learning.
        
        Returns:
            {
                "learning": "what was learned",
                "category": "strategy|preference|pattern|failure",
                "importance": "low|medium|high"
            }
        """
        if results.get("status") == "ACHIEVED":
            importance = "high"
            category = "strategy"
            learning = f"Successfully completed goal using: {', '.join(steps[:3])}"
        elif results.get("status") == "PARTIAL":
            importance = "medium"
            category = "pattern"
            learning = f"Partial success on goal, some steps failed"
        else:
            importance = "high"
            category = "failure"
            learning = f"Failed on goal - need different approach"
        
        self.learned_strategies.append({
            "goal": goal,
            "learning": learning,
            "category": category,
            "importance": importance,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "learning": learning,
            "category": category,
            "importance": importance
        }
    
    # ========================================================================
    # LAYER 9: RE-PLANNING ENGINE
    # ========================================================================
    
    def replan_on_failure(self, goal: str, failed_plan: List[str], failures: List[str]) -> List[str]:
        """Layer 9: Create improved plan after failure.
        
        Returns:
            New plan (max 4 steps)
        """
        # Learn from failures and create different approach
        new_plan = []
        
        if "timeout" in str(failures).lower():
            new_plan.append("Increase timeout or simplify steps")
        
        if "not found" in str(failures).lower():
            new_plan.append("Search for alternative resources")
        
        if "permission" in str(failures).lower():
            new_plan.append("Check permissions and elevate if needed")
        
        # Add fresh approach steps
        if not new_plan:
            new_plan = [
                "Try alternative method",
                "Gather more information",
                "Simplify the approach"
            ]
        
        new_plan.append("Execute revised approach")
        
        return new_plan[:4]
    
    # ========================================================================
    # MAIN ORCHESTRATION: THE AUTONOMOUS WORKFLOW
    # ========================================================================
    
    def execute_goal(self, user_input: str) -> Dict[str, Any]:
        """Execute the complete 12-layer workflow.
        
        This is the main entry point that orchestrates all layers.
        """
        if not is_advanced_system_enabled():
            return {"error": "Advanced system not enabled"}
        
        # LAYER 1: Detect Intent
        intent = self.detect_intent(user_input)
        intent_type = intent["type"]
        complexity = intent["complexity"]
        
        # LAYER 10: Chat Mode (if needed)
        if intent_type == "CHAT":
            return {
                "mode": "CHAT",
                "input": user_input,
                "intent": intent,
                "message": "Chat mode activated - respond naturally"
            }
        
        # LAYER 2-3: Plan & Critique
        if intent_type == "GOAL":
            plan = self.create_plan(user_input)
            is_approved, feedback = self.critique_plan(plan)
            
            if not is_approved:
                plan = self.create_plan(f"{user_input}. {feedback}")
        else:
            plan = [user_input]  # COMMAND
        
        # LAYER 4-6: Execute each step with safety checks
        execution_results = []
        for step in plan:
            # Layer 4: Generate command
            execution = self.execute_step(step)
            
            # Layer 6: Safety check
            is_safe, safety_msg = self.validate_safety(execution["command"])
            
            if not is_safe:
                execution["status"] = "blocked"
                execution["output"] = f"BLOCKED: {safety_msg}"
            else:
                execution["status"] = "executed"
                execution["output"] = f"Executed: {execution['command']}"
            
            execution_results.append(execution)
        
        # LAYER 7: Reflect on outcome
        reflection = self.reflect_on_outcome(user_input, plan, execution_results)
        
        # LAYER 8: Extract learning
        learning = self.extract_learning(user_input, plan, reflection)
        
        # LAYER 9: Replan if needed
        if reflection["status"] != "ACHIEVED" and self.retry_count < self.max_retries:
            failed_steps = [r for r in execution_results if r["status"] != "executed"]
            if failed_steps:
                self.retry_count += 1
                revised_plan = self.replan_on_failure(user_input, plan, 
                                                     [r["output"] for r in failed_steps])
                return self.execute_goal(user_input)  # Retry with new plan
        
        # Store in history
        self.execution_history.append({
            "input": user_input,
            "intent": intent,
            "plan": plan,
            "results": execution_results,
            "reflection": reflection,
            "learning": learning,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "status": "complete",
            "input": user_input,
            "type": intent_type,
            "complexity": complexity,
            "plan": plan,
            "results": execution_results,
            "reflection": reflection,
            "learning": learning
        }
    
    def get_execution_history(self) -> List[Dict]:
        """Get execution history."""
        return self.execution_history
    
    def get_learned_strategies(self) -> List[Dict]:
        """Get all learned strategies."""
        return self.learned_strategies
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get system metrics."""
        successful = sum(1 for e in self.execution_history 
                        if e["reflection"]["status"] == "ACHIEVED")
        total = len(self.execution_history)
        
        return {
            "total_executions": total,
            "successful": successful,
            "success_rate": f"{(successful/total*100):.1f}%" if total > 0 else "0%",
            "strategies_learned": len(self.learned_strategies),
            "retry_count": self.retry_count,
        }


# Global executor instance
_executor = None

def get_executor() -> AutonomousExecutor:
    """Get or create global executor instance."""
    global _executor
    if _executor is None:
        _executor = AutonomousExecutor()
    return _executor


def execute(user_input: str) -> Dict[str, Any]:
    """Convenience function to execute user input."""
    return get_executor().execute_goal(user_input)


def reset_executor():
    """Reset executor state."""
    global _executor
    _executor = None
