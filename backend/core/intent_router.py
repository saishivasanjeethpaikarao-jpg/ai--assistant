import re
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class IntentResult:
    type: str
    confidence: float
    params: dict = field(default_factory=dict)
    raw_input: str = ""


class IntentRouter:
    """Fast intent router using pattern matching.

    Routes to: SYSTEM, CHAT, WEB, REMINDER, TRADING, FILE
    Uses keyword patterns first, falls back to LLM classification.
    """

    # ── Pattern definitions ────────────────────────────────────────────────

    SYSTEM_PATTERNS = [
        (r"\b(?:shut\s?down|power\s?off|restart|reboot|sleep|hibernate)\b", "power"),
        (r"\b(?:volume|sound|mute|unmute)\b", "volume"),
        (r"\block\s+(?:screen|pc|computer)\b", "lock"),
        (r"\b(?:system\s?info|my\s?pc|computer\s?info)\b", "system_info"),
        (r"\b(?:screenshot|take\s+a\s+screenshot|capture\s+screen)\b", "screenshot"),
        (r"\b(?:settings|open\s+settings)\b", "settings"),
    ]

    APP_PATTERNS = [
        (r"\b(?:open|launch|start|run)\s+(\w+(?:\s+\w+)?)\b", "launch"),
        (r"\b(?:close|kill|stop|exit)\s+(\w+(?:\s+\w+)?)\b", "close"),
        (r"\b(?:switch\s+to|focus|activate)\s+(\w+(?:\s+\w+)?)\b", "focus"),
    ]

    WEB_PATTERNS = [
        (r"\b(?:search|google|look\s+up|find)\s+(.+?)\b", "search"),
        (r"\b(?:open|go\s+to|navigate\s+to)\s+(https?://\S+|www\.\S+)\b", "open_url"),
        (r"\b(?:open|go\s+to)\s+(\w+(?:\.\w+)+)\b", "open_domain"),
        (r"\b(?:youtube|yt)\s+(.+?)\b", "youtube"),
        (r"\b(?:download)\s+(.+?)\b", "download"),
    ]

    REMINDER_PATTERNS = [
        (r"\b(?:remind|reminder|remind\s+me)\b", "set"),
        (r"\b(?:show|list|view|check)\s+(?:my\s+)?reminders\b", "list"),
        (r"\b(?:delete|cancel|remove|clear)\s+(?:reminder|reminders)\b", "delete"),
        (r"\b(?:in\s+\d+\s+(?:min|minute|hour|hr|day|sec))\b.*\b(?:to|that|about)\b", "set"),
        (r"\b(?:at\s+\d{1,2}:\d{2}\s*(?:am|pm)?)\b", "set"),
    ]

    TRADING_PATTERNS = [
        (r"\b(?:stock|share|price|market)\s+(?:price|of|for|info|data)\s+(\w+)\b", "stock_price"),
        (r"\b(?:analyze|analysis|research)\s+(?:stock\s+)?(\w+)\b", "analyze"),
        (r"\b(?:portfolio|my\s+holdings|my\s+stocks)\b", "portfolio"),
        (r"\b(?:watchlist|watch\s+list|tracked)\b", "watchlist"),
        (r"\b(?:market|nse|bse|sensex|nifty)\s+(?:summary|overview|today|update)\b", "market_summary"),
        (r"\b(?:add|remove)\s+(?:\w+\s+)?(?:to|from)?\s*(?:watchlist|portfolio)\b", "watchlist_edit"),
        (r"\b(?:gainers|losers|top\s+gainers|top\s+losers)\b", "movers"),
        (r"\b(?:buy|sell|trade)\s+(?:signal|recommendation|suggestion)\s+(\w+)\b", "signal"),
    ]

    FILE_PATTERNS = [
        (r"\b(?:create|make|new)\s+(?:file|folder|directory)\s+(.+?)\b", "create"),
        (r"\b(?:read|open|show|view)\s+(?:file\s+)?(.+?)\b", "read"),
        (r"\b(?:delete|remove|trash)\s+(?:file\s+)?(.+?)\b", "delete"),
        (r"\b(?:edit|update|modify|change)\s+(?:file\s+)?(.+?)\b", "edit"),
        (r"\b(?:list|show)\s+(?:files?|contents?|directory)\s+(.+?)\b", "list"),
        (r"\b(?:find|search|locate)\s+(?:file\s+)?(.+?)\b", "find"),
        (r"\b(?:rename|move|copy)\s+(.+?)\b", "file_op"),
    ]

    def classify(self, text: str) -> IntentResult:
        """Classify input text into an intent type."""
        text_lower = text.lower().strip()

        if not text:
            return IntentResult(type="UNKNOWN", confidence=0.0, raw_input=text)

        # ── Check patterns in priority order ───────────────────────────────

        # SYSTEM
        for pattern, action in self.SYSTEM_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                return IntentResult(
                    type="SYSTEM",
                    confidence=0.9,
                    params={"action": action, "target": match.group(0)},
                    raw_input=text,
                )

        # REMINDER (check before general CHAT)
        for pattern, action in self.REMINDER_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                return IntentResult(
                    type="REMINDER",
                    confidence=0.9,
                    params={"action": action, "full_match": match.group(0)},
                    raw_input=text,
                )

        # TRADING
        for pattern, action in self.TRADING_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                symbol = match.group(1) if match.lastindex and match.lastindex >= 1 else ""
                return IntentResult(
                    type="TRADING",
                    confidence=0.85,
                    params={"action": action, "symbol": symbol.upper() if symbol else ""},
                    raw_input=text,
                )

        # WEB
        for pattern, action in self.WEB_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                query = match.group(1) if match.lastindex and match.lastindex >= 1 else ""
                return IntentResult(
                    type="WEB",
                    confidence=0.85,
                    params={"action": action, "query": query},
                    raw_input=text,
                )

        # APP (open/close)
        for pattern, action in self.APP_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                app_name = match.group(1) if match.lastindex and match.lastindex >= 1 else ""
                return IntentResult(
                    type="SYSTEM",
                    confidence=0.85,
                    params={"action": action, "app": app_name},
                    raw_input=text,
                )

        # FILE
        for pattern, action in self.FILE_PATTERNS:
            match = re.search(pattern, text_lower)
            if match:
                target = match.group(1) if match.lastindex and match.lastindex >= 1 else ""
                return IntentResult(
                    type="FILE",
                    confidence=0.8,
                    params={"action": action, "target": target.strip()},
                    raw_input=text,
                )

        # ── Default: CHAT ──────────────────────────────────────────────────

        return IntentResult(type="CHAT", confidence=0.6, raw_input=text)


def classify_intent(text: str) -> IntentResult:
    """Convenience wrapper."""
    return IntentRouter().classify(text)
