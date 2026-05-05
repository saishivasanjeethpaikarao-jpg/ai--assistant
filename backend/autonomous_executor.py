"""
AUTONOMOUS EXECUTION ENGINE - Fixed version
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from ai_switcher import has_provider_configured, with_fallback, refresh_providers
    from config_paths import get_dotenv_path
    from dotenv import load_dotenv
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False


class AutonomousExecutor:
    """Simplified executor that actually calls AI"""
    
    def __init__(self):
        self.execution_history = []
        self.learned_strategies = []
        self.retry_count = 0
        self.max_retries = 3
    
    def execute_goal(self, user_input: str) -> Dict[str, Any]:
        """Process user input - actually call AI instead of returning stubs"""
        if not AI_AVAILABLE:
            return {
                "status": "complete",
                "mode": "CHAT",
                "message": "AI providers not configured. Please set GROQ_API_KEY in Settings.",
                "input": user_input
            }
        
        try:
            # Actually call AI
            load_dotenv(get_dotenv_path(), override=True)
            refresh_providers()
            
            if not has_provider_configured():
                return {
                    "status": "complete",
                    "mode": "CHAT",
                    "message": "No AI provider configured. Please add your Groq API key in Settings.",
                    "input": user_input
                }
            
            from assistant_persona import ASSISTANT_PERSONA
            
            messages = [
                {"role": "system", "content": ASSISTANT_PERSONA},
                {"role": "user", "content": user_input}
            ]
            
            import requests as req_lib
            try:
                from openai import OpenAI
            except ImportError:
                OpenAI = None
            
            def call_ai(provider, msgs):
                pname = provider.get("name", "").lower()
                api_key = provider.get("api_key")
                base_url = provider.get("base_url", "")
                model = provider.get("model", "")
                
                if pname == "ollama":
                    url = base_url.rstrip("/") + "/v1/chat/completions"
                    r = req_lib.post(url, json={"model": model, "messages": msgs}, timeout=60)
                    r.raise_for_status()
                    d = r.json()
                    return d["choices"][0]["message"]["content"]
                
                if OpenAI is None:
                    raise RuntimeError("openai package not installed")
                client = OpenAI(api_key=api_key, base_url=base_url)
                resp = client.chat.completions.create(model=model, messages=msgs)
                return resp.choices[0].message.content
            
            reply = with_fallback(call_ai, messages)
            
            return {
                "status": "complete",
                "mode": "CHAT",
                "response": reply,
                "message": reply,
                "input": user_input
            }
            
        except Exception as e:
            return {
                "status": "error",
                "mode": "CHAT",
                "message": f"Error: {str(e)}",
                "input": user_input
            }
    
    def get_execution_history(self) -> List[Dict]:
        return self.execution_history
    
    def get_learned_strategies(self) -> List[Dict]:
        return self.learned_strategies
    
    def get_metrics(self) -> Dict[str, Any]:
        return {
            "total_executions": len(self.execution_history),
            "successful": len([e for e in self.execution_history if e.get("status") == "complete"]),
            "success_rate": "0%",
            "strategies_learned": len(self.learned_strategies),
            "retry_count": self.retry_count,
        }


_executor = None

def get_executor() -> AutonomousExecutor:
    global _executor
    if _executor is None:
        _executor = AutonomousExecutor()
    return _executor


def execute(user_input: str) -> Dict[str, Any]:
    return get_executor().execute_goal(user_input)


def reset_executor():
    global _executor
    _executor = None
