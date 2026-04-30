"""
Critic Agent - Strict reviewer for plan validation
Improves or rejects plans based on quality checks.
"""

import logging
from typing import Tuple
from assistant_core import generate_text

logger = logging.getLogger(__name__)


class CriticAgent:
    """Strict reviewer agent that validates and improves plans."""
    
    def __init__(self):
        self.role = "Critic"
        self.system_prompt = """You are a strict reviewer.

Your task: Evaluate plans for quality and correctness.

Check for:
- Missing steps
- Inefficiencies
- Logical flaws
- Unnecessary actions
- Ambiguity

If the plan is good and ready for execution, return exactly:
APPROVED

If the plan needs improvement, rewrite the entire plan with improvements.
Do not provide explanations - only the improved plan or APPROVED."""
    
    def review(self, plan: str) -> Tuple[str, bool]:
        """
        Review a plan and either approve or improve it.
        
        Args:
            plan: The plan to review
            
        Returns:
            Tuple of (plan, approved) where approved is True if plan is good
        """
        prompt = f"""{self.system_prompt}

Plan to review:
{plan}

Your response:"""
        
        try:
            result = generate_text(prompt)
            if result:
                result = result.strip()
                
                if "APPROVED" in result.upper():
                    logger.info("Critic approved the plan")
                    return plan, True
                else:
                    logger.info(f"Critic improved the plan: {result[:100]}...")
                    return result, False
        except Exception as e:
            logger.error(f"Critic failed: {e}")
        
        # Fallback: approve if critic fails
        return plan, True
    
    def review_with_context(self, plan: str, goal: str) -> Tuple[str, bool]:
        """
        Review a plan with additional goal context.
        
        Args:
            plan: The plan to review
            goal: Original goal for context
            
        Returns:
            Tuple of (plan, approved)
        """
        prompt = f"""{self.system_prompt}

Original goal: {goal}

Plan to review:
{plan}

Your response:"""
        
        try:
            result = generate_text(prompt)
            if result:
                result = result.strip()
                
                if "APPROVED" in result.upper():
                    return plan, True
                else:
                    return result, False
        except Exception as e:
            logger.error(f"Critic with context failed: {e}")
        
        return plan, True
