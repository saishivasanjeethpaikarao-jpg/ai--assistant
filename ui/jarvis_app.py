"""
Production Jarvis-style shell: sidebar, main content, context panel.
"""

from __future__ import annotations

import os
import threading
from datetime import datetime, timedelta
from functools import partial

import kivymd.icon_definitions  # noqa: F401
import kivymd.font_definitions  # noqa: F401

from kivy.lang import Builder
from kivy.clock import mainthread, Clock
from kivy.properties import StringProperty, BooleanProperty, NumericProperty
from kivy.core.window import Window
from kivy.metrics import dp
from kivy.animation import Animation
from kivy.uix.screenmanager import Screen, ScreenManager, FadeTransition
from kivymd.app import MDApp
from kivymd.uix.dialog import MDDialog
from kivymd.uix.button import MDFlatButton, MDRaisedButton
from kivymd.uix.list import OneLineListItem
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.textfield import MDTextField
from kivymd.uix.label import MDLabel
from kivymd.uix.card import MDCard

from assistant_core import (
    handle_command,
    listen_voice_once,
    set_user,
    voice_loop,
    get_user_profile,
    start_reminder_monitor,
    get_reminder_count,
)
from assistant_persona import ASSISTANT_TAGLINE
import firebase_auth
from firebase_auth import sign_in, sign_up
from ai_switcher import has_provider_configured, save_provider_setting, refresh_providers
from memory.reminders import (
    load_reminders,
    add_reminder,
    delete_reminder_at,
    set_reminder_completed,
)
from ui.chat_history_store import load_sessions, append_turn
from ui.jarvis_widgets import build_message_row
from config_paths import ensure_user_env, get_dotenv_path
from config_prefs import load_prefs, save_prefs
from system_theme import system_prefers_dark

JARVIS_KV = """
#:import Widget kivy.uix.widget.Widget
#:import MDFillRoundFlatButton kivymd.uix.button.MDFillRoundFlatButton
#:import MDFloatingActionButton kivymd.uix.button.MDFloatingActionButton
#:import MDTextButton kivymd.uix.button.MDTextButton
#:import MDSeparator kivymd.uix.card.MDSeparator
#:import MDTopAppBar kivymd.uix.toolbar.MDTopAppBar
#:import MDNavigationRail kivymd.uix.navigationrail.MDNavigationRail
#:import MDNavigationRailItem kivymd.uix.navigationrail.MDNavigationRailItem
#:import MDSwitch kivymd.uix.selectioncontrol.MDSwitch

<LoginScreen>:
    name: 'login'
    MDBoxLayout:
        orientation: 'vertical'
        padding: dp(24)
        md_bg_color: app.theme_cls.bg_darkest
        MDCard:
            orientation: 'vertical'
            padding: dp(28)
            spacing: dp(16)
            size_hint: 0.92, None
            height: self.minimum_height
            pos_hint: {'center_x': 0.5, 'center_y': 0.5}
            radius: [dp(20)]
            elevation: 8
            MDLabel:
                text: 'Jarvis AI'
                halign: 'center'
                font_style: 'H3'
                bold: True
            MDLabel:
                text: app.app_tagline
                halign: 'center'
                theme_text_color: 'Secondary'
            MDSeparator:
            MDTextField:
                id: identifier
                hint_text: 'Email or phone'
                mode: 'rectangle'
            MDTextField:
                id: password
                hint_text: 'Password'
                password: True
                mode: 'rectangle'
            MDLabel:
                id: login_error
                text: ''
                theme_text_color: 'Error'
                halign: 'center'
                adaptive_height: True
            MDBoxLayout:
                adaptive_height: True
                spacing: dp(12)
                MDFillRoundFlatButton:
                    text: 'Sign In'
                    size_hint_x: 0.5
                    on_release: app.login(False)
                MDRaisedButton:
                    text: 'Sign Up'
                    size_hint_x: 0.5
                    on_release: app.login(True)
            MDTextButton:
                text: 'Continue as Guest'
                pos_hint: {'center_x': 0.5}
                on_release: app.guest_login()

<MainShellScreen>:
    name: 'main'
    MDBoxLayout:
        orientation: 'horizontal'
        md_bg_color: app.theme_cls.bg_darkest
        MDBoxLayout:
            orientation: 'vertical'
            size_hint_x: None
            width: app.sidebar_width
            md_bg_color: app.theme_cls.bg_dark
            MDNavigationRail:
                id: nav_rail
                size_hint_y: 1
                type: 'labeled' if app.sidebar_expanded else 'unselected'
                md_bg_color: app.theme_cls.bg_dark
                anchor: 'top'
                padding: [0, dp(8), 0, dp(8)]
                MDNavigationRailItem:
                    text: 'Chat'
                    icon: 'message-text'
                MDNavigationRailItem:
                    text: 'Reminders'
                    icon: 'bell'
                MDNavigationRailItem:
                    text: 'History'
                    icon: 'history'
                MDNavigationRailItem:
                    text: 'Files'
                    icon: 'folder-code'
                MDNavigationRailItem:
                    text: 'Settings'
                    icon: 'cog'
            MDIconButton:
                icon: 'chevron-double-right' if not app.sidebar_expanded else 'chevron-double-left'
                theme_icon_color: 'Hint'
                on_release: app.toggle_sidebar()
        MDBoxLayout:
            orientation: 'vertical'
            MDBoxLayout:
                size_hint_y: None
                height: dp(52)
                padding: dp(12), dp(6)
                spacing: dp(8)
                md_bg_color: app.theme_cls.bg_dark
                MDLabel:
                    text: 'Jarvis AI'
                    font_style: 'H6'
                    bold: True
                    size_hint_x: None
                MDLabel:
                    text: app.status_pill_text
                    theme_text_color: 'Secondary'
                    font_style: 'Caption'
                    size_hint_x: None
                Widget:
                    size_hint_x: 1
                MDLabel:
                    text: app.user_display
                    theme_text_color: 'Hint'
                    font_style: 'Caption'
                    size_hint_x: None
                MDIconButton:
                    id: top_mic
                    icon: 'microphone'
                    on_release: app.start_voice()
                MDBoxLayout:
                    orientation: 'horizontal'
                    size_hint_x: None
                    width: app.reminder_bar_width
                    MDIconButton:
                        icon: 'bell-outline'
                        on_release: app.show_reminders()
                    MDLabel:
                        text: app.reminder_badge_text
                        theme_text_color: 'Error'
                        font_style: 'Overline'
                        bold: True
                        size_hint_x: None
                        width: dp(22) if app.reminder_badge_text else 0
                        halign: 'center'
                MDIconButton:
                    icon: 'theme-light-dark'
                    on_release: app.toggle_theme()
                MDIconButton:
                    icon: 'cog-outline'
                    on_release: app.open_settings()
                MDIconButton:
                    icon: 'logout'
                    on_release: app.logout()
            ScreenManager:
                id: center_sm
                transition: FadeTransition(duration=0.15)
                Screen:
                    name: 'chat'
                    MDBoxLayout:
                        orientation: 'vertical'
                        ScrollView:
                            id: chat_scroll
                            bar_width: dp(5)
                            MDBoxLayout:
                                id: chat_list
                                orientation: 'vertical'
                                adaptive_height: True
                                padding: app.chat_pad_v, dp(12)
                                spacing: dp(8)
                        MDBoxLayout:
                            id: typing_row
                            size_hint_y: None
                            height: dp(26) if app.typing_visible else 0
                            opacity: 1 if app.typing_visible else 0
                            padding: dp(20), 0
                            MDLabel:
                                text: '● ● ●'
                                theme_text_color: 'Hint'
                        MDBoxLayout:
                            size_hint_y: None
                            height: app.chat_input_h
                            padding: dp(12), dp(8), dp(12), dp(14)
                            spacing: dp(8)
                            md_bg_color: app.theme_cls.bg_dark
                            MDTextField:
                                id: command_input
                                hint_text: 'Ask Jarvis anything...'
                                mode: 'rectangle'
                                multiline: True
                                size_hint_x: 1
                            MDIconButton:
                                id: mic_button
                                icon: 'microphone'
                                on_release: app.start_voice()
                            MDRaisedButton:
                                text: 'Brief'
                                size_hint_x: None
                                width: dp(76)
                                on_release: app.daily_briefing()
                            MDFlatButton:
                                text: 'Clear'
                                on_release: app.clear_chat()
                            MDFloatingActionButton:
                                icon: 'send'
                                on_release: app.send_command()
                Screen:
                    name: 'reminders'
                    MDBoxLayout:
                        orientation: 'vertical'
                        padding: dp(16)
                        spacing: dp(12)
                        MDBoxLayout:
                            adaptive_height: True
                            MDLabel:
                                text: 'Reminders'
                                font_style: 'H5'
                                bold: True
                            Widget:
                                size_hint_x: 1
                            MDFloatingActionButton:
                                icon: 'plus'
                                on_release: app.open_add_reminder_dialog()
                        ScrollView:
                            MDBoxLayout:
                                id: reminder_list
                                orientation: 'vertical'
                                adaptive_height: True
                                spacing: dp(8)
                Screen:
                    name: 'memory'
                    MDBoxLayout:
                        orientation: 'vertical'
                        padding: dp(16)
                        spacing: dp(12)
                        MDLabel:
                            text: 'History'
                            font_style: 'H5'
                            bold: True
                        MDTextField:
                            id: history_search
                            hint_text: 'Search conversations...'
                            mode: 'rectangle'
                            on_text: app.refresh_history_list()
                        ScrollView:
                            MDBoxLayout:
                                id: history_list
                                orientation: 'vertical'
                                adaptive_height: True
                                spacing: dp(4)
                Screen:
                    name: 'files'
                    MDBoxLayout:
                        orientation: 'vertical'
                        padding: dp(16)
                        spacing: dp(12)
                        MDBoxLayout:
                            adaptive_height: True
                            spacing: dp(8)
                            MDLabel:
                                text: 'Files & code'
                                font_style: 'H5'
                                bold: True
                            Widget:
                                size_hint_x: 1
                            MDRaisedButton:
                                text: 'Open folder'
                                size_hint_x: None
                                on_release: app.files_open_project_folder()
                            MDRaisedButton:
                                text: 'Create'
                                size_hint_x: None
                                on_release: app.files_quick_create()
                            MDRaisedButton:
                                text: 'Run'
                                size_hint_x: None
                                on_release: app.files_run_project()
                            MDRaisedButton:
                                text: 'Refresh'
                                size_hint_x: None
                                on_release: app.refresh_files_list()
                        ScrollView:
                            MDBoxLayout:
                                id: files_list
                                orientation: 'vertical'
                                adaptive_height: True
                                spacing: dp(4)
        MDCard:
            id: context_panel
            orientation: 'vertical'
            size_hint_x: None
            width: app.context_panel_width
            padding: dp(14)
            spacing: dp(8)
            md_bg_color: app.theme_cls.bg_dark
            MDLabel:
                text: 'Context'
                font_style: 'Subtitle1'
                bold: True
            ScrollView:
                MDLabel:
                    id: context_body
                    text: app.context_text
                    theme_text_color: 'Secondary'
                    adaptive_height: True
                    text_size: self.width, None

<SettingsScreen>:
    name: 'settings'
    MDBoxLayout:
        orientation: 'vertical'
        MDTopAppBar:
            title: 'Settings'
            left_action_items: [['arrow-left', lambda x: app.close_settings()]]
        ScrollView:
            MDBoxLayout:
                orientation: 'vertical'
                padding: dp(20)
                spacing: dp(14)
                adaptive_height: True
                MDLabel:
                    text: 'Appearance'
                    font_style: 'H6'
                MDLabel:
                    text: 'Theme follows Windows when System is selected.'
                    theme_text_color: 'Secondary'
                    font_style: 'Caption'
                    adaptive_height: True
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDRaisedButton:
                        text: 'Dark'
                        size_hint_x: 0.33
                        on_release: app.set_appearance_mode('dark')
                    MDRaisedButton:
                        text: 'Light'
                        size_hint_x: 0.33
                        on_release: app.set_appearance_mode('light')
                    MDRaisedButton:
                        text: 'System'
                        size_hint_x: 0.33
                        on_release: app.set_appearance_mode('system')
                MDLabel:
                    text: 'Density'
                    font_style: 'Subtitle1'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDRaisedButton:
                        text: 'Comfortable'
                        on_release: app.set_density_mode('comfortable')
                    MDRaisedButton:
                        text: 'Compact'
                        on_release: app.set_density_mode('compact')
                MDSeparator:
                MDLabel:
                    text: 'Notifications'
                    font_style: 'H6'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDSwitch:
                        id: switch_notif_reminders
                        size_hint_x: None
                        width: dp(48)
                    MDLabel:
                        text: 'Reminder toasts'
                        valign: 'center'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDSwitch:
                        id: switch_notif_sound
                        size_hint_x: None
                        width: dp(48)
                    MDLabel:
                        text: 'Sound with notifications (Windows)'
                        valign: 'center'
                MDSeparator:
                MDLabel:
                    text: 'Account (Firebase)'
                    font_style: 'H6'
                MDLabel:
                    text: 'Email/password sign-in (use your Gmail as email). Enable Email/Password in Firebase Console.'
                    theme_text_color: 'Secondary'
                    font_style: 'Caption'
                    adaptive_height: True
                MDTextField:
                    id: firebase_api
                    hint_text: 'FIREBASE Web API Key'
                    mode: 'rectangle'
                MDLabel:
                    text: 'AI (Groq + Ollama only)'
                    font_style: 'H6'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDSwitch:
                        id: switch_app_keys
                        size_hint_x: None
                        width: dp(48)
                    MDLabel:
                        text: 'Use keys below as app overrides (else .env only)'
                        valign: 'center'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDSwitch:
                        id: switch_ollama
                        size_hint_x: None
                        width: dp(48)
                    MDLabel:
                        text: 'Enable Ollama (all installed models are used automatically)'
                        valign: 'center'
                MDTextField:
                    id: groq_api
                    hint_text: 'Groq API Key'
                    mode: 'rectangle'
                MDTextField:
                    id: groq_model
                    hint_text: 'Groq chat model (optional)'
                    mode: 'rectangle'
                MDTextField:
                    id: ollama_url
                    hint_text: 'Ollama URL (e.g. http://127.0.0.1:11434)'
                    mode: 'rectangle'
                MDTextField:
                    id: ollama_model
                    hint_text: 'Ollama fallback model if list API fails'
                    mode: 'rectangle'
                MDTextField:
                    id: fish_audio_api
                    hint_text: 'Fish Audio API key (https://fish.audio/app/)'
                    password: True
                MDTextField:
                    id: fish_audio_ref
                    hint_text: 'Fish voice model ID (reference_id)'
                MDTextField:
                    id: fish_audio_model
                    hint_text: 'Fish TTS model header: s2-pro or s1'
                MDTextField:
                    id: elevenlabs_api
                    hint_text: 'ElevenLabs API Key (optional)'
                    password: True
                MDTextField:
                    id: elevenlabs_voice
                    hint_text: 'ElevenLabs Voice ID (optional)'
                MDFillRoundFlatButton:
                    text: 'Save all settings'
                    on_release: app.save_all_settings()
                MDSeparator:
                MDLabel:
                    text: 'Voice'
                    font_style: 'H6'
                MDLabel:
                    id: voice_priority_hint
                    text: 'Voice engine priority (comma separated): fish,eleven,self'
                    theme_text_color: 'Secondary'
                    font_style: 'Caption'
                    adaptive_height: True
                MDTextField:
                    id: voice_priority
                    hint_text: 'Voice priority e.g. fish,eleven,self'
                    mode: 'rectangle'
                MDBoxLayout:
                    adaptive_height: True
                    spacing: dp(8)
                    MDRaisedButton:
                        text: 'Fish > Eleven > Self'
                        on_release: app.set_voice_priority('fish,eleven,self')
                    MDRaisedButton:
                        text: 'Eleven > Fish > Self'
                        on_release: app.set_voice_priority('eleven,fish,self')
                    MDRaisedButton:
                        text: 'Self > Fish > Eleven'
                        on_release: app.set_voice_priority('self,fish,eleven')
                MDFlatButton:
                    id: lang_toggle_btn
                    text: 'English' if app.voice_language == 'en' else 'Telugu'
                    on_release: app.toggle_voice_language()
                MDRaisedButton:
                    text: 'Self clone voice (Fish or ElevenLabs)'
                    on_release: app.open_file_manager()
                MDSeparator:
                MDFlatButton:
                    text: 'Log out'
                    theme_text_color: 'Error'
                    on_release: app.logout()
"""


class LoginScreen(Screen):
    pass


class MainShellScreen(Screen):
    pass


class SettingsScreen(Screen):
    pass


Builder.load_string(JARVIS_KV)


class JarvisApp(MDApp):
    status_text = StringProperty("Ready")
    user_display = StringProperty("Guest")
    reminder_count = StringProperty("0")
    reminder_badge_text = StringProperty("")
    reminder_bar_width = NumericProperty(48)
    app_name = StringProperty("Jarvis AI")
    app_tagline = StringProperty(ASSISTANT_TAGLINE)
    active_nav = StringProperty("chat")
    status_pill_text = StringProperty("● Online")
    typing_visible = BooleanProperty(False)
    context_text = StringProperty("Tip: select a history item or reminder.")
    context_panel_width = NumericProperty(260)
    voice_language = StringProperty("en")
    ui_busy = BooleanProperty(False)
    sidebar_expanded = BooleanProperty(False)
    sidebar_width = NumericProperty(72)
    appearance_mode = StringProperty("dark")
    chat_pad_v = NumericProperty(16)
    chat_input_h = NumericProperty(100)
    density_compact = BooleanProperty(False)

    def build(self):
        ensure_user_env()
        Window.minimum_width = 880
        Window.minimum_height = 540
        Window.size = (1080, 700)
        self.title = "Jarvis AI"
        self.theme_cls.primary_palette = "Indigo"
        self.theme_cls.accent_palette = "Teal"
        self.theme_cls.theme_style = "Dark"
        self.file_manager = None
        self.provider_dialog = None
        self.mic_anim = None
        self._system_theme_ev = None
        self.sidebar_width = dp(72)
        sm = ScreenManager(transition=FadeTransition(duration=0.12))
        sm.add_widget(LoginScreen())
        sm.add_widget(MainShellScreen())
        sm.add_widget(SettingsScreen())
        return sm

    def on_start(self):
        self.status_text = "Initializing…"
        try:
            from actions.automation_agent import start_automation_agent
            start_automation_agent()
        except Exception as e:
            print(f"Automation agent: {e}")
        self.status_pill_text = "● Online"
        self.update_reminder_count()
        self.mic_anim = Animation(
            md_bg_color=[0.85, 0.25, 0.35, 1], duration=0.45
        ) + Animation(md_bg_color=self.theme_cls.bg_dark, duration=0.45)
        self.mic_anim.repeat = True
        threading.Thread(target=voice_loop, daemon=True).start()
        Clock.schedule_once(self._bind_chat_keys, 0.8)
        Clock.schedule_once(self._wire_nav_rail, 0.02)
        Clock.schedule_once(self._apply_saved_appearance, 0.06)

    def _main(self):
        return self.root.get_screen("main")

    def _bind_chat_keys(self, dt):
        try:
            shell = self.root.get_screen("main")
            inp = shell.ids.center_sm.get_screen("chat").ids.command_input
            ti = None
            for w in inp.walk():
                if w.__class__.__name__ == "TextInput":
                    ti = w
                    break
            if ti:

                def on_key(instance, key, scancode, codepoint, modifiers):
                    if key == 13 and modifiers and "shift" in modifiers:
                        return False
                    if key == 13:
                        self.send_command()
                        return True
                    return False

                ti.bind(on_key_down=on_key)
        except Exception:
            pass

    def _wire_nav_rail(self, *args):
        try:
            rail = self._main().ids.nav_rail
            rail.bind(on_item_release=self._on_nav_rail_item)
            self._highlight_nav_rail(self.active_nav)
        except Exception:
            pass

    def _on_nav_rail_item(self, rail, item):
        mapping = {
            "Chat": "chat",
            "Reminders": "reminders",
            "History": "memory",
            "Files": "files",
        }
        if item.text == "Settings":
            self.open_settings()
            return
        if item.text in mapping:
            self.set_nav(mapping[item.text])

    def _highlight_nav_rail(self, name: str):
        try:
            rail = self._main().ids.nav_rail
        except Exception:
            return
        labels = {
            "chat": "Chat",
            "reminders": "Reminders",
            "memory": "History",
            "files": "Files",
        }
        want = labels.get(name)
        if not want:
            return
        for it in rail.get_items():
            it.active = it.text == want

    def toggle_sidebar(self):
        self.sidebar_expanded = not self.sidebar_expanded
        try:
            rail = self._main().ids.nav_rail
            rail.type = "labeled" if self.sidebar_expanded else "unselected"
        except Exception:
            pass
        tgt = dp(220) if self.sidebar_expanded else dp(72)
        Animation(sidebar_width=tgt, duration=0.2, t="out_quad").start(self)

    def _apply_saved_appearance(self, *args):
        p = load_prefs()
        self.appearance_mode = p.get("appearance", "dark")
        self._sync_theme_from_mode()
        self.density_compact = p.get("density", "comfortable") == "compact"
        self._apply_density_ui()
        self._ensure_system_theme_poll()

    def _sync_theme_from_mode(self, *args):
        p = load_prefs()
        mode = p.get("appearance", "dark")
        if mode == "system":
            self.theme_cls.theme_style = "Dark" if system_prefers_dark() else "Light"
        else:
            self.theme_cls.theme_style = "Dark" if mode == "dark" else "Light"

    def _ensure_system_theme_poll(self):
        if self._system_theme_ev is not None:
            self._system_theme_ev.cancel()
            self._system_theme_ev = None
        if load_prefs().get("appearance") == "system":
            self._system_theme_ev = Clock.schedule_interval(
                lambda dt: self._sync_theme_from_mode(), 30
            )

    def set_appearance_mode(self, mode: str):
        save_prefs({"appearance": mode})
        self.appearance_mode = mode
        self._sync_theme_from_mode()
        self._ensure_system_theme_poll()

    def set_density_mode(self, mode: str):
        save_prefs({"density": mode})
        self.density_compact = mode == "compact"
        self._apply_density_ui()

    def _apply_density_ui(self):
        self.chat_pad_v = dp(8) if self.density_compact else dp(16)
        self.chat_input_h = dp(80) if self.density_compact else dp(100)

    def set_nav(self, name: str):
        self.active_nav = name
        sm = self._main().ids.center_sm
        if sm.has_screen(name):
            sm.current = name
        self._sync_nav_colors()
        self._highlight_nav_rail(name)
        if name == "reminders":
            self.refresh_reminder_list()
        elif name == "memory":
            self.refresh_history_list()
        elif name == "files":
            self.refresh_files_list()

    def _sync_nav_colors(self):
        pass

    def set_status_mode(self, mode: str):
        if mode == "listening":
            self.status_pill_text = "● Listening"
        elif mode == "thinking":
            self.status_pill_text = "● Thinking"
        else:
            self.status_pill_text = "● Online"

    def append_message(self, sender: str, text: str):
        if not text:
            return
        shell = self.root.get_screen("main")
        lst = shell.ids.center_sm.get_screen("chat").ids.chat_list
        is_u = sender.lower() == "you"
        row = build_message_row(text, is_u, self)
        row.opacity = 0
        lst.add_widget(row)
        Animation(opacity=1, duration=0.2, t="out_quad").start(row)
        Clock.schedule_once(lambda dt: setattr(shell.ids.chat_scroll, "scroll_y", 0), 0.05)

    def update_reminder_count(self):
        uid = get_user_profile().get("uid")
        n = get_reminder_count(uid)
        self.reminder_count = str(n)
        self.reminder_badge_text = str(n) if n else ""
        self.reminder_bar_width = dp(48) + (dp(22) if n else 0)

    def login(self, signup_or_ident=False, password=None):
        """KV: login(False) / login(True). Programmatic: login(email, password)."""
        scr = self.root.get_screen("login")
        scr.ids.login_error.text = ""
        if password is not None:
            scr.ids.identifier.text = str(signup_or_ident).strip()
            scr.ids.password.text = str(password).strip()
            signup = False
        else:
            signup = bool(signup_or_ident)
        ident = scr.ids.identifier.text.strip()
        pwd = scr.ids.password.text.strip()
        if not ident or not pwd:
            scr.ids.login_error.text = "Enter email/phone and password."
            return
        self.set_status_mode("thinking")
        threading.Thread(
            target=self._authenticate, args=(ident, pwd, signup), daemon=True
        ).start()

    def signUp(self, email: str, password: str):
        scr = self.root.get_screen("login")
        scr.ids.login_error.text = ""
        scr.ids.identifier.text = (email or "").strip()
        scr.ids.password.text = (password or "").strip()
        ident = scr.ids.identifier.text.strip()
        pwd = scr.ids.password.text.strip()
        if not ident or not pwd:
            scr.ids.login_error.text = "Enter email/phone and password."
            return
        self.set_status_mode("thinking")
        threading.Thread(
            target=self._authenticate, args=(ident, pwd, True), daemon=True
        ).start()

    def _authenticate(self, ident: str, pwd: str, signup: bool):
        try:
            result = sign_up(ident, pwd) if signup else sign_in(ident, pwd)
            uid = result.get("localId")
            email = result.get("email")
            phone = result.get("phoneNumber")
            set_user(uid, email=email, phone=phone)
            dn = email or phone or uid
            Clock.schedule_once(lambda dt: self._after_auth(dn), 0)
        except Exception as e:
            Clock.schedule_once(lambda dt: self._login_err(str(e)), 0)
        finally:
            Clock.schedule_once(lambda dt: self.set_status_mode("ready"), 0)

    @mainthread
    def _login_err(self, msg: str):
        self.root.get_screen("login").ids.login_error.text = msg

    @mainthread
    def _after_auth(self, display_name: str):
        self.user_display = display_name
        self.root.current = "main"
        self.append_message("Assistant", "Welcome back. Your session is ready.")
        self.update_reminder_count()
        uid = get_user_profile().get("uid")
        if uid:
            start_reminder_monitor(uid)
        self.ensure_provider_configured()

    def guest_login(self):
        set_user("guest", email=None, phone=None)
        self.user_display = "Guest"
        self.root.current = "main"
        self.append_message("Assistant", "Guest mode. Memories are limited.")
        self.ensure_provider_configured()

    def ensure_provider_configured(self):
        if not has_provider_configured():
            self.show_provider_setup_dialog()

    def show_provider_setup_dialog(self):
        if self.provider_dialog:
            self.provider_dialog.open()
            return
        box = MDBoxLayout(orientation="vertical", spacing="12dp", size_hint_y=None, height="160dp")
        self._pt = MDTextField(hint_text="groq | ollama")
        self._pv = MDTextField(hint_text="API key or Ollama URL")
        box.add_widget(self._pt)
        box.add_widget(self._pv)
        self.provider_dialog = MDDialog(
            title="Configure AI",
            type="custom",
            content_cls=box,
            buttons=[
                MDFlatButton(text="Cancel", on_release=lambda x: self.provider_dialog.dismiss()),
                MDFlatButton(text="Save", on_release=self.save_provider_config),
            ],
        )
        self.provider_dialog.open()

    def save_provider_config(self, *a):
        p = self._pt.text.strip().lower()
        v = self._pv.text.strip()
        if not p or not v:
            return
        if p == "groq":
            save_provider_setting("GROQ_API_KEY", v)
        elif p == "ollama":
            save_provider_setting("OLLAMA_URL", v)
        refresh_providers()
        self.provider_dialog.dismiss()

    def open_settings(self):
        import os
        from dotenv import load_dotenv

        scr = self.root.get_screen("settings")
        p = get_dotenv_path()
        if os.path.exists(p):
            load_dotenv(p, override=True)
        prefs = load_prefs()
        inline = prefs.get("inline_api_keys") or {}

        def _v(key):
            return (os.getenv(key, "") or inline.get(key, "")).strip()

        scr.ids.firebase_api.text = _v("FIREBASE_API_KEY")
        scr.ids.groq_api.text = _v("GROQ_API_KEY")
        scr.ids.groq_model.text = _v("GROQ_MODEL") or "llama-3.3-70b-versatile"
        scr.ids.ollama_url.text = _v("OLLAMA_URL")
        scr.ids.ollama_model.text = _v("OLLAMA_MODEL") or "llama3.2"
        scr.ids.fish_audio_api.text = _v("FISH_AUDIO_API_KEY")
        scr.ids.fish_audio_ref.text = _v("FISH_AUDIO_REFERENCE_ID")
        scr.ids.fish_audio_model.text = _v("FISH_AUDIO_MODEL") or "s2-pro"
        scr.ids.elevenlabs_api.text = _v("ELEVENLABS_API_KEY")
        scr.ids.elevenlabs_voice.text = _v("ELEVENLABS_VOICE_ID")
        scr.ids.voice_priority.text = prefs.get("voice_priority", "fish,eleven,self")
        scr.ids.switch_app_keys.active = prefs.get("api_key_mode", "global") == "app"
        scr.ids.switch_ollama.active = prefs.get("ollama_enabled", True)
        scr.ids.switch_notif_reminders.active = prefs.get(
            "notifications_reminders", True
        )
        scr.ids.switch_notif_sound.active = prefs.get("notifications_sound", True)
        self.root.current = "settings"

    def close_settings(self):
        self.root.current = "main"
        self._highlight_nav_rail(self.active_nav)

    def save_all_settings(self, *args):
        scr = self.root.get_screen("settings")
        fields = {
            "FIREBASE_API_KEY": scr.ids.firebase_api.text.strip(),
            "GROQ_API_KEY": scr.ids.groq_api.text.strip(),
            "GROQ_MODEL": scr.ids.groq_model.text.strip(),
            "OLLAMA_URL": scr.ids.ollama_url.text.strip(),
            "OLLAMA_MODEL": scr.ids.ollama_model.text.strip(),
            "FISH_AUDIO_API_KEY": scr.ids.fish_audio_api.text.strip(),
            "FISH_AUDIO_REFERENCE_ID": scr.ids.fish_audio_ref.text.strip(),
            "FISH_AUDIO_MODEL": scr.ids.fish_audio_model.text.strip(),
            "ELEVENLABS_API_KEY": scr.ids.elevenlabs_api.text.strip(),
            "ELEVENLABS_VOICE_ID": scr.ids.elevenlabs_voice.text.strip(),
        }
        for k, v in fields.items():
            if v:
                save_provider_setting(k, v)
        app_mode = scr.ids.switch_app_keys.active
        mode = "app" if app_mode else "global"
        inline = {k: v for k, v in fields.items() if v} if app_mode else {}
        save_prefs(
            {
                "api_key_mode": mode,
                "inline_api_keys": inline,
                "ollama_enabled": scr.ids.switch_ollama.active,
                "notifications_reminders": scr.ids.switch_notif_reminders.active,
                "notifications_sound": scr.ids.switch_notif_sound.active,
                "voice_priority": (scr.ids.voice_priority.text or "").strip() or "fish,eleven,self",
            }
        )
        refresh_providers()
        firebase_auth.reload_env()
        self.status_text = "Settings saved."
        self.context_text = "All settings saved. AI providers refreshed."
        self.root.current = "main"
        self._highlight_nav_rail(self.active_nav)

    def set_voice_priority(self, value: str):
        scr = self.root.get_screen("settings")
        scr.ids.voice_priority.text = value

    def toggle_theme(self):
        if self.theme_cls.theme_style == "Dark":
            self.theme_cls.theme_style = "Light"
            save_prefs({"appearance": "light"})
        else:
            self.theme_cls.theme_style = "Dark"
            save_prefs({"appearance": "dark"})
        if self._system_theme_ev is not None:
            self._system_theme_ev.cancel()
            self._system_theme_ev = None

    def send_command(self, *a):
        shell = self.root.get_screen("main")
        inp = shell.ids.center_sm.get_screen("chat").ids.command_input
        cmd = inp.text.strip()
        if not cmd or self.ui_busy:
            return
        inp.text = ""
        self.append_message("You", cmd)
        self._run_command_async(cmd)

    def sendCommand(self, text: str):
        if not text or not str(text).strip() or self.ui_busy:
            return
        self.append_message("You", str(text).strip())
        self._run_command_async(str(text).strip())

    def _run_command_async(self, cmd: str):
        self.ui_busy = True
        self.typing_visible = True
        self.set_status_mode("thinking")

        def work():
            try:
                out = handle_command(cmd)
            except Exception as e:
                out = f"Error: {e}"
            Clock.schedule_once(lambda dt: self._finish_response(out, cmd), 0)

        threading.Thread(target=work, daemon=True).start()

    @mainthread
    def _finish_response(self, text: str, user_cmd: str):
        self.typing_visible = False
        self.append_message("Assistant", text)
        append_turn(user_cmd, text)
        self.ui_busy = False
        self.set_status_mode("online")
        self.update_reminder_count()

    def process_command(self, cmd: str):
        try:
            return handle_command(cmd)
        except Exception as e:
            return f"Error: {e}"

    def start_voice(self):
        self.set_status_mode("listening")
        self.toggle_mic_anim(True)
        threading.Thread(target=self._voice_thread, daemon=True).start()

    def toggle_mic_anim(self, on: bool):
        try:
            mb = self._main().ids.center_sm.get_screen("chat").ids.mic_button
            if on:
                self.mic_anim.start(mb)
            else:
                self.mic_anim.stop(mb)
                mb.md_bg_color = self.theme_cls.bg_dark
        except Exception:
            pass

    def _voice_thread(self):
        txt = listen_voice_once()
        Clock.schedule_once(lambda dt: self.toggle_mic_anim(False), 0)
        if txt:
            Clock.schedule_once(lambda dt: self._voice_got_text(txt), 0)
        else:
            Clock.schedule_once(lambda dt: self.set_status_mode("online"), 0)

    @mainthread
    def _voice_got_text(self, txt: str):
        self.append_message("You", txt)
        self._run_command_async(txt)

    def show_reminders(self):
        self.set_nav("reminders")
        self.refresh_reminder_list()

    def refresh_reminder_list(self):
        lst = self._main().ids.center_sm.get_screen("reminders").ids.reminder_list
        lst.clear_widgets()
        uid = get_user_profile().get("uid")
        for idx, r in enumerate(load_reminders(uid)):
            done = bool(r.get("completed"))
            card = MDCard(
                padding=12,
                elevation=1,
                radius=[12],
                orientation="vertical",
                adaptive_height=True,
            )
            title = r.get("text", "")
            card.add_widget(
                MDLabel(
                    text=f"[s]{title}[/s]" if done else title,
                    adaptive_height=True,
                    font_style="Body1",
                    markup=True,
                )
            )
            card.add_widget(
                MDLabel(
                    text=(
                        f"When: {r.get('when', '')} · Done"
                        if done
                        else f"When: {r.get('when', '')}"
                    ),
                    theme_text_color="Secondary",
                    font_style="Caption",
                    adaptive_height=True,
                )
            )
            row = MDBoxLayout(
                orientation="horizontal",
                spacing=8,
                adaptive_height=True,
                padding=(0, 4, 0, 0),
            )
            if not done:
                row.add_widget(
                    MDFlatButton(
                        text="Complete",
                        on_release=partial(self._on_reminder_done, idx),
                    )
                )
            row.add_widget(
                MDFlatButton(
                    text="Delete",
                    theme_text_color="Error",
                    on_release=partial(self._on_reminder_delete, idx),
                )
            )
            card.add_widget(row)
            lst.add_widget(card)

    def _on_reminder_done(self, idx: int, *args):
        uid = get_user_profile().get("uid")
        if uid and set_reminder_completed(uid, idx):
            self.refresh_reminder_list()
            self.update_reminder_count()
            self.context_text = "Reminder marked complete."

    def _on_reminder_delete(self, idx: int, *args):
        uid = get_user_profile().get("uid")
        if uid and delete_reminder_at(uid, idx):
            self.refresh_reminder_list()
            self.update_reminder_count()
            self.context_text = "Reminder removed."

    def open_add_reminder_dialog(self):
        box = MDBoxLayout(orientation="vertical", spacing="8dp", size_hint_y=None, height="120dp")
        t1 = MDTextField(hint_text="What to remind")
        t2 = MDTextField(hint_text="When (e.g. today at 3pm)")
        box.add_widget(t1)
        box.add_widget(t2)

        def save(*a):
            uid = get_user_profile().get("uid")
            if not uid:
                dlg.dismiss()
                return
            add_reminder(t1.text.strip(), t2.text.strip() or "soon", uid)
            dlg.dismiss()
            self.refresh_reminder_list()
            self.update_reminder_count()
            self.context_text = "Reminder added."

        dlg = MDDialog(
            title="New reminder",
            type="custom",
            content_cls=box,
            buttons=[
                MDFlatButton(text="Cancel", on_release=lambda x: dlg.dismiss()),
                MDFlatButton(text="Add", on_release=save),
            ],
        )
        dlg.open()

    def _history_bucket_label(self, ts_str: str) -> str:
        try:
            dt = datetime.fromisoformat(str(ts_str).replace("Z", "+00:00"))
        except Exception:
            return "Older"
        today = datetime.now().date()
        d = dt.date()
        if d == today:
            return "Today"
        if d == today - timedelta(days=1):
            return "Yesterday"
        return "Older"

    def refresh_history_list(self):
        lst = self._main().ids.center_sm.get_screen("memory").ids.history_list
        lst.clear_widgets()
        q = (
            self._main().ids.center_sm.get_screen("memory").ids.history_search.text.lower()
        )
        sessions = []
        for s in load_sessions():
            title = s.get("title", "") or ""
            if q and q not in title.lower():
                continue
            sessions.append(s)
        buckets = {"Today": [], "Yesterday": [], "Older": []}
        for s in sessions:
            ts = s.get("ts") or s.get("id") or ""
            buckets[self._history_bucket_label(str(ts))].append(s)
        for label in ("Today", "Yesterday", "Older"):
            items = buckets[label]
            if not items:
                continue
            lst.add_widget(
                MDLabel(
                    text=label,
                    font_style="Subtitle2",
                    bold=True,
                    adaptive_height=True,
                    padding=(0, 10, 0, 4),
                )
            )
            for s in items:
                title = s.get("title", "Chat") or "Chat"
                lst.add_widget(
                    OneLineListItem(
                        text=title,
                        on_release=partial(self._load_history_session, s),
                    )
                )

    def _load_history_session(self, sess: dict, *args):
        self.context_text = sess.get("preview", "")
        msgs = sess.get("messages", [])
        self.clear_chat()
        for m in msgs:
            role = m.get("role", "assistant")
            self.append_message(
                "You" if role == "user" else "Assistant", m.get("text", "")
            )

    def refresh_files_list(self):
        lst = self._main().ids.center_sm.get_screen("files").ids.files_list
        lst.clear_widgets()
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        for name in sorted(os.listdir(root))[:80]:
            if name.startswith(".") or name in ("build", "dist", "__pycache__"):
                continue
            path = os.path.join(root, name)
            lst.add_widget(
                OneLineListItem(
                    text=name,
                    on_release=partial(self._open_project_file, path),
                )
            )

    def daily_briefing(self):
        self._run_command_async("daily briefing")

    def _open_project_file(self, path: str, *args):
        handle_command(f'open "{path}"')

    def files_open_project_folder(self):
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        handle_command(f'open "{root}"')

    def files_quick_create(self):
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        path = os.path.join(root, "jarvis_quick_note.txt")
        try:
            if not os.path.exists(path):
                with open(path, "w", encoding="utf-8") as f:
                    f.write("# Jarvis quick note\n")
            self.context_text = f"Created or opened {path}"
            self.refresh_files_list()
            handle_command(f'open "{path}"')
        except OSError as e:
            self.context_text = f"Could not create file: {e}"

    def files_run_project(self):
        self._run_command_async("run python app.py")

    def clear_chat(self):
        lst = self._main().ids.center_sm.get_screen("chat").ids.chat_list
        lst.clear_widgets()

    def toggle_voice_language(self):
        if self.voice_language == "en":
            self.voice_language = "te"
            handle_command("use telugu")
        else:
            self.voice_language = "en"
            handle_command("use english")
        try:
            self.root.get_screen("settings").ids.lang_toggle_btn.text = (
                "English" if self.voice_language == "en" else "Telugu"
            )
        except Exception:
            pass

    def open_file_manager(self):
        from kivymd.uix.filemanager import MDFileManager

        if not self.file_manager:
            self.file_manager = MDFileManager(
                exit_manager=self.exit_manager,
                select_path=self.select_path,
                preview=True,
            )
        self.file_manager.show(os.path.expanduser("~"))

    def select_path(self, path):
        self.exit_manager()
        threading.Thread(target=self._clone, args=(path,), daemon=True).start()

    def _clone(self, path):
        from assistant_core import clone_voice

        r = clone_voice("Cloned", [path])
        Clock.schedule_once(
            lambda dt: self.append_message("Assistant", str(r)), 0
        )

    def exit_manager(self, *a):
        if self.file_manager:
            self.file_manager.close()

    def logout(self):
        set_user("guest", email=None, phone=None)
        self.user_display = "Guest"
        self.root.current = "login"

    guestLogin = guest_login
    startVoice = start_voice
    showReminders = show_reminders
    dailyBriefing = daily_briefing

    def stop_app(self):
        self.stop()


def run():
    JarvisApp().run()


if __name__ == "__main__":
    run()
