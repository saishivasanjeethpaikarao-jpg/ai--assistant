"""
Multi-Agent Orchestrator - Coordinates independent agents
Manages control flow between Planner, Critic, Executor, and Evaluator agents.
"""

import logging
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

from .planner_agent import PlannerAgent
from .critic_agent import CriticAgent
from .executor_agent import ExecutorAgent
from .evaluator_agent import EvaluatorAgent
from core.command_engine import command_engine
from brain.brain import learn_text

logger = logging.getLogger(__name__)


class MultiAgentOrchestrator:
    """Orchestrator that coordinates multiple specialized agents."""
    
    def __init__(self, max_iterations: int = 3):
        self.planner = PlannerAgent()
        self.critic = CriticAgent()
        self.executor = ExecutorAgent()
        self.evaluator = EvaluatorAgent()
        
        self.max_iterations = max_iterations
        self.execution_history: List[Dict] = []
        
        # Callback for real-time updates
        self.callback: Optional[Callable] = None
    
    def set_callback(self, callback: Callable):
        """Set callback function for real-time updates."""
        self.callback = callback
    
    def _send_update(self, update: Dict):
        """Send update via callback if available."""
        if self.callback:
            self.callback(update)
    
    def run(self, goal: str) -> str:
        """
        Execute goal using multi-agent system.
        
        Args:
            goal: User's goal statement
            
        Returns:
            Final result string
        """
        logger.info(f"Multi-Agent Orchestrator processing: {goal[:100]}")
        
        for iteration in range(self.max_iterations):
            logger.info(f"--- Iteration {iteration + 1}/{self.max_iterations} ---")
            
            # Phase 1: Planning
            self._send_update({"type": "phase", "data": "Planning", "iteration": iteration + 1})
            plan = self.planner.plan(goal)
            logger.info(f"Plan created: {plan[:200]}")
            self._send_update({"type": "plan", "data": plan, "iteration": iteration + 1})
            
            # Phase 2: Criticism
            self._send_update({"type": "phase", "data": "Reviewing", "iteration": iteration + 1})
            reviewed_plan, approved = self.critic.review(plan)
            
            if not approved:
                logger.info("Plan improved by critic")
                plan = reviewed_plan
                self._send_update({"type": "critic", "data": plan, "iteration": iteration + 1})
            else:
                logger.info("Plan approved by critic")
                self._send_update({"type": "approved", "data": "Plan approved", "iteration": iteration + 1})
            
            # Phase 3: Execution
            self._send_update({"type": "phase", "data": "Executing", "iteration": iteration + 1})
            results = self._execute_plan(plan)
            logger.info(f"Execution completed: {len(results)} steps")
            
            # Phase 4: Evaluation
            self._send_update({"type": "phase", "data": "Evaluating", "iteration": iteration + 1})
            success, explanation = self.evaluator.evaluate(goal, results)
            logger.info(f"Evaluation: {success} - {explanation}")
            self._send_update({"type": "evaluation", "data": explanation, "success": success, "iteration": iteration + 1})
            
            # Store iteration history
            self.execution_history.append({
                "iteration": iteration + 1,
                "plan": plan,
                "approved": approved,
                "results": results,
                "success": success,
                "explanation": explanation,
                "timestamp": datetime.now().isoformat()
            })
            
            if success:
                logger.info("Goal achieved successfully")
                self._send_update({"type": "success", "data": "Goal achieved", "iteration": iteration + 1})
                break
            
            # Replan if not successful
            if iteration < self.max_iterations - 1:
                logger.info("Replanning for next iteration...")
                goal = self._refine_goal(goal, results, explanation)
        
        # Store in memory
        self._store_learning(goal)
        
        # Format final response
        return self._format_response()
    
    def _execute_plan(self, plan: str) -> List[str]:
        """
        Execute plan using Executor agent and command engine.
        
        Args:
            plan: Plan to execute
            
        Returns:
            List of execution results
        """
        steps = plan.split("\n")
        steps = steps[:5]  # Limit to 5 steps
        
        results = []
        previous_commands = []
        
        for step in steps:
            # Skip empty steps
            if not step.strip():
                continue
            
            # Extract step content
            step_content = step.lstrip("0123456789.- ").strip()
            if not step_content:
                continue
            
            logger.info(f"Executing step: {step_content[:100]}")
            self._send_update({"type": "step", "data": step_content})
            
            # Convert to command
            command = self.executor.execute_with_context(step_content, previous_commands)
            logger.info(f"Command: {command}")
            
            # Safety check
            if not self._safety_check(command):
                logger.warning(f"Command blocked: {command}")
                results.append(f"Blocked unsafe command: {step_content}")
                self._send_update({"type": "result", "data": "Blocked", "success": False})
                continue
            
            # Execute command
            try:
                result = command_engine.execute(command)
                results.append(f"Step: {step_content}\nResult: {result}")
                previous_commands.append(command)
                self._send_update({"type": "result", "data": result[:100], "success": True})
            except Exception as e:
                logger.error(f"Execution failed: {e}")
                results.append(f"Step failed: {step_content}\nError: {str(e)}")
                self._send_update({"type": "result", "data": str(e), "success": False})
        
        return results
    
    def _safety_check(self, command: str) -> bool:
        """Check if command is safe to execute."""
        blocked = ["shutdown", "delete", "format", "rm -rf", "del /s", "format c:"]
        cmd_lower = command.lower()
        return not any(b in cmd_lower for b in blocked)
    
    def _refine_goal(self, original_goal: str, results: List[str], explanation: str) -> str:
        """
        Refine goal based on failure for next iteration.
        
        Args:
            original_goal: Original goal
            results: Execution results
            explanation: Failure explanation
            
        Returns:
            Refined goal
        """
        from assistant_core import generate_text
        
        results_summary = "\n".join(results[:3])
        
        prompt = f"""Original goal: {original_goal}

Failed because: {explanation}

Results so far:
{results_summary}

Provide a refined, more specific goal that addresses the failure.
Keep it concise and actionable."""
        
        try:
            refined = generate_text(prompt)
            if refined:
                return refined.strip()
        except Exception as e:
            logger.error(f"Goal refinement failed: {e}")
        
        return original_goal
    
    def _store_learning(self, goal: str):
        """Store execution in memory for learning."""
        try:
            summary = f"Multi-agent execution: {goal}\n"
            summary += f"Iterations: {len(self.execution_history)}\n"
            
            final = self.execution_history[-1]
            if final.get('success'):
                summary += "Result: Successful"
            else:
                summary += "Result: Needs improvement"
            
            learn_text(summary)
            logger.info("Stored execution in memory")
        except Exception as e:
            logger.error(f"Memory storage failed: {e}")
    
    def _format_response(self) -> str:
        """Format execution history into readable response."""
        lines = ["🤖 Multi-Agent Execution Results\n"]
        
        for h in self.execution_history:
            lines.append(f"\n--- Iteration {h['iteration']} ---")
            lines.append(f"Plan: {h['plan'][:200]}...")
            lines.append(f"Approved: {h['approved']}")
            lines.append(f"Success: {h['success']}")
            
            if h['results']:
                lines.append("\nResults:")
                for r in h['results'][:3]:
                    lines.append(f"  • {r[:150]}...")
        
        final = self.execution_history[-1]
        if final['success']:
            lines.append("\n✅ Goal achieved successfully!")
        else:
            lines.append("\n⚠️ Goal not fully achieved after maximum iterations.")
        
        return "\n".join(lines)
    
    def get_history(self) -> List[Dict]:
        """Get execution history."""
        return self.execution_history.copy()
    
    def clear_history(self):
        """Clear execution history."""
        self.execution_history.clear()
