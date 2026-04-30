"""
ADVANCED 12-LAYER AI SYSTEM - AUTONOMOUS ASSISTANT BRAIN

This module contains the complete 12-layer decision-making and execution engine
for your personal AI assistant. All layers work together in an autonomous workflow.

Layers:
1. Intent Detector - Classify input type and complexity
2. Strategic Planner - Create optimal execution plans
3. Plan Critic - Validate and improve plans
4. Execution Engine - Convert steps to commands
5. Decision Engine - Choose best options
6. Safety Filter - Validate command safety
7. Self-Reflection - Evaluate outcomes
8. Adaptive Memory - Learn from interactions
9. Re-Planning Engine - Recover from failures
10. Chat Mode - Natural conversation
11. Meta-Improvement - System optimization
12. Orchestrator - Coordinate all layers
"""

import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from config_paths import user_data_dir

# ============================================================================
# LAYER 1: INTENT DETECTOR
# ============================================================================

LAYER_INTENT_DETECTOR = """LAYER 1: INTENT + COMPLEXITY DETECTOR

Analyze user input and classify it.

Input: {user_input}

Determine:
1. TYPE - Is this a COMMAND, GOAL, or CHAT?
2. COMPLEXITY - How complex? LOW / MEDIUM / HIGH?

COMMAND = Single action (open app, run command, show file)
GOAL = Multi-step task (analyze, build, prepare, debug)
CHAT = Conversation (question, discussion, explanation)

LOW complexity = 1 step, straightforward
MEDIUM complexity = 2-3 steps, some planning needed
HIGH complexity = 4+ steps, strategic thinking required

Output format (EXACT):
TYPE: COMMAND / GOAL / CHAT
COMPLEXITY: LOW / MEDIUM / HIGH
REASONING: brief explanation"""

# ============================================================================
# LAYER 2: STRATEGIC PLANNER
# ============================================================================

LAYER_STRATEGIC_PLANNER = """LAYER 2: STRATEGIC PLANNER

Create an optimal execution plan.

Goal: {goal}

Requirements:
- Maximize efficiency
- Minimize unnecessary steps
- Consider task dependencies
- Logical ordering
- Maximum 5 steps
- Each step must be executable

Think strategically before writing steps.

Output (numbered list):
1. Step with specific action
2. Step with specific action
3. Step with specific action"""

# ============================================================================
# LAYER 3: PLAN CRITIC
# ============================================================================

LAYER_PLAN_CRITIC = """LAYER 3: PLAN CRITIC / OPTIMIZER

Evaluate and improve this plan.

Plan:
{plan}

Strict analysis:
- Are there missing steps?
- Are there inefficiencies?
- Are there logical flaws?
- Are there unnecessary actions?
- Does it achieve the goal?

Decision:
- If plan is WEAK → Rewrite a BETTER version
- If plan is STRONG → Return "APPROVED"

Output:
Either: APPROVED
Or: [Rewritten improved plan]"""

# ============================================================================
# LAYER 4: EXECUTION ENGINE
# ============================================================================

LAYER_EXECUTION_ENGINE = """LAYER 4: EXECUTION ENGINE

Convert a planning step into an executable command.

Step: {step}

Available commands:
- open <app/file/url>
- run <system_command>
- search <query>
- analyze <data_target>
- create file <path>
- read file <path>
- execute <code>
- git <action>

Rules:
- Output ONLY the command
- No explanation
- Must use exact syntax
- Be specific and concrete"""

# ============================================================================
# LAYER 5: DECISION ENGINE
# ============================================================================

LAYER_DECISION_ENGINE = """LAYER 5: DECISION ENGINE

Choose the best option from alternatives.

Goal: {goal}
Options:
{options}

Evaluate each option on:
- Success probability (1-10)
- Risk level (1-10, high=risky)
- Efficiency (1-10, high=efficient)

Score each option.

Output:
BEST: [option name]
SCORE: [average score]
REASON: [brief explanation]"""

# ============================================================================
# LAYER 6: SAFETY FILTER
# ============================================================================

LAYER_SAFETY_FILTER = """LAYER 6: SAFETY FILTER

Validate command safety.

Command: {command}

Check for:
- Destructive system actions (delete, shutdown, format)
- Unsafe PowerShell with admin privileges
- Unknown or suspicious execution
- Privacy/credential risks
- File system dangers

Output ONLY:
SAFE [proceed with execution]
or
BLOCKED [reason: brief explanation]"""

# ============================================================================
# LAYER 7: SELF-REFLECTION
# ============================================================================

LAYER_SELF_REFLECTION = """LAYER 7: SELF-REFLECTION / EVALUATOR

Evaluate the outcome.

Goal: {goal}
Planned steps: {plan}
Execution results: {results}

Analysis:
- Was the goal FULLY achieved?
- What FAILED or went wrong?
- What WORKED well?
- What can be IMPROVED?

Output:
STATUS: ACHIEVED / PARTIAL / FAILED
ANALYSIS: [brief analysis]
IMPROVEMENTS: [1-2 concrete suggestions]"""

# ============================================================================
# LAYER 8: ADAPTIVE MEMORY
# ============================================================================

LAYER_ADAPTIVE_MEMORY = """LAYER 8: ADAPTIVE MEMORY BUILDER

Extract knowledge from this interaction.

Goal: {goal}
Execution steps: {steps}
Outcome: {results}

Extract and store:
- Successful strategies (what worked)
- User preferences (what they like)
- Repeated patterns (common tasks)
- Failed approaches (what didn't work)

Output JSON:
{
  "learning": "specific learning",
  "category": "strategy|preference|pattern|failure",
  "importance": "low|medium|high",
  "timestamp": "2026-04-29T10:30:00"
}"""

# ============================================================================
# LAYER 9: RE-PLANNING ENGINE
# ============================================================================

LAYER_REPLANNING_ENGINE = """LAYER 9: RE-PLANNING ENGINE

Goal wasn't fully achieved. Create a better plan.

Goal: {goal}
Previous plan: {previous_plan}
What failed: {failures}

Create IMPROVED plan:
- Avoid previous mistakes
- Try different approach
- Maximum 4 steps
- Be more specific

Output:
1. Better step
2. Better step
3. Better step"""

# ============================================================================
# LAYER 10: CHAT MODE
# ============================================================================

LAYER_CHAT_MODE = """LAYER 10: CHAT MODE

Natural conversation mode.

User: {user_input}

Rules:
- Speak naturally and clearly
- Be helpful and concise
- Avoid unnecessary complexity
- Only use tools if truly needed
- Be friendly and direct

Respond conversationally."""

# ============================================================================
# LAYER 11: META-IMPROVEMENT
# ============================================================================

LAYER_META_IMPROVEMENT = """LAYER 11: META-IMPROVEMENT PROMPT

Analyze and improve the system.

System analysis:
{analysis}

Suggest improvements:
- Better decision prompts
- Performance optimizations
- Missing capabilities
- Workflow improvements

Output:
- [Specific improvement 1]
- [Specific improvement 2]
- [Specific improvement 3]"""

# ============================================================================
# LAYER 12: ORCHESTRATOR
# ============================================================================

LAYER_ORCHESTRATOR = """LAYER 12: ORCHESTRATOR

Coordinate all 11 layers in optimal workflow.

User Input → Intent Detector
    ↓
IF COMMAND:
    → Execution Engine → Safety Filter → Execute
    ↓
IF GOAL:
    → Strategic Planner → Plan Critic
    → Execution Engine (for each step) → Safety Filter
    → Execute all steps
    ↓
    → Self-Reflection → Adaptive Memory
    ↓
    IF NOT FULLY ACHIEVED: Re-Planning Engine → retry

IF CHAT:
    → Chat Mode
    → (Optional) Adaptive Memory for learning

Output results and store memory."""

# ============================================================================
# CONFIG & MANAGEMENT
# ============================================================================

ADVANCED_SYSTEM_CONFIG_PATH = os.path.join(user_data_dir(), "advanced_system.json")

LAYER_PROMPTS = {
    "intent_detector": LAYER_INTENT_DETECTOR,
    "strategic_planner": LAYER_STRATEGIC_PLANNER,
    "plan_critic": LAYER_PLAN_CRITIC,
    "execution_engine": LAYER_EXECUTION_ENGINE,
    "decision_engine": LAYER_DECISION_ENGINE,
    "safety_filter": LAYER_SAFETY_FILTER,
    "self_reflection": LAYER_SELF_REFLECTION,
    "adaptive_memory": LAYER_ADAPTIVE_MEMORY,
    "replanning_engine": LAYER_REPLANNING_ENGINE,
    "chat_mode": LAYER_CHAT_MODE,
    "meta_improvement": LAYER_META_IMPROVEMENT,
    "orchestrator": LAYER_ORCHESTRATOR,
}

DEFAULT_ADVANCED_CONFIG = {
    "version": "3.0",
    "name": "Advanced 12-Layer Autonomous AI System",
    "enabled": True,
    "layers_enabled": list(LAYER_PROMPTS.keys()),
    "max_retries": 3,
    "learning_enabled": True,
    "safety_enabled": True,
    "auto_replan": True,
}


def get_layer_prompt(layer_name: str, **kwargs) -> str:
    """Get formatted prompt for a specific layer.
    
    Args:
        layer_name: Name of the layer (e.g., 'intent_detector')
        **kwargs: Variables to format into the prompt
    
    Returns:
        Formatted prompt string
    """
    if layer_name not in LAYER_PROMPTS:
        raise ValueError(f"Unknown layer: {layer_name}. Available: {list(LAYER_PROMPTS.keys())}")
    
    prompt = LAYER_PROMPTS[layer_name]
    try:
        return prompt.format(**kwargs)
    except KeyError:
        return prompt  # Return unformatted if kwargs don't match


def load_advanced_config() -> Dict[str, Any]:
    """Load advanced system configuration."""
    if os.path.isfile(ADVANCED_SYSTEM_CONFIG_PATH):
        try:
            with open(ADVANCED_SYSTEM_CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    config = DEFAULT_ADVANCED_CONFIG.copy()
                    config.update(data)
                    return config
        except (OSError, json.JSONDecodeError):
            pass
    return DEFAULT_ADVANCED_CONFIG.copy()


def save_advanced_config(config: Dict[str, Any]) -> None:
    """Save advanced system configuration."""
    os.makedirs(os.path.dirname(ADVANCED_SYSTEM_CONFIG_PATH), exist_ok=True)
    with open(ADVANCED_SYSTEM_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def is_advanced_system_enabled() -> bool:
    """Check if advanced 12-layer system is enabled."""
    config = load_advanced_config()
    return config.get("enabled", True)


def get_all_layers() -> List[str]:
    """Get all available layers."""
    return list(LAYER_PROMPTS.keys())


def get_layer_count() -> int:
    """Get total number of layers."""
    return len(LAYER_PROMPTS)
