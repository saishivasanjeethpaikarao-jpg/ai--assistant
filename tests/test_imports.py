import time

def test_import(module_name):
    print(f"Testing {module_name}...", end=" ", flush=True)
    start = time.time()
    try:
        __import__(module_name)
        print(f"OK ({time.time() - start:.2f}s)")
    except ImportError:
        print("MISSING")
    except Exception as e:
        print(f"FAILED: {e}")

modules = [
    "os", "re", "subprocess", "sys", "threading", "time", "audioop", 
    "requests", "speech_recognition", "pyttsx3", "pyaudio", "plyer", 
    "dotenv", "google.generativeai", "openai", "kivy", "kivymd", "pandas",
    "openpyxl", "pyautogui", "pillow", "elevenlabs", "schedule"
]

for m in modules:
    test_import(m)

print("\nImport diagnostic complete.")
