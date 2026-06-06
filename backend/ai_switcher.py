import os
import sys
import time
from dotenv import load_dotenv, set_key

from config_paths import ensure_user_env, get_dotenv_path

try:
    import requests
except ImportError:
    requests = None

current_index = 0
PROVIDERS: list = []


def _is_real_secret(value: str) -> bool:
    val = (value or "").strip()
    if not val:
        return False
    lowered = val.lower()
    placeholders = ("your_", "your-", "placeholder", "api_key_here", "key_here", "xxxx", "sk-...")
    return not any(token in lowered for token in placeholders)


def __getattr__(name: str):
    if name == "DOTENV_PATH":
        return get_dotenv_path()
    raise AttributeError(name)


def _env_file() -> str:
    ensure_user_env()
    return get_dotenv_path()


def _load_env_keys() -> dict:
    path = _env_file()
    if not os.path.exists(path):
        open(path, "a", encoding="utf-8").close()
    load_dotenv(path, override=True)
    keys = {
        "GROQ_API_KEY": os.getenv("GROQ_API_KEY", ""),
        "GROQ_MODEL": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "OPENAI_API_KEY": os.getenv("OPENAI_API_KEY", ""),
        "OPENAI_MODEL": os.getenv("OPENAI_MODEL", "gpt-4o"),
        "NVIDIA_NIM_API_KEY": os.getenv("NVIDIA_NIM_API_KEY", ""),
        "NVIDIA_MODEL": os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b"),
        "MISTRAL_API_KEY": os.getenv("MISTRAL_API_KEY", ""),
        "MISTRAL_MODEL": os.getenv("MISTRAL_MODEL", "mistral-large-latest"),
        "TOGETHER_API_KEY": os.getenv("TOGETHER_API_KEY", ""),
        "TOGETHER_MODEL": os.getenv("TOGETHER_MODEL", "meta-llama/Llama-3-70b"),
        "OLLAMA_URL": os.getenv("OLLAMA_URL", ""),
        "OLLAMA_MODEL": os.getenv("OLLAMA_MODEL", "llama3.2"),
        "FIREBASE_API_KEY": os.getenv("FIREBASE_API_KEY", ""),
    }
    try:
        from config_prefs import load_prefs

        prefs = load_prefs()
        if prefs.get("api_key_mode") == "app":
            for k, v in (prefs.get("inline_api_keys") or {}).items():
                if v and k in keys:
                    keys[k] = v
    except ImportError:
        pass
    return keys


def _ollama_enabled_flag() -> bool:
    try:
        from config_prefs import load_prefs

        return bool(load_prefs().get("ollama_enabled", True))
    except ImportError:
        return True


def _ollama_model_tags(base_url: str, fallback_model: str) -> list[str]:
    """List installed Ollama models from /api/tags; fallback to a single model name."""
    if not base_url.strip():
        return []
    if requests is None:
        return [fallback_model] if fallback_model else []
    try:
        u = base_url.rstrip("/") + "/api/tags"
        r = requests.get(u, timeout=6)
        r.raise_for_status()
        data = r.json()
        names = []
        for m in data.get("models", []):
            n = m.get("name")
            if n:
                names.append(n)
        names = sorted(set(names))
        if names:
            return names
    except Exception:
        pass
    return [fallback_model] if fallback_model else []


def _build_providers():
    settings = _load_env_keys()
    ollama_on = _ollama_enabled_flag()
    out: list[dict] = []

    base = (settings.get("OLLAMA_URL") or "").strip()
    fallback_m = (settings.get("OLLAMA_MODEL") or "llama3.2").strip()

    if base and ollama_on:
        for model in _ollama_model_tags(base, fallback_m):
            out.append(
                {
                    "name": "Ollama",
                    "model": model,
                    "api_key": None,
                    "base_url": base,
                    "enabled": True,
                }
            )

    openai_compatible = [
        ("Groq", "GROQ_API_KEY", "GROQ_MODEL", "llama-3.3-70b-versatile", "https://api.groq.com/openai/v1"),
        ("OpenAI", "OPENAI_API_KEY", "OPENAI_MODEL", "gpt-4o", "https://api.openai.com/v1"),
        ("NVIDIA", "NVIDIA_NIM_API_KEY", "NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b", "https://integrate.api.nvidia.com/v1"),
        ("Mistral", "MISTRAL_API_KEY", "MISTRAL_MODEL", "mistral-large-latest", "https://api.mistral.ai/v1"),
        ("Together", "TOGETHER_API_KEY", "TOGETHER_MODEL", "meta-llama/Llama-3-70b", "https://api.together.xyz/v1"),
    ]

    for name, key_name, model_name, default_model, base_url in openai_compatible:
        api_key = (settings.get(key_name) or "").strip()
        out.append(
            {
                "name": name,
                "model": (settings.get(model_name) or default_model).strip(),
                "api_key": api_key,
                "base_url": base_url,
                "enabled": _is_real_secret(api_key),
            }
        )

    return out


def _init_providers():
    global PROVIDERS, current_index
    PROVIDERS = _build_providers()
    current_index = 0

def refresh_providers():
    global PROVIDERS, current_index
    PROVIDERS = _build_providers()
    current_index = 0


_init_providers()


def save_provider_setting(name: str, value: str) -> None:
    path = _env_file()
    set_key(path, name, value)
    refresh_providers()


def has_provider_configured() -> bool:
    return any(provider.get("enabled") for provider in PROVIDERS)


def get_active_provider():
    """Get current working provider"""
    global current_index
    for i in range(current_index, len(PROVIDERS)):
        p = PROVIDERS[i]
        if p.get("enabled"):
            print(f"Using: {p['name']} ({p['model']})")
            current_index = i
            return p
    ollama = next(
        (
            p
            for p in PROVIDERS
            if p["name"].lower() == "ollama" and p.get("enabled")
        ),
        None,
    )
    if ollama:
        print("Falling back to first available Ollama model.")
        current_index = PROVIDERS.index(ollama)
        return ollama
    raise RuntimeError(
        "No AI providers are configured. Set GROQ_API_KEY and/or OLLAMA_URL in Settings or .env."
    )


def next_provider():
    """Switch to next provider"""
    global current_index
    if not PROVIDERS:
        raise RuntimeError("No AI providers are configured. Set GROQ_API_KEY and/or OLLAMA_URL in Settings or .env.")
    current_index = (current_index + 1) % len(PROVIDERS)
    return get_active_provider()


def get_provider_status():
    """Return configured provider status."""
    status = []
    for provider in PROVIDERS:
        enabled = bool(provider.get("enabled"))
        status.append(
            {
                "name": provider["name"],
                "model": provider["model"],
                "enabled": enabled,
                "base_url": provider["base_url"],
            }
        )
    return status


def print_provider_status():
    status = get_provider_status()
    print("Provider status:")
    for provider in status:
        print(
            f"  - {provider['name']} ({provider['model']}): "
            f"{'enabled' if provider['enabled'] else 'disabled'}"
        )


def with_fallback(func, *args, **kwargs):
    """Run function with auto provider fallback"""
    global current_index
    refresh_providers()
    current_index = 0
    for attempt in range(len(PROVIDERS)):
        try:
            provider = get_active_provider()
            return func(provider, *args, **kwargs)
        except Exception as e:
            error = str(e).lower()
            if any(
                term in error
                for term in [
                    "rate limit",
                    "quota",
                    "429",
                    "401",
                    "403",
                    "unauthorized",
                    "connection",
                    "timeout",
                    "service unavailable",
                    "could not connect",
                    "failed to establish a new connection",
                    "request cancelled",
                    "cancelled",
                    "bad request",
                    "invalid request",
                    "model not found",
                    "not found",
                    "internal server error",
                    "server error",
                    "500",
                    "502",
                    "503",
                    "504",
                    "no ai providers are configured",
                    "not installed",
                    "client not installed",
                    "package not installed",
                ]
            ):
                print(f"{provider['name']} failed ({e}). Switching...")
                next_provider()
                time.sleep(2)
                continue
            raise e
    print("All providers exhausted!")
    return None
