"""
AI Router - Multi-provider AI endpoints with streaming support
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import database
import providers
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
    Chat endpoint with multi-provider support and automatic fallback
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
        
        # Create provider manager
        manager = providers.ProviderManager(settings)
        
        if not manager.providers:
            raise HTTPException(
                status_code=400,
                detail="No AI provider configured. Add an API key in settings."
            )
        
        # Get response with automatic fallback
        response, provider_name = await manager.chat(
            messages,
            temperature=req.temperature,
            max_tokens=req.max_tokens
        )
        
        return {
            "success": True,
            "provider": provider_name,
            "response": response,
            "messages": messages
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """
    Streaming chat endpoint with multi-provider support
    """
    async def generate():
        try:
            settings = database.get_all_settings()
            
            # Get system prompt
            system_prompt = settings.get("system_prompt", "You are Airis, an advanced AI assistant.")
            
            # Build messages with system prompt
            messages = [
                {"role": "system", "content": system_prompt}
            ]
            messages.extend([{"role": m.role, "content": m.content} for m in req.messages])
            
            # Create provider manager
            manager = providers.ProviderManager(settings)
            
            if not manager.providers:
                yield json.dumps({"error": "No AI provider configured"})
                return
            
            # Stream response with automatic fallback
            async for chunk, provider_name in manager.stream_chat(
                messages,
                temperature=req.temperature,
                max_tokens=req.max_tokens
            ):
                yield json.dumps({
                    "chunk": chunk,
                    "provider": provider_name
                }) + "\n"
        
        except Exception as e:
            yield json.dumps({"error": str(e)})
    
    return StreamingResponse(generate(), media_type="application/x-ndjson")

@router.get("/provider/status")
def get_provider_status():
    """Get status of available AI providers"""
    try:
        settings = database.get_all_settings()
        manager = providers.ProviderManager(settings)
        
        available = manager.get_available_providers()
        
        return {
            "has_provider": len(available) > 0,
            "providers": available,
            "primary": available[0]["name"] if available else None
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
