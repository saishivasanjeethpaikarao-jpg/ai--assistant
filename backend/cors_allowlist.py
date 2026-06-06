"""Single source of truth for the CORS allowlist.

Phase 1: pick a narrow list and apply it uniformly to every HTTP server
entry point (dashboard_api.py, main.py, api_server_minimal.py,
app_enhanced.py). Previously each file maintained its own list with
wildcard (*) policies.
"""
import os


def allowed_origins() -> list:
    """Return the list of allowed CORS origins.

    Reads AIRIS_ALLOWED_ORIGINS (comma-separated) from env. If unset,
    returns a safe default covering local dev hosts and the deployed
    production domains.
    """
    raw = os.environ.get("AIRIS_ALLOWED_ORIGINS", "").strip()
    if raw:
        return [o.strip() for o in raw.split(",") if o.strip()]
    return [
        "http://localhost:3000",        # Vite dev (legacy)
        "http://localhost:5000",        # frontend_server.py
        "http://localhost:5173",        # Vite dev (default)
        "http://localhost:8080",        # legacy frontend_server
        "https://airis-9ox.pages.dev",  # Cloudflare Pages
        "https://ai-assistant-8r3x.onrender.com",  # Render backend
    ]
