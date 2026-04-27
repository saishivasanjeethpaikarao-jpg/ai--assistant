import threading
from typing import Optional

try:
    import speech_recognition as sr
except ImportError:
    sr = None


def listen_for_command() -> str:
    if sr is None:
        raise RuntimeError("Speech recognition not available. Install SpeechRecognition and PyAudio.")
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for a voice command...")
        recognizer.adjust_for_ambient_noise(source, duration=0.5)
        audio = recognizer.listen(source, timeout=6)
    try:
        command = recognizer.recognize_google(audio)
        print(f"Heard: {command}")
        return command
    except sr.UnknownValueError:
        print("Could not understand audio.")
    except sr.RequestError as exc:
        print(f"Speech service error: {exc}")
    return ""


def voice_loop(execute_fn):
    if sr is None:
        return
    while True:
        cmd = listen_for_command()
        if not cmd:
            continue
        normalized = cmd.strip().lower()
        if "hey ai" in normalized:
            print("Yes?")
            cmd = listen_for_command()
            if cmd:
                response = execute_fn(cmd)
                print(response)


def start_background_listener(execute_fn):
    thread = threading.Thread(target=voice_loop, args=(execute_fn,), daemon=True)
    thread.start()
    return thread
