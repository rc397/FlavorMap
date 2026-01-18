from __future__ import annotations

import json
import mimetypes
import os
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT_DIR = Path(__file__).resolve().parent
STATIC_DIR = ROOT_DIR / "static"
DATA_DIR = ROOT_DIR / "data"
SPOTS_FILE = DATA_DIR / "spots.json"


@dataclass(frozen=True)
class Spot:
    id: str
    name: str
    lat: float
    lng: float
    cuisine: str
    emoji: str
    note: str
    createdAt: str


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _ensure_data_files() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not SPOTS_FILE.exists():
        SPOTS_FILE.write_text("[]", encoding="utf-8")


def _read_spots() -> list[dict[str, Any]]:
    _ensure_data_files()
    try:
        raw = json.loads(SPOTS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        raw = []
    return raw if isinstance(raw, list) else []


def _write_spots(spots: list[dict[str, Any]]) -> None:
    _ensure_data_files()
    SPOTS_FILE.write_text(json.dumps(spots, ensure_ascii=False, indent=2), encoding="utf-8")


def _json(handler: BaseHTTPRequestHandler, status: int, payload: Any) -> None:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _read_json_body(handler: BaseHTTPRequestHandler) -> Any:
    length = int(handler.headers.get("Content-Length", "0") or "0")
    body = handler.rfile.read(length) if length > 0 else b""
    if not body:
        return None
    return json.loads(body.decode("utf-8"))


def _safe_static_path(url_path: str) -> Path | None:
    # Map URLs to STATIC_DIR safely.
    # '/' -> 'index.html'
    rel = url_path.lstrip("/")
    if rel == "":
        rel = "index.html"

    candidate = (STATIC_DIR / rel).resolve()
    try:
        candidate.relative_to(STATIC_DIR.resolve())
    except ValueError:
        return None
    return candidate


class FlavorMapHandler(BaseHTTPRequestHandler):
    server_version = "FlavorMapHTTP/0.1"

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/spots":
            return self._handle_get_spots()

        return self._serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/spots":
            return self._handle_post_spot()

        _json(self, HTTPStatus.NOT_FOUND, {"error": "Not found"})

    def _handle_get_spots(self) -> None:
        spots = _read_spots()
        _json(self, HTTPStatus.OK, {"spots": spots})

    def _handle_post_spot(self) -> None:
        try:
            body = _read_json_body(self)
        except json.JSONDecodeError:
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "Invalid JSON"})

        if not isinstance(body, dict):
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "Expected JSON object"})

        name = str(body.get("name", "")).strip()
        cuisine = str(body.get("cuisine", "")).strip()
        note = str(body.get("note", "")).strip()
        emoji = str(body.get("emoji", "")).strip()

        try:
            lat = float(body.get("lat"))
            lng = float(body.get("lng"))
        except (TypeError, ValueError):
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "lat/lng must be numbers"})

        if not name or len(name) > 80:
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "name is required (max 80 chars)"})
        if not cuisine or len(cuisine) > 40:
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "cuisine is required (max 40 chars)"})
        if len(note) > 240:
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "note too long (max 240 chars)"})
        if not emoji or len(emoji) > 4:
            return _json(self, HTTPStatus.BAD_REQUEST, {"error": "emoji is required"})

        spots = _read_spots()
        spot_id = f"s_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        spot = Spot(
            id=spot_id,
            name=name,
            lat=lat,
            lng=lng,
            cuisine=cuisine,
            emoji=emoji,
            note=note,
            createdAt=_now_iso(),
        )
        spots.append(asdict(spot))
        _write_spots(spots)
        _json(self, HTTPStatus.CREATED, {"spot": asdict(spot)})

    def _serve_static(self, url_path: str) -> None:
        path = _safe_static_path(url_path)
        if path is None:
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        if path.is_dir():
            path = path / "index.html"

        if not path.exists() or not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        content = path.read_bytes()
        content_type, _ = mimetypes.guess_type(str(path))
        if content_type is None:
            content_type = "application/octet-stream"

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format: str, *args: Any) -> None:
        # Keep logs readable.
        print(f"{self.address_string()} - {format % args}")


def main() -> None:
    _ensure_data_files()

    host = os.environ.get("FLAVORMAP_HOST", "127.0.0.1")
    port = int(os.environ.get("FLAVORMAP_PORT", "8000"))

    server = ThreadingHTTPServer((host, port), FlavorMapHandler)
    print(f"FlavorMap running on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
