"""
System Tray Integration

Manages system tray icon and interactions.
Enables minimize to tray and quick access.
"""

from typing import Optional, Callable
from PyQt6.QtWidgets import QSystemTrayIcon, QMenu, QMainWindow
from PyQt6.QtGui import QIcon, QColor, QPixmap, QPainter
from PyQt6.QtCore import Qt, pyqtSignal, QObject


class UISignalsForTray(QObject):
    """Signals for tray interactions"""
    
    show_window = pyqtSignal()
    hide_window = pyqtSignal()
    start_listening = pyqtSignal()
    stop_listening = pyqtSignal()
    quit_app = pyqtSignal()


class SystemTrayManager:
    """
    Manages system tray icon and menu.
    
    Features:
    - Minimize to tray
    - Quick access menu
    - Status indication
    - Context menu actions
    """
    
    signals = UISignalsForTray()
    
    def __init__(self, parent: QMainWindow):
        """
        Initialize tray manager.
        
        Args:
            parent: Main window
        """
        self.parent = parent
        self.tray_icon = QSystemTrayIcon(parent)
        self.is_listening = False
        self._init_tray()
    
    def _init_tray(self) -> None:
        """Initialize system tray"""
        # Create icon
        icon = self._create_tray_icon()
        self.tray_icon.setIcon(icon)
        
        # Create context menu
        self.tray_menu = QMenu()
        
        # Show/Hide action
        self.show_action = self.tray_menu.addAction("Show")
        self.show_action.triggered.connect(self._on_show)
        
        self.hide_action = self.tray_menu.addAction("Hide")
        self.hide_action.triggered.connect(self._on_hide)
        
        self.tray_menu.addSeparator()
        
        # Listen action
        self.listen_action = self.tray_menu.addAction("🎤 Start Listening")
        self.listen_action.triggered.connect(self._on_listen)
        
        self.stop_action = self.tray_menu.addAction("⏹ Stop")
        self.stop_action.triggered.connect(self._on_stop)
        self.stop_action.setEnabled(False)
        
        self.tray_menu.addSeparator()
        
        # Status action (read-only)
        self.status_action = self.tray_menu.addAction("Status: Ready")
        self.status_action.setEnabled(False)
        
        self.tray_menu.addSeparator()
        
        # Quit action
        self.quit_action = self.tray_menu.addAction("Exit")
        self.quit_action.triggered.connect(self._on_quit)
        
        # Set menu
        self.tray_icon.setContextMenu(self.tray_menu)
        
        # Connect double-click
        self.tray_icon.activated.connect(self._on_tray_activated)
        
        # Show tray icon
        self.tray_icon.show()
    
    def _create_tray_icon(self) -> QIcon:
        """Create tray icon"""
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Draw circle background
        painter.fillRect(pixmap.rect(), QColor("#2196F3"))
        
        # Draw "J" (Jarvis initial)
        painter.setPen(Qt.GlobalColor.white)
        font = painter.font()
        font.setPixelSize(40)
        font.setBold(True)
        painter.setFont(font)
        painter.drawText(pixmap.rect(), Qt.AlignmentFlag.AlignCenter, "J")
        
        painter.end()
        
        return QIcon(pixmap)
    
    def set_listening(self, is_listening: bool) -> None:
        """Update listening state"""
        self.is_listening = is_listening
        
        self.listen_action.setEnabled(not is_listening)
        self.stop_action.setEnabled(is_listening)
        
        if is_listening:
            self.status_action.setText("Status: Listening...")
            self._update_tray_icon_state("listening")
        else:
            self.status_action.setText("Status: Ready")
            self._update_tray_icon_state("idle")
    
    def set_status(self, status: str) -> None:
        """Update status text"""
        self.status_action.setText(f"Status: {status}")
    
    def _update_tray_icon_state(self, state: str) -> None:
        """Update tray icon appearance based on state"""
        pixmap = QPixmap(64, 64)
        pixmap.fill(Qt.GlobalColor.transparent)
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Choose color based on state
        colors = {
            "idle": QColor("#2196F3"),
            "listening": QColor("#4CAF50"),
            "processing": QColor("#FF9800"),
            "error": QColor("#f44336")
        }
        
        color = colors.get(state, QColor("#2196F3"))
        painter.fillRect(pixmap.rect(), color)
        
        # Draw "J"
        painter.setPen(Qt.GlobalColor.white)
        font = painter.font()
        font.setPixelSize(40)
        font.setBold(True)
        painter.setFont(font)
        painter.drawText(pixmap.rect(), Qt.AlignmentFlag.AlignCenter, "J")
        
        painter.end()
        
        self.tray_icon.setIcon(QIcon(pixmap))
    
    def show_notification(self, title: str, message: str, duration: int = 5000) -> None:
        """Show tray notification"""
        self.tray_icon.showMessage(title, message, QSystemTrayIcon.MessageIcon.Information, duration)
    
    def show_window(self) -> None:
        """Show main window"""
        self.signals.show_window.emit()
    
    def hide_window(self) -> None:
        """Hide main window (to tray)"""
        self.signals.hide_window.emit()
    
    def _on_tray_activated(self, reason) -> None:
        """Handle tray icon activation"""
        if reason == QSystemTrayIcon.ActivationReason.DoubleClick:
            self.signals.show_window.emit()
    
    def _on_show(self) -> None:
        """Handle show action"""
        self.signals.show_window.emit()
    
    def _on_hide(self) -> None:
        """Handle hide action"""
        self.signals.hide_window.emit()
    
    def _on_listen(self) -> None:
        """Handle listen action"""
        self.signals.start_listening.emit()
        self.set_listening(True)
    
    def _on_stop(self) -> None:
        """Handle stop action"""
        self.signals.stop_listening.emit()
        self.set_listening(False)
    
    def _on_quit(self) -> None:
        """Handle quit action"""
        self.signals.quit_app.emit()


class TrayMenu(QMenu):
    """Enhanced context menu for tray"""
    
    def __init__(self, parent=None):
        """Initialize menu"""
        super().__init__(parent)
        self.setStyleSheet("""
            QMenu {
                background-color: #1e1e1e;
                color: #e0e0e0;
                border: 1px solid #2196F3;
            }
            QMenu::item:selected {
                background-color: #2196F3;
            }
            QMenu::separator {
                background-color: #2196F3;
            }
        """)
