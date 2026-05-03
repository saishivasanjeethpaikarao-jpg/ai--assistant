import json, os

MEMORY_FILE = os.path.join(os.path.dirname(__file__), 'memory.json')
_memories = {}
_profile = {}
_active_user = 'default'

def _save():
    with open(MEMORY_FILE, 'w') as f:
        json.dump({'memories': _memories, 'profile': _profile}, f)

def _load():
    global _memories, _profile
    if os.path.exists(MEMORY_FILE):
        with open(MEMORY_FILE) as f:
            data = json.load(f)
            _memories = data.get('memories', {})
            _profile = data.get('profile', {})

_load()

def set_active_user(user): global _active_user; _active_user = user
def get_active_user(): return _active_user
def remember_fact(key, value): _memories[key] = value; _save()
def recall_fact(key): return _memories.get(key)
def forget_fact(key): _memories.pop(key, None); _save()
def list_memories(): return dict(_memories)
def store_profile_value(key, value): _profile[key] = value; _save()
def recall_profile_value(key): return _profile.get(key)
def list_profile_values(): return dict(_profile)
def learn_text(text): pass
def memory_context(): return '\n'.join(f'{k}: {v}' for k, v in _memories.items())
def profile_context(): return '\n'.join(f'{k}: {v}' for k, v in _profile.items())
