"""
JARVIS Main GUI Window

Main application window with all UI components integrated.
"""

import logging
from typing import Optional, Callable
from pathlib import Path

from PyQt6.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QHBoxLayout
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread, QObject
from PyQt6.QtGui import QIcon

from ui.jarvis_ui_components import (
    StyleManager, Theme, UIState, UISignals,
    TitleBar, StatusDisplay, InfoPanel,
    ControlPanel, NotificationCenter
)
from ui.waveform_widget import WaveformWidget, AnimatedIndicator, PulseIndicator
from ui.system_tray import SystemTrayManager

logger = logging.getLogger(__name__)


class JarvisMainWindow(QMainWindow):
    """
    Main JARVIS GUI Window.
    
    Features:
    - Modern floating window interface
    - Animated waveform visualization
    - Real-time status indicators
    - System tray integration
    - Voice interaction display
    """
    
    def __init__(self):
        """Initialize main window"""
        super().__init__()
        self.setWindowTitle("JARVIS AI Assistant v4.0")
        self.setGeometry(100, 100, 600, 700)
        
        # Theme
        self.style_manager = StyleManager(Theme.DARK)
        self.setStyleSheet(self.style_manager.get_main_window_style())
        
        # Signals
        self.ui_signals = UISignals()
        self.ui_signals.state_changed.connect(self._on_state_changed)
        
        # Current state
        self.current_state = UIState.IDLE
        
        # Initialize UI
        self._init_ui()
        
        # System tray
        self.tray_manager = SystemTrayManager(self)
        self.tray_manager.signals.show_window.connect(self.show_window_safe)
        self.tray_manager.signals.hide_window.connect(self.hide_window_safe)
        self.tray_manager.signals.start_listening.connect(self._on_tray_start_listening)
        self.tray_manager.signals.stop_listening.connect(self._on_tray_stop_listening)
        self.tray_manager.signals.quit_app.connect(self.close_app)
        
        # Level update timer
        self.level_timer = QTimer()
        self.level_timer.timeout.connect(self._decay_waveform)
        self.level_timer.start(100)
        
        logger.info("Main window initialized")
    
    def _init_ui(self) -> None:
        """Initialize user interface"""
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        # Main layout
        main_layout = QVBoxLayout()
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Title bar
        self.title_bar = TitleBar("JARVIS AI Assistant", self.style_manager)
        main_layout.addWidget(self.title_bar)
        
        # Content area
        content_layout = QVBoxLayout()
        content_layout.setContentsMargins(16, 16, 16, 16)
        content_layout.setSpacing(16)
        
        # Waveform
        self.waveform = WaveformWidget(num_bars=32)
        self.waveform.color_idle = self.style_manager.colors.primary
        self.waveform.color_active = self.style_manager.colors.success
        content_layout.addWidget(self.waveform)
        
        # Indicators row
        indicators_layout = QHBoxLayout()
        indicators_layout.setSpacing(16)
        
        # Animated indicator
        self.animated_indicator = AnimatedIndicator()
        indicators_layout.addWidget(self.animated_indicator)
        
        # Pulse indicator
        self.pulse_indicator = PulseIndicator()
        indicators_layout.addWidget(self.pulse_indicator)
        
        # Status display
        self.status_display = StatusDisplay(self.style_manager)
        indicators_layout.addWidget(self.status_display)
        
        content_layout.addLayout(indicators_layout)
        
        # Info panel
        self.info_panel = InfoPanel(self.style_manager)
        content_layout.addWidget(self.info_panel)
        
        # Control panel
        self.control_panel = ControlPanel(self.style_manager)
        self.control_panel.signals.listening_started.connect(self._on_listening_started)
        self.control_panel.signals.listening_stopped.connect(self._on_listening_stopped)
        content_layout.addWidget(self.control_panel)
        
        # Notification center
        self.notification_center = NotificationCenter(self.style_manager)
        content_layout.addWidget(self.notification_center)
        
        # Create content widget
        content_widget = QWidget()
        content_widget.setLayout(content_layout)
        main_layout.addWidget(content_widget)
        
        central_widget.setLayout(main_layout)
    
    def _on_state_changed(self, state: UIState) -> None:
        """Handle state change"""
        self.current_state = state
        
        # Update indicators
        state_names = {
            UIState.IDLE: "idle",
            UIState.LISTENING: "listening",
            UIState.PROCESSING: "processing",
            UIState.SPEAKING: "speaking",
            UIState.ERROR: "error"
        }
        
        state_name = state_names.get(state, "idle")
        self.animated_indicator.set_state(state_name)
        self.pulse_indicator.set_active(state != UIState.IDLE)
        
        # Update status display
        self.status_display.set_state(state)
        
        # Update waveform
        is_active = state in [UIState.LISTENING, UIState.PROCESSING, UIState.SPEAKING]
        self.waveform.set_active(is_active)
        
        # Update tray
        self.tray_manager.set_status(state_name.capitalize())
        
        logger.info(f"State changed to: {state_name}")
    
    def _on_listening_started(self) -> None:
        """Handle listening started"""
        self.ui_signals.state_changed.emit(UIState.LISTENING)
        self.control_panel.set_listening_mode(True)
        self.tray_manager.set_listening(True)
        self.notification_center.add_notification("Listening started...")
    
    def _on_listening_stopped(self) -> None:
        """Handle listening stopped"""
        self.ui_signals.state_changed.emit(UIState.IDLE)
        self.control_panel.set_listening_mode(False)
        self.tray_manager.set_listening(False)
        self.notification_center.add_notification("Listening stopped")
    
    def _on_tray_start_listening(self) -> None:
        """Handle tray start listening"""
        self.show_window_safe()
        self.control_panel.listen_btn.click()
    
    def _on_tray_stop_listening(self) -> None:
        """Handle tray stop listening"""
        self.control_panel.stop_btn.click()
    
    def _decay_waveform(self) -> None:
        """Decay waveform levels over time"""
        if self.current_state != UIState.LISTENING:
            self.waveform.set_level(0.0)
    
    def set_audio_level(self, level: float) -> None:
        """Set current audio level"""
        self.waveform.set_level(level)
    
    def set_command(self, command: str) -> None:
        """Display command"""
        self.notification_center.add_notification(f"Command: {command}")
        self.ui_signals.state_changed.emit(UIState.PROCESSING)
    
    def set_response(self, response: str) -> None:
        """Display response"""
        self.notification_center.add_notification(f"Response: {response}")
        self.ui_signals.state_changed.emit(UIState.SPEAKING)
    
    def show_error(self, error: str) -> None:
        """Display error"""
        self.notification_center.add_notification(f"Error: {error}", level="error")
        self.ui_signals.state_changed.emit(UIState.ERROR)
        self.ui_signals.error_occurred.emit(error)
    
    def show_notification(self, message: str) -> None:
        """Show notification"""
        self.notification_center.add_notification(message)
        self.tray_manager.show_notification("JARVIS", message)
    
    def show_window_safe(self) -> None:
        """Show window safely"""
        self.setWindowState(self.windowState() & ~Qt.WindowState.WindowMinimized)
        self.show()
        self.raise_()
        self.activateWindow()
    
    def hide_window_safe(self) -> None:
        """Hide window to tray"""
        self.hide()
    
    def close_app(self) -> None:
        """Close application"""
        self.close()
    
    def changeEvent(self, event) -> None:
        """Handle window state changes"""
        from PyQt6.QtGui import QWindowStateChangeEvent
        if isinstance(event, QWindowStateChangeEvent):
            if self.isMinimized():
                self.hide_window_safe()
                event.ignore()
