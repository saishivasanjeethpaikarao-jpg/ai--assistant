"""
Planner Agent - Strategic planning specialist
Creates clear, minimal step-by-step plans for goals.
"""

import logging
from typing import Optional
from assistant_core import generate_text

logger = logging.getLogger(__name__)


class PlannerAgent:
    """Strategic planner agent that creates executable plans."""
    
    def __init__(self):
        self.role = "Strategic Planner"
        self.system_prompt = """You are a strategic planner.

Your task: Create clear, minimal step-by-step plans for user goals.

Constraints:
- Maximum 5 steps
- Only executable actions
- No explanations or fluff
- Logical ordering
- Be specific and concrete

Output format:
1. Step one
2. Step two
3. Step three
..."""
    
    def plan(self, goal: str) -> str:
        """
        Create a plan for the given goal.
        
        Args:
            goal: User's goal statement
            
        Returns:
            Step-by-step plan as numbered list
        """
        prompt = f"""{self.system_prompt}

Goal: {goal}

Create the plan:"""
        
        try:
            result = generate_text(prompt)
            if result:
                # Clean up the result
                plan = result.strip()
                logger.info(f"Planner created plan: {plan[:100]}...")
                return plan
        except Exception as e:
            logger.error(f"Planner failed: {e}")
        
        # Fallback plan
        return "1. Analyze the request\n2. Execute the task\n3. Provide response"
    
    def plan_with_constraints(self, goal: str, max_steps: int = 5) -> str:
        """
        Create a plan with custom constraints.
        
        Args:
            goal: User's goal statement
            max_steps: Maximum number of steps
            
        Returns:
            Step-by-step plan
        """
        prompt = f"""{self.system_prompt}

Goal: {goal}
Maximum steps: {max_steps}

Create the plan:"""
        
        try:
            result = generate_text(prompt)
            if result:
                return result.strip()
        except Exception as e:
            logger.error(f"Planner with constraints failed: {e}")
        
        return self.plan(goal)
