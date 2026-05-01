"""
Dashboard API Server - Connects web dashboard to 12-layer AI system
Uses built-in HTTP server (no external dependencies needed)
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

from system_coordinator import process_user_request, get_system_status, show_learned_knowledge

# Store request history
request_history = []
MAX_HISTORY = 50

class DashboardAPIHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for Dashboard API"""
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
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
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        try:
            data = json.loads(body.decode('utf-8'))
        except:
            data = {}
        
        if path == '/api/request':
            self.api_request(data)
        elif path == '/api/history/clear':
            self.api_history_clear()
        elif path == '/api/test':
            self.api_test()
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def send_json(self, data, status=200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def serve_dashboard(self):
        """Serve the dashboard HTML file"""
        try:
            with open('system_dashboard.html', 'r') as f:
                html = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(html.encode('utf-8'))
        except:
            self.send_error(404, "Dashboard not found")
    
    def api_health(self):
        """GET /api/health - System health check"""
        try:
            status = get_system_status()
            response = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'system': status
            }
            self.send_json(response)
        except Exception as e:
            self.send_json({'status': 'error', 'message': str(e)}, 500)
    
    def api_request(self, data):
        """POST /api/request - Process user request"""
        try:
            # Accept both 'input' and 'message' fields
            user_input = data.get('input') or data.get('message', '')
            user_input = user_input.strip()
            
            if not user_input:
                self.send_json({'error': 'No input provided'}, 400)
                return
            
            # Process through AI system
            result = process_user_request(user_input)
            
            # Store in history
            global request_history
            history_entry = {
                'input': user_input,
                'timestamp': datetime.now().isoformat(),
                'type': result.get('type'),
                'complexity': result.get('complexity'),
                'status': result.get('status'),
            }
            request_history.append(history_entry)
            if len(request_history) > MAX_HISTORY:
                request_history.pop(0)
            
            # Build reply from system response
            reply = result.get('response') or result.get('message') or 'Processing complete'
            
            response = {
                'success': True,
                'input': user_input,
                'reply': reply,
                'thinking': result.get('thinking', []),
                'response': result
            }
            self.send_json(response)
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_json({'error': str(e)}, 500)
    
    def api_system_status(self):
        """GET /api/system/status - Get system status"""
        try:
            status = get_system_status()
            response = {
                'success': True,
                'status': status,
                'timestamp': datetime.now().isoformat()
            }
            self.send_json(response)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)
    
    def api_system_knowledge(self):
        """GET /api/system/knowledge - Get learned knowledge"""
        try:
            knowledge = show_learned_knowledge()
            response = {
                'success': True,
                'knowledge': knowledge,
                'timestamp': datetime.now().isoformat()
            }
            self.send_json(response)
        except Exception as e:
            self.send_json({'error': str(e)}, 500)
    
    def api_history(self):
        """GET /api/history - Get request history"""
        response = {
            'success': True,
            'history': request_history[-20:],
            'total': len(request_history)
        }
        self.send_json(response)
    
    def api_history_clear(self):
        """POST /api/history/clear - Clear history"""
        global request_history
        request_history = []
        self.send_json({'success': True, 'message': 'History cleared'})
    
    def api_test(self):
        """POST /api/test - Run test requests"""
        test_requests = [
            'open Chrome browser',
            'analyze Q4 sales performance',
            'what is machine learning',
        ]
        
        results = []
        for req in test_requests:
            try:
                result = process_user_request(req)
                results.append({
                    'input': req,
                    'type': result.get('type'),
                    'status': result.get('status'),
                    'success': True
                })
            except Exception as e:
                results.append({
                    'input': req,
                    'error': str(e),
                    'success': False
                })
        
        response = {
            'success': True,
            'test_results': results
        }
        self.send_json(response)
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def start_server(port=8000):
    """Start the dashboard API server"""
    server = HTTPServer(('0.0.0.0', port), DashboardAPIHandler)
    print("=" * 70)
    print("DASHBOARD API SERVER - STARTING")
    print("=" * 70)
    print("\nAPI Endpoints Available:")
    print("  GET  /api/health              - System health check")
    print("  POST /api/request             - Process user request")
    print("  GET  /api/system/status       - Get system status")
    print("  GET  /api/system/knowledge    - Get learned knowledge")
    print("  GET  /api/history             - Get request history")
    print("  POST /api/history/clear       - Clear history")
    print("  POST /api/test                - Run test requests")
    print("\n" + "=" * 70)
    print(f"Server running on http://localhost:{port}")
    print("Press Ctrl+C to stop")
    print("=" * 70 + "\n")
    
    server.serve_forever()

if __name__ == '__main__':
    try:
        start_server(8000)
    except KeyboardInterrupt:
        print("\n\nServer stopped")
    except Exception as e:
        print(f"Error: {e}")
