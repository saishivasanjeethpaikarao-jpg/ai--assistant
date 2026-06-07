#!/usr/bin/env python3
"""
Simple Frontend Server — serves built frontend on port 5173.
Use this only as a fallback. The recommended workflow is `npm run dev`
in the frontend directory, which uses Vite's dev server on port 5173.
This Python server is kept for users who can't run npm.

Backend (FastAPI) is expected on port 8000.
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

DEFAULT_PORT = int(os.environ.get("AIRIS_FRONTEND_PORT", "5173"))
BACKEND_PORT = int(os.environ.get("AIRIS_BACKEND_PORT", "8000"))


class FrontendHandler(SimpleHTTPRequestHandler):
    """Serve frontend files with loopback-only CORS headers."""

    _ALLOWED_ORIGINS = {
        f"http://localhost:{DEFAULT_PORT}",
        f"http://127.0.0.1:{DEFAULT_PORT}",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        f"http://localhost:{BACKEND_PORT}",
        f"http://127.0.0.1:{BACKEND_PORT}",
    }

    def end_headers(self):
        origin = self.headers.get("Origin", "")
        if origin in self._ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def translate_path(self, path):
        path = super().translate_path(path)
        relpath = os.path.relpath(path, os.getcwd())
        if relpath.startswith('..') or relpath == '.':
            return os.path.join(os.getcwd(), 'index.html')
        return path

    def log_message(self, format, *args):
        print(f"[Frontend] {format % args}")


if __name__ == '__main__':
    # Serve from frontend/dist (built output) if it exists, otherwise from frontend/
    project_root = Path(__file__).parent
    dist_path = project_root / 'frontend' / 'dist'
    frontend_path = dist_path if dist_path.exists() else (project_root / 'frontend')

    if not frontend_path.exists():
        print(f"ERROR: Frontend directory not found at {frontend_path}")
        print("Run `npm run build` in the frontend directory first.")
        sys.exit(1)

    os.chdir(frontend_path)

    server_address = ('', DEFAULT_PORT)
    httpd = HTTPServer(server_address, FrontendHandler)

    print("=" * 70)
    print("AIRIS FRONTEND SERVER")
    print("=" * 70)
    print(f"Serving frontend from: {frontend_path}")
    print(f"Frontend URL:          http://localhost:{DEFAULT_PORT}")
    print(f"Backend API expected:  http://localhost:{BACKEND_PORT}")
    print("\nPress Ctrl+C to stop")
    print("=" * 70)

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")
        sys.exit(0)
