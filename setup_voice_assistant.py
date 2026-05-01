#!/usr/bin/env python3
"""
Installation and test script for JARVIS Voice Assistant.
Checks all requirements and provides setup guidance.
"""

import sys
import subprocess
import importlib.util

def check_package(name, import_name=None):
    """Check if a package is installed."""
    if import_name is None:
        import_name = name
    
    spec = importlib.util.find_spec(import_name)
    if spec is None:
        return False, name
    return True, name

def install_package(name):
    """Install a Python package."""
    print(f"  Installing {name}...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", name, "-q"])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("\n" + "="*60)
    print("  🤖 JARVIS VOICE ASSISTANT - SETUP")
    print("="*60 + "\n")
    
    # Check Python version
    print("1. Checking Python version...")
    if sys.version_info < (3, 8):
        print(f"   ❌ Python {sys.version_info.major}.{sys.version_info.minor} detected")
        print("   ❌ Python 3.8+ required")
        return False
    print(f"   ✅ Python {sys.version_info.major}.{sys.version_info.minor} OK\n")
    
    # Required packages
    packages = [
        ("SpeechRecognition", "speech_recognition"),
        ("pyttsx3", "pyttsx3"),
        ("pydub", "pydub"),
    ]
    
    print("2. Checking required packages...\n")
    missing_packages = []
    
    for package_name, import_name in packages:
        installed, name = check_package(package_name, import_name)
        if installed:
            print(f"   ✅ {package_name}")
        else:
            print(f"   ❌ {package_name}")
            missing_packages.append(package_name)
    
    # Install missing
    if missing_packages:
        print(f"\n3. Installing {len(missing_packages)} missing package(s)...\n")
        for package in missing_packages:
            if install_package(package):
                print(f"   ✅ {package} installed")
            else:
                print(f"   ❌ Failed to install {package}")
                print(f"      Try manual install: pip install {package}")
                return False
    else:
        print("\n3. All packages already installed ✅\n")
    
    # Check for PyAudio (special handling needed on Windows)
    print("4. Checking audio system...\n")
    try:
        import pyaudio
        print("   ✅ PyAudio available")
    except ImportError:
        print("   ⚠️  PyAudio not found (needed for microphone)")
        print("      Install with: pip install pyaudio")
        print("      Windows: May require pre-built wheel")
        print("      See: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio")
    
    # Check microphone
    print("\n5. Checking microphone access...\n")
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        with sr.Microphone() as source:
            print("   ✅ Microphone detected and accessible")
    except Exception as e:
        print(f"   ⚠️  Microphone check failed: {e}")
        print("      Check system audio input settings")
    
    print("\n" + "="*60)
    print("  SETUP COMPLETE! Ready to use JARVIS Voice Assistant")
    print("="*60 + "\n")
    
    print("Quick Start Commands:\n")
    print("  Interactive mode (single command):")
    print("  $ python backend/voice_assistant.py --mode interactive\n")
    
    print("  Continuous mode (keep listening):")
    print("  $ python backend/voice_assistant.py --mode continuous\n")
    
    print("  With debug logging:")
    print("  $ python backend/voice_assistant.py --mode continuous --debug\n")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
