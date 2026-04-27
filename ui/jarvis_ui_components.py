"""
JARVIS PyQt6 UI - Core Components

Base classes and utilities for the modern GUI.
Includes theming, styling, and common widgets.
"""

import sys
from enum import Enum
from dataclasses import dataclass
from typing import Optional, Callable
from pathlib import Path

from PyQt6.QtWidgets import (
    QWidget, QMainWindow, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QSystemTrayIcon, QMenu
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QObject
from PyQt6.QtGui import QIcon, QColor, QFont, QPixmap
from PyQt6.QtCore import QSize


class UIState(Enum):
    """UI Application States"""
    IDLE = "idle"
    LISTENING = "listening"
    PROCESSING = "processing"
    SPEAKING = "speaking"
    ERROR = "error"


class Theme(Enum):
    """UI Themes"""
    DARK = "dark"
    LIGHT = "light"


@dataclass
class ThemeColors:
    """Theme color definitions"""
    background: str
    foreground: str
    primary: str
    secondary: str
    accent: str
    success: str
    error: str
    warning: str


class DarkTheme(ThemeColors):
    """Dark theme colors"""
    def __init__(self):
        super().__init__(
            background="#1e1e1e",
            foreground="#e0e0e0",
            primary="#2196F3",
            secondary="#1976D2",
            accent="#64B5F6",
            success="#4CAF50",
            error="#f44336",
            warning="#ff9800"
        )


class LightTheme(ThemeColors):
    """Light theme colors"""
    def __init__(self):
        super().__init__(
            background="#ffffff",
            foreground="#212121",
            primary="#2196F3",
            secondary="#1976D2",
            accent="#64B5F6",
            success="#4CAF50",
            error="#f44336",
            warning="#ff9800"
        )


class StyleManager:
    """Manages application styling and theming"""
    
    def __init__(self, theme: Theme = Theme.DARK):
        """Initialize style manager"""
        self.theme = theme
        self.colors = self._get_theme_colors(theme)
    
    def _get_theme_colors(self, theme: Theme) -> ThemeColors:
        """Get colors for theme"""
        if theme == Theme.DARK:
            return DarkTheme()
        else:
            return LightTheme()
    
    def get_main_window_style(self) -> str:
        """Get stylesheet for main window"""
        return f"""
        QMainWindow {{
            background-color: {self.colors.background};
            color: {self.colors.foreground};
        }}
        QWidget {{
            background-color: {self.colors.background};
            color: {self.colors.foreground};
        }}
        """
    
    def get_button_style(self, is_primary: bool = False) -> str:
        """Get stylesheet for button"""
        color = self.colors.primary if is_primary else self.colors.secondary
        return f"""
        QPushButton {{
            background-color: {color};
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            font-weight: bold;
        }}
        QPushButton:hover {{
            background-color: {self.colors.accent};
        }}
        QPushButton:pressed {{
            opacity: 0.8;
        }}
        """
    
    def get_label_style(self, is_title: bool = False) -> str:
        """Get stylesheet for label"""
        if is_title:
            return f"""
            QLabel {{
                color: {self.colors.primary};
                font-weight: bold;
                font-size: 16px;
            }}
            """
        else:
            return f"""
            QLabel {{
                color: {self.colors.foreground};
            }}
            """
    
    def set_theme(self, theme: Theme) -> None:
        """Switch theme"""
        self.theme = theme
        self.colors = self._get_theme_colors(theme)


class UISignals(QObject):
    """Custom signals for UI events"""
    
    # Voice interaction signals
    wake_word_detected = pyqtSignal()
    listening_started = pyqtSignal()
    listening_stopped = pyqtSignal()
    command_received = pyqtSignal(str)
    response_received = pyqtSignal(str)
    
    # State signals
    state_changed = pyqtSignal(UIState)
    error_occurred = pyqtSignal(str)
    
    # System signals
    quit_requested = pyqtSignal()
    minimize_requested = pyqtSignal()


class StatusDisplay(QWidget):
    """Displays current application status"""
    
    def __init__(self, theme: StyleManager = None):
        """Initialize status display"""
        super().__init__()
        self.theme = theme or StyleManager()
        self.state = UIState.IDLE
        self._init_ui()
    
    def _init_ui(self) -> None:
        """Initialize UI"""
        layout = QHBoxLayout()
        
        # Status indicator
        self.indicator = QLabel()
        self.indicator.setFixedSize(16, 16)
        self.indicator.setStyleSheet(f"background-color: {self.theme.colors.secondary}; border-radius: 8px;")
        layout.addWidget(self.indicator)
        
        # Status text
        self.status_label = QLabel("Ready")
        layout.addWidget(self.status_label)
        
        layout.addStretch()
        self.setLayout(layout)
    
    def set_state(self, state: UIState) -> None:
        """Update state"""
        self.state = state
        
        state_colors = {
            UIState.IDLE: self.theme.colors.secondary,
            UIState.LISTENING: self.theme.colors.accent,
            UIState.PROCESSING: self.theme.colors.primary,
            UIState.SPEAKING: self.theme.colors.accent,
            UIState.ERROR: self.theme.colors.error
        }
        
        state_texts = {
            UIState.IDLE: "Ready",
            UIState.LISTENING: "Listening...",
            UIState.PROCESSING: "Processing...",
            UIState.SPEAKING: "Speaking...",
            UIState.ERROR: "Error"
        }
        
        color = state_colors.get(state, self.theme.colors.secondary)
        text = state_texts.get(state, "Unknown")
        
        self.indicator.setStyleSheet(f"background-color: {color}; border-radius: 8px;")
        self.status_label.setText(text)


class TitleBar(QWidget):
    """Custom title bar for main window"""
    
    def __init__(self, title: str = "JARVIS", theme: StyleManager = None):
        """Initialize title bar"""
        super().__init__()
        self.theme = theme or StyleManager()
        self.title = title
        self._init_ui()
    
    def _init_ui(self) -> None:
        """Initialize UI"""
        layout = QHBoxLayout()
        layout.setContentsMargins(16, 8, 16, 8)
        
        # Title
        title_label = QLabel(self.title)
        title_label.setFont(QFont("Arial", 14, QFont.Weight.Bold))
        title_label.setStyleSheet(f"color: {self.theme.colors.primary};")
        layout.addWidget(title_label)
        
        layout.addStretch()
        
        self.setLayout(layout)
        self.setStyleSheet(f"background-color: {self.theme.colors.background}; border-bottom: 1px solid {self.theme.colors.secondary};")


class InfoPanel(QWidget):
    """Displays application information"""
    
    def __init__(self, theme: StyleManager = None):
        """Initialize info panel"""
        super().__init__()
        self.theme = theme or StyleManager()
        self._init_ui()
    
    def _init_ui(self) -> None:
        """Initialize UI"""
        layout = QVBoxLayout()
        layout.setSpacing(8)
        
        # Title
        title = QLabel("JARVIS v4.0")
        title.setFont(QFont("Arial", 16, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {self.theme.colors.primary};")
        layout.addWidget(title)
        
        # Subtitle
        subtitle = QLabel("AI Assistant with Voice Control")
        subtitle.setStyleSheet(f"color: {self.theme.colors.secondary};")
        layout.addWidget(subtitle)
        
        # Version info
        version = QLabel("Phase 4: Modern UI")
        version.setStyleSheet(f"color: {self.theme.colors.accent}; font-size: 12px;")
        layout.addWidget(version)
        
        layout.addSpacing(16)
        
        self.setLayout(layout)


class ControlPanel(QWidget):
    """Main control panel with buttons"""
    
    signals = UISignals()
    
    def __init__(self, theme: StyleManager = None):
        """Initialize control panel"""
        super().__init__()
        self.theme = theme or StyleManager()
        self._init_ui()
    
    def _init_ui(self) -> None:
        """Initialize UI"""
        layout = QVBoxLayout()
        layout.setSpacing(12)
        
        # Listen button
        self.listen_btn = QPushButton("🎤 Start Listening")
        self.listen_btn.setStyleSheet(self.theme.get_button_style(is_primary=True))
        self.listen_btn.clicked.connect(self._on_listen_clicked)
        layout.addWidget(self.listen_btn)
        
        # Stop button
        self.stop_btn = QPushButton("⏹ Stop")
        self.stop_btn.setStyleSheet(self.theme.get_button_style())
        self.stop_btn.clicked.connect(self._on_stop_clicked)
        self.stop_btn.setEnabled(False)
        layout.addWidget(self.stop_btn)
        
        # Settings button
        self.settings_btn = QPushButton("⚙️ Settings")
        self.settings_btn.setStyleSheet(self.theme.get_button_style())
        self.settings_btn.clicked.connect(self._on_settings_clicked)
        layout.addWidget(self.settings_btn)
        
        # Info button
        self.info_btn = QPushButton("ℹ️ About")
        self.info_btn.setStyleSheet(self.theme.get_button_style())
        self.info_btn.clicked.connect(self._on_info_clicked)
        layout.addWidget(self.info_btn)
        
        self.setLayout(layout)
    
    def set_listening_mode(self, is_listening: bool) -> None:
        """Update button states for listening mode"""
        self.listen_btn.setEnabled(not is_listening)
        self.stop_btn.setEnabled(is_listening)
    
    def _on_listen_clicked(self) -> None:
        """Handle listen button click"""
        self.signals.listening_started.emit()
        self.set_listening_mode(True)
    
    def _on_stop_clicked(self) -> None:
        """Handle stop button click"""
        self.signals.listening_stopped.emit()
        self.set_listening_mode(False)
    
    def _on_settings_clicked(self) -> None:
        """Handle settings button click"""
        pass  # Implement settings dialog
    
    def _on_info_clicked(self) -> None:
        """Handle info button click"""
        pass  # Implement about dialog


class NotificationCenter(QWidget):
    """Displays notifications and recent commands"""
    
    def __init__(self, theme: StyleManager = None):
        """Initialize notification center"""
        super().__init__()
        self.theme = theme or StyleManager()
        self.notifications = []
        self._init_ui()
    
    def _init_ui(self) -> None:
        """Initialize UI"""
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Recent Activity")
        title.setFont(QFont("Arial", 12, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {self.theme.colors.primary};")
        layout.addWidget(title)
        
        # Notifications
        self.notification_label = QLabel("Waiting for input...")
        self.notification_label.setWordWrap(True)
        self.notification_label.setStyleSheet(f"color: {self.theme.colors.secondary};")
        layout.addWidget(self.notification_label)
        
        layout.addStretch()
        self.setLayout(layout)
    
    def add_notification(self, message: str, level: str = "info") -> None:
        """Add notification"""
        self.notifications.append((message, level))
        
        # Keep only last 5
        if len(self.notifications) > 5:
            self.notifications.pop(0)
        
        # Update display
        text = "\n".join([f"• {msg}" for msg, _ in self.notifications])
        self.notification_label.setText(text)
