"""
Dashboard API Server — Jarvis AI Assistant
All endpoints for settings, voice, memory, reminders, system prompt, capabilities.
"""

import json
import os
import sys
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from system_coordinator import process_user_request, get_system_status, show_learned_knowledge

request_history = []
MAX_HISTORY = 50

CAPABILITIES = [
    {"id": "chat",         "category": "AI",           "icon": "💬", "name": "Natural Conversation",   "desc": "Chat in English & Telugu with full context memory"},
    {"id": "voice-in",     "category": "Voice",        "icon": "🎤", "name": "Voice Input (STT)",       "desc": "Speak commands using microphone — browser or local"},
    {"id": "voice-out",    "category": "Voice",        "icon": "🔊", "name": "Voice Output (TTS)",      "desc": "Premium AI voices via Fish Audio, ElevenLabs, or browser"},
    {"id": "voice-clone",  "category": "Voice",        "icon": "🎭", "name": "Voice Cloning",           "desc": "Clone any voice using Fish Audio API"},
    {"id": "wake-word",    "category": "Voice",        "icon": "👂", "name": "Wake Word Detection",     "desc": "Say 'Jarvis' or double-clap to activate hands-free"},
    {"id": "open-apps",    "category": "PC Control",   "icon": "🚀", "name": "Launch Applications",     "desc": "Open Chrome, VSCode, Office, Terminal, any app"},
    {"id": "system-ctrl",  "category": "PC Control",   "icon": "⚙️", "name": "System Control",          "desc": "Shutdown, restart, lock, volume — full OS control"},
    {"id": "file-ops",     "category": "PC Control",   "icon": "📁", "name": "File Operations",         "desc": "Create, read, edit, delete files and folders"},
    {"id": "screen-read",  "category": "PC Control",   "icon": "👁️", "name": "Screen Reading",          "desc": "Jarvis reads your screen and guides you visually"},
    {"id": "coding",       "category": "Coding",       "icon": "💻", "name": "Code Execution",          "desc": "Run Python scripts with [EXECUTE_PYTHON] blocks"},
    {"id": "git",          "category": "Coding",       "icon": "🔀", "name": "Git Automation",          "desc": "Auto-commit, status, branch management"},
    {"id": "self-improve", "category": "Coding",       "icon": "🧠", "name": "Self-Improvement",        "desc": "Jarvis adds features to itself when you ask"},
    {"id": "browser",      "category": "Browsing",     "icon": "🌐", "name": "Web Browsing",            "desc": "Google search, open URLs, YouTube, Wikipedia"},
    {"id": "gmail",        "category": "Browsing",     "icon": "📧", "name": "Email & Social",          "desc": "Open Gmail, GitHub, Reddit, Twitter, StackOverflow"},
    {"id": "trading",      "category": "Trading",      "icon": "📈", "name": "Indian Stock Market",     "desc": "NSE/BSE real-time prices, watchlist, portfolio"},
    {"id": "options",      "category": "Trading",      "icon": "📊", "name": "Options Trading",         "desc": "Black-Scholes, Greeks, options strategies"},
    {"id": "backtest",     "category": "Trading",      "icon": "🔬", "name": "Backtest Engine",         "desc": "Simulate trading strategies on historical data"},
    {"id": "technical",    "category": "Trading",      "icon": "📉", "name": "Technical Analysis",      "desc": "RSI, MACD, Bollinger Bands, ML predictions"},
    {"id": "memory",       "category": "Memory",       "icon": "🧩", "name": "Adaptive Memory",         "desc": "Learns from every interaction, remembers preferences"},
    {"id": "reminders",    "category": "Memory",       "icon": "⏰", "name": "Smart Reminders",         "desc": "Schedule and manage reminders with natural language"},
    {"id": "firebase",     "category": "Memory",       "icon": "☁️", "name": "Cloud Sync",              "desc": "Sync memory, settings and history via Firebase"},
    {"id": "12-layer",     "category": "AI",           "icon": "🔮", "name": "12-Layer AI Brain",       "desc": "Intent → Plan → Execute → Reflect → Learn → Improve"},
    {"id": "multi-agent",  "category": "AI",           "icon": "🤖", "name": "Multi-Agent System",      "desc": "Parallel AI agents tackle complex goals together"},
    {"id": "analytics",    "category": "Analytics",    "icon": "📋", "name": "Analytics Dashboard",     "desc": "Productivity metrics, usage stats, trading performance"},
    {"id": "recommender",  "category": "Analytics",    "icon": "✨", "name": "Smart Recommendations",   "desc": "AI-driven tips on productivity, trading, and health"},
    {"id": "tasks",        "category": "Productivity", "icon": "✅", "name": "Task Manager",            "desc": "Create, track and complete tasks with natural language"},
    {"id": "notes",        "category": "Productivity", "icon": "📝", "name": "Notes",                   "desc": "Quick notes saved and recalled by Jarvis"},
    {"id": "calendar",     "category": "Productivity", "icon": "📅", "name": "Calendar",                "desc": "Schedule events and get daily briefings"},
    {"id": "alerts",       "category": "Trading",      "icon": "🔔", "name": "Price Alerts",            "desc": "Real-time alerts when stocks hit target prices"},
]

LAYERS = [
    {"n": 1,  "name": "Intent Detector",    "desc": "Classifies input: COMMAND / GOAL / CHAT + complexity"},
    {"n": 2,  "name": "Strategic Planner",  "desc": "Breaks goals into 3–6 executable steps"},
    {"n": 3,  "name": "Plan Critic",        "desc": "Validates and optimises the plan before execution"},
    {"n": 4,  "name": "Execution Engine",   "desc": "Converts each step into runnable commands/tools"},
    {"n": 5,  "name": "Decision Engine",    "desc": "Picks the best option when multiple paths exist"},
    {"n": 6,  "name": "Safety Filter",      "desc": "Checks commands for safety before running them"},
    {"n": 7,  "name": "Self-Reflection",    "desc": "Evaluates the outcome — did the goal succeed?"},
    {"n": 8,  "name": "Adaptive Memory",    "desc": "Stores lessons, preferences, and patterns"},
    {"n": 9,  "name": "Re-Planning",        "desc": "Recovers from failures with a better plan"},
    {"n": 10, "name": "Chat Mode",          "desc": "Natural conversation with bilingual support"},
    {"n": 11, "name": "Meta-Improvement",   "desc": "Analyses the system and proposes upgrades"},
    {"n": 12, "name": "Orchestrator",       "desc": "Coordinates all 11 layers in optimal sequence"},
]


class DashboardAPIHandler(BaseHTTPRequestHandler):

    # ── Routing ─────────────────────────────────────────────────────────────

    def do_GET(self):
        path = urlparse(self.path).path
        routes = {
            '/': self.serve_dashboard,
            '/api/health': self.api_health,
            '/api/system/status': self.api_system_status,
            '/api/system/knowledge': self.api_system_knowledge,
            '/api/system/layers': self.api_system_layers,
            '/api/history': self.api_history,
            '/api/settings': self.api_get_settings,
            '/api/provider/status': self.api_provider_status,
            '/api/reminders': self.api_get_reminders,
            '/api/memory/stats': self.api_memory_stats,
            '/api/system/prompt': self.api_get_system_prompt,
            '/api/capabilities': self.api_capabilities,
            '/api/analytics': self.api_analytics,
            '/api/vibe/agents': self.api_vibe_agents,
            '/api/vibe/detect': self.api_vibe_detect_get,
        }
        handler = routes.get(path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        path = urlparse(self.path).path
        try:
            data = json.loads(body.decode('utf-8'))
        except Exception:
            data = {}

        routes = {
            '/api/request': lambda: self.api_request(data),
            '/api/history/clear': self.api_history_clear,
            '/api/settings': lambda: self.api_save_settings(data),
            '/api/system/prompt': lambda: self.api_save_system_prompt(data),
            '/api/reminders': lambda: self.api_add_reminder(data),
            '/api/vibe/code': lambda: self.api_vibe_code(data),
            '/api/vibe/run': lambda: self.api_vibe_run(data),
            '/api/vibe/fix': lambda: self.api_vibe_fix(data),
            '/api/vibe/chat': lambda: self.api_vibe_chat(data),
            '/api/vibe/detect': lambda: self.api_vibe_detect(data),
        }
        handler = routes.get(path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, default=str).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # ── Dashboard ────────────────────────────────────────────────────────────

    def serve_dashboard(self):
        try:
            with open('system_dashboard.html', 'r') as f:
                html = f.read()
            body = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)
        except Exception:
            self.send_error(404)

    # ── Core endpoints ───────────────────────────────────────────────────────

    def api_health(self):
        try:
            status = get_system_status()
            self.send_json({'status': 'healthy', 'timestamp': datetime.now().isoformat(), 'system': status})
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)

    def api_request(self, data):
        global request_history
        try:
            user_input = (data.get('input') or data.get('message') or '').strip()
            if not user_input:
                self.send_json({'error': 'No input provided'}, 400)
                return

            # ── Try real AI response first ───────────────────────────────
            reply = None
            mode = 'CHAT'
            try:
                from ai_switcher import has_provider_configured, with_fallback, refresh_providers
                from config_paths import get_dotenv_path
                from dotenv import load_dotenv
                load_dotenv(get_dotenv_path(), override=True)
                refresh_providers()

                if has_provider_configured():
                    from assistant_persona import ASSISTANT_PERSONA
                    from system_prompt_config import load_system_prompt

                    # Build system prompt: persona + master system prompt
                    try:
                        master = load_system_prompt()
                    except Exception:
                        master = ''

                    system_content = ASSISTANT_PERSONA
                    if master:
                        system_content = master + '\n\n' + ASSISTANT_PERSONA

                    # Build recent conversation history for context (last 10)
                    messages_payload = [{"role": "system", "content": system_content}]
                    for h in request_history[-10:]:
                        if h.get('input'):
                            messages_payload.append({"role": "user", "content": h['input']})
                        if h.get('reply'):
                            messages_payload.append({"role": "assistant", "content": h['reply']})
                    messages_payload.append({"role": "user", "content": user_input})

                    import requests as req_lib
                    try:
                        from openai import OpenAI
                    except ImportError:
                        OpenAI = None

                    def call_ai(provider, msgs):
                        pname = provider.get('name', '').lower()
                        api_key = provider.get('api_key')
                        base_url = provider.get('base_url', '')
                        model = provider.get('model', '')

                        if pname == 'ollama':
                            url = base_url.rstrip('/') + '/v1/chat/completions'
                            r = req_lib.post(url, json={'model': model, 'messages': msgs}, timeout=60)
                            r.raise_for_status()
                            d = r.json()
                            return d['choices'][0]['message']['content']

                        if OpenAI is None:
                            raise RuntimeError('openai package not installed')
                        client = OpenAI(api_key=api_key, base_url=base_url)
                        resp = client.chat.completions.create(model=model, messages=msgs)
                        return resp.choices[0].message.content

                    reply = with_fallback(call_ai, messages_payload)

            except Exception as ai_err:
                print(f"[AI] Error: {ai_err}")
                reply = None

            # ── Fallback: try the coordinator ────────────────────────────
            if not reply:
                try:
                    result = process_user_request(user_input)
                    mode = result.get('mode', 'CHAT')
                    candidate = result.get('response') or result.get('message') or ''
                    # Only use coordinator reply if it's not the stub message
                    if candidate and 'Chat mode activated' not in candidate:
                        reply = candidate
                except Exception:
                    pass

            # ── Hard fallback ────────────────────────────────────────────
            if not reply:
                reply = (
                    "⚙️ No AI provider is configured yet.\n\n"
                    "**To activate Jarvis:**\n"
                    "1. Click the **gear icon** (bottom-left) → **AI Engine** tab\n"
                    "2. Paste your **Groq API key** (free at console.groq.com)\n"
                    "3. Click **Save Settings**\n\n"
                    "Groq is free and takes 30 seconds to set up."
                )

            request_history.append({
                'input': user_input,
                'reply': reply,
                'timestamp': datetime.now().isoformat(),
                'mode': mode,
            })
            if len(request_history) > MAX_HISTORY:
                request_history.pop(0)

            self.send_json({
                'success': True,
                'input': user_input,
                'reply': reply,
                'mode': mode,
                'thinking': [],
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_system_status(self):
        try:
            self.send_json({'success': True, 'status': get_system_status(), 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_system_knowledge(self):
        try:
            self.send_json({'success': True, 'knowledge': show_learned_knowledge()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_system_layers(self):
        self.send_json({'success': True, 'layers': LAYERS, 'total': len(LAYERS)})

    def api_history(self):
        self.send_json({'success': True, 'history': request_history[-20:], 'total': len(request_history)})

    def api_history_clear(self):
        global request_history
        request_history = []
        self.send_json({'success': True})

    def api_capabilities(self):
        self.send_json({'success': True, 'capabilities': CAPABILITIES})

    def api_analytics(self):
        try:
            status = get_system_status()
            session = status.get('session', {})
            execution = status.get('execution', {})
            memory_data = status.get('memory', {})
            self.send_json({
                'success': True,
                'analytics': {
                    'interactions': session.get('interactions', 0),
                    'success_rate': execution.get('success_rate', '0%'),
                    'total_executions': execution.get('total_executions', 0),
                    'strategies_learned': execution.get('strategies_learned', 0),
                    'memory_items': memory_data.get('total_strategies', 0),
                    'patterns_detected': memory_data.get('total_patterns', 0),
                    'session_start': session.get('start_time', ''),
                    'history_count': len(request_history),
                }
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Settings ─────────────────────────────────────────────────────────────

    def _mask(self, key: str) -> str:
        if not key:
            return ''
        if len(key) <= 8:
            return '*' * len(key)
        return key[:4] + '*' * (len(key) - 8) + key[-4:]

    def api_get_settings(self):
        try:
            from ai_switcher import _load_env_keys, get_provider_status
            from config_prefs import load_prefs
            from config_paths import get_dotenv_path
            from dotenv import load_dotenv
            load_dotenv(get_dotenv_path(), override=True)

            keys = _load_env_keys()
            prefs = load_prefs()
            groq_key = (keys.get('GROQ_API_KEY') or '').strip()
            fish_key = os.getenv('FISH_AUDIO_API_KEY', '').strip()
            el_key = os.getenv('ELEVENLABS_API_KEY', '').strip()
            firebase_key = (keys.get('FIREBASE_API_KEY') or '').strip()

            self.send_json({
                'success': True,
                'settings': {
                    'groq_api_key': self._mask(groq_key),
                    'groq_api_key_set': bool(groq_key),
                    'groq_model': keys.get('GROQ_MODEL') or 'llama-3.3-70b-versatile',
                    'ollama_url': keys.get('OLLAMA_URL') or '',
                    'ollama_model': keys.get('OLLAMA_MODEL') or 'llama3.2',
                    'fish_audio_api_key': self._mask(fish_key),
                    'fish_audio_api_key_set': bool(fish_key),
                    'fish_audio_reference_id': os.getenv('FISH_AUDIO_REFERENCE_ID', ''),
                    'fish_audio_model': os.getenv('FISH_AUDIO_MODEL', 's2-pro'),
                    'elevenlabs_api_key': self._mask(el_key),
                    'elevenlabs_api_key_set': bool(el_key),
                    'elevenlabs_voice_id': os.getenv('ELEVENLABS_VOICE_ID', ''),
                    'firebase_api_key': self._mask(firebase_key),
                    'firebase_api_key_set': bool(firebase_key),
                    'voice_personality': os.getenv('VOICE_PERSONALITY', 'jarvis'),
                    'preferred_voice_provider': os.getenv('PREFERRED_VOICE_PROVIDER', 'fish'),
                    'voice_language': os.getenv('VOICE_LANGUAGE', 'en'),
                    'response_language': os.getenv('RESPONSE_LANGUAGE', 'auto'),
                    'wake_word': os.getenv('WAKE_WORD', 'jarvis'),
                    'wake_word_sensitivity': os.getenv('WAKE_WORD_SENSITIVITY', '1.0'),
                    'double_clap_enabled': os.getenv('DOUBLE_CLAP_ENABLED', 'true').lower() == 'true',
                    'voice_rate': os.getenv('VOICE_RATE', '150'),
                    'voice_volume': os.getenv('VOICE_VOLUME', '0.9'),
                    'voice_pitch': os.getenv('VOICE_PITCH', '1.0'),
                },
                'preferences': prefs,
                'providers': get_provider_status(),
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_save_settings(self, data):
        try:
            from ai_switcher import refresh_providers
            from config_prefs import save_prefs
            from config_paths import get_dotenv_path
            from dotenv import set_key

            env_path = get_dotenv_path()
            saved = []

            ENV_MAP = {
                'groq_api_key': 'GROQ_API_KEY',
                'groq_model': 'GROQ_MODEL',
                'ollama_url': 'OLLAMA_URL',
                'ollama_model': 'OLLAMA_MODEL',
                'fish_audio_api_key': 'FISH_AUDIO_API_KEY',
                'fish_audio_reference_id': 'FISH_AUDIO_REFERENCE_ID',
                'fish_audio_model': 'FISH_AUDIO_MODEL',
                'elevenlabs_api_key': 'ELEVENLABS_API_KEY',
                'elevenlabs_voice_id': 'ELEVENLABS_VOICE_ID',
                'firebase_api_key': 'FIREBASE_API_KEY',
                'voice_personality': 'VOICE_PERSONALITY',
                'preferred_voice_provider': 'PREFERRED_VOICE_PROVIDER',
                'voice_language': 'VOICE_LANGUAGE',
                'response_language': 'RESPONSE_LANGUAGE',
                'wake_word': 'WAKE_WORD',
                'wake_word_sensitivity': 'WAKE_WORD_SENSITIVITY',
                'voice_rate': 'VOICE_RATE',
                'voice_volume': 'VOICE_VOLUME',
                'voice_pitch': 'VOICE_PITCH',
            }

            # Boolean fields
            BOOL_MAP = {
                'double_clap_enabled': 'DOUBLE_CLAP_ENABLED',
            }

            settings = data.get('settings', {})
            prefs = data.get('preferences', {})

            for field, env_name in ENV_MAP.items():
                val = (settings.get(field) or '').strip()
                if val and '*' not in val:
                    set_key(env_path, env_name, val)
                    os.environ[env_name] = val
                    saved.append(env_name)

            for field, env_name in BOOL_MAP.items():
                if field in settings:
                    val = 'true' if settings[field] else 'false'
                    set_key(env_path, env_name, val)
                    os.environ[env_name] = val
                    saved.append(env_name)

            if prefs:
                save_prefs(prefs)

            refresh_providers()
            self.send_json({'success': True, 'saved': saved, 'message': f'Saved {len(saved)} setting(s)'})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_provider_status(self):
        try:
            from ai_switcher import get_provider_status, has_provider_configured, refresh_providers
            refresh_providers()
            self.send_json({
                'success': True,
                'providers': get_provider_status(),
                'has_provider': has_provider_configured(),
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── System Prompt ────────────────────────────────────────────────────────

    def api_get_system_prompt(self):
        try:
            from system_prompt_config import load_system_prompt, get_system_config
            prompt = load_system_prompt()
            cfg = get_system_config()
            self.send_json({
                'success': True,
                'prompt': prompt,
                'enabled': cfg.get('enabled', True),
                'mode': cfg.get('mode', 'agent'),
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_save_system_prompt(self, data):
        try:
            from system_prompt_config import save_system_prompt
            prompt = data.get('prompt', '').strip()
            if prompt:
                save_system_prompt(prompt)
                self.send_json({'success': True, 'message': 'System prompt saved'})
            else:
                self.send_json({'error': 'Empty prompt'}, 400)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Reminders ────────────────────────────────────────────────────────────

    def api_get_reminders(self):
        try:
            from memory.reminders import list_reminders
            reminders = list_reminders(user_id='guest')
            self.send_json({'success': True, 'reminders': reminders})
        except Exception as e:
            self.send_json({'success': True, 'reminders': [], 'note': str(e)})

    def api_add_reminder(self, data):
        try:
            from memory.reminders import add_reminder
            text = data.get('text', '').strip()
            when = data.get('when', 'later').strip()
            if not text:
                self.send_json({'error': 'No reminder text'}, 400)
                return
            result = add_reminder(text=text, when_text=when, user_id='guest')
            self.send_json({'success': True, 'message': result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    # ── Vibe Coder ───────────────────────────────────────────────────────────

    def api_vibe_agents(self):
        try:
            from vibe_coder import get_agents_list
            self.send_json({'success': True, 'agents': get_agents_list()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_code(self, data):
        try:
            from vibe_coder import generate_code
            prompt = (data.get('prompt') or '').strip()
            agent_id = (data.get('agent_id') or 'auto').strip()
            if not prompt:
                self.send_json({'error': 'No prompt provided'}, 400)
                return
            result = generate_code(prompt, agent_id)
            self.send_json({'success': True, **result})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_vibe_run(self, data):
        try:
            from vibe_coder import run_code
            code = (data.get('code') or '').strip()
            language = (data.get('language') or 'python').strip()
            if not code:
                self.send_json({'error': 'No code provided'}, 400)
                return
            result = run_code(code, language)
            self.send_json({'success': True, **result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_fix(self, data):
        try:
            from vibe_coder import fix_code
            code = (data.get('code') or '').strip()
            error = (data.get('error') or '').strip()
            if not code:
                self.send_json({'error': 'No code provided'}, 400)
                return
            result = fix_code(code, error)
            self.send_json({'success': True, **result})
        except Exception as e:
            import traceback; traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_vibe_chat(self, data):
        try:
            from vibe_coder import chat_about_code
            message = (data.get('message') or '').strip()
            code_context = (data.get('code_context') or '').strip()
            if not message:
                self.send_json({'error': 'No message provided'}, 400)
                return
            result = chat_about_code(message, code_context)
            self.send_json({'success': True, **result})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_detect(self, data):
        try:
            from vibe_coder import detect_agent_with_confidence, AGENTS
            prompt = (data.get('prompt') or '').strip()
            if not prompt:
                self.send_json({'agent_id': 'auto', 'confidence': 0})
                return
            detection = detect_agent_with_confidence(prompt)
            agent = AGENTS.get(detection['agent_id'], {})
            self.send_json({
                'success': True,
                'agent_id': detection['agent_id'],
                'agent_name': agent.get('name', ''),
                'agent_emoji': agent.get('emoji', ''),
                'confidence': detection['confidence'],
            })
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_vibe_detect_get(self):
        self.send_json({'success': True, 'message': 'POST to /api/vibe/detect with {prompt}'})

    # ── Memory ───────────────────────────────────────────────────────────────

    def api_memory_stats(self):
        try:
            from memory.adaptive_memory import get_memory_stats
            stats = get_memory_stats()
            self.send_json({'success': True, 'stats': stats})
        except Exception as e:
            self.send_json({'success': True, 'stats': {}, 'note': str(e)})

    def log_message(self, format, *args):
        pass


def start_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), DashboardAPIHandler)
    print(f"Jarvis Backend API — port {port}")
    print("Ready: /api/request  /api/settings  /api/capabilities  /api/system/layers")
    server.serve_forever()


if __name__ == '__main__':
    try:
        start_server(8000)
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")
