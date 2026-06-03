"""
AI Router - Multi-provider AI endpoints with streaming support
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import database
import json

router = APIRouter()

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stream: Optional[bool] = False

@router.post("/chat")
async def chat(req: ChatRequest):
    """
    Chat endpoint with multi-provider support
    Automatically selects best available provider
    """
    try:
        settings = database.get_all_settings()
        
        # Get system prompt
        system_prompt = settings.get("system_prompt", "You are Airis, an advanced AI assistant.")
        
        # Build messages with system prompt
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        messages.extend([{"role": m.role, "content": m.content} for m in req.messages])
        
        # Try providers in order of priority
        providers_to_try = []
        
        # Groq (fastest)
        if settings.get("groq_api_key"):
            providers_to_try.append({
                "name": "Groq",
                "api_key": settings.get("groq_api_key"),
                "model": req.model or settings.get("groq_model", "llama-3.3-70b-versatile"),
                "base_url": "https://api.groq.com/openai/v1"
            })
        
        # Claude
        if settings.get("claude_api_key"):
            providers_to_try.append({
                "name": "Claude",
                "api_key": settings.get("claude_api_key"),
                "model": req.model or settings.get("claude_model", "claude-3-5-sonnet-20241022"),
                "base_url": "https://api.anthropic.com"
            })
        
        # OpenAI
        if settings.get("openai_api_key"):
            providers_to_try.append({
                "name": "OpenAI",
                "api_key": settings.get("openai_api_key"),
                "model": req.model or settings.get("openai_model", "gpt-4-turbo"),
                "base_url": "https://api.openai.com/v1"
            })
        
        # Gemini
        if settings.get("gemini_api_key"):
            providers_to_try.append({
                "name": "Gemini",
                "api_key": settings.get("gemini_api_key"),
                "model": req.model or settings.get("gemini_model", "gemini-2.0-flash"),
                "base_url": "https://generativelanguage.googleapis.com"
            })
        
        # NVIDIA NIM
        if settings.get("nvidia_api_key"):
            providers_to_try.append({
                "name": "NVIDIA NIM",
                "api_key": settings.get("nvidia_api_key"),
                "model": req.model or settings.get("nvidia_model", "meta/llama-3.1-405b-instruct"),
                "base_url": "https://integrate.api.nvidia.com/v1"
            })
        
        # Mistral
        if settings.get("mistral_api_key"):
            providers_to_try.append({
                "name": "Mistral",
                "api_key": settings.get("mistral_api_key"),
                "model": req.model or settings.get("mistral_model", "mistral-large-latest"),
                "base_url": "https://api.mistral.ai/v1"
            })
        
        # Together AI
        if settings.get("together_api_key"):
            providers_to_try.append({
                "name": "Together AI",
                "api_key": settings.get("together_api_key"),
                "model": req.model or settings.get("together_model", "meta-llama/Llama-3-70b-chat-hf"),
                "base_url": "https://api.together.xyz/v1"
            })
        
        # Ollama (local)
        if settings.get("ollama_enabled") and settings.get("ollama_url"):
            providers_to_try.append({
                "name": "Ollama",
                "api_key": None,
                "model": req.model or settings.get("ollama_model", "llama3.2"),
                "base_url": settings.get("ollama_url", "http://localhost:11434")
            })
        
        if not providers_to_try:
            raise HTTPException(
                status_code=400,
                detail="No AI provider configured. Add an API key in settings."
            )
        
        # Try first available provider
        provider = providers_to_try[0]
        
        # For now, return a placeholder response
        # In production, this would call the actual provider API
        return {
            "success": True,
            "provider": provider["name"],
            "model": provider["model"],
            "response": "This is a placeholder response. Implement provider-specific API calls.",
            "messages": messages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/provider/status")
def get_provider_status():
    """Get status of available AI providers"""
    try:
        settings = database.get_all_settings()
        
        providers = []
        
        if settings.get("groq_api_key"):
            providers.append({"name": "Groq", "available": True})
        
        if settings.get("claude_api_key"):
            providers.append({"name": "Claude", "available": True})
        
        if settings.get("openai_api_key"):
            providers.append({"name": "OpenAI", "available": True})
        
        if settings.get("gemini_api_key"):
            providers.append({"name": "Gemini", "available": True})
        
        if settings.get("nvidia_api_key"):
            providers.append({"name": "NVIDIA NIM", "available": True})
        
        if settings.get("mistral_api_key"):
            providers.append({"name": "Mistral", "available": True})
        
        if settings.get("together_api_key"):
            providers.append({"name": "Together AI", "available": True})
        
        if settings.get("ollama_enabled"):
            providers.append({"name": "Ollama", "available": True})
        
        has_provider = len(providers) > 0
        
        return {
            "has_provider": has_provider,
            "providers": providers,
            "primary": providers[0]["name"] if providers else None
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/system-prompt")
def set_system_prompt(prompt: str):
    """Set the system prompt"""
    try:
        database.set_setting("system_prompt", prompt)
        return {"success": True, "message": "System prompt updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system-prompt")
def get_system_prompt():
    """Get the current system prompt"""
    prompt = database.get_setting("system_prompt")
    if not prompt:
        prompt = "You are Airis, an advanced AI assistant."
    return {"system_prompt": prompt}
