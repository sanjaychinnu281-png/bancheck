
import json
import os
import urllib.parse
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

def reply(handler, status, payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Cache-Control", "no-store")
    handler.send_header("X-Content-Type-Options", "nosniff")
    handler.end_headers()
    handler.wfile.write(data)

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        uid = (params.get("uid") or [""])[0].strip()
        region = (params.get("region") or ["IND"])[0].strip().upper()
        if not uid or not uid.isdigit() or len(uid) > 24:
            return reply(self, 400, {"ok": False, "error": "invalid_uid", "message": "Provide a numeric uid query parameter."})
        provider = os.getenv("FF_BAN_STATUS_URL", "").strip()
        if not provider:
            return reply(self, 501, {
                "ok": False,
                "status": "unknown",
                "error": "ban_provider_not_configured",
                "message": "No reliable UID-only ban-status provider is configured. This API will not guess or label an account banned from a failed login."
            })
        if not provider.startswith("https://"):
            return reply(self, 500, {"ok": False, "error": "provider_config_error", "message": "FF_BAN_STATUS_URL must be an HTTPS URL."})
        url = provider + ("&" if "?" in provider else "?") + urllib.parse.urlencode({"uid": uid, "region": region})
        req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "CHINNU-FreeFire-API/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=8) as response:
                raw = response.read(1_000_000)
                if "json" not in response.headers.get("Content-Type", "").lower():
                    return reply(self, 502, {"ok": False, "error": "provider_non_json"})
                try:
                    data = json.loads(raw.decode("utf-8"))
                except (ValueError, UnicodeDecodeError):
                    return reply(self, 502, {"ok": False, "error": "provider_invalid_json"})
                return reply(self, 200, {"ok": True, "uid": uid, "requested_region": region, "source": "configured_ban_provider", "data": data})
        except urllib.error.HTTPError as exc:
            return reply(self, 502, {"ok": False, "error": "provider_http_error", "provider_status": exc.code})
        except Exception:
            return reply(self, 502, {"ok": False, "error": "provider_unavailable"})
