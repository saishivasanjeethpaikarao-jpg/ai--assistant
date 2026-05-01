#!/usr/bin/env python3
"""
Simple Frontend Server - Serves frontend files on port 8080
Allows testing of chat UI against local backend on port 5000
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

class FrontendHandler(SimpleHTTPRequestHandler):
    """Serve frontend files with CORS headers"""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def translate_path(self, path):
        # Serve from frontend directory
        path = super().translate_path(path)
        relpath = os.path.relpath(path, os.getcwd())
        if relpath.startswith('..') or relpath == '.':
            # Prevent directory traversal
            return os.path.join(os.getcwd(), 'index.html')
        return path
    
    def log_message(self, format, *args):
        print(f"[Frontend] {format % args}")

if __name__ == '__main__':
    # Change to frontend directory
    frontend_path = Path(__file__).parent / 'frontend'
    os.chdir(frontend_path)
    
    server_address = ('', 8080)
    httpd = HTTPServer(server_address, FrontendHandler)
    
    print("=" * 70)
    print("FRONTEND SERVER - STARTING")
    print("=" * 70)
    print("\nServing frontend on: http://localhost:8080")
    print("Backend API on:      http://localhost:5000")
    print("\nOpen browser to:     http://localhost:8080")
    print("\nPress Ctrl+C to stop")
    print("=" * 70)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped")
        sys.exit(0)
