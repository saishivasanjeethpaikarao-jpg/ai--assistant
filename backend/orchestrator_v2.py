"""
ORCHESTRATOR V2 - Adaptive Reasoning Controller
Converts from pipeline executor to agent loop with iterative thinking and self-correction.
Now includes Multi-Agent system for complex tasks.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import existing system components
from assistant_core import generate_text
from core.command_engine import command_engine
from brain.brain import memory_context, learn_text

# Import Multi-Agent system
try:
    from agents.multi_agent_orchestrator import MultiAgentOrchestrator
    _multi_agent_available = True
except ImportError:
    _multi_agent_available = False

logger = logging.getLogger(__name__)


class SmartOrchestrator:
    """Adaptive reasoning controller with agent loop capabilities."""
    
    def __init__(self, max_loops: int = 3, use_multi_agent: bool = True):
        self.max_loops = max_loops
        self.execution_history = []
        self.use_multi_agent = use_multi_agent and _multi_agent_available
        
        # Initialize Multi-Agent Orchestrator if available
        if self.use_multi_agent:
            self.multi_agent = MultiAgentOrchestrator(max_iterations=max_loops)
            logger.info("Multi-Agent system initialized")
        else:
            self.multi_agent = None
            logger.info("Using single-agent mode")
        
    def run(self, user_input: str) -> str:
        """
        Main entry point - routes input through adaptive reasoning.
        
        Args:
            user_input: User's command or query
            
        Returns:
            Final response string
        """
        logger.info(f"SmartOrchestrator processing: {user_input[:100]}")
        
        intent = self.detect_intent(user_input)
        logger.info(f"Detected intent: {intent}")
        
        if intent == "COMMAND":
            return self.execute_command(user_input)
        
        elif intent == "GOAL":
            return self.run_agent(user_input)
        
        else:  # CHAT
            return self.chat(user_input)
    
    # -------------------------------------------------------------------------
    # Intent Detection
    # -------------------------------------------------------------------------
    
    def detect_intent(self, text: str) -> str:
        """
        Classify input as COMMAND, GOAL, or CHAT.
        
        COMMAND = Single action (open app, run command, show file)
        GOAL = Multi-step task (analyze, build, prepare, debug)
        CHAT = Conversation (question, discussion, explanation)
        """
        prompt = f"""Classify this user input as one of: COMMAND, GOAL, or CHAT

COMMAND = Single action (open app, run command, show file, create file)
GOAL = Multi-step task (analyze, build, prepare, debug, research, organize)
CHAT = Conversation (question, discussion, explanation, general query)

Input: {text}

Output ONLY the classification (COMMAND/GOAL/CHAT):"""
        
        try:
            result = generate_text(prompt)
            if result:
                classification = result.strip().upper()
                # Validate and return
                if classification in ["COMMAND", "GOAL", "CHAT"]:
                    return classification
        except Exception as e:
            logger.error(f"Intent detection failed: {e}")
        
        # Fallback: simple keyword-based classification
        text_lower = text.lower()
        action_keywords = ["open", "run", "create", "read", "delete", "search", "play"]
        goal_keywords = ["analyze", "research", "prepare", "build", "organize", "setup", "plan"]
        
        if any(kw in text_lower for kw in action_keywords):
            return "COMMAND"
        elif any(kw in text_lower for kw in goal_keywords):
            return "GOAL"
        else:
            return "CHAT"
    
    # -------------------------------------------------------------------------
    # Agent Loop (GOAL processing)
    # -------------------------------------------------------------------------
    
    def run_agent(self, goal: str, callback=None) -> str:
        """
        Run agent loop for goal-oriented tasks with iterative improvement.
        
        Args:
            goal: User's goal statement
            callback: Optional callback function for real-time updates
            
        Returns:
            Final results string
        """
        # Use Multi-Agent system if available and enabled
        if self.use_multi_agent and self.multi_agent:
            logger.info("Using Multi-Agent system for goal execution")
            
            # Set callback for multi-agent updates
            if callback:
                self.multi_agent.set_callback(callback)
            
            return self.multi_agent.run(goal)
        
        # Fallback to single-agent mode
        logger.info(f"Starting single-agent loop for goal: {goal[:100]}")
        history = []
        
        for i in range(self.max_loops):
            logger.info(f"Agent loop iteration {i + 1}/{self.max_loops}")
            
            # Create plan
            plan = self.create_plan(goal)
            logger.info(f"Plan created: {plan[:200]}")
            
            if callback:
                callback({"type": "plan", "data": plan, "iteration": i + 1})
            
            # Critic and improve plan
            plan = self.critic(plan)
            logger.info(f"Plan after critic: {plan[:200]}")
            
            if callback:
                callback({"type": "critic", "data": plan, "iteration": i + 1})
            
            # Execute plan
            results = self.execute_plan(plan, callback)
            logger.info(f"Execution results: {len(results)} steps completed")
            
            # Evaluate success
            success = self.evaluate(goal, results)
            logger.info(f"Success evaluation: {success}")
            
            if callback:
                callback({"type": "evaluation", "data": success, "iteration": i + 1})
            
            # Store in history
            history.append({
                "iteration": i + 1,
                "plan": plan,
                "results": results,
                "success": success,
                "timestamp": datetime.now().isoformat()
            })
            
            if success:
                logger.info("Goal achieved successfully")
                if callback:
                    callback({"type": "success", "data": "Goal achieved", "iteration": i + 1})
                break
            
            # Replan if not successful
            goal = self.replan(goal, history)
            logger.info(f"Replanned goal: {goal[:100]}")
            
            if callback:
                callback({"type": "replan", "data": goal, "iteration": i + 1})
        
        # Store in memory
        self.memory_store({"goal": goal, "history": history})
        
        # Format final response
        final_result = self.format_agent_response(history)
        
        if callback:
            callback({"type": "final", "data": final_result})
        
        return final_result
    
    def create_plan(self, goal: str) -> str:
        """Break goal into 3-5 executable steps."""
        prompt = f"""Break this goal into 3-5 specific, executable steps.

Goal: {goal}

Requirements:
- Each step must be actionable
- Maximum 5 steps
- Logical ordering
- Be specific and concrete

Output as numbered list:
1. Step one
2. Step two
3. Step three"""
        
        result = generate_text(prompt)
        return result if result else "1. Analyze the request\n2. Provide response"
    
    def critic(self, plan: str) -> str:
        """Evaluate and improve the plan if needed."""
        prompt = f"""Evaluate this plan and improve it if needed:

{plan}

Check for:
- Missing steps?
- Inefficiencies?
- Logical flaws?
- Unnecessary actions?

If plan is strong, return: APPROVED
If plan needs improvement, return the improved plan."""
        
        result = generate_text(prompt)
        if result and "APPROVED" not in result.upper():
            return result
        return plan
    
    def execute_plan(self, plan: str, callback=None) -> List[str]:
        """Execute each step in the plan and collect results."""
        steps = plan.split("\n")
        # Important fix 1: Limit steps
        steps = steps[:5]
        
        results = []
        
        for step in steps:
            # Important fix 2: Skip empty steps
            if not step.strip():
                continue
            
            # Extract step content (remove numbering)
            step_content = step.lstrip("0123456789.- ").strip()
            if not step_content:
                continue
            
            logger.info(f"Executing step: {step_content[:100]}")
            
            if callback:
                callback({"type": "step", "data": step_content})
            
            # Map to command
            cmd = self.map_to_command(step_content)
            
            # Safety check
            safe = self.safety_check(cmd)
            if not safe:
                logger.warning(f"Command blocked by safety check: {cmd}")
                result = f"Blocked unsafe command: {step_content}"
                results.append(result)
                if callback:
                    callback({"type": "result", "data": result, "success": False})
                continue
            
            # Execute
            try:
                result = self.tools_run(cmd)
                results.append(f"Step: {step_content}\nResult: {result}")
                if callback:
                    callback({"type": "result", "data": result, "success": True})
            except Exception as e:
                logger.error(f"Execution failed: {e}")
                result = f"Step failed: {step_content}\nError: {str(e)}"
                results.append(result)
                if callback:
                    callback({"type": "result", "data": result, "success": False})
        
        return results
    
    def evaluate(self, goal: str, results: List[str]) -> bool:
        """Evaluate if the goal was achieved based on results."""
        prompt = f"""Goal: {goal}

Execution results:
{chr(10).join(results[:5])}

Did we successfully achieve the goal? Answer yes or no."""
        
        try:
            result = generate_text(prompt)
            if result:
                return "yes" in result.lower()
        except Exception as e:
            logger.error(f"Evaluation failed: {e}")
        
        # Fallback: check if any results indicate success
        results_text = " ".join(results).lower()
        return any(word in results_text for word in ["success", "completed", "done", "finished"])
    
    def replan(self, goal: str, history: List[Dict]) -> str:
        """Improve the goal based on failure history."""
        history_summary = "\n".join([
            f"Iteration {h['iteration']}: Success={h['success']}\nPlan: {h['plan'][:200]}"
            for h in history
        ])
        
        prompt = f"""Original goal: {goal}

Previous attempts failed:
{history_summary}

Provide an improved, more specific goal that addresses the failures.
Keep it concise and actionable."""
        
        result = generate_text(prompt)
        return result if result else goal
    
    def map_to_command(self, step: str) -> str:
        """Convert a natural language step to an executable command."""
        prompt = f"""Convert this step to an executable command for an AI assistant.

Step: {step}

Available command types:
- open <app/file/url>
- run <command>
- search <query>
- create file <path>
- read file <path>

Output ONLY the command, no explanation."""
        
        result = generate_text(prompt)
        if result:
            # Extract command if wrapped in explanation
            lines = result.split("\n")
            for line in lines:
                if any(cmd in line.lower() for cmd in ["open", "run", "search", "create", "read"]):
                    return line.strip()
            return result.strip()
        return step
    
    def safety_check(self, cmd: str) -> bool:
        """Check if command is safe to execute."""
        blocked = ["shutdown", "delete", "format", "rm -rf", "del /s", "format c:"]
        cmd_lower = cmd.lower()
        return not any(b in cmd_lower for b in blocked)
    
    # -------------------------------------------------------------------------
    # Direct Execution (COMMAND processing)
    # -------------------------------------------------------------------------
    
    def execute_command(self, cmd: str) -> str:
        """Execute a single command directly."""
        logger.info(f"Executing command: {cmd[:100]}")
        
        # Safety check
        if not self.safety_check(cmd):
            return "Command blocked by safety check."
        
        try:
            result = self.tools_run(cmd)
            return result
        except Exception as e:
            logger.error(f"Command execution failed: {e}")
            return f"Error: {str(e)}"
    
    # -------------------------------------------------------------------------
    # Chat Mode (CHAT processing)
    # -------------------------------------------------------------------------
    
    def chat(self, text: str) -> str:
        """Handle conversational queries."""
        logger.info(f"Chat mode: {text[:100]}")
        
        # Add memory context
        context = memory_context()
        if context:
            text = f"Memory context:\n{context}\n\nUser: {text}"
        
        result = generate_text(text)
        return result if result else "I couldn't process that request."
    
    # -------------------------------------------------------------------------
    # Tool Execution
    # -------------------------------------------------------------------------
    
    def tools_run(self, cmd: str) -> str:
        """Execute command using existing command engine."""
        try:
            result = command_engine.execute(cmd)
            return result
        except Exception as e:
            logger.error(f"Tool execution failed: {e}")
            raise
    
    # -------------------------------------------------------------------------
    # Memory Storage
    # -------------------------------------------------------------------------
    
    def memory_store(self, data: Dict[str, Any]) -> None:
        """Store execution history in memory."""
        try:
            # Store as a learning note
            summary = f"Agent execution: {data.get('goal', 'unknown')}\n"
            summary += f"Iterations: {len(data.get('history', []))}\n"
            
            final_result = data.get('history', [])[-1]
            if final_result.get('success'):
                summary += "Result: Successful"
            else:
                summary += "Result: Needs improvement"
            
            learn_text(summary)
            logger.info("Stored execution in memory")
        except Exception as e:
            logger.error(f"Memory storage failed: {e}")
    
    # -------------------------------------------------------------------------
    # Response Formatting
    # -------------------------------------------------------------------------
    
    def format_agent_response(self, history: List[Dict]) -> str:
        """Format agent execution history into readable response."""
        lines = ["🤖 Agent Execution Results\n"]
        
        for h in history:
            lines.append(f"\n--- Iteration {h['iteration']} ---")
            lines.append(f"Plan: {h['plan'][:200]}...")
            lines.append(f"Success: {h['success']}")
            
            if h['results']:
                lines.append("\nResults:")
                for r in h['results'][:3]:
                    lines.append(f"  • {r[:150]}...")
        
        final = history[-1]
        if final['success']:
            lines.append("\n✅ Goal achieved successfully!")
        else:
            lines.append("\n⚠️ Goal not fully achieved after maximum iterations.")
        
        return "\n".join(lines)
    
    # -------------------------------------------------------------------------
    # Logging
    # -------------------------------------------------------------------------
    
    def get_execution_history(self) -> List[Dict]:
        """Get execution history for debugging and improvement."""
        return self.execution_history.copy()
    
    def clear_history(self) -> None:
        """Clear execution history."""
        self.execution_history.clear()
