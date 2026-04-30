"""
Floating Assistant Orb - KivyMD widget for Jarvis Mode
Shows assistant state and provides quick access to conversation mode.
"""

from kivy.uix.floatlayout import FloatLayout
from kivy.uix.behaviors import ButtonBehavior
from kivy.properties import StringProperty, BooleanProperty
from kivy.animation import Animation
from kivy.clock import Clock
from kivy.metrics import dp
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDFloatingActionButton, MDIconButton
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard


class AssistantOrb(ButtonBehavior, MDCard):
    """Floating orb that shows assistant state and can be clicked to activate."""
    
    state = StringProperty("idle")  # idle, listening, thinking, executing, speaking
    message = StringProperty("")
    expanded = BooleanProperty(False)
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (None, None)
        self.size = (dp(60), dp(60))
        self.pos_hint = {"right": 0.95, "top": 0.9}
        self.radius = [dp(30)]
        self.elevation = 8
        self.md_bg_color = [0.2, 0.6, 1, 1]  # Blue default
        
        # Create content
        self._create_content()
        
        # Pulse animation
        self.pulse_anim = None
        self._start_pulse()
    
    def _create_content(self):
        """Create orb content."""
        self.layout = MDBoxLayout(
            orientation='vertical',
            size_hint=(1, 1),
            padding=dp(5)
        )
        self.add_widget(self.layout)
        
        # Status icon/label
        self.status_label = MDLabel(
            text="●",
            halign='center',
            valign='center',
            font_style='H5',
            theme_text_color='Custom',
            text_color=[1, 1, 1, 1]
        )
        self.layout.add_widget(self.status_label)
    
    def _start_pulse(self):
        """Start pulse animation for active states."""
        if self.pulse_anim:
            self.pulse_anim.cancel()
        
        if self.state != "idle":
            self.pulse_anim = Animation(
                elevation=12,
                duration=0.5
            ) + Animation(
                elevation=8,
                duration=0.5
            )
            self.pulse_anim.repeat = True
            self.pulse_anim.start(self)
    
    def _stop_pulse(self):
        """Stop pulse animation."""
        if self.pulse_anim:
            self.pulse_anim.cancel()
            self.pulse_anim = None
        self.elevation = 8
    
    def set_state(self, state: str):
        """Update assistant state."""
        self.state = state
        
        # Update color based on state
        state_colors = {
            "idle": [0.2, 0.6, 1, 1],      # Blue
            "listening": [0.3, 0.8, 0.3, 1],  # Green
            "thinking": [0.9, 0.6, 0.1, 1],   # Orange
            "executing": [0.9, 0.3, 0.3, 1],  # Red
            "speaking": [0.6, 0.3, 0.9, 1]    # Purple
        }
        
        self.md_bg_color = state_colors.get(state, state_colors["idle"])
        
        # Update icon
        state_icons = {
            "idle": "●",
            "listening": "🎤",
            "thinking": "🧠",
            "executing": "⚙️",
            "speaking": "🔊"
        }
        self.status_label.text = state_icons.get(state, "●")
        
        # Handle pulse
        if state == "idle":
            self._stop_pulse()
        else:
            self._start_pulse()
    
    def set_message(self, message: str):
        """Update status message."""
        self.message = message
        if self.expanded:
            self.status_label.text = message[:20] + "..."
    
    def on_press(self):
        """Handle orb press - toggle conversation mode."""
        if not self.expanded:
            self.expand()
        else:
            self.collapse()
    
    def expand(self):
        """Expand orb to show controls."""
        self.expanded = True
        anim = Animation(
            size=(dp(200), dp(120)),
            duration=0.3
        )
        anim.start(self)
        
        # Show conversation mode button
        self._show_controls()
    
    def collapse(self):
        """Collapse orb to minimal size."""
        self.expanded = False
        anim = Animation(
            size=(dp(60), dp(60)),
            duration=0.3
        )
        anim.start(self)
        
        # Hide controls
        self._hide_controls()
    
    def _show_controls(self):
        """Show control buttons when expanded."""
        # Clear current content
        self.layout.clear_widgets()
        
        # Add conversation button
        conv_btn = MDFloatingActionButton(
            icon="microphone",
            size_hint=(None, None),
            size=(dp(48), dp(48)),
            pos_hint={"center_x": 0.5}
        )
        conv_btn.bind(on_release=self._start_conversation)
        self.layout.add_widget(conv_btn)
        
        # Add status text
        self.status_label.text = self.message or "Tap to start"
        self.layout.add_widget(self.status_label)
    
    def _hide_controls(self):
        """Hide controls when collapsed."""
        self.layout.clear_widgets()
        self.status_label.text = "●"
        self.layout.add_widget(self.status_label)
    
    def _start_conversation(self, *args):
        """Start conversation mode."""
        from jarvis_mode import get_jarvis_mode
        jarvis = get_jarvis_mode()
        jarvis.start_conversation()
        self.collapse()


class AssistantPanel(MDCard):
    """Expanded panel showing detailed assistant status."""
    
    state = StringProperty("idle")
    message = StringProperty("")
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.size_hint = (None, None)
        self.size = (dp(300), dp(200))
        self.pos_hint = {"right": 0.02, "top": 0.85}
        self.radius = [dp(15)]
        self.elevation = 10
        self.md_bg_color = [0.1, 0.1, 0.1, 0.95]
        
        self._create_content()
    
    def _create_content(self):
        """Create panel content."""
        layout = MDBoxLayout(
            orientation='vertical',
            size_hint=(1, 1),
            padding=dp(15),
            spacing=dp(10)
        )
        self.add_widget(layout)
        
        # Title
        title = MDLabel(
            text="Jarvis Assistant",
            font_style='H6',
            theme_text_color='Primary',
            size_hint_y=None,
            height=dp(30)
        )
        layout.add_widget(title)
        
        # State indicator
        self.state_label = MDLabel(
            text=f"State: {self.state}",
            theme_text_color='Secondary',
            size_hint_y=None,
            height=dp(25)
        )
        layout.add_widget(self.state_label)
        
        # Message
        self.message_label = MDLabel(
            text=self.message,
            theme_text_color='Hint',
            size_hint_y=None,
            height=dp(50)
        )
        layout.add_widget(self.message_label)
        
        # Controls
        controls = MDBoxLayout(
            orientation='horizontal',
            size_hint_y=None,
            height=dp(50),
            spacing=dp(10)
        )
        layout.add_widget(controls)
        
        # Conversation button
        conv_btn = MDFloatingActionButton(
            icon="microphone",
            size_hint=(None, None),
            size=(dp(40), dp(40))
        )
        conv_btn.bind(on_release=self._start_conversation)
        controls.add_widget(conv_btn)
        
        # Stop button
        stop_btn = MDFloatingActionButton(
            icon="stop",
            size_hint=(None, None),
            size=(dp(40), dp(40))
        )
        stop_btn.bind(on_release=self._stop_conversation)
        controls.add_widget(stop_btn)
    
    def set_state(self, state: str):
        """Update state display."""
        self.state = state
        self.state_label.text = f"State: {state}"
    
    def set_message(self, message: str):
        """Update message display."""
        self.message = message
        self.message_label.text = message
    
    def _start_conversation(self, *args):
        """Start conversation mode."""
        from jarvis_mode import get_jarvis_mode
        jarvis = get_jarvis_mode()
        jarvis.start_conversation()
    
    def _stop_conversation(self, *args):
        """Stop conversation mode."""
        from jarvis_mode import get_jarvis_mode
        jarvis = get_jarvis_mode()
        jarvis.stop_conversation()
