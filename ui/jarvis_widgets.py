"""Reusable Jarvis UI widgets."""

from kivy.properties import StringProperty, BooleanProperty
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel


class MessageBubble(MDBoxLayout):
    """User (right) or assistant (left) chat bubble."""

    text = StringProperty("")
    is_user = BooleanProperty(False)


def build_message_row(text: str, is_user: bool, app) -> MDBoxLayout:
    """Programmatic row: spacer + card + spacer for alignment."""
    row = MDBoxLayout(
        orientation="horizontal",
        adaptive_height=True,
        padding=(8, 4),
        spacing=8,
    )
    left_sp = MDBoxLayout()
    right_sp = MDBoxLayout()
    card = MDCard(
        adaptive_height=True,
        size_hint_y=None,
        padding=(16, 12),
        elevation=1,
        radius=[16, 16, 4, 16] if is_user else [16, 16, 16, 4],
    )
    if is_user:
        card.md_bg_color = app.theme_cls.primary_color
        lbl_theme = "Custom"
        lbl_color = (1, 1, 1, 1)
    else:
        card.md_bg_color = app.theme_cls.bg_darkest
        lbl_theme = "Primary"
        lbl_color = None

    lbl = MDLabel(
        text=text,
        adaptive_height=True,
        markup=True,
        theme_text_color=lbl_theme if not is_user else "Custom",
    )
    if is_user:
        lbl.text_color = lbl_color
    card.add_widget(lbl)

    if is_user:
        row.add_widget(left_sp)
        row.add_widget(card)
        left_sp.size_hint_x = 0.12
        card.size_hint_x = 0.78
        right_sp.size_hint_x = 0.1
        row.add_widget(right_sp)
    else:
        row.add_widget(left_sp)
        left_sp.size_hint_x = 0.08
        card.size_hint_x = 0.84
        right_sp.size_hint_x = 0.08
        row.add_widget(card)
        row.add_widget(right_sp)
    return row
