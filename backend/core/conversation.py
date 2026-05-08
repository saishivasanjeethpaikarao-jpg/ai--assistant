from datetime import datetime
from typing import List, Dict, Optional


class ConversationMemory:
    """Runtime conversation memory with ring buffer.

    Stores recent exchanges in memory (not persistent).
    Injects context into AI prompts automatically.
    """

    def __init__(self, max_turns: int = 20):
        self._history: List[Dict] = []
        self._max_turns = max_turns

    def add(self, role: str, content: str, intent: Optional[str] = None) -> None:
        """Add an exchange to the conversation history."""
        self._history.append({
            "role": role,
            "content": content,
            "intent": intent,
            "timestamp": datetime.now().isoformat(),
        })
        if len(self._history) > self._max_turns:
            self._history.pop(0)

    def get_context(self, max_tokens: int = 2000) -> str:
        """Format recent conversation for AI prompt injection."""
        if not self._history:
            return ""

        lines = []
        total = 0
        for entry in reversed(self._history):
            label = "User" if entry["role"] == "user" else "Assistant"
            text = f"{label}: {entry['content']}"
            total += len(text)
            if total > max_tokens:
                break
            lines.append(text)

        lines.reverse()
        return "\n".join(lines)

    def get_recent(self, n: int = 5) -> List[Dict]:
        """Get last n exchanges."""
        return self._history[-n:]

    def clear(self) -> None:
        """Clear conversation history."""
        self._history.clear()

    @property
    def count(self) -> int:
        return len(self._history)

    @property
    def is_empty(self) -> bool:
        return len(self._history) == 0
