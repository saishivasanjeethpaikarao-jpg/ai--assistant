"""
Evaluator Agent - Success/failure checker
Evaluates whether goals were achieved based on results.
"""

import logging
from typing import Tuple
from assistant_core import generate_text

logger = logging.getLogger(__name__)


class EvaluatorAgent:
    """Evaluator agent that checks success/failure of goal execution."""
    
    def __init__(self):
        self.role = "Evaluator"
        self.system_prompt = """You are an evaluator.

Your task: Determine if a goal was successfully achieved based on execution results.

Evaluation criteria:
- Did the results address the goal?
- Were the steps completed successfully?
- Is the outcome satisfactory?

Output format:
If successful: "yes"
If failed: "no" followed by brief explanation (max 1 line)"""
    
    def evaluate(self, goal: str, results: list) -> Tuple[bool, str]:
        """
        Evaluate if the goal was achieved.
        
        Args:
            goal: Original goal statement
            results: List of execution results
            
        Returns:
            Tuple of (success, explanation)
        """
        results_text = "\n".join(results[:5])  # Limit to first 5 results
        
        prompt = f"""{self.system_prompt}

Goal: {goal}

Execution results:
{results_text}

Did we succeed?"""
        
        try:
            result = generate_text(prompt)
            if result:
                result = result.strip().lower()
                
                if "yes" in result:
                    logger.info("Evaluator: Goal achieved")
                    return True, "Goal achieved successfully"
                else:
                    # Extract explanation
                    explanation = result.replace("no", "").strip()
                    if not explanation:
                        explanation = "Goal not achieved"
                    logger.info(f"Evaluator: Goal not achieved - {explanation}")
                    return False, explanation
        except Exception as e:
            logger.error(f"Evaluator failed: {e}")
        
        # Fallback: check if any results indicate success
        results_text = " ".join(results).lower()
        if any(word in results_text for word in ["success", "completed", "done", "finished"]):
            return True, "Goal appears successful"
        return False, "Goal not achieved"
    
    def evaluate_with_metrics(self, goal: str, results: list, metrics: dict) -> Tuple[bool, str]:
        """
        Evaluate with additional metrics context.
        
        Args:
            goal: Original goal
            results: Execution results
            metrics: Dictionary of performance metrics
            
        Returns:
            Tuple of (success, explanation)
        """
        metrics_text = "\n".join([f"{k}: {v}" for k, v in metrics.items()])
        results_text = "\n".join(results[:5])
        
        prompt = f"""{self.system_prompt}

Goal: {goal}

Execution results:
{results_text}

Performance metrics:
{metrics_text}

Did we succeed?"""
        
        try:
            result = generate_text(prompt)
            if result:
                result = result.strip().lower()
                
                if "yes" in result:
                    return True, "Goal achieved successfully"
                else:
                    explanation = result.replace("no", "").strip()
                    return False, explanation or "Goal not achieved"
        except Exception as e:
            logger.error(f"Evaluator with metrics failed: {e}")
        
        return self.evaluate(goal, results)
