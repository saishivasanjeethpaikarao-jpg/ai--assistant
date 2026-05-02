"""
Airis AI — desktop entry point (no console). Launches the KivyMD shell.
"""

import kivymd.icon_definitions  # noqa: F401 — PyInstaller
import kivymd.font_definitions  # noqa: F401

from config_paths import ensure_user_env

if __name__ == "__main__":
    ensure_user_env()
    from ui.airis_app import AirisApp

    AirisApp().run()
