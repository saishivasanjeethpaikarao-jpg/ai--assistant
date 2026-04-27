"""Fish Audio TTS and voice model API — https://fish.audio/docs"""

from __future__ import annotations

import os
import tempfile
from typing import Any

try:
    import requests
except ImportError:
    requests = None

BASE = "https://api.fish.audio"


def fish_tts_to_file(
    text: str,
    api_key: str,
    reference_id: str,
    *,
    model: str = "s2-pro",
    timeout: int = 120,
) -> str:
    """POST /v1/tts, write audio to a temp file, return path."""
    if requests is None:
        raise RuntimeError("requests is not installed")
    t = (text or "").strip()
    if not t:
        raise ValueError("empty text")
    url = f"{BASE}/v1/tts"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json",
        "model": (model or "s2-pro").strip(),
    }
    body: dict[str, Any] = {
        "text": t,
        "reference_id": reference_id.strip(),
        "format": "mp3",
        "latency": "normal",
    }
    r = requests.post(url, headers=headers, json=body, timeout=timeout)
    if not r.ok:
        try:
            err = r.json()
        except Exception:
            err = (r.text or "")[:500]
        raise RuntimeError(f"Fish Audio TTS failed ({r.status_code}): {err}")
    suffix = ".mp3"
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    with open(path, "wb") as f:
        f.write(r.content)
    return path


def play_fish_tts(
    text: str,
    api_key: str,
    reference_id: str,
    *,
    model: str = "s2-pro",
) -> None:
    from playsound import playsound

    path = fish_tts_to_file(text, api_key, reference_id, model=model)
    try:
        playsound(path)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def fish_create_voice_model(
    api_key: str,
    title: str,
    audio_path: str,
    *,
    visibility: str = "private",
    timeout: int = 180,
) -> str:
    """POST /model (multipart). Returns model _id for use as reference_id."""
    if requests is None:
        raise RuntimeError("requests is not installed")
    if not os.path.isfile(audio_path):
        raise FileNotFoundError(audio_path)
    url = f"{BASE}/model"
    headers = {"Authorization": f"Bearer {api_key.strip()}"}
    vis = (visibility or "private").strip().lower()
    if vis not in ("public", "unlist", "private"):
        vis = "private"
    data = {
        "type": "tts",
        "title": (title or "Cloned")[:200],
        "train_mode": "fast",
        "visibility": vis,
    }
    with open(audio_path, "rb") as af:
        files = {
            "voices": (os.path.basename(audio_path), af, "application/octet-stream"),
        }
        r = requests.post(url, headers=headers, files=files, data=data, timeout=timeout)
    if r.status_code not in (200, 201):
        try:
            err = r.json()
        except Exception:
            err = (r.text or "")[:500]
        raise RuntimeError(f"Fish create model failed ({r.status_code}): {err}")
    payload = r.json()
    mid = payload.get("_id") or payload.get("id")
    if not mid:
        raise RuntimeError(f"Fish create model: unexpected response: {payload!r}")
    return str(mid)
