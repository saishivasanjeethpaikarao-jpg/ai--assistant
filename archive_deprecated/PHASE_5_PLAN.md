# 🚀 PHASE 5: SYSTEM INTEGRATION - COMPREHENSIVE PLAN

**Version**: 5.0.0 (In Development)  
**Status**: Planning + Building  
**Target Tests**: 15  
**Modules**: 6  

---

## 📋 Overview

Phase 5 adds **deep system integration** to make Jarvis a practical daily assistant with:
- Email management (read, send, compose)
- Calendar access (check events, schedule meetings)
- Browser automation (form filling, navigation)
- App-specific commands (context-aware actions)
- System hooks (hotkeys, quick actions)

---

## 🏗️ Architecture Design

### Module Structure
```
handlers/
├── email_handler.py          (NEW) Gmail integration
├── calendar_handler.py       (NEW) Google Calendar
├── browser_automation.py     (NEW) Selenium + PyAutoGUI
├── app_commands.py           (NEW) Context-aware commands
└── system_hooks.py           (NEW) Keyboard shortcuts

integrations/
├── __init__.py
├── gmail_client.py           (NEW) Email API
├── calendar_client.py        (NEW) Calendar API
└── browser_client.py         (NEW) Browser control

jarvis_main_v5.py             (NEW) Phase 5 entry point
jarvis_gui_v5.py              (NEW) Updated GUI with new features
test_phase5.py                (NEW) 15 comprehensive tests
```

### Integration Points
```
Phase 4 GUI
    ↓
jarvis_main_v5.py
    ↓
Phase 3 Voice Pipeline
    ↓
New Handlers:
├── Email Handler
├── Calendar Handler
├── Browser Automation
├── App Commands
└── System Hooks
    ↓
Phase 2 AI Integration
    ↓
Phase 1 Core
```

---

## 📧 Email Integration (Gmail)

### Features
```
✓ Read latest emails
✓ Check unread count
✓ Send emails
✓ Compose with dictation
✓ Search emails
✓ Mark as read/star
```

### Commands
```
"check my email"                 → Read last 5 unread emails
"how many unread emails"         → Display count
"send email to john"             → Compose + send
"search emails for python"       → Find matching emails
"mark email as read"             → Update status
```

### Implementation
```python
# handlers/email_handler.py
async def email_handler(command: str, context: dict) -> str:
    """Handle email commands"""
    if "check" in command or "unread" in command:
        return gmail_client.get_unread()
    elif "send" in command:
        return gmail_client.compose_and_send(command)
    elif "search" in command:
        return gmail_client.search(command)
    else:
        return "Email command not recognized"

# integrations/gmail_client.py
class GmailClient:
    def __init__(self, credentials_file: str):
        """Initialize Gmail API client"""
        self.service = build('gmail', 'v1', credentials=creds)
    
    def get_unread(self) -> str:
        """Get unread emails"""
        results = self.service.users().messages().list(
            userId='me',
            q='is:unread'
        ).execute()
        return format_emails(results)
    
    def send_email(self, to: str, subject: str, body: str) -> str:
        """Send email"""
        message = create_message(to, subject, body)
        return self.service.users().messages().send(
            userId='me',
            body=message
        ).execute()
```

---

## 📅 Calendar Integration (Google Calendar)

### Features
```
✓ Check today's schedule
✓ List upcoming events
✓ Create events
✓ Find free time
✓ Get meeting details
✓ RSVP to events
```

### Commands
```
"what's on my calendar"          → Show today's events
"my next meeting"                → Get upcoming event
"schedule meeting tomorrow at 2"  → Create event
"when am I free"                 → Check availability
"join my next call"              → Get meeting link
```

### Implementation
```python
# handlers/calendar_handler.py
async def calendar_handler(command: str, context: dict) -> str:
    """Handle calendar commands"""
    if "today" in command or "schedule" in command:
        return calendar_client.get_today_events()
    elif "next" in command or "upcoming" in command:
        return calendar_client.get_next_event()
    elif "create" in command or "schedule" in command:
        return calendar_client.create_event(command)
    elif "free" in command or "availability" in command:
        return calendar_client.find_free_slots()
    else:
        return "Calendar command not recognized"

# integrations/calendar_client.py
class CalendarClient:
    def __init__(self, credentials_file: str):
        """Initialize Google Calendar client"""
        self.service = build('calendar', 'v3', credentials=creds)
    
    def get_today_events(self) -> str:
        """Get today's events"""
        start = datetime.now().isoformat() + 'Z'
        end = (datetime.now() + timedelta(days=1)).isoformat() + 'Z'
        
        events = self.service.events().list(
            calendarId='primary',
            timeMin=start,
            timeMax=end,
            singleEvents=True,
            orderBy='startTime'
        ).execute().get('items', [])
        
        return format_events(events)
    
    def create_event(self, title: str, time: str, duration: int = 60) -> str:
        """Create calendar event"""
        event = {
            'summary': title,
            'start': {'dateTime': parse_time(time)},
            'end': {'dateTime': add_minutes(parse_time(time), duration)}
        }
        return self.service.events().insert(
            calendarId='primary',
            body=event
        ).execute()
```

---

## 🌐 Browser Automation

### Features
```
✓ Fill forms with voice input
✓ Navigate pages
✓ Click buttons
✓ Extract text
✓ Take screenshots
✓ Automation workflows
```

### Commands
```
"open amazon and search for laptop"     → Navigate + search
"fill out the form"                      → Interactive form fill
"click the checkout button"              → Execute action
"read the page"                          → Extract & read text
"screenshot"                             → Capture screen
```

### Implementation
```python
# handlers/browser_automation.py
from selenium import webdriver
from selenium.webdriver.common.by import By
import pyautogui

class BrowserAutomation:
    def __init__(self):
        """Initialize browser automation"""
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
    
    def navigate(self, url: str) -> str:
        """Navigate to URL"""
        self.driver.get(url)
        return f"Navigated to {url}"
    
    def search_on_page(self, query: str) -> str:
        """Search using page search"""
        search_box = self.wait.until(
            EC.presence_of_element_located((By.NAME, "q"))
        )
        search_box.send_keys(query)
        search_box.submit()
        return f"Searched for {query}"
    
    def fill_form(self, fields: dict) -> str:
        """Fill form fields"""
        for field_name, value in fields.items():
            element = self.driver.find_element(By.NAME, field_name)
            element.clear()
            element.send_keys(value)
        return "Form filled"
    
    def click_button(self, button_text: str) -> str:
        """Click button by text"""
        button = self.driver.find_element(
            By.XPATH,
            f"//button[contains(text(), '{button_text}')]"
        )
        button.click()
        return f"Clicked {button_text}"
    
    def extract_text(self) -> str:
        """Extract all page text"""
        return self.driver.find_element(By.TAG_NAME, "body").text
    
    def screenshot(self) -> str:
        """Take screenshot"""
        filename = f"screenshot_{datetime.now().timestamp()}.png"
        self.driver.save_screenshot(filename)
        return f"Screenshot saved: {filename}"

async def browser_automation_handler(command: str, context: dict) -> str:
    """Handle browser automation commands"""
    browser = BrowserAutomation()
    
    if "open" in command and "search" in command:
        # Extract URL and search term
        browser.navigate("https://www.google.com")
        search_term = extract_query(command)
        return browser.search_on_page(search_term)
    
    elif "fill" in command and "form" in command:
        # Interactive form filling
        fields = await prompt_form_fields()
        return browser.fill_form(fields)
    
    elif "click" in command:
        button_text = extract_button(command)
        return browser.click_button(button_text)
    
    elif "read" in command:
        return browser.extract_text()
    
    elif "screenshot" in command:
        return browser.screenshot()
    
    else:
        return "Browser command not recognized"
```

---

## 🎯 App-Specific Commands

### Feature Matrix
```
Feature           | Command Example              | Supported Apps
----------------- |------------------------------|------------------
Open & launch     | "open spotify"               | All installed apps
Smart shortcuts   | "play my workout playlist"   | Spotify, YouTube
Context actions   | "reply to last message"      | Discord, Slack
Quick access      | "show my github repos"       | Chrome/Firefox
App integration   | "code this python file"      | VS Code
```

### Implementation
```python
# handlers/app_commands.py
APP_INTEGRATIONS = {
    'spotify': SpotifyIntegration(),
    'discord': DiscordIntegration(),
    'slack': SlackIntegration(),
    'vscode': VSCodeIntegration(),
    'github': GitHubIntegration(),
}

async def app_command_handler(command: str, context: dict) -> str:
    """Handle app-specific commands"""
    for app_name, integration in APP_INTEGRATIONS.items():
        if app_name in command.lower():
            return await integration.handle_command(command, context)
    
    return "App command not recognized"

# App Integration Classes
class SpotifyIntegration:
    def __init__(self):
        self.client = SpotifyClient(credentials)
    
    async def handle_command(self, command: str, context: dict) -> str:
        if "play" in command:
            playlist = extract_playlist_name(command)
            return self.client.play_playlist(playlist)
        elif "pause" in command:
            return self.client.pause()
        elif "next" in command:
            return self.client.next_track()
        elif "what's playing" in command:
            return self.client.get_current_track()
        else:
            return "Spotify command not recognized"

class DiscordIntegration:
    def __init__(self):
        self.client = DiscordClient(token)
    
    async def handle_command(self, command: str, context: dict) -> str:
        if "message" in command or "send" in command:
            message = extract_message(command)
            return await self.client.send_message(message)
        elif "reply" in command:
            return await self.client.reply_to_last_message(command)
        elif "status" in command:
            return await self.client.set_status(command)
        else:
            return "Discord command not recognized"
```

---

## ⌨️ System Hooks & Hotkeys

### Features
```
✓ Global hotkey support
✓ Quick launch from anywhere
✓ Context-aware actions
✓ Multi-key combinations
✓ Fallback actions
```

### Implementation
```python
# handlers/system_hooks.py
from pynput import keyboard

class GlobalHotkeys:
    def __init__(self):
        self.listener = keyboard.Listener(on_press=self.on_key_press)
        self.hotkeys = {
            (keyboard.Key.ctrl, keyboard.Key.alt, 'j'): self.activate_jarvis,
            (keyboard.Key.ctrl, keyboard.Key.alt, 'e'): self.check_email,
            (keyboard.Key.ctrl, keyboard.Key.alt, 'c'): self.check_calendar,
        }
    
    def on_key_press(self, key):
        """Handle global hotkey press"""
        if (keyboard.Key.ctrl, keyboard.Key.alt, 'j') in self.hotkeys:
            self.activate_jarvis()
    
    def start(self):
        """Start listening for hotkeys"""
        self.listener.start()
    
    def activate_jarvis(self):
        """Activate Jarvis from anywhere"""
        # Show window, set focus, start listening
        pass
    
    def check_email(self):
        """Quick email check"""
        pass
    
    def check_calendar(self):
        """Quick calendar check"""
        pass
```

---

## 🧪 Test Plan (15 tests)

### Email Tests (3)
```python
def test_email_handler_read():
    """Test reading emails"""
    pass

def test_email_handler_send():
    """Test sending email"""
    pass

def test_email_handler_search():
    """Test searching emails"""
    pass
```

### Calendar Tests (3)
```python
def test_calendar_handler_today():
    """Test getting today's events"""
    pass

def test_calendar_handler_create():
    """Test creating event"""
    pass

def test_calendar_handler_availability():
    """Test finding free slots"""
    pass
```

### Browser Tests (3)
```python
def test_browser_navigate():
    """Test navigation"""
    pass

def test_browser_fill_form():
    """Test form filling"""
    pass

def test_browser_extract_text():
    """Test text extraction"""
    pass
```

### App Commands Tests (3)
```python
def test_spotify_integration():
    """Test Spotify commands"""
    pass

def test_discord_integration():
    """Test Discord commands"""
    pass

def test_vscode_integration():
    """Test VS Code commands"""
    pass
```

### System Hooks Tests (3)
```python
def test_hotkey_registration():
    """Test hotkey setup"""
    pass

def test_hotkey_activation():
    """Test hotkey press"""
    pass

def test_hotkey_multiple():
    """Test multiple hotkeys"""
    pass
```

---

## 📊 Implementation Timeline

### Week 1: Foundation
- ✅ Design architecture
- Email & Calendar APIs
- Browser automation setup
- App integrations framework

### Week 2: Development
- Email handler implementation
- Calendar handler implementation
- Browser automation implementation
- App commands implementation

### Week 3: Integration
- System hooks setup
- GUI updates (jarvis_gui_v5.py)
- Full pipeline integration
- Error handling & fallbacks

### Week 4: Testing & Polish
- 15 comprehensive tests
- Documentation
- Performance optimization
- User testing & feedback

---

## 📦 Required Dependencies

```python
# New in requirements.txt
google-auth-oauthlib>=0.4.6       # Gmail API auth
google-auth-httplib2>=0.1.0       # Gmail auth helper
google-api-python-client>=2.0.0   # Gmail & Calendar APIs
Selenium>=4.0.0                    # Browser automation
PyAutoGUI>=0.9.53                  # GUI automation
pynput>=1.7.6                      # Global hotkeys
python-dotenv>=0.19.0              # .env support
spotipy>=2.19.0                    # Spotify API
discord.py>=2.0.0                  # Discord API
PyGithub>=1.55                     # GitHub API
```

---

## 🔐 Security Considerations

### OAuth 2.0 Flow
```
1. User authenticates Gmail/Calendar
2. Tokens stored securely in ~/.jarvis/tokens/
3. Tokens auto-refresh before expiry
4. Credentials never logged or exposed
```

### API Keys
```
# .env file (git ignored)
GMAIL_CREDENTIALS_FILE=~/.jarvis/gmail_creds.json
CALENDAR_CREDENTIALS_FILE=~/.jarvis/calendar_creds.json
SPOTIFY_CLIENT_ID=xxx
DISCORD_TOKEN=xxx
GITHUB_TOKEN=xxx
```

---

## 📈 Success Criteria

✅ All 15 tests passing  
✅ Email integration working  
✅ Calendar integration working  
✅ Browser automation functional  
✅ App commands integrated  
✅ System hotkeys active  
✅ GUI updated with new features  
✅ Documentation complete  
✅ Performance acceptable  
✅ Error handling robust  

---

## 🎯 Phase 5 Goals

1. **Deep System Integration** - Connect to user's digital life
2. **Practical Daily Use** - Real productivity assistant
3. **Smart Shortcuts** - App-specific intelligence
4. **Hands-Free Workflow** - Minimal UI interaction
5. **Reliability** - Production-quality integration

---

## 🚀 Starting Implementation

The architecture is ready. Now building:
1. Email integration module
2. Calendar handler
3. Browser automation
4. App-specific commands
5. System hooks
6. Full test suite
7. Updated GUI
8. Comprehensive documentation

**Phase 5 will make Jarvis a truly practical daily assistant!**
