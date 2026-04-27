import os
import io
import time
import base64
import pyautogui

def capture_screen_base64() -> str:
    """Takes a screenshot of the entire primary display and returns it as a base64 encoded JPG."""
    screenshot = pyautogui.screenshot()
    img_byte_arr = io.BytesIO()
    screenshot.save(img_byte_arr, format='JPEG', quality=75)
    img_byte_arr = img_byte_arr.getvalue()
    return base64.b64encode(img_byte_arr).decode('utf-8')

def build_vision_payload(prompt: str) -> dict:
    """Payload for Groq vision (or text fallback) in assistant_core."""
    b64_image = capture_screen_base64()
    return {
        "text": prompt,
        "image_data": b64_image,
        "mime_type": "image/jpeg"
    }

def process_vision_command(command: str) -> str:
    """Takes the raw user command and flags it as a vision task to the core routing."""
    # The actual dispatch is handled by assistant_core since the provider wrappers live there.
    # This agent just prepares the instruction.
    return "[VISION_REQUEST] " + command
