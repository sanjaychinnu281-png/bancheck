import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = {
            "name": "CHINNU Free Fire API",
            "status": "online",
            "endpoints": {
                "/api/player?uid=PLAYER_ID&region=IND": "Player information lookup",
                "/api/ban?uid=PLAYER_ID&region=IND": "Ban status lookup"
            },
            "note": "Results depend on configured upstream data providers. Ban status is not guessed."
        }
        data = json.dumps(body).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

