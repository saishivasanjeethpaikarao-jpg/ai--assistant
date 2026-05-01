"""Master System Prompt Configuration — Core Brain for AI Assistant

Supports 6 operating modes:
1. Classifier - categorize input
2. Planner - break goals into steps
3. Executor - convert steps to commands
4. Critic - evaluate and improve results
5. Memory Extractor - store lessons
6. Safety Validator - check command safety
"""

import json
import os
from config_paths import user_data_dir

SYSTEM_PROMPT_PATH = os.path.join(user_data_dir(), "system_prompt.json")

MASTER_SYSTEM_PROMPT = """MASTER SYSTEM PROMPT - Core AI Assistant Brain

You are a smart AI assistant integrated into a desktop system.

YOUR ROLE:
- Understand user goals (not just commands)
- Break goals into actionable steps
- Use available tools to execute tasks
- Be precise, efficient, and safe

CORE RULES:
1. Never hallucinate tools or capabilities
2. Only use provided tools
3. Prefer short plans (3-6 steps)
4. Avoid unnecessary actions
5. If unsure, ask for clarification

OPERATING MODES:
1. Command Mode: direct execution
2. Agent Mode: plan + execute
3. Chat Mode: normal conversation

Always choose the correct mode for the user's request."""

# ============================================================================
# MULTI-MODE FRAMEWORK
# ============================================================================

MODE_CLASSIFIER = """MODE: CLASSIFIER
Categorize user input into one of three types:

1. COMMAND - Direct action needed
   Examples: "open Chrome", "run Python script", "show files"
   Output: COMMAND

2. GOAL - Multi-step task required
   Examples: "analyze sales data", "prepare deployment", "research topic"
   Output: GOAL

3. CHAT - General conversation
   Examples: "how are you?", "explain quantum mechanics", "tell me a joke"
   Output: CHAT

Rules:
- Output ONLY one word: COMMAND, GOAL, or CHAT
- No explanation needed
- Be decisive"""

MODE_PLANNER = """MODE: PLANNER
Break user goals into short, executable steps.

Goal: {goal}

Rules:
- Create 3-6 steps maximum
- Each step must be clear and actionable
- No unnecessary steps
- Avoid repetition

Output format (no explanation):
1. step one
2. step two
3. step three"""

MODE_EXECUTOR = """MODE: EXECUTOR
Convert a planning step into a tool command.

Step: {step}

Available commands:
- open <target>
- search <query>
- run <command>
- analyze <target>
- create file <path>
- read file <path>
- execute <code>
- git <action>

Rules:
- Output ONLY the command
- No explanation
- Must match available commands exactly"""

MODE_CRITIC = """MODE: CRITIC
Evaluate execution results and suggest improvements.

Goal: {goal}
Steps executed: {steps}
Results: {results}

Evaluate:
- Did we achieve the goal?
- What failed? Why?
- What can be improved?

Output:
- Achievement status (YES/PARTIAL/NO)
- What went wrong (if applicable)
- One improvement suggestion"""

MODE_MEMORY_EXTRACTOR = """MODE: MEMORY EXTRACTOR
Extract useful facts from interactions for learning.

User goal: {goal}
Actions: {steps}
Result: {results}

Store only important facts:
- User preferences and habits
- Successful strategies
- Repeated patterns
- Error patterns

Output JSON (compact):
{"facts": [...], "patterns": [...], "preferences": [...]}"""

MODE_SAFETY_VALIDATOR = """MODE: SAFETY VALIDATOR
Check if a command is safe to execute.

Command: {command}

Block if contains:
- shutdown/restart system
- delete system files or critical paths
- unsafe PowerShell with admin
- unknown/suspicious execution
- credential exposure

Output:
SAFE - proceed with execution
BLOCKED - reason why
UNKNOWN - needs human review"""

DEFAULT_SYSTEM_CONFIG = {
    "master_prompt": MASTER_SYSTEM_PROMPT,
    "version": "2.0",
    "enabled": True,
    "mode": "agent",  # default operating mode
    "multi_mode_enabled": True,
}

# Map mode names to prompts
MODE_PROMPTS = {
    "classifier": MODE_CLASSIFIER,
    "planner": MODE_PLANNER,
    "executor": MODE_EXECUTOR,
    "critic": MODE_CRITIC,
    "memory_extractor": MODE_MEMORY_EXTRACTOR,
    "safety_validator": MODE_SAFETY_VALIDATOR,
}


def load_system_prompt() -> str:
    """Load master system prompt from config or return default."""
    if os.path.isfile(SYSTEM_PROMPT_PATH):
        try:
            with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "master_prompt" in data:
                    return data["master_prompt"]
        except (OSError, json.JSONDecodeError):
            pass
    return MASTER_SYSTEM_PROMPT


def save_system_prompt(prompt: str) -> None:
    """Save master system prompt to config."""
    config = DEFAULT_SYSTEM_CONFIG.copy()
    config["master_prompt"] = prompt
    os.makedirs(os.path.dirname(SYSTEM_PROMPT_PATH), exist_ok=True)
    with open(SYSTEM_PROMPT_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def get_system_config() -> dict:
    """Load full system config."""
    if os.path.isfile(SYSTEM_PROMPT_PATH):
        try:
            with open(SYSTEM_PROMPT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    config = DEFAULT_SYSTEM_CONFIG.copy()
                    config.update(data)
                    return config
        except (OSError, json.JSONDecodeError):
            pass
    return DEFAULT_SYSTEM_CONFIG.copy()


def is_system_prompt_enabled() -> bool:
    """Check if system prompt is enabled."""
    config = get_system_config()
    return config.get("enabled", True)


def get_operating_mode() -> str:
    """Get default operating mode (command/agent/chat)."""
    config = get_system_config()
    return config.get("mode", "agent")


def get_mode_prompt(mode: str, **kwargs) -> str:
    """Get prompt for a specific operating mode.
    
    Args:
        mode: One of 'classifier', 'planner', 'executor', 'critic', 
              'memory_extractor', 'safety_validator'
        **kwargs: Variables to format into the prompt (e.g., goal, step)
    
    Returns:
        Formatted mode prompt
    """
    mode = mode.lower()
    if mode not in MODE_PROMPTS:
        raise ValueError(f"Unknown mode: {mode}. Available: {list(MODE_PROMPTS.keys())}")
    
    prompt = MODE_PROMPTS[mode]
    try:
        return prompt.format(**kwargs)
    except KeyError as e:
        return prompt  # Return unformatted if kwargs don't match


def is_multi_mode_enabled() -> bool:
    """Check if multi-mode framework is enabled."""
    config = get_system_config()
    return config.get("multi_mode_enabled", True)


def list_available_modes() -> list:
    """Get list of all available operating modes."""
    return list(MODE_PROMPTS.keys())


def classify_input(user_input: str) -> str:
    """Classify user input into COMMAND, GOAL, or CHAT.
    
    Simple heuristic classifier (can be replaced with LLM call)
    """
    user_input_lower = user_input.lower().strip()
    
    # COMMAND indicators
    command_keywords = ['open', 'run', 'execute', 'close', 'start', 'stop', 'show', 'list', 'delete', 'create', 'move']
    for keyword in command_keywords:
        if user_input_lower.startswith(keyword):
            return "COMMAND"
    
    # GOAL indicators
    goal_keywords = ['analyze', 'prepare', 'research', 'plan', 'build', 'debug', 'fix', 'improve', 'optimize']
    for keyword in goal_keywords:
        if keyword in user_input_lower:
            return "GOAL"
    
    # CHAT (default)
    return "CHAT"
