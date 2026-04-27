"""
Waveform Visualization Widget

Displays animated waveform for voice activity.
Real-time audio level visualization with smooth animations.
"""

import math
from typing import List
from collections import deque

from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QSize
from PyQt6.QtGui import QPainter, QColor, QPen, QPainterPath


class WaveformWidget(QWidget):
    """
    Real-time waveform visualization.
    
    Features:
    - Smooth animated bars representing audio levels
    - Responsive to audio input
    - Customizable colors and heights
    - Efficient rendering
    """
    
    # Signals
    level_updated = pyqtSignal(float)
    
    def __init__(self, num_bars: int = 32, parent=None):
        """
        Initialize waveform widget.
        
        Args:
            num_bars: Number of bars to display
            parent: Parent widget
        """
        super().__init__(parent)
        self.num_bars = num_bars
        self.levels = deque([0.0] * num_bars, maxlen=num_bars)
        self.target_levels = deque([0.0] * num_bars, maxlen=num_bars)
        self.is_active = False
        self.current_level = 0.0
        
        # Animation settings
        self.animation_speed = 0.15
        self.decay_rate = 0.92
        
        # Colors
        self.color_idle = QColor("#2196F3")
        self.color_active = QColor("#4CAF50")
        self.color_peak = QColor("#FF9800")
        self.background_color = QColor("#1e1e1e")
        
        # Animation timer
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self._update_animation)
        self.animation_timer.start(50)  # 20fps
        
        self.setMinimumHeight(100)
        self.setMinimumWidth(300)
    
    def set_level(self, level: float) -> None:
        """
        Set audio level (0.0 - 1.0).
        
        Args:
            level: Audio level
        """
        self.current_level = max(0.0, min(1.0, level))
        
        # Update target levels with new value
        target_list = list(self.target_levels)
        target_list.append(self.current_level)
        target_list.pop(0)
        
        for i, val in enumerate(target_list):
            self.target_levels[i] = val
        
        self.level_updated.emit(level)
    
    def set_active(self, active: bool) -> None:
        """Set active state"""
        self.is_active = active
        if not active:
            # Decay levels when inactive
            self.current_level = 0.0
    
    def _update_animation(self) -> None:
        """Update animation frame"""
        # Smooth transition from current to target
        for i in range(len(self.levels)):
            current = self.levels[i]
            target = self.target_levels[i]
            
            # Smooth interpolation
            new_val = current + (target - current) * self.animation_speed
            
            # Apply decay if inactive
            if not self.is_active and new_val > 0.01:
                new_val *= self.decay_rate
            
            self.levels[i] = max(0.0, new_val)
        
        self.update()
    
    def paintEvent(self, event):
        """Paint waveform"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Draw background
        painter.fillRect(self.rect(), self.background_color)
        
        # Calculate bar dimensions
        width = self.width()
        height = self.height()
        bar_width = max(1, width // (self.num_bars * 2))
        spacing = bar_width
        
        # Draw bars
        x_offset = 10
        for i, level in enumerate(self.levels):
            # Calculate bar height
            bar_height = height * 0.8 * level
            
            # Determine color
            if level > 0.8:
                color = self.color_peak
            elif self.is_active and level > 0.1:
                color = self.color_active
            else:
                color = self.color_idle
            
            # Draw bar
            painter.fillRect(
                int(x_offset + i * (bar_width + spacing)),
                int(height - bar_height),
                int(bar_width),
                int(bar_height),
                color
            )
            
            # Add reflection effect
            reflection_color = QColor(color)
            reflection_color.setAlpha(50)
            painter.fillRect(
                int(x_offset + i * (bar_width + spacing)),
                int(height - bar_height),
                int(bar_width),
                int(bar_height * 0.3),
                reflection_color
            )
        
        painter.end()
    
    def sizeHint(self) -> QSize:
        """Return size hint"""
        return QSize(400, 120)


class AnimatedIndicator(QWidget):
    """
    Animated loading/listening indicator.
    
    Features:
    - Rotating circle animation
    - Color state indication
    - Smooth animation
    """
    
    def __init__(self, parent=None):
        """Initialize indicator"""
        super().__init__(parent)
        self.angle = 0
        self.state = "idle"  # idle, listening, processing
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self._update_angle)
        
        self.setMinimumSize(60, 60)
    
    def set_state(self, state: str) -> None:
        """Set indicator state"""
        self.state = state
        
        if state in ["listening", "processing"]:
            if not self.animation_timer.isActive():
                self.animation_timer.start(50)
        else:
            self.animation_timer.stop()
            self.angle = 0
        
        self.update()
    
    def _update_angle(self) -> None:
        """Update rotation angle"""
        self.angle = (self.angle + 6) % 360
        self.update()
    
    def paintEvent(self, event):
        """Paint indicator"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        center_x = self.width() // 2
        center_y = self.height() // 2
        radius = min(self.width(), self.height()) // 2 - 5
        
        # Choose color based on state
        colors = {
            "idle": QColor("#2196F3"),
            "listening": QColor("#4CAF50"),
            "processing": QColor("#FF9800")
        }
        
        color = colors.get(self.state, QColor("#2196F3"))
        
        # Draw background circle
        painter.setPen(QPen(QColor(color.red(), color.green(), color.blue(), 50), 2))
        painter.drawEllipse(
            int(center_x - radius),
            int(center_y - radius),
            int(radius * 2),
            int(radius * 2)
        )
        
        # Draw rotating arc
        if self.state in ["listening", "processing"]:
            pen = QPen(color, 3)
            pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            painter.setPen(pen)
            
            # Draw arc
            painter.translate(center_x, center_y)
            painter.rotate(self.angle)
            
            start_angle = 0
            span_angle = 90
            
            painter.drawArc(
                int(-radius),
                int(-radius),
                int(radius * 2),
                int(radius * 2),
                int(start_angle * 16),
                int(span_angle * 16)
            )
        else:
            # Draw static circle
            painter.setPen(QPen(color, 3))
            painter.drawEllipse(
                int(center_x - radius),
                int(center_y - radius),
                int(radius * 2),
                int(radius * 2)
            )
        
        painter.end()
    
    def sizeHint(self):
        """Return size hint"""
        return QSize(80, 80)


class PulseIndicator(QWidget):
    """
    Pulsing indicator for real-time feedback.
    
    Features:
    - Smooth pulsing animation
    - Color state indication
    - Responsive to activity
    """
    
    def __init__(self, parent=None):
        """Initialize pulse indicator"""
        super().__init__(parent)
        self.pulse_value = 0.0
        self.direction = 1
        self.is_active = False
        
        self.animation_timer = QTimer()
        self.animation_timer.timeout.connect(self._update_pulse)
        self.animation_timer.start(50)
        
        self.setMinimumSize(40, 40)
    
    def set_active(self, active: bool) -> None:
        """Set active state"""
        self.is_active = active
    
    def _update_pulse(self) -> None:
        """Update pulse animation"""
        if self.is_active:
            self.pulse_value += self.direction * 0.1
            
            if self.pulse_value >= 1.0:
                self.pulse_value = 1.0
                self.direction = -1
            elif self.pulse_value <= 0.0:
                self.pulse_value = 0.0
                self.direction = 1
        else:
            self.pulse_value = 0.0
        
        self.update()
    
    def paintEvent(self, event):
        """Paint pulse indicator"""
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        center_x = self.width() // 2
        center_y = self.height() // 2
        base_radius = 12
        
        # Draw outer pulse
        if self.is_active:
            outer_radius = base_radius + self.pulse_value * 10
            outer_color = QColor("#4CAF50")
            outer_color.setAlpha(int(255 * (1 - self.pulse_value)))
            painter.setBrush(outer_color)
            painter.setPen(Qt.PenStyle.NoPen)
            painter.drawEllipse(
                int(center_x - outer_radius),
                int(center_y - outer_radius),
                int(outer_radius * 2),
                int(outer_radius * 2)
            )
        
        # Draw inner circle
        color = QColor("#4CAF50") if self.is_active else QColor("#2196F3")
        painter.setBrush(color)
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(
            int(center_x - base_radius),
            int(center_y - base_radius),
            int(base_radius * 2),
            int(base_radius * 2)
        )
        
        painter.end()
    
    def sizeHint(self):
        """Return size hint"""
        return QSize(50, 50)
