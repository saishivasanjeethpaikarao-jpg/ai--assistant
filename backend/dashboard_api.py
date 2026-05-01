"""
Dashboard API Server - Connects web dashboard to 12-layer AI system
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


class DashboardAPIHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/':
            self.serve_dashboard()
        elif path == '/api/health':
            self.api_health()
        elif path == '/api/system/status':
            self.api_system_status()
        elif path == '/api/system/knowledge':
            self.api_system_knowledge()
        elif path == '/api/history':
            self.api_history()
        elif path == '/api/settings':
            self.api_get_settings()
        elif path == '/api/provider/status':
            self.api_provider_status()
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

        if path == '/api/request':
            self.api_request(data)
        elif path == '/api/history/clear':
            self.api_history_clear()
        elif path == '/api/test':
            self.api_test()
        elif path == '/api/settings':
            self.api_save_settings(data)
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

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
            self.send_error(404, "Dashboard not found")

    def api_health(self):
        try:
            status = get_system_status()
            self.send_json({'status': 'healthy', 'timestamp': datetime.now().isoformat(), 'system': status})
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)

    def api_request(self, data):
        try:
            user_input = (data.get('input') or data.get('message') or '').strip()
            if not user_input:
                self.send_json({'error': 'No input provided'}, 400)
                return

            result = process_user_request(user_input)

            global request_history
            request_history.append({
                'input': user_input,
                'timestamp': datetime.now().isoformat(),
                'type': result.get('type'),
                'status': result.get('status'),
            })
            if len(request_history) > MAX_HISTORY:
                request_history.pop(0)

            reply = result.get('response') or result.get('message') or 'Processing complete'
            self.send_json({
                'success': True,
                'input': user_input,
                'reply': reply,
                'thinking': result.get('thinking', []),
                'response': result,
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json({'error': str(e)}, 500)

    def api_system_status(self):
        try:
            self.send_json({'success': True, 'status': get_system_status(), 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_system_knowledge(self):
        try:
            self.send_json({'success': True, 'knowledge': show_learned_knowledge(), 'timestamp': datetime.now().isoformat()})
        except Exception as e:
            self.send_json({'error': str(e)}, 500)

    def api_history(self):
        self.send_json({'success': True, 'history': request_history[-20:], 'total': len(request_history)})

    def api_history_clear(self):
        global request_history
        request_history = []
        self.send_json({'success': True, 'message': 'History cleared'})

    def api_test(self):
        results = []
        for req in ['open Chrome browser', 'what is machine learning']:
            try:
                result = process_user_request(req)
                results.append({'input': req, 'type': result.get('type'), 'success': True})
            except Exception as e:
                results.append({'input': req, 'error': str(e), 'success': False})
        self.send_json({'success': True, 'test_results': results})

    # ─── Settings ──────────────────────────────────────────────────────────

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
            }

            settings = data.get('settings', {})
            prefs = data.get('preferences', {})

            for field, env_name in ENV_MAP.items():
                val = (settings.get(field) or '').strip()
                if val and '*' not in val:
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

    def log_message(self, format, *args):
        pass


def start_server(port=8000):
    server = HTTPServer(('0.0.0.0', port), DashboardAPIHandler)
    print(f"Backend API running on port {port}")
    print("Endpoints: /api/request  /api/settings  /api/provider/status  /api/health")
    server.serve_forever()


if __name__ == '__main__':
    try:
        start_server(8000)
    except KeyboardInterrupt:
        print("\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")
