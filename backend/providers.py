"""
Multi-Provider AI Integration
Supports Groq, Claude, OpenAI, Gemini, NVIDIA NIM, Mistral, Together AI, Ollama
With automatic fallback and streaming support
"""

import os
import json
import httpx
from typing import Optional, List, Dict, Any, AsyncGenerator
import asyncio

class AIProvider:
    """Base class for AI providers"""
    
    def __init__(self, api_key: str, model: str, base_url: str):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url
        self.name = self.__class__.__name__
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Send chat request and get response"""
        raise NotImplementedError
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat response"""
        raise NotImplementedError

class GroqProvider(AIProvider):
    """Groq API Provider - Fastest inference"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Groq"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Groq"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            pass

class ClaudeProvider(AIProvider):
    """Claude API Provider - Anthropic"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Claude"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "messages": messages,
                    "temperature": temperature,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["content"][0]["text"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Claude"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "content_block_delta":
                                if data.get("delta", {}).get("type") == "text_delta":
                                    yield data["delta"]["text"]
                        except json.JSONDecodeError:
                            pass

class OpenAIProvider(AIProvider):
    """OpenAI API Provider - GPT-4"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with OpenAI"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with OpenAI"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            pass

class GeminiProvider(AIProvider):
    """Google Gemini API Provider"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Gemini"""
        # Convert messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/v1beta/models/{self.model}:generateContent",
                params={"key": self.api_key},
                json={
                    "contents": contents,
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Gemini"""
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/v1beta/models/{self.model}:streamGenerateContent",
                params={"key": self.api_key},
                json={
                    "contents": contents,
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens,
                    }
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    try:
                        data = json.loads(line)
                        if "candidates" in data and len(data["candidates"]) > 0:
                            parts = data["candidates"][0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                yield parts[0]["text"]
                    except json.JSONDecodeError:
                        pass

class NVIDIAProvider(AIProvider):
    """NVIDIA NIM API Provider"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with NVIDIA NIM"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with NVIDIA NIM"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            pass

class MistralProvider(AIProvider):
    """Mistral API Provider"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Mistral"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Mistral"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            pass

class TogetherProvider(AIProvider):
    """Together AI API Provider"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Together AI"""
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Together AI"""
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                if "content" in delta:
                                    yield delta["content"]
                        except json.JSONDecodeError:
                            pass

class OllamaProvider(AIProvider):
    """Ollama Local Provider"""
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> str:
        """Chat with Ollama"""
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": False,
                }
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"]
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[str, None]:
        """Stream chat with Ollama"""
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": True,
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    try:
                        data = json.loads(line)
                        if "message" in data and "content" in data["message"]:
                            yield data["message"]["content"]
                    except json.JSONDecodeError:
                        pass

class ProviderManager:
    """Manages multiple AI providers with automatic fallback"""
    
    def __init__(self, settings: Dict[str, Any]):
        self.settings = settings
        self.providers: List[AIProvider] = []
        self._build_providers()
    
    def _build_providers(self):
        """Build provider list from settings"""
        self.providers = []
        
        # Priority order: Groq > Claude > OpenAI > Gemini > NVIDIA > Mistral > Together > Ollama
        
        if self.settings.get("groq_api_key"):
            self.providers.append(GroqProvider(
                self.settings["groq_api_key"],
                self.settings.get("groq_model", "llama-3.3-70b-versatile"),
                "https://api.groq.com/openai/v1"
            ))
        
        if self.settings.get("claude_api_key"):
            self.providers.append(ClaudeProvider(
                self.settings["claude_api_key"],
                self.settings.get("claude_model", "claude-3-5-sonnet-20241022"),
                "https://api.anthropic.com"
            ))
        
        if self.settings.get("openai_api_key"):
            self.providers.append(OpenAIProvider(
                self.settings["openai_api_key"],
                self.settings.get("openai_model", "gpt-4-turbo"),
                "https://api.openai.com/v1"
            ))
        
        if self.settings.get("gemini_api_key"):
            self.providers.append(GeminiProvider(
                self.settings["gemini_api_key"],
                self.settings.get("gemini_model", "gemini-2.0-flash"),
                "https://generativelanguage.googleapis.com"
            ))
        
        if self.settings.get("nvidia_api_key"):
            self.providers.append(NVIDIAProvider(
                self.settings["nvidia_api_key"],
                self.settings.get("nvidia_model", "meta/llama-3.1-405b-instruct"),
                "https://integrate.api.nvidia.com/v1"
            ))
        
        if self.settings.get("mistral_api_key"):
            self.providers.append(MistralProvider(
                self.settings["mistral_api_key"],
                self.settings.get("mistral_model", "mistral-large-latest"),
                "https://api.mistral.ai/v1"
            ))
        
        if self.settings.get("together_api_key"):
            self.providers.append(TogetherProvider(
                self.settings["together_api_key"],
                self.settings.get("together_model", "meta-llama/Llama-3-70b-chat-hf"),
                "https://api.together.xyz/v1"
            ))
        
        if self.settings.get("ollama_enabled") and self.settings.get("ollama_url"):
            self.providers.append(OllamaProvider(
                "",  # Ollama doesn't need API key
                self.settings.get("ollama_model", "llama3.2"),
                self.settings.get("ollama_url", "http://localhost:11434")
            ))
    
    async def chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> tuple[str, str]:
        """Chat with automatic fallback"""
        if not self.providers:
            raise ValueError("No AI providers configured")
        
        last_error = None
        for provider in self.providers:
            try:
                response = await provider.chat(messages, temperature, max_tokens)
                return response, provider.name
            except Exception as e:
                last_error = e
                continue
        
        raise Exception(f"All providers failed. Last error: {last_error}")
    
    async def stream_chat(self, messages: List[Dict], temperature: float = 0.7, max_tokens: int = 1024) -> AsyncGenerator[tuple[str, str], None]:
        """Stream chat with automatic fallback"""
        if not self.providers:
            raise ValueError("No AI providers configured")
        
        last_error = None
        for provider in self.providers:
            try:
                async for chunk in provider.stream_chat(messages, temperature, max_tokens):
                    yield chunk, provider.name
                return
            except Exception as e:
                last_error = e
                continue
        
        raise Exception(f"All providers failed. Last error: {last_error}")
    
    def get_available_providers(self) -> List[Dict[str, str]]:
        """Get list of available providers"""
        return [
            {"name": p.name, "model": p.model}
            for p in self.providers
        ]
