import json
import os
import urllib.parse
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler

DEFAULT_PLAYER_URL = "https://free-fire-info-ob55.vercel.app/player-info"
ALLOWED_REGIONS = {
    "IND", "BD", "BR", "NA", "US", "SAC", "ME", "VN",
    "PK", "SG", "ID", "RU", "TH", "TW", "EU"
}

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
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        uid = (params.get("uid") or [""])[0].strip()
        region = (params.get("region") or ["IND"])[0].strip().upper()

        if not uid or not uid.isdigit() or len(uid) > 24:
            return reply(self, 400, {"ok": False, "error": "invalid_uid", "message": "Provide a numeric uid query parameter."})
        if region not in ALLOWED_REGIONS:
            return reply(self, 400, {"ok": False, "error": "invalid_region", "allowed_regions": sorted(ALLOWED_REGIONS)})

        upstream = os.getenv("FF_PLAYER_INFO_URL", DEFAULT_PLAYER_URL).strip()
        if not upstream.startswith("https://"):
            return reply(self, 500, {"ok": False, "error": "provider_config_error", "message": "FF_PLAYER_INFO_URL must be an HTTPS URL."})

        # The provider's exact parameter/schema may differ. This proxy forwards uid and region.
        query = urllib.parse.urlencode({"uid": uid, "region": region})
        url = upstream + ("&" if "?" in upstream else "?") + query
        request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "CHINNU-FreeFire-API/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=8) as response:
                raw = response.read(1_000_000)
                content_type = response.headers.get("Content-Type", "")
                if "json" not in content_type.lower():
                    return reply(self, 502, {"ok": False, "error": "provider_non_json", "message": "The upstream provider did not return JSON."})
                try:
                    upstream_data = json.loads(raw.decode("utf-8"))
                except (ValueError, UnicodeDecodeError):
                    return reply(self, 502, {"ok": False, "error": "provider_invalid_json"})
                return reply(self, 200, {
                    "ok": True,
                    "uid": uid,
                    "requested_region": region,
                    "source": "configured_player_info_provider",
                    "data": upstream_data
                })
        except urllib.error.HTTPError as exc:
            return reply(self, 502, {"ok": False, "error": "provider_http_error", "provider_status": exc.code})
        except Exception:
            return reply(self, 502, {"ok": False, "error": "provider_unavailable", "message": "Could not reach the player-info provider. Check provider URL and logs."})
