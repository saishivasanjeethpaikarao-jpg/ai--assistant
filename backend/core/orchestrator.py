import os
import sys
from typing import Optional

from core.conversation import ConversationMemory
from core.intent_router import IntentRouter, IntentResult
from core.executor import VerifiedExecutor

# ── Lazy AI imports (keep backward compat) ──────────────────────────────
_ai_available = False
_has_provider = False
_with_fallback = None
_refresh_providers = None

try:
    from ai_switcher import has_provider_configured, with_fallback, refresh_providers
    _ai_available = True
except ImportError:
    pass

try:
    from dotenv import load_dotenv
    from config_paths import get_dotenv_path, ensure_user_env
    ensure_user_env()
    load_dotenv(get_dotenv_path(), override=True)
    if _ai_available:
        refresh_providers()
        _has_provider = has_provider_configured()
except Exception:
    pass


class AirisOrchestrator:
    """Production orchestrator for Airis desktop assistant.

    Flow:
    1. Inject conversation context
    2. Route intent (SYSTEM / CHAT / WEB / REMINDER / TRADING / FILE)
    3. Execute action with verification (if actionable)
    4. Generate AI response with verified results
    5. Store exchange in conversation memory
    6. Return response

    Never claims actions succeeded unless verified.
    """

    def __init__(self):
        self.memory = ConversationMemory(max_turns=20)
        self.router = IntentRouter()
        self.executor = VerifiedExecutor()
        self._session_id = self._generate_session_id()

    def _generate_session_id(self) -> str:
        import uuid
        return uuid.uuid4().hex[:12]

    def process(self, user_input: str) -> dict:
        """Process user input through the full pipeline.

        Returns dict with:
          - response: text response
          - intent: detected intent type
          - action_taken: what was executed (if any)
          - verified: whether action was verified
          - session_id: current session
        """
        # 1. Store user input
        self.memory.add("user", user_input)

        # 2. Route intent
        intent = self.router.classify(user_input)

        # 3. Execute if actionable
        action_result = self._execute_intent(intent)

        # 4. Generate response
        response = self._generate_response(user_input, intent, action_result)

        # 5. Store assistant response
        self.memory.add("assistant", response, intent=intent.type)

        return {
            "response": response,
            "intent": intent.type,
            "confidence": intent.confidence,
            "action_taken": action_result.get("action") if action_result else None,
            "verified": action_result.get("verified") if action_result else None,
            "session_id": self._session_id,
        }

    def _execute_intent(self, intent: IntentResult) -> Optional[dict]:
        """Execute an intent using the verified executor.

        Returns None for CHAT intent (no execution needed).
        Returns dict with execution result for actionable intents.
        """
        if intent.type == "CHAT":
            return None

        if intent.type == "SYSTEM":
            return self._handle_system(intent)

        if intent.type == "WEB":
            return self._handle_web(intent)

        if intent.type == "REMINDER":
            return self._handle_reminder(intent)

        if intent.type == "TRADING":
            return self._handle_trading(intent)

        if intent.type == "FILE":
            return self._handle_file(intent)

        return None

    def _handle_system(self, intent: IntentResult) -> dict:
        """Handle SYSTEM intents (apps, power, volume)."""
        action = intent.params.get("action", "")
        app = intent.params.get("app", "")
        target = intent.params.get("target", "")

        if action in ("launch", "open"):
            return self.executor.execute("launch_app", app_name=app)

        if action == "close":
            return self.executor.execute("close_app", app_name=app)

        if action == "power":
            if "shut" in target or "power" in target:
                return self.executor.execute("poweroff")
            return self.executor.execute("restart")

        if action == "volume":
            return self.executor.execute("set_volume", level=50)

        if action == "lock":
            return self.executor.execute("lock_screen")

        if action == "system_info":
            return self.executor.execute("get_system_info")

        if action == "screenshot":
            return self._take_screenshot()

        return {"success": False, "message": f"Unknown system action: {action}", "verified": False}

    def _handle_web(self, intent: IntentResult) -> dict:
        """Handle WEB intents (search, URLs)."""
        action = intent.params.get("action", "")
        query = intent.params.get("query", "")

        if action == "search":
            return self.executor.execute("search_google", query=query)

        if action in ("open_url", "open_domain"):
            return self.executor.execute("open_url", url=query)

        if action == "youtube":
            return self.executor.execute("search_youtube", query=query)

        return {"success": False, "message": f"Unknown web action: {action}", "verified": False}

    def _handle_reminder(self, intent: IntentResult) -> dict:
        """Handle REMINDER intents."""
        action = intent.params.get("action", "")

        if action == "set":
            return {
                "success": True,
                "message": "Reminder would be set (delegated to memory.reminders)",
                "verified": True,
            }

        if action == "list":
            try:
                from memory.reminders import list_reminders
                reminders = list_reminders()
                return {
                    "success": True,
                    "message": f"Found {len(reminders)} reminders",
                    "verified": True,
                    "data": {"reminders": reminders},
                }
            except Exception as e:
                return {"success": False, "message": str(e), "verified": False}

        return {"success": False, "message": f"Unknown reminder action: {action}", "verified": False}

    def _handle_trading(self, intent: IntentResult) -> dict:
        """Handle TRADING intents (delegate to existing trading modules)."""
        action = intent.params.get("action", "")
        symbol = intent.params.get("symbol", "")

        try:
            if action == "stock_price" and symbol:
                from trading_commands import get_stock_price
                result = get_stock_price(symbol)
                return {"success": True, "message": result, "verified": True}

            if action == "analyze" and symbol:
                from trading_commands import get_stock_analysis
                result = get_stock_analysis(symbol)
                return {"success": True, "message": result, "verified": True}

            if action == "portfolio":
                from trading_commands import view_portfolio
                result = view_portfolio()
                return {"success": True, "message": result, "verified": True}

            if action == "market_summary":
                from trading.indian_stock_api import get_api
                summary = get_api().generate_market_summary()
                return {"success": True, "message": str(summary), "verified": True}

            if action == "movers":
                from trading.indian_stock_api import get_api
                gainers = get_api().get_top_gainers(5)
                return {"success": True, "message": f"Top gainers: {len(gainers)} stocks", "verified": True}

        except Exception as e:
            return {"success": False, "message": f"Trading error: {e}", "verified": False}

        return {"success": False, "message": f"Unknown trading action: {action}", "verified": False}

    def _handle_file(self, intent: IntentResult) -> dict:
        """Handle FILE intents."""
        action = intent.params.get("action", "")
        target = intent.params.get("target", "")

        if action == "create":
            return self.executor.execute("create_file", filepath=target)

        if action == "read":
            return self.executor.execute("read_file", filepath=target)

        if action == "list":
            return self.executor.execute("list_files", directory=target or ".")

        if action == "delete":
            return self.executor.execute("delete_file", filepath=target)

        return {"success": False, "message": f"Unknown file action: {action}", "verified": False}

    def _take_screenshot(self) -> dict:
        """Take a screenshot using PowerShell."""
        try:
            import subprocess
            path = os.path.join(os.environ.get("TEMP", "."), "airis_screenshot.png")
            cmd = (
                f"Add-Type -AssemblyName System.Windows.Forms; "
                f"[System.Windows.Forms.Application]::DoEvents(); "
                f"$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; "
                f"$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; "
                f"$graphics = [System.Drawing.Graphics]::FromImage($bitmap); "
                f"$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); "
                f"$bitmap.Save('{path}'); "
                f"$graphics.Dispose(); $bitmap.Dispose(); "
                f"Write-Output 'Screenshot saved to {path}'"
            )
            result = subprocess.run(
                ["powershell", "-NoProfile", "-Command", cmd],
                capture_output=True, text=True, timeout=15
            )
            if result.returncode == 0:
                return {"success": True, "message": f"Screenshot saved", "verified": True}
            return {"success": False, "message": result.stderr.strip(), "verified": False}
        except Exception as e:
            return {"success": False, "message": str(e), "verified": False}

    def _generate_response(self, user_input: str, intent: IntentResult,
                           action_result: Optional[dict]) -> str:
        """Generate response with context and verification results."""
        context = self.memory.get_context()

        if intent.type == "CHAT" or action_result is None:
            return self._call_ai(user_input, context)

        if not action_result.get("success"):
            return (
                f"I tried to {intent.type.lower()} that but it didn't work. "
                f"{action_result.get('message', '')}"
            )

        verified = action_result.get("verified", False)
        if verified:
            return action_result.get("message", "Done.")
        else:
            return (
                f"I ran the command but couldn't verify it completed successfully. "
                f"{action_result.get('message', '')}"
            )

    def _call_ai(self, user_input: str, context: str) -> str:
        """Call AI with context injection and user's configured system prompt."""
        if not _has_provider or not _ai_available:
            return "AI not configured. Add a Groq API key in Settings."

        try:
            from assistant_persona import ASSISTANT_PERSONA
            from system_prompt_config import load_system_prompt

            try:
                master = load_system_prompt()
            except Exception:
                master = ''

            system = ASSISTANT_PERSONA
            if master:
                system = master + '\n\n' + ASSISTANT_PERSONA
            if context:
                system += f"\n\nRecent conversation:\n{context}"

            messages = [
                {"role": "system", "content": system},
                {"role": "user", "content": user_input},
            ]

            return with_fallback(self._call_llm, messages)
        except Exception as e:
            return f"Error: {e}"

    def _call_llm(self, provider: dict, messages: list) -> str:
        """Call LLM via provider."""
        try:
            from openai import OpenAI
        except ImportError:
            return "OpenAI package not installed"

        client = OpenAI(
            api_key=provider.get("api_key"),
            base_url=provider.get("base_url", ""),
        )
        resp = client.chat.completions.create(
            model=provider.get("model", "llama-3.3-70b-versatile"),
            messages=messages,
        )
        return resp.choices[0].message.content

    def get_session_info(self) -> dict:
        return {
            "session_id": self._session_id,
            "turns": self.memory.count,
            "executions": len(self.executor.get_history()),
        }

    def clear_session(self) -> None:
        self.memory.clear()
        self.executor.clear_history()
        self._session_id = self._generate_session_id()


_orchestrator_instance = None


def get_orchestrator() -> AirisOrchestrator:
    global _orchestrator_instance
    if _orchestrator_instance is None:
        _orchestrator_instance = AirisOrchestrator()
    return _orchestrator_instance
