import os
import re
import subprocess
import sys
import threading
import time
try:
    import audioop
except ImportError:
    audioop = None
import warnings
import difflib
import json
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    requests = None

try:
    import speech_recognition as sr
except ImportError:
    sr = None

try:
    import pyttsx3
except ImportError:
    pyttsx3 = None

try:
    import pyaudio
except ImportError:
    pyaudio = None

try:
    from plyer import notification
except ImportError:
    notification = None

from dotenv import load_dotenv

BASE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))
from config_paths import ensure_user_env, get_dotenv_path

ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

from ai_switcher import with_fallback, has_provider_configured, get_provider_status
from brain.brain import (
    remember_fact,
    recall_fact,
    forget_fact,
    list_memories,
    list_profile_values,
    store_profile_value,
    recall_profile_value,
    learn_text,
    memory_context,
    profile_context,
    set_active_user,
    get_active_user,
)
from browser import search_google, open_url
from files import create_file, read_file
from git_auto import git_commit, git_status
from memory.reminders import add_reminder, list_reminders, clear_reminder, due_reminders
from assistant_persona import ASSISTANT_NAME, ASSISTANT_PERSONA
from system_prompt_config import load_system_prompt, is_system_prompt_enabled
from advanced_system import is_advanced_system_enabled, get_all_layers, get_layer_count
from autonomous_executor import get_executor, execute as autonomous_execute
from memory.adaptive_memory import get_memory, store_learning, get_memory_stats
from actions.data_agent import execute_python_code

# Smart Orchestrator V2 integration
try:
    from orchestrator_v2 import SmartOrchestrator
    _orchestrator_available = True
except ImportError:
    _orchestrator_available = False

# Trading advisor integration
try:
    from trading_advisor import get_trading_advice, StockRecommendationEngine, PortfolioAdvisor, UserTradingProfile
    _trading_available = True
except ImportError:
    _trading_available = False

# NSE/BSE trading commands
try:
    from trading_commands import (
        get_stock_price, search_stock, compare_exchanges,
        get_market_gainers, get_market_losers, get_market_summary,
        add_to_watchlist, remove_from_watchlist, view_watchlist,
        add_portfolio_holding, view_portfolio,
        get_stock_analysis, get_trading_recommendations
    )
    _trading_commands_available = True
except ImportError:
    _trading_commands_available = False

# New feature integrations
try:
    from advanced_trading import get_trading_analysis, get_portfolio_analysis
    _advanced_trading_available = True
except ImportError:
    _advanced_trading_available = False

try:
    from productivity_system import get_task_manager, get_note_manager, get_calendar_manager, get_productivity_dashboard
    _productivity_available = True
except ImportError:
    _productivity_available = False

try:
    from analytics_dashboard import get_analytics_dashboard
    _analytics_available = True
except ImportError:
    _analytics_available = False

try:
    from smart_recommendations import get_recommendations_system
    _recommendations_available = True
except ImportError:
    _recommendations_available = False

# Groq uses OpenAI-compatible API
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

try:
    from elevenlabs.client import ElevenLabs as ELClient
    from elevenlabs import play as el_play
    _el_available = True
except ImportError:
    _el_available = False

VOICE_ENGINE = None
if pyttsx3:
    try:
        VOICE_ENGINE = pyttsx3.init()
    except Exception:
        VOICE_ENGINE = None

VOICE_LANGUAGE = "en"
LANGUAGE_CODES = {
    "en": "en-US",
    "te": "te-IN",
}

SAFE_MODE = True
PENDING_CONFIRMATION = None
_REMINDER_MONITOR_THREAD = None
_REMINDER_MONITOR_LOCK = threading.Lock()

# Smart Orchestrator V2 instance
_smart_orchestrator = SmartOrchestrator(max_loops=3) if _orchestrator_available else None

SELF_IMPROVE_EXCLUDE_DIRS = {
    ".git", ".venv", "__pycache__", "build", "dist", "node_modules"
}
SELF_IMPROVE_EXTENSIONS = {".py"}
SELF_IMPROVE_ALLOWED_FILES = None  # allow all .py files
SELF_IMPROVE_AUTO_APPLY = True  # Auto-apply improvements without confirmation
SELF_IMPROVE_CREATE_NEW_FILES = True  # Allow creating new feature files
SELF_IMPROVE_FEATURE_DETECT = True  # Auto-detect feature requests


def set_user(uid: str, email: str | None = None, phone: str | None = None) -> None:
    set_active_user(uid, email=email, phone=phone)


def get_user_profile() -> dict:
    return get_active_user()


def _project_root() -> str:
    return os.path.dirname(os.path.abspath(__file__))


def _iter_code_files(root: str) -> list[str]:
    candidates = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SELF_IMPROVE_EXCLUDE_DIRS]
        for name in filenames:
            ext = os.path.splitext(name)[1].lower()
            if ext in SELF_IMPROVE_EXTENSIONS:
                full_path = os.path.join(dirpath, name)
                rel = os.path.relpath(full_path, root).replace("\\", "/")
                if SELF_IMPROVE_ALLOWED_FILES is None or rel in SELF_IMPROVE_ALLOWED_FILES:
                    candidates.append(full_path)
    return candidates


def _score_file_for_request(file_path: str, request: str) -> int:
    score = 0
    req_tokens = {t for t in re.findall(r"[a-zA-Z_]{3,}", request.lower())}
    basename = os.path.basename(file_path).lower()
    for token in req_tokens:
        if token in basename:
            score += 6
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().lower()
        for token in req_tokens:
            if token in content:
                score += 1
    except Exception:
        pass
    if basename in {"assistant_core.py", "app.py"}:
        score += 2
    return score


def _extract_code_only(ai_text: str) -> str:
    if not ai_text:
        return ""
    fenced = re.search(r"```(?:python)?\s*(.*?)```", ai_text, re.DOTALL | re.IGNORECASE)
    if fenced:
        return fenced.group(1).strip()
    return ai_text.strip()


def _build_diff_preview(old_code: str, new_code: str, file_path: str, max_lines: int = 120) -> str:
    old_lines = old_code.splitlines()
    new_lines = new_code.splitlines()
    diff = list(
        difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"{file_path} (old)",
            tofile=f"{file_path} (new)",
            lineterm="",
        )
    )
    if not diff:
        return "No code changes were proposed."
    if len(diff) > max_lines:
        diff = diff[:max_lines] + ["... diff truncated ..."]
    return "\n".join(diff)


def _should_create_new_file(user_request: str) -> bool:
    """Detect if user is asking for a new feature/module."""
    if not SELF_IMPROVE_FEATURE_DETECT:
        return False
    keywords = {
        "add", "create", "new", "module", "feature", "plugin", "command",
        "implement", "build", "make", "handler"
    }
    req_lower = user_request.lower()
    return any(kw in req_lower for kw in keywords)


def propose_self_improvement(user_request: str) -> str:
    global PENDING_CONFIRMATION
    if not has_provider_configured():
        return "No AI provider configured. Open Settings and set at least one provider key."

    root = _project_root()
    files = _iter_code_files(root)
    if not files:
        return (
            "No allowed code files found for self-improvement. "
            "Check SELF_IMPROVE_ALLOWED_FILES configuration."
        )

    scored = sorted(
        ((p, _score_file_for_request(p, user_request)) for p in files),
        key=lambda x: x[1],
        reverse=True,
    )
    target_file = scored[0][0]
    if scored[0][1] == 0:
        if SELF_IMPROVE_CREATE_NEW_FILES and _should_create_new_file(user_request):
            # Create new feature file
            target_file = os.path.join(root, "custom_feature.py")
        else:
            for fallback_name in ("assistant_core.py", "app.py"):
                fp = os.path.join(root, fallback_name)
                if os.path.exists(fp):
                    target_file = fp
                    break

    is_new_file = not os.path.exists(target_file)
    try:
        if is_new_file:
            old_code = ""
        else:
            with open(target_file, "r", encoding="utf-8") as f:
                old_code = f.read()
    except Exception as exc:
        return f"Could not read target file for improvement: {exc}"

    rel_target = os.path.relpath(target_file, root).replace("\\", "/")
    if SELF_IMPROVE_ALLOWED_FILES is not None and rel_target not in SELF_IMPROVE_ALLOWED_FILES:
        return (
            f"Blocked by safety policy. File not in whitelist: {rel_target}\n"
            "Only approved core files can be modified by self-improve."
        )

    if is_new_file:
        prompt = (
            "You are creating a new Python module for an AI assistant codebase.\n"
            "Task: Create a complete, production-ready feature based on the user's request.\n"
            "Rules:\n"
            "- Return ONLY the complete Python file content.\n"
            "- Include docstrings and type hints.\n"
            "- Make it production-ready with error handling.\n"
            "- Keep code valid Python.\n"
            "- Include all necessary imports.\n\n"
            f"User request: {user_request}\n"
            f"Target file path: {target_file}\n\n"
            "Create a complete, ready-to-use module.\n"
        )
    else:
        prompt = (
            "You are improving an existing Python assistant codebase.\n"
            "Task: Apply ONLY the minimal relevant edits requested by the user.\n"
            "Rules:\n"
            "- Return ONLY the full updated file content.\n"
            "- Keep existing behavior unless directly related to the request.\n"
            "- Do not add placeholder text.\n"
            "- Keep code valid Python.\n\n"
            f"User request: {user_request}\n"
            f"Target file path: {target_file}\n\n"
            "Current file content:\n"
            f"{old_code}"
        )
    
    generated = generate_text(prompt)
    if not generated:
        return "Could not generate an improved version right now."

    new_code = _extract_code_only(generated)
    if not new_code or len(new_code) < 20:
        return "AI returned an invalid code update. Try a more specific request."

    preview = _build_diff_preview(old_code, new_code, target_file)
    
    # Check if auto-apply is enabled for this change
    auto_apply = SELF_IMPROVE_AUTO_APPLY and not is_new_file  # Always confirm new files
    
    action = {
        "type": "self_improve",
        "file_path": target_file,
        "old_code": old_code,
        "new_code": new_code,
        "is_new_file": is_new_file,
    }
    
    if auto_apply:
        # Auto-apply improvements to existing files
        result = apply_self_improvement(action)
        return f"✓ Self-improvement applied automatically!\\n\\n{result}\\n\\nPreview:\\n{preview}"
    else:
        # Require confirmation for new files or when auto-apply is disabled
        PENDING_CONFIRMATION = action
        file_type = "NEW FILE" if is_new_file else "existing file"
        return (
            f"Proposed self-improvement for: {file_type} {target_file}\\n\\n"
            f"Preview:\\n{preview}\\n\\n"
            "Do you want to apply these changes? (yes/no)"
        )


def apply_self_improvement(action: dict) -> str:
    file_path = action.get("file_path")
    old_code = action.get("old_code", "")
    new_code = action.get("new_code", "")
    is_new_file = action.get("is_new_file", False)
    
    if not file_path or not new_code:
        return "Invalid self-improvement payload."
    
    try:
        # Create backup for existing files
        if not is_new_file and old_code:
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"{file_path}.bak.{stamp}"
            with open(backup_path, "w", encoding="utf-8") as bf:
                bf.write(old_code)
            backup_msg = f"\nBackup created: {backup_path}"
        else:
            backup_msg = ""
        
        # Ensure directory exists for new files
        dir_path = os.path.dirname(file_path)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        # Write the new/updated code
        with open(file_path, "w", encoding="utf-8") as wf:
            wf.write(new_code)
        
        file_action = "Created" if is_new_file else "Updated"
        return f"{file_action}: {file_path}{backup_msg}"
    except Exception as exc:
        return f"Failed to apply changes safely: {exc}"


def notify(message: str, title: str = ASSISTANT_NAME) -> None:
    try:
        from config_prefs import load_prefs

        if not load_prefs().get("notifications_reminders", True):
            return
    except ImportError:
        pass
    if notification is None:
        return
    try:
        notification.notify(title=title, message=message, timeout=5)
        if sys.platform == "win32":
            try:
                from config_prefs import load_prefs
                import winsound

                if load_prefs().get("notifications_sound", True):
                    winsound.MessageBeep(winsound.MB_ICONASTERISK)
            except Exception:
                pass
    except Exception as exc:
        print(f"Notification failed: {exc}")


def _find_tts_voice(language: str):
    if VOICE_ENGINE is None:
        return None
    try:
        voices = VOICE_ENGINE.getProperty("voices") or []
        lang_key = language.lower()
        for voice in voices:
            name = getattr(voice, "name", "").lower()
            voice_id = getattr(voice, "id", "").lower()
            languages = []
            if hasattr(voice, "languages"):
                languages = [l.decode("utf-8").lower() if isinstance(l, bytes) else str(l).lower() for l in voice.languages or []]
            if lang_key == "te":
                if "telugu" in name or "telugu" in voice_id or any("te" in lang for lang in languages):
                    return voice
            elif lang_key == "en":
                if "english" in name or "en" in voice_id or any("en" in lang for lang in languages):
                    return voice
        return None
    except Exception:
        return None


def _get_voice_priority_order() -> list[str]:
    default_order = ["fish", "eleven", "self"]
    try:
        from config_prefs import load_prefs

        raw = str(load_prefs().get("voice_priority", "fish,eleven,self") or "")
    except Exception:
        raw = "fish,eleven,self"
    parts = [p.strip().lower() for p in raw.split(",") if p.strip()]
    allowed = {"fish", "eleven", "self"}
    ordered = []
    for p in parts:
        if p in allowed and p not in ordered:
            ordered.append(p)
    for p in default_order:
        if p not in ordered:
            ordered.append(p)
    return ordered


def _speak_fish(message: str) -> bool:
    fish_key = os.getenv("FISH_AUDIO_API_KEY", "").strip()
    fish_ref = (
        os.getenv("FISH_AUDIO_REFERENCE_ID", "")
        or os.getenv("FISH_AUDIO_VOICE_ID", "")
        or ""
    ).strip()
    fish_model = (os.getenv("FISH_AUDIO_MODEL") or "s2-pro").strip()
    if not (fish_key and fish_ref and requests):
        return False
    try:
        from fish_audio import play_fish_tts

        play_fish_tts(message, fish_key, fish_ref, model=fish_model)
        return True
    except Exception as exc:
        print(f"Fish Audio voice failed, falling back: {exc}")
        return False


def _speak_eleven(message: str) -> bool:
    el_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    el_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "").strip()
    if not (_el_available and el_key and el_voice_id):
        return False
    try:
        _el_client = ELClient(api_key=el_key)
        audio = _el_client.text_to_speech.convert(
            voice_id=el_voice_id,
            text=message,
            model_id="eleven_multilingual_v2",
        )
        el_play(audio)
        return True
    except Exception as exc:
        print(f"ElevenLabs voice failed, falling back: {exc}")
        return False


def _speak_local(message: str) -> bool:
    # gTTS first for Telugu online quality, then pyttsx3 local engine.
    if VOICE_LANGUAGE == "te":
        try:
            from gtts import gTTS
            import tempfile
            from playsound import playsound

            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as fp:
                tts = gTTS(text=message, lang="te")
                tts.save(fp.name)
                playsound(fp.name)
                return True
        except Exception as e:
            print(f"gTTS failed: {e}")

    if VOICE_ENGINE is None:
        return False
    try:
        if VOICE_LANGUAGE == "te":
            telugu_voice = _find_tts_voice("te")
            if telugu_voice is not None:
                VOICE_ENGINE.setProperty("voice", telugu_voice.id)
        else:
            english_voice = _find_tts_voice("en")
            if english_voice is not None:
                VOICE_ENGINE.setProperty("voice", english_voice.id)
        VOICE_ENGINE.say(message)
        VOICE_ENGINE.runAndWait()
        return True
    except Exception as exc:
        try:
            print(f"Voice failed: {exc}")
        except UnicodeEncodeError:
            print("Voice failed.")
        return False


def speak(message: str) -> None:
    try:
        print(f"🤖 Assistant: {message}")
    except UnicodeEncodeError:
        print(f"Assistant: {message}")

    engines = {
        "fish": _speak_fish,
        "eleven": _speak_eleven,
        "self": _speak_local,
    }
    for engine in _get_voice_priority_order():
        fn = engines.get(engine)
        if fn and fn(message):
            return


def generate_text(prompt: str) -> str | None:
    def call_api(provider, msg):
        provider_name = provider.get("name", "groq").lower()
        api_key = provider.get("api_key")
        base_url = provider.get("base_url")
        model = provider.get("model")

        if provider_name == "ollama":
            if requests is None:
                raise RuntimeError("Requests is not installed")
            payload = {
                "model": model,
                "messages": [{"role": "user", "content": msg}]
            }
            url = base_url.rstrip("/") + "/v1/chat/completions"
            response = requests.post(url, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            if "choices" in data and data["choices"]:
                return data["choices"][0].get("message", {}).get("content", "")
            return data.get("output", "")

        client = OpenAI(api_key=api_key, base_url=base_url)
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": msg}]
        )
        return response.choices[0].message.content

    if not has_provider_configured():
        return None
    try:
        return with_fallback(call_api, prompt)
    except Exception as exc:
        print(f"generate_text failed: {exc}")
        return None

def extract_facts_bg(user_msg: str, assistant_reply: str) -> None:
    def _run():
        prompt = (
            "Analyze the following conversation snippet. If the user explicitly stated "
            "a fact about themselves, their preferences, or requested you to remember something, "
            "output a JSON array of objects with 'key' and 'value'. DO NOT include markdown blocks. "
            "Just valid JSON like: [{\"key\": \"favorite_color\", \"value\": \"red\"}]. "
            "If nothing new is learned about the user, output [].\n\n"
            f"User: {user_msg}\nAssistant: {assistant_reply}"
        )
        result = generate_text(prompt)
        if result:
            try:
                import json
                cleaned = result.strip()
                if cleaned.startswith('```json'): cleaned = cleaned[7:]
                elif cleaned.startswith('```'): cleaned = cleaned[3:]
                if cleaned.endswith('```'): cleaned = cleaned[:-3]
                facts = json.loads(cleaned.strip())
                for f in facts:
                    k, v = f.get('key'), f.get('value')
                    if k and v:
                        remember_fact(k, v)
            except Exception as e:
                print(f"Auto-learning error: {e}")
    threading.Thread(target=_run, daemon=True).start()

def _vision_chat(user_message: str) -> str:
    """Handles vision requests via Groq vision model (OpenAI-compatible)."""
    try:
        from actions.vision_agent import build_vision_payload

        payload = build_vision_payload(user_message)
        b64 = payload["image_data"]
        groq_key = os.getenv("GROQ_API_KEY", "").strip()
        vision_model = os.getenv(
            "GROQ_VISION_MODEL", "llama-3.2-90b-vision-preview"
        ).strip()
        if groq_key:
            try:
                client = OpenAI(
                    api_key=groq_key,
                    base_url="https://api.groq.com/openai/v1",
                )
                resp = client.chat.completions.create(
                    model=vision_model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": user_message},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{b64}",
                                    },
                                },
                            ],
                        }
                    ],
                    timeout=60,
                )
                text = resp.choices[0].message.content
                if text:
                    return text
            except Exception as e:
                print(f"Groq vision failed: {e}")

        return chat(
            f"[User shared a screenshot] {user_message} "
            "(Vision unavailable — answer from description only.)"
        )
    except Exception as exc:
        return f"Vision analysis failed to initialize: {exc}"


def chat(message: str) -> str:
    """Send message to AI with auto fallback and memory extraction"""
    context = memory_context()
    profile = get_active_user()
    profile_section = ""
    if profile:
        profile_lines = []
        if profile.get("email"):
            profile_lines.append(f"Email: {profile['email']}")
        if profile.get("phone"):
            profile_lines.append(f"Phone: {profile['phone']}")
        if profile_lines:
            profile_section = "User profile:\n" + "\n".join(profile_lines) + "\n\n"

    profile_memory = profile_context()
    profile_memory_section = ""
    if profile_memory:
        profile_memory_section = f"Profile memory:\n{profile_memory}\n\n"

    # Build prompt with master system prompt if enabled
    system_prompt_prefix = ""
    if is_system_prompt_enabled():
        system_prompt_prefix = load_system_prompt() + "\n\n"

    prompt = (
        f"{system_prompt_prefix}"
        f"{ASSISTANT_PERSONA}\n"
        f"Current Date and Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        "You should aim to continuously learn about the user to provide better answers.\n"
        "You can understand both English and Telugu. Reply in the same language the user used "
        "(or mix if the user mixed), and keep responses natural.\n\n"
        f"{profile_section}{profile_memory_section}"
    )
    if context:
        prompt += f"Memory context:\n{context}\n\n"
    prompt += f"User: {message}"

    if not has_provider_configured():
        fallback = search_google(message)
        result = (
            "I don't have an AI provider configured yet, so I opened a browser search instead.\n"
            f"{fallback}"
        )
        speak(result)
        return result

    result = generate_text(prompt)

    if result is None:
        fallback = search_google(message)
        result = (
            "I couldn't complete that request with the AI provider. "
            f"I opened a browser search instead.\n{fallback}"
        )
    else:
        extract_facts_bg(message, result)

        python_match = re.search(r"\[EXECUTE_PYTHON\](.*?)\[/EXECUTE_PYTHON\]", result, re.DOTALL)
        if python_match:
            script_code = python_match.group(1).strip()
            
            if SAFE_MODE:
                global PENDING_CONFIRMATION
                PENDING_CONFIRMATION = {"type": "python_agent", "value": script_code}
                result = "I have written an agent script to perform this data operation. Safe mode is enabled. Say 'yes' to execute it or 'no' to cancel."
                speak(result)
                return result
            else:
                execution_output = execute_python_code(script_code)
                clean_result = re.sub(r"\[EXECUTE_PYTHON\].*?\[/EXECUTE_PYTHON\]", "", result, flags=re.DOTALL).strip()
                if not clean_result:
                    clean_result = "I have executed the requested data operations."
                
                if "Error" in execution_output or "Exception" in execution_output:
                    clean_result += f"\nWarning, execution issue: {execution_output}"
                else:
                    clean_result += "\nTask completed successfully."
                result = clean_result

    speak(result)
    return result


def parse_reminder_command(command: str) -> tuple[str, str]:
    normalized = command.lower().strip()
    if normalized.startswith("remind me to "):
        content = command[12:].strip()
    elif normalized.startswith("remind me "):
        content = command[10:].strip()
    elif normalized.startswith("set reminder to "):
        content = command[16:].strip()
    elif normalized.startswith("set reminder "):
        content = command[13:].strip()
    else:
        content = command.strip()

    when_text = "today"
    if " at " in content:
        content, when_text = content.rsplit(" at ", 1)
    elif " tomorrow" in content.lower():
        content = re.sub(r"\s+tomorrow", "", content, flags=re.IGNORECASE)
        when_text = "tomorrow"
    elif " today" in content.lower():
        content = re.sub(r"\s+today", "", content, flags=re.IGNORECASE)
        when_text = "today"

    return content.strip(), when_text.strip()


def daily_briefing(user_id: str | None = None) -> str:
    reminders = list_reminders(user_id=user_id)
    if not reminders:
        return "You have no reminders yet. Say 'set reminder' or 'remind me' to create one."
    lines = []
    for reminder in reminders:
        text = reminder.get("text", "")
        when = reminder.get("when", "soon")
        lines.append(f"{text} at {when}")
    return "Here is your briefing:\n" + "\n".join(lines)


def start_reminder_monitor(user_id: str | None = None, interval_seconds: int = 60) -> None:
    global _REMINDER_MONITOR_THREAD

    def monitor():
        seen = set()
        while True:
            profile = get_user_profile()
            current_user_id = profile.get("uid")
            if not current_user_id:
                time.sleep(interval_seconds)
                continue
            due = due_reminders(user_id=current_user_id, within_minutes=1)
            for reminder in due:
                key = f"{reminder.get('created')}|{reminder.get('text')}"
                if key not in seen:
                    message = f"Reminder: {reminder.get('text')} is due {reminder.get('when')} now."
                    speak(message)
                    notify(message)
                    seen.add(key)
            time.sleep(interval_seconds)

    with _REMINDER_MONITOR_LOCK:
        if _REMINDER_MONITOR_THREAD is not None and _REMINDER_MONITOR_THREAD.is_alive():
            return
        thread = threading.Thread(target=monitor, daemon=True)
        thread.start()
        _REMINDER_MONITOR_THREAD = thread


def get_reminder_count(user_id: str | None = None) -> int:
    return len(
        [r for r in list_reminders(user_id=user_id) if not r.get("completed")]
    )


def trading_assistant(query: str, region: str = "global") -> str:
    """Trading-focused analysis assistant with risk-aware structure."""
    if not query:
        return "Tell me what market or symbol you want analyzed."
    region_context = ""
    if region == "india":
        region_context = (
            "Focus on Indian markets (NSE/BSE/MCX) and Indian trading context. "
            "Consider NIFTY, BANKNIFTY, SENSEX, major sector indices, INR impact, "
            "and India session timing."
        )
    prompt = (
        "You are an expert trading research assistant. Provide structured market analysis with:\n"
        "1) Market context and trend direction\n"
        "2) Key levels (support/resistance)\n"
        "3) Bias (bullish/bearish/neutral) with confidence level\n"
        "4) Example setup ideas with entry, stop, and target ranges\n"
        "5) Risk management (position sizing and max risk)\n"
        "6) Alternative invalidation scenario\n"
        "Keep it practical, concise, and educational. Do not claim guaranteed profit.\n\n"
        f"Regional context: {region_context or 'Global market context'}\n"
        f"User request: {query}"
    )
    response = chat(prompt)
    disclaimer = (
        "\n\nNote: This is educational analysis, not financial advice. "
        "Always verify with live charts/news before placing trades."
    )
    return response + disclaimer


def indian_options_assistant(query: str) -> str:
    if not query:
        return "Tell me the index/stock and view, for example: NIFTY weekly bullish."
    prompt = (
        "You are an expert Indian options trading assistant. "
        "Focus on NSE derivatives (NIFTY, BANKNIFTY, FINNIFTY, major stocks options).\n"
        "Provide:\n"
        "1) Market view and volatility context (including IV idea)\n"
        "2) Suitable strategy choices (buy CE/PE, debit spread, credit spread, iron condor, straddle/strangle)\n"
        "3) Strike selection logic and expiry preference (weekly/monthly)\n"
        "4) Example trade structures with entry zone, SL logic, adjustment points, and target zones\n"
        "5) Risk rules for Indian options (max loss, lot sizing, and capital allocation)\n"
        "6) What invalidates the setup\n"
        "Keep response practical, concise, and educational with no guaranteed return claims.\n\n"
        f"User request: {query}"
    )
    response = chat(prompt)
    disclaimer = (
        "\n\nNote: Options are high risk. This is educational analysis, not financial advice. "
        "Verify live premium, IV, OI, spread, and liquidity before trading."
    )
    return response + disclaimer


def run_command(cmd: str) -> str:
    """Run Windows PowerShell command"""
    try:
        result = subprocess.run(
            ["powershell", "-Command", cmd],
            capture_output=True, text=True
        )
        if result.stdout:
            print(f"✅ Output:\n{result.stdout}")
        if result.stderr:
            print(f"❌ Error:\n{result.stderr}")
        return result.stdout or result.stderr
    except Exception as e:
        error_message = f"Command failed: {e}"
        print(f"❌ {error_message}")
        return error_message


def open_target(target: str) -> str:
    """Open an app, file, or folder on Windows."""
    target = target.strip()
    if not target:
        return "No target provided."

    if os.path.exists(target):
        try:
            os.startfile(target)
            return f"Opened {target}."
        except Exception as exc:
            return f"Could not open {target}: {exc}"

    normalized = target.lower()
    if normalized in {"chrome", "google chrome"}:
        return run_command("Start-Process chrome")
    if normalized in {"vs code", "vscode", "code"}:
        return run_command("Start-Process code")
    if normalized in {"file explorer", "explorer"}:
        return run_command("Start-Process explorer")

    return run_command(f"Start-Process '{target}'")


def listen_voice_once():
    if sr is None:
        speak("Speech recognition is not installed.")
        return None

    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            print("Listening...")
            # Detect language code
            lang_code = LANGUAGE_CODES.get(VOICE_LANGUAGE, "en-US")
            audio = recognizer.listen(source, timeout=10, phrase_time_limit=15)
            text = recognizer.recognize_google(audio, language=lang_code)
            print(f"You searching: {text}")
            return text
    except Exception:
        return None


def clone_voice(name: str, files: list) -> str:
    """Clone voice: Fish Audio if FISH_AUDIO_API_KEY is set, else ElevenLabs."""
    from dotenv import set_key

    from config_paths import get_dotenv_path

    path = files[0] if files else None
    if not path or not os.path.isfile(path):
        return "No audio file selected."

    fish_key = os.getenv("FISH_AUDIO_API_KEY", "").strip()
    if fish_key and requests:
        try:
            from fish_audio import fish_create_voice_model

            mid = fish_create_voice_model(fish_key, name, path)
            env_path = get_dotenv_path()
            set_key(env_path, "FISH_AUDIO_REFERENCE_ID", mid)
            os.environ["FISH_AUDIO_REFERENCE_ID"] = mid
            return f"Fish Audio model ready. reference_id={mid} (saved for TTS)."
        except Exception as e:
            return f"Fish Audio cloning failed: {e}"

    el_key = os.getenv('ELEVENLABS_API_KEY', '').strip()
    if not _el_available or not el_key:
        return (
            "Configure Fish Audio (FISH_AUDIO_API_KEY + reference id from "
            "https://fish.audio/app/) or ElevenLabs in Settings."
        )

    try:
        from elevenlabs.client import ElevenLabs

        client = ElevenLabs(api_key=el_key)
        voice = client.voices.add(
            name=name,
            description=f"Cloned for {name}",
            files=files,
        )
        env_path = get_dotenv_path()
        set_key(env_path, "ELEVENLABS_VOICE_ID", voice.voice_id)
        os.environ["ELEVENLABS_VOICE_ID"] = voice.voice_id
        return voice.voice_id
    except Exception as e:
        return f"Cloning failed: {e}"


def detect_double_clap(max_wait_seconds: float = 5.0) -> bool:
    """Detect two clap-like peaks from microphone input."""
    if pyaudio is None:
        return False
    audio = None
    stream = None
    try:
        audio = pyaudio.PyAudio()
        stream = audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=1024,
        )
        threshold = 3500
        claps = 0
        first_clap_time = 0.0
        last_peak_time = 0.0
        start = time.time()
        while time.time() - start < max_wait_seconds:
            data = stream.read(1024, exception_on_overflow=False)
            rms = audioop.rms(data, 2) if audioop else 0
            now = time.time()
            if rms > threshold and now - last_peak_time > 0.2:
                claps += 1
                last_peak_time = now
                if claps == 1:
                    first_clap_time = now
                elif claps == 2 and (now - first_clap_time) <= 1.3:
                    return True
            if claps >= 1 and (now - first_clap_time) > 1.6:
                claps = 0
        return False
    except Exception:
        return False
    finally:
        try:
            if stream:
                stream.stop_stream()
                stream.close()
            if audio:
                audio.terminate()
        except Exception:
            pass


def voice_loop():
    """Enhanced voice loop with Airis Mode integration."""
    if sr is None or pyaudio is None:
        return
    
    # Import AirisMode
    try:
        from airis_mode import get_airis_mode
        airis = get_airis_mode()
        airis_mode_available = True
    except ImportError:
        airis_mode_available = False
    
    while True:
        activated = detect_double_clap()
        if not activated:
            time.sleep(0.3)
            continue
        
        speak("Wake phrase?")
        wake_text = listen_voice_once()
        if not wake_text:
            time.sleep(0.3)
            continue
        
        wake_normalized = wake_text.lower().strip()
        if "hey ai" not in wake_normalized and "assistant" not in wake_normalized and "hey 23" not in wake_normalized:
            continue
        
        # Check for conversation mode trigger
        if "conversation" in wake_normalized or "continuous" in wake_normalized:
            if airis_mode_available:
                speak("Starting conversation mode. Say exit to stop.")
                airis.start_conversation()
            else:
                speak("Conversation mode not available.")
        else:
            # Single command mode
            speak("Listening for command.")
            command = listen_voice_once()
            if command:
                handle_command(command)
        time.sleep(1)


def handle_command(command: str) -> str:
    global SAFE_MODE, PENDING_CONFIRMATION, VOICE_LANGUAGE
    normalized = command.strip().lower()
    if not normalized:
        response = "No command provided."
        speak(response)
        return response

    if PENDING_CONFIRMATION is not None:
        if normalized in {"yes", "confirm", "ok", "do it", "proceed"}:
            action = PENDING_CONFIRMATION
            PENDING_CONFIRMATION = None
            if action["type"] == "run":
                response = run_command(action["value"])
            elif action["type"] == "python_agent":
                exe_out = execute_python_code(action["value"])
                if "Error" in exe_out:
                    response = f"Execution failed: {exe_out}"
                else:
                    response = "Code executed successfully."
            elif action["type"] == "shutdown":
                run_command("Stop-Computer -Force")
                response = "Shutting down your PC now."
            elif action["type"] == "restart":
                run_command("Restart-Computer -Force")
                response = "Restarting your PC now."
            elif action["type"] == "self_improve":
                response = apply_self_improvement(action)
                extract_facts_bg(command, response)  # Learn from the improvement
            else:
                response = "Unknown pending action."
            speak(response)
            return response
        if normalized in {"no", "cancel", "stop", "don't", "dont"}:
            PENDING_CONFIRMATION = None
            response = "Cancelled."
            speak(response)
            return response
        response = "Please say yes to confirm or no to cancel."
        speak(response)
        return response

    if normalized in {"who are you", "what is your name", "your name", "tell me about yourself"}:
        response = (
            f"My name is {ASSISTANT_NAME}. "
            "I'm your personal AI assistant, ready to help with voice commands, chat, searches, "
            "file actions, and smart tasks."
        )
    elif normalized == "help":
        response = (
            "I can open apps and folders, search the web, create or read files, run PowerShell commands, "
            "set reminders, give you a daily briefing, shut down your PC, chat with you, and remember facts. "
            "Safe mode is on by default."
        )
    elif normalized in {"safe mode on", "enable safe mode"}:
        SAFE_MODE = True
        response = "Safe mode enabled. I will ask confirmation for risky commands."
    elif normalized in {"safe mode off", "disable safe mode"}:
        SAFE_MODE = False
        response = "Safe mode disabled."
    elif normalized in {"safe mode", "safe mode status"}:
        response = f"Safe mode is {'on' if SAFE_MODE else 'off'}."
    elif normalized in {"ai status", "provider status", "ai provider status"}:
        try:
            status = get_provider_status()
            lines = [
                f"{p['name']} ({p['model']}): {'enabled' if p['enabled'] else 'disabled'}"
                for p in status
            ]
            response = "AI provider status:\n" + "\n".join(lines)
        except Exception as exc:
            response = f"Could not read provider status: {exc}"
    elif normalized in {"improve yourself", "fix bugs in your system", "auto-improve", "self-improve", "optimize yourself"}:
        response = propose_self_improvement("Analyze the codebase and suggest improvements for performance, reliability, and features")
    elif normalized.startswith("add ") or normalized.startswith("create ") or normalized.startswith("implement "):
        response = propose_self_improvement(command)
    elif normalized.startswith("improve "):
        response = propose_self_improvement(command)
    elif normalized.startswith("feature: "):
        response = propose_self_improvement(command[9:].strip())
    elif normalized.startswith("bug: ") or normalized.startswith("fix: "):
        response = propose_self_improvement(command)
    elif normalized.startswith("stock recommendation") or normalized in {"recommend stocks", "give stock picks", "what stocks should i buy"}:
        if _trading_available:
            try:
                advice = get_trading_advice()
                stocks = [s["symbol"] for s in advice["watchlist"]["stocks"][:5]]
                response = f"📈 Top Stock Recommendations: {', '.join(stocks)}\n\nAnalyzing news and market trends...\n" + \
                          f"Market Outlook: {advice['market_summary']}\n\n" + \
                          f"Suggestions:\n{json.dumps(advice['suggestions']['suggested_trades'][:3], indent=2, default=str)}"
            except Exception as e:
                response = f"Trading analysis error: {e}"
        else:
            response = "Trading module not available. Install trading_advisor."
    elif normalized.startswith("analyze stock ") or normalized.startswith("check stock "):
        if _trading_available:
            try:
                symbol = command.split("stock ")[-1].upper().strip()
                engine = StockRecommendationEngine(UserTradingProfile(
                    risk_tolerance="medium",
                    investment_amount=10000,
                    preferred_sectors=["TECH"],
                    exclude_sectors=[],
                    trading_style="swing_trading",
                    experience_level="intermediate",
                    stop_loss_percentage=5,
                    take_profit_percentage=15,
                    max_positions=5
                ))
                analysis = engine.analyze_stock(symbol)
                response = f"📊 {symbol} Analysis:\n" + \
                          f"Price: ${analysis.current_price:.2f}\n" + \
                          f"P/E Ratio: {analysis.pe_ratio:.2f}\n" + \
                          f"Recommendation: {analysis.recommendation}\n" + \
                          f"Entry: ${analysis.entry_price:.2f}\n" + \
                          f"Target: ${analysis.target_price:.2f}\n" + \
                          f"Stop Loss: ${analysis.stop_loss_price:.2f}\n" + \
                          f"Overall Score: {analysis.overall_score:.0f}/100"
            except Exception as e:
                response = f"Stock analysis error: {e}"
        else:
            response = "Trading module not available."
    elif normalized in {"market news", "financial news", "latest news", "what's happening in market"}:
        if _trading_available:
            try:
                from trading_advisor import NewsMonitor
                monitor = NewsMonitor()
                news = monitor.get_latest_news(5)
                news_text = "📰 Latest Financial News:\n\n"
                for item in news:
                    sentiment = item.get("sentiment", "neutral").replace("_", " ").title()
                    news_text += f"• {item['title']}\n  Source: {item['source']} | Sentiment: {sentiment}\n\n"
                response = news_text
            except Exception as e:
                response = f"News fetch error: {e}"
        else:
            response = search_google("latest financial news")
    elif normalized in {"portfolio advice", "analyze my portfolio", "what should i invest in"}:
        if _trading_available:
            try:
                advice = get_trading_advice()
                portfolio = advice["suggestions"]
                response = f"💼 Portfolio Analysis & Advice:\n\n" + \
                          f"Investment Amount: ${advice['profile']['investment_amount']:,.0f}\n" + \
                          f"Risk Tolerance: {advice['profile']['risk_tolerance'].title()}\n" + \
                          f"Max Positions: {advice['profile']['max_positions']}\n\n" + \
                          f"Suggested Trades:\n{json.dumps(portfolio['suggested_trades'][:5], indent=2, default=str)}"
            except Exception as e:
                response = f"Portfolio analysis error: {e}"
        else:
            response = "Trading module not available."
    elif normalized.startswith("trading tips") or normalized in {"best trader", "perfect trader", "trading strategy"}:
        response = """📈 Perfect Trader Tips:
        
1. **Fundamental Analysis**: Analyze P/E ratio, profit margins, debt levels
2. **Technical Analysis**: Watch RSI, MACD, Bollinger Bands
3. **Sentiment Analysis**: Monitor news and market sentiment
4. **Risk Management**: Always use stop-loss, never risk more than 2% per trade
5. **Portfolio Diversity**: Spread investments across sectors
6. **News Monitoring**: Stay updated on company & industry news
7. **Entry/Exit Rules**: Follow predetermined entry/exit levels
8. **Position Sizing**: Adjust position size based on risk tolerance
9. **Trend Following**: Trade with the trend, not against it
10. **Emotional Control**: Stick to your strategy, avoid FOMO/panic

I can analyze stocks, monitor news, and suggest trades based on your profile!"""
    elif normalized.startswith("trading strategy ") or normalized.startswith("should i buy"):
        if _trading_available:
            try:
                symbol = command.split()[-1].upper()
                engine = StockRecommendationEngine(UserTradingProfile(
                    risk_tolerance="medium",
                    investment_amount=10000,
                    preferred_sectors=["TECH"],
                    exclude_sectors=[],
                    trading_style="swing_trading",
                    experience_level="intermediate",
                    stop_loss_percentage=5,
                    take_profit_percentage=15,
                    max_positions=5
                ))
                signal = engine.generate_trading_signal(symbol)
                response = f"📊 Trading Signal for {symbol}:\n" + \
                          f"Signal: {signal.signal}\n" + \
                          f"Confidence: {signal.confidence:.0f}%\n" + \
                          f"Entry: ${signal.entry_price:.2f}\n" + \
                          f"Target: ${signal.target_price:.2f}\n" + \
                          f"Stop Loss: ${signal.stop_loss:.2f}\n" + \
                          f"Timeframe: {signal.timeframe}\n" + \
                          f"Reason: {signal.reason}"
            except Exception as e:
                response = f"Trading strategy error: {e}"
        else:
            response = "Trading module not available."
    elif normalized in {"telugu mode", "speak telugu", "talk in telugu", "use telugu"}:
        VOICE_LANGUAGE = "te"
        response = "తెలుగు భాషలో ఇప్పుడు నేను మాట్లాడతాను. మీరు తెలుగు లో మాట్లాడవచ్చు."
    elif normalized in {"english mode", "speak english", "talk in english", "use english"}:
        VOICE_LANGUAGE = "en"
        response = "English mode enabled. I am ready to speak in English."
    elif normalized in {"what language", "current language", "language mode"}:
        response = "I am currently using తెలుగు." if VOICE_LANGUAGE == "te" else "I am currently using English."
    elif normalized.startswith("remember "):
        memory_text = command[9:].strip()
        if " is " in memory_text:
            key, value = memory_text.split(" is ", 1)
            response = remember_fact(key.strip(), value.strip())
        else:
            response = learn_text(memory_text)
    elif normalized.startswith("learn "):
        response = learn_text(command[6:].strip())
    elif normalized.startswith("recall "):
        response = recall_fact(command[7:].strip())
    elif normalized.startswith("forget "):
        response = forget_fact(command[7:].strip())
    elif normalized in {"what do you remember", "what do you know", "list memories", "show memory", "show memories"}:
        response = list_memories()
    elif normalized in {"reminders", "show reminders", "list reminders"}:
        reminders = list_reminders(user_id=get_user_profile().get("uid"))
        if not reminders:
            response = "You have no reminders yet."
        else:
            lines = [f"{idx+1}. {item.get('text')} at {item.get('when')}" for idx, item in enumerate(reminders)]
            response = "Your reminders:\n" + "\n".join(lines)
    elif normalized in {"daily briefing", "what is my daily briefing", "what is my day", "what should i do today", "brief me"}:
        response = daily_briefing(user_id=get_user_profile().get("uid"))
    elif normalized.startswith("clear reminder ") or normalized.startswith("delete reminder "):
        user_id = get_user_profile().get("uid")
        if not user_id:
            response = "Login or continue as guest to clear reminders."
        else:
            reminder_key = command.split(" ", 2)[2].strip()
            response = clear_reminder(reminder_key, user_id=user_id)
    elif normalized.startswith("remind me") or normalized.startswith("set reminder"):
        user_id = get_user_profile().get("uid")
        if not user_id:
            response = "Login or continue as guest to set reminders."
        else:
            reminder_text, when_text = parse_reminder_command(command)
            added = add_reminder(reminder_text, when_text, user_id=user_id)
            response = f"Reminder set: {added['text']} at {added['when']}"
    elif normalized in {"show profile", "profile", "my profile", "what do you know about me"}:
        profile = get_user_profile()
        profile_lines = []
        if profile.get("email"):
            profile_lines.append(f"Email: {profile['email']}")
        if profile.get("phone"):
            profile_lines.append(f"Phone: {profile['phone']}")
        profile_values = list_profile_values()
        if profile_values:
            profile_lines.append("Profile settings:")
            profile_lines.append(profile_values)
        if profile_lines:
            response = "\n".join(profile_lines)
        else:
            response = "I don't have any profile information yet."
    elif normalized.startswith("set my ") and " to " in normalized:
        attr = normalized[7:].split(" to ", 1)[0].strip()
        value = command.split(" to ", 1)[1].strip()
        response = store_profile_value(attr, value)
    elif normalized.startswith("my ") and " is " in normalized:
        attr = normalized[3:].split(" is ", 1)[0].strip()
        value = command.split(" is ", 1)[1].strip()
        response = store_profile_value(attr, value)
    elif normalized.startswith("call me "):
        response = store_profile_value("name", command[8:].strip())
    elif normalized in {"what is my name", "what am i called", "my name"}:
        response = recall_profile_value("name")
    elif normalized.startswith("what is my ") or normalized.startswith("what's my "):
        attr = normalized.split(" ", 3)[-1].strip()
        response = recall_profile_value(attr)
    elif normalized.startswith("open url "):
        response = open_url(command[9:].strip())
    elif normalized.startswith("open http") or normalized.startswith("open https"):
        response = open_url(command[5:].strip())
    elif normalized.startswith("open "):
        response = open_target(command[5:])
    elif normalized.startswith("launch "):
        response = open_target(command[7:])
    elif normalized.startswith("run "):
        dangerous_cmd = command[4:].strip()
        if SAFE_MODE:
            PENDING_CONFIRMATION = {"type": "run", "value": dangerous_cmd}
            response = f"Safe mode: confirm run command: {dangerous_cmd}. Say yes or no."
        else:
            response = run_command(dangerous_cmd)
    elif normalized.startswith("google "):
        query = command.split(" ", 1)[1] if " " in command else ""
        response = search_google(query)
    elif normalized.startswith("ask google "):
        query = command.removeprefix("ask google ").strip()
        response = search_google(query)
    elif normalized.startswith("search ") or normalized.startswith("browse "):
        query = command.split(" ", 1)[1]
        response = search_google(query)
    elif normalized.startswith("trading help india "):
        response = trading_assistant(command[19:].strip(), region="india")
    elif normalized in {"indian trading", "india trading", "trading india"}:
        response = (
            "Indian trading mode ready. Say commands like: "
            "'trading help india NIFTY 50 intraday', "
            "'trade analysis RELIANCE', or 'open nse'."
        )
    elif normalized.startswith("trading help "):
        response = trading_assistant(command[13:].strip())
    elif normalized.startswith("trade analysis "):
        response = trading_assistant(command[15:].strip())
    elif normalized.startswith("trade analysis india "):
        response = trading_assistant(command[20:].strip(), region="india")
    elif normalized.startswith("analyze market "):
        response = trading_assistant(command[15:].strip())
    elif normalized.startswith("analyze india market "):
        response = trading_assistant(command[21:].strip(), region="india")
    elif normalized.startswith("trading research "):
        response = trading_assistant(command[17:].strip())
    elif normalized.startswith("india trading research "):
        response = trading_assistant(command[22:].strip(), region="india")
    elif normalized.startswith("trade plan "):
        response = trading_assistant(
            f"Create a detailed trade plan for: {command[11:].strip()}"
        )
    elif normalized.startswith("india trade plan "):
        response = trading_assistant(
            f"Create a detailed Indian-market trade plan for: {command[17:].strip()}",
            region="india",
        )
    elif normalized.startswith("indian options strategy "):
        response = indian_options_assistant(command[24:].strip())
    elif normalized.startswith("options strategy india "):
        response = indian_options_assistant(command[23:].strip())
    elif normalized.startswith("nifty options strategy "):
        response = indian_options_assistant(
            f"NIFTY options strategy: {command[23:].strip()}"
        )
    elif normalized.startswith("banknifty options strategy "):
        response = indian_options_assistant(
            f"BANKNIFTY options strategy: {command[27:].strip()}"
        )
    elif normalized in {"open tradingview", "open chart"}:
        response = open_url("https://www.tradingview.com/chart/")
    elif normalized in {"open nse", "open nse india"}:
        response = open_url("https://www.nseindia.com/")
    elif normalized in {"open bse", "open bse india"}:
        response = open_url("https://www.bseindia.com/")
    elif normalized in {"open moneycontrol", "open india market news"}:
        response = open_url("https://www.moneycontrol.com/")
    elif normalized in {"open forex factory", "open economic calendar"}:
        response = open_url("https://www.forexfactory.com/calendar")
    elif normalized.startswith("execute trade") or normalized.startswith("place order"):
        response = (
            "I can help you analyze and prepare a trade plan, but I cannot place live trades directly "
            "without a dedicated broker API integration and explicit safeguards."
        )
    # NEW NSE/BSE TRADING COMMANDS (Real-time data)
    elif normalized.startswith("stock price ") or normalized.startswith("get price "):
        symbol = command.split()[-1] if len(command.split()) > 0 else ""
        if _trading_commands_available and symbol:
            response = get_stock_price(symbol)
        else:
            response = "Please provide a stock symbol. Usage: 'stock price RELIANCE'"
    elif normalized.startswith("search stock ") or normalized.startswith("find stock "):
        query = command.split(" ", 2)[2] if len(command.split()) > 2 else ""
        if _trading_commands_available and query:
            response = search_stock(query)
        else:
            response = "Please provide a search term. Usage: 'search stock reliance'"
    elif normalized.startswith("compare ") and "exchange" in normalized:
        symbol = command.split()[-1] if len(command.split()) > 0 else ""
        if _trading_commands_available and symbol:
            response = compare_exchanges(symbol)
        else:
            response = "Please provide a stock symbol. Usage: 'compare RELIANCE exchange'"
    elif "market gainers" in normalized or "top gainers" in normalized:
        if _trading_commands_available:
            response = get_market_gainers()
        else:
            response = "Trading module not available"
    elif "market losers" in normalized or "top losers" in normalized:
        if _trading_commands_available:
            response = get_market_losers()
        else:
            response = "Trading module not available"
    elif "market summary" in normalized or "market status" in normalized:
        if _trading_commands_available:
            response = get_market_summary()
        else:
            response = "Trading module not available"
    elif normalized.startswith("add ") and "watchlist" in normalized:
        # Parse: "add RELIANCE to watchlist" or "add RELIANCE at 2500"
        parts = command.split()
        symbol = parts[1] if len(parts) > 1 else ""
        alert_price = None
        if "at" in parts:
            try:
                alert_idx = parts.index("at")
                alert_price = float(parts[alert_idx + 1])
            except (ValueError, IndexError):
                pass
        if _trading_commands_available and symbol:
            response = add_to_watchlist(symbol, alert_price)
        else:
            response = "Please provide a stock symbol. Usage: 'add RELIANCE to watchlist'"
    elif "remove" in normalized and "watchlist" in normalized:
        parts = command.split()
        symbol = parts[1] if len(parts) > 1 else ""
        if _trading_commands_available and symbol:
            response = remove_from_watchlist(symbol)
        else:
            response = "Please provide a stock symbol. Usage: 'remove RELIANCE from watchlist'"
    elif "show watchlist" in normalized or "view watchlist" in normalized:
        if _trading_commands_available:
            response = view_watchlist()
        else:
            response = "Trading module not available"
    elif normalized.startswith("add ") and ("shares" in normalized or "at" in normalized):
        # Parse: "add 10 RELIANCE at 2500" or "portfolio add TCS 5 3200"
        try:
            parts = command.split()
            quantity_idx = 1 if parts[1].isdigit() else 2
            quantity = float(parts[quantity_idx])
            symbol_idx = quantity_idx + 1
            symbol = parts[symbol_idx] if len(parts) > symbol_idx else ""
            price_idx = parts.index("at") + 1 if "at" in parts else symbol_idx + 1
            price = float(parts[price_idx]) if len(parts) > price_idx else 0
            
            if _trading_commands_available and symbol and price > 0:
                response = add_portfolio_holding(symbol, quantity, price)
            else:
                response = "Usage: 'add 10 RELIANCE at 2500'"
        except (ValueError, IndexError):
            response = "Usage: 'add 10 RELIANCE at 2500'"
    elif "portfolio" in normalized and ("show" in normalized or "view" in normalized or "status" in normalized):
        if _trading_commands_available:
            response = view_portfolio()
        else:
            response = "Trading module not available"
    elif "analyze" in normalized and len(command.split()) >= 2:
        symbol = command.split()[-1]
        if _trading_commands_available and symbol:
            response = get_stock_analysis(symbol)
        else:
            response = "Please provide a stock symbol. Usage: 'analyze RELIANCE'"
    elif "trading recommendations" in normalized or "recommend trades" in normalized:
        if _trading_commands_available:
            response = get_trading_recommendations()
        else:
            response = "Trading module not available"
    elif normalized.startswith("create file "):
        path = command[12:].strip()
        response = create_file(path, "# New file\n")
    elif normalized.startswith("read file "):
        path = command[10:].strip()
        response = read_file(path)
    elif normalized.startswith("edit file "):
        path = command[10:].strip()
        if os.path.exists(path):
            response = open_target(path)
        else:
            response = create_file(path, "# New file\n")
    elif normalized.startswith("play "):
        target = command[5:].strip()
        if os.path.exists(target):
            response = open_target(target)
        else:
            response = search_google(target)
    elif normalized == "git status":
        response = git_status() or "No git changes."
    elif normalized.startswith("git commit"):
        message = command[10:].strip() or "Update from assistant"
        response = git_commit(message)
    elif normalized in {"power off", "shutdown pc", "shut down pc", "turn off pc"}:
        if SAFE_MODE:
            PENDING_CONFIRMATION = {"type": "shutdown", "value": ""}
            response = "Safe mode: confirm shutdown. Say yes or no."
        else:
            run_command("Stop-Computer -Force")
            response = "Shutting down your PC now."
    elif normalized in {"restart pc", "reboot pc"}:
        if SAFE_MODE:
            PENDING_CONFIRMATION = {"type": "restart", "value": ""}
            response = "Safe mode: confirm restart. Say yes or no."
        else:
            run_command("Restart-Computer -Force")
            response = "Restarting your PC now."
    elif normalized == "chat":
        response = "Use the UI to chat directly."

    # --- Vision ---
    elif command.startswith("[VISION_REQUEST] "):
        vision_query = command.removeprefix("[VISION_REQUEST] ").strip()
        response = _vision_chat(vision_query)

    # --- RAG Document Brain ---
    elif normalized.startswith("read document ") or normalized.startswith("search documents ") or normalized.startswith("query documents "):
        query = re.split(r'^(?:read document|search documents|query documents)\s+', command, maxsplit=1, flags=re.IGNORECASE)[-1].strip()
        try:
            from actions.rag_agent import query_knowledge_base
            context = query_knowledge_base(query)
            if context and context.strip():
                response = chat(f"Using the following document excerpts, answer: {query}\n\nDocument context:\n{context}")
            else:
                response = "No relevant documents found in the knowledge base. Drop PDF or TXT files into the 'knowledge_base' folder first."
        except Exception as exc:
            print(f"Document search error: {exc}")
            response = f"Document search is currently initializing or unavailable. Please ensure NumPy and Torch are installed correctly. Error: {exc}"

    elif normalized in {"index documents", "rebuild document index", "index knowledge base"}:
        try:
            from actions.rag_agent import brain as rag_brain
            response = rag_brain.build_index()
        except Exception as exc:
            response = f"Indexing failed: {exc}"

    # --- Automations/Routines ---
    elif normalized.startswith("every day at ") or normalized.startswith("schedule daily ") or normalized.startswith("automate daily "):
        try:
            from actions.automation_agent import add_routine
            # Parse: "every day at 09:00 summarize the news"
            parts = re.split(r'(?:every day at|schedule daily at|automate daily at)\s+', command, maxsplit=1, flags=re.IGNORECASE)
            if len(parts) == 2:
                rest = parts[1].strip()
                # time is first token e.g. "09:00 summarize..."
                tokens = rest.split(" ", 1)
                time_str = tokens[0].strip()
                task_cmd = tokens[1].strip() if len(tokens) > 1 else ""
                uid = get_user_profile().get("uid", "guest")
                response = add_routine(time_str, task_cmd, uid)
            else:
                response = "Please specify: 'every day at HH:MM <command>'"
        except Exception as exc:
            response = f"Scheduling failed: {exc}"

    # --- PRODUCTIVITY SYSTEM ---
    elif normalized.startswith("add task ") or normalized.startswith("create task "):
        if _productivity_available:
            task_title = re.sub(r'^(?:add|create) task\s+', '', command, flags=re.IGNORECASE).strip()
            try:
                tasks = get_task_manager(get_user_profile().get("uid", "guest"))
                task = tasks.add_task(task_title)
                response = f"✅ Task added: {task_title}"
            except Exception as e:
                response = f"Task creation failed: {e}"
        else:
            response = "Productivity system not available."
    
    elif normalized in {"list tasks", "show tasks", "my tasks"}:
        if _productivity_available:
            try:
                tasks = get_task_manager(get_user_profile().get("uid", "guest"))
                task_list = tasks.list_tasks("pending")
                if task_list:
                    response = "📋 PENDING TASKS:\n"
                    for task in task_list[:10]:
                        response += f"  [{task['priority'].upper()}] {task['title']}"
                        if task.get("due_date"):
                            response += f" (Due: {task['due_date']})"
                        response += "\n"
                else:
                    response = "✅ No pending tasks!"
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Productivity system not available."
    
    elif normalized.startswith("complete task ") or normalized.startswith("mark task done "):
        if _productivity_available:
            task_id = re.sub(r'^(?:complete task|mark task done)\s+', '', command, flags=re.IGNORECASE).strip()
            try:
                tasks = get_task_manager(get_user_profile().get("uid", "guest"))
                if tasks.complete_task(task_id):
                    response = "✅ Task marked as completed!"
                else:
                    response = "Task not found."
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Productivity system not available."
    
    elif normalized.startswith("add note ") or normalized.startswith("create note "):
        if _productivity_available:
            note_text = re.sub(r'^(?:add|create) note\s+', '', command, flags=re.IGNORECASE).strip()
            try:
                notes = get_note_manager(get_user_profile().get("uid", "guest"))
                note = notes.create_note("Note", note_text)
                response = f"✅ Note created with ID: {note['id']}"
            except Exception as e:
                response = f"Note creation failed: {e}"
        else:
            response = "Productivity system not available."
    
    elif normalized in {"list notes", "show notes", "my notes", "recent notes"}:
        if _productivity_available:
            try:
                notes = get_note_manager(get_user_profile().get("uid", "guest"))
                note_list = notes.list_notes("recent")[:5]
                if note_list:
                    response = "📝 RECENT NOTES:\n"
                    for note in note_list:
                        response += f"  • {note['title']}\n"
                else:
                    response = "No notes yet."
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Productivity system not available."
    
    elif normalized in {"productivity dashboard", "productivity summary", "today summary"}:
        if _productivity_available:
            try:
                dashboard = get_productivity_dashboard(get_user_profile().get("uid", "guest"))
                response = dashboard.get_daily_summary()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Productivity system not available."
    
    # --- ANALYTICS DASHBOARD ---
    elif normalized in {"analytics", "analytics dashboard", "show analytics", "analytics report"}:
        if _analytics_available:
            try:
                dashboard = get_analytics_dashboard(get_user_profile().get("uid", "guest"))
                response = dashboard.get_executive_summary()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Analytics system not available."
    
    elif normalized in {"productivity report", "productivity metrics"}:
        if _analytics_available:
            try:
                dashboard = get_analytics_dashboard(get_user_profile().get("uid", "guest"))
                response = dashboard.get_productivity_report()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Analytics system not available."
    
    elif normalized in {"trading report", "trading metrics", "trading analytics"}:
        if _analytics_available:
            try:
                dashboard = get_analytics_dashboard(get_user_profile().get("uid", "guest"))
                response = dashboard.get_trading_report()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Analytics system not available."
    
    elif normalized in {"usage report", "usage analytics", "my usage"}:
        if _analytics_available:
            try:
                dashboard = get_analytics_dashboard(get_user_profile().get("uid", "guest"))
                response = dashboard.get_usage_report()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Analytics system not available."
    
    # --- ADVANCED TRADING ANALYSIS ---
    elif normalized.startswith("analyze stock ") or normalized.startswith("detailed analysis "):
        if _advanced_trading_available:
            symbol = re.sub(r'^(?:analyze stock|detailed analysis)\s+', '', command, flags=re.IGNORECASE).strip().upper()
            try:
                from advanced_trading import analyzer
                # Mock prices for demonstration
                prices = list(range(100, 110)) + list(range(110, 105, -1))  # Demo data
                response = analyzer.analyze_stock(symbol, prices)
            except Exception as e:
                response = f"Analysis failed: {e}"
        else:
            response = "Advanced trading module not available."
    
    elif normalized in {"portfolio analysis", "analyze my portfolio"}:
        if _advanced_trading_available:
            try:
                from advanced_trading import analyzer
                # Mock portfolio for demonstration
                mock_holdings = {
                    "AAPL": (150.0, list(range(100, 155))),
                    "GOOGL": (120.0, list(range(100, 125)))
                }
                response = analyzer.analyze_portfolio(mock_holdings)
            except Exception as e:
                response = f"Portfolio analysis failed: {e}"
        else:
            response = "Advanced trading module not available."
    
    # --- SMART RECOMMENDATIONS ---
    elif normalized in {"recommendations", "suggest", "recommendations for me", "what should i do"}:
        if _recommendations_available:
            try:
                rec_system = get_recommendations_system(get_user_profile().get("uid", "guest"))
                response = rec_system.get_recommendations_summary()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Recommendations system not available."
    
    elif normalized in {"daily tips", "tips", "give me tips", "daily advice"}:
        if _recommendations_available:
            try:
                rec_system = get_recommendations_system(get_user_profile().get("uid", "guest"))
                response = rec_system.get_daily_tips()
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Recommendations system not available."
    
    elif normalized in {"productivity tips", "how to be more productive"}:
        if _recommendations_available:
            try:
                rec_system = get_recommendations_system(get_user_profile().get("uid", "guest"))
                tips = rec_system.productivity.get_time_management_tips()
                response = "⏱️ TIME MANAGEMENT TIPS:\n\n"
                for tip in tips[:5]:
                    response += f"  {tip}\n"
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Recommendations system not available."
    
    elif normalized in {"trading tips", "improve trading"}:
        if _recommendations_available:
            try:
                rec_system = get_recommendations_system(get_user_profile().get("uid", "guest"))
                tips = rec_system.trading.get_trading_tips()
                response = "💹 TRADING TIPS:\n\n"
                for tip in tips[:5]:
                    response += f"  {tip}\n"
            except Exception as e:
                response = f"Error: {e}"
        else:
            response = "Recommendations system not available."

    else:
        # Use Smart Orchestrator V2 for adaptive reasoning if available
        if _smart_orchestrator:
            try:
                response = _smart_orchestrator.run(command)
            except Exception as e:
                logger.error(f"SmartOrchestrator failed: {e}")
                response = chat(command)
        else:
            response = chat(command)

    speak(response)
    return response


def cleanup_on_exit() -> None:
    """Stop reminder monitor thread on application exit."""
    global _REMINDER_MONITOR_THREAD
    try:
        with _REMINDER_MONITOR_LOCK:
            if _REMINDER_MONITOR_THREAD is not None and _REMINDER_MONITOR_THREAD.is_alive():
                _REMINDER_MONITOR_THREAD.join(timeout=2)
                _REMINDER_MONITOR_THREAD = None
    except Exception as e:
        # Log but don't fail on cleanup
        pass
