"""
JARVIS PyQt6 UI - Core UI Components Module

Public API for UI components.
"""

from .jarvis_ui_components import (
    UIState,
    Theme,
    ThemeColors,
    DarkTheme,
    LightTheme,
    StyleManager,
    UISignals,
    StatusDisplay,
    TitleBar,
    InfoPanel,
    ControlPanel,
    NotificationCenter
)

from .waveform_widget import (
    WaveformWidget,
    AnimatedIndicator,
    PulseIndicator
)

from .system_tray import (
    SystemTrayManager,
    UISignalsForTray,
    TrayMenu
)

from .jarvis_main_window import (
    JarvisMainWindow
)

__all__ = [
    "UIState",
    "Theme",
    "ThemeColors",
    "DarkTheme",
    "LightTheme",
    "StyleManager",
    "UISignals",
    "StatusDisplay",
    "TitleBar",
    "InfoPanel",
    "ControlPanel",
    "NotificationCenter",
    "WaveformWidget",
    "AnimatedIndicator",
    "PulseIndicator",
    "SystemTrayManager",
    "UISignalsForTray",
    "TrayMenu",
    "JarvisMainWindow"
]
