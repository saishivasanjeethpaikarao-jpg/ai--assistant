import os
import re
import sys
import requests
from dotenv import load_dotenv

from config_paths import ensure_user_env, get_dotenv_path

BASE_DIR = getattr(sys, "_MEIPASS", os.path.dirname(os.path.abspath(__file__)))


def _apply_firebase_secrets() -> None:
    """Optional OEM file: copy firebase_secrets.example.py -> firebase_secrets.py and fill keys."""
    try:
        from firebase_secrets import FIREBASE_DEFAULTS

        for k, v in (FIREBASE_DEFAULTS or {}).items():
            if v and not os.getenv(k):
                os.environ[k] = str(v).strip()
    except ImportError:
        pass


def reload_env() -> None:
    """Reload .env after Settings save (e.g. FIREBASE_API_KEY)."""
    _apply_firebase_secrets()
    ensure_user_env()
    load_dotenv(get_dotenv_path(), override=True)


_apply_firebase_secrets()
ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

BASE_URL = "https://identitytoolkit.googleapis.com/v1"


def _get_api_key() -> str:
    api_key = os.getenv("FIREBASE_API_KEY")
    if not api_key:
        raise RuntimeError("FIREBASE_API_KEY is not configured in .env")
    return api_key


def _endpoint(action: str) -> str:
    api_key = _get_api_key()
    return f"{BASE_URL}/accounts:{action}?key={api_key}"


def _friendly_firebase_error(code: str) -> str:
    mapping = {
        "EMAIL_EXISTS": "This account already exists. Try Sign In instead.",
        "EMAIL_NOT_FOUND": "Account not found. Check your email/phone or Sign Up first.",
        "INVALID_PASSWORD": "Incorrect password. Please try again.",
        "INVALID_EMAIL": "Invalid email format. Use a valid email or phone number.",
        "WEAK_PASSWORD": "Password is too weak. Use at least 6 characters.",
        "TOO_MANY_ATTEMPTS_TRY_LATER": "Too many attempts. Please wait and try again.",
        "OPERATION_NOT_ALLOWED": "Email/password login is not enabled in Firebase Auth settings.",
        "USER_DISABLED": "This account is disabled.",
    }
    return mapping.get(code, f"Authentication failed: {code}")


def _raise_for_firebase_error(response: requests.Response) -> None:
    try:
        data = response.json()
        code = (
            data.get("error", {}).get("message", "")
            if isinstance(data, dict)
            else ""
        )
    except Exception:
        code = ""
    message = _friendly_firebase_error(code) if code else f"HTTP {response.status_code} authentication error."
    raise RuntimeError(message)


def _post_auth(action: str, payload: dict) -> dict:
    response = requests.post(_endpoint(action), json=payload, timeout=20)
    if not response.ok:
        _raise_for_firebase_error(response)
    return response.json()


def normalize_identifier(identifier: str) -> str:
    if not identifier:
        raise ValueError("No identifier provided")
    cleaned = identifier.strip()
    if "@" in cleaned:
        return cleaned.lower()

    digits = "".join(c for c in cleaned if c.isdigit())
    if len(digits) >= 6:
        return f"phone+{digits}@firebase.local"

    raise ValueError("Provide a valid email or phone number (email or phone digits).")


def sign_in(identifier: str, password: str) -> dict:
    email = normalize_identifier(identifier)
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    return _post_auth("signInWithPassword", payload)


def sign_up(identifier: str, password: str) -> dict:
    email = normalize_identifier(identifier)
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True
    }
    return _post_auth("signUp", payload)


def get_user_info(id_token: str) -> dict:
    payload = {"idToken": id_token}
    data = _post_auth("lookup", payload)
    return data.get("users", [])[0] if data.get("users") else {}
