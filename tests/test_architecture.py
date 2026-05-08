"""Integration tests for new Airis architecture (core/ modules)."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from core.conversation import ConversationMemory
from core.intent_router import IntentRouter, classify_intent


def test_conversation_memory():
    """Test runtime conversation memory."""
    mem = ConversationMemory(max_turns=3)

    assert mem.is_empty
    assert mem.count == 0

    mem.add("user", "hello")
    mem.add("assistant", "hi there", intent="CHAT")
    mem.add("user", "open Chrome", intent="SYSTEM")

    assert mem.count == 3
    assert not mem.is_empty

    recent = mem.get_recent(2)
    assert len(recent) == 2
    assert recent[0]["role"] == "assistant"
    assert recent[1]["role"] == "user"

    context = mem.get_context()
    assert "hello" in context
    assert "hi there" in context
    assert "open Chrome" in context

    # Test ring buffer eviction
    mem.add("user", "message 4")
    mem.add("user", "message 5")
    assert mem.count == 3

    # Test clear
    mem.clear()
    assert mem.count == 0
    assert mem.is_empty
    assert mem.get_context() == ""

    print("[PASS] test_conversation_memory")


def test_intent_router_chat():
    """Test CHAT intent detection."""
    result = classify_intent("how are you today?")
    assert result.type == "CHAT", f"Expected CHAT, got {result.type}"
    print("[PASS] test_intent_router_chat")


def test_intent_router_system():
    """Test SYSTEM intent detection."""
    tests = [
        ("shutdown the computer", "SYSTEM"),
        ("restart my pc", "SYSTEM"),
        ("lock screen", "SYSTEM"),
        ("system info", "SYSTEM"),
        ("open Chrome", "SYSTEM"),
        ("launch notepad", "SYSTEM"),
        ("close vscode", "SYSTEM"),
    ]

    for text, expected in tests:
        result = classify_intent(text)
        assert result.type == expected, f"'{text}' → {result.type}, expected {expected}"
        assert result.confidence >= 0.8, f"Low confidence for '{text}': {result.confidence}"

    print("[PASS] test_intent_router_system")


def test_intent_router_web():
    """Test WEB intent detection."""
    tests = [
        ("search Google for Python tutorials", "WEB"),
        ("open https://github.com", "WEB"),
        ("youtube music", "WEB"),
    ]

    for text, expected in tests:
        result = classify_intent(text)
        assert result.type == expected, f"'{text}' → {result.type}, expected {expected}"

    print("[PASS] test_intent_router_web")


def test_intent_router_reminder():
    """Test REMINDER intent detection."""
    tests = [
        ("remind me to call in 10 minutes", "REMINDER"),
        ("show my reminders", "REMINDER"),
        ("list reminders", "REMINDER"),
    ]

    for text, expected in tests:
        result = classify_intent(text)
        assert result.type == expected, f"'{text}' → {result.type}, expected {expected}"

    print("[PASS] test_intent_router_reminder")


def test_intent_router_trading():
    """Test TRADING intent detection."""
    tests = [
        ("stock price of RELIANCE", "TRADING"),
        ("analyze TCS", "TRADING"),
        ("show my portfolio", "TRADING"),
        ("market summary today", "TRADING"),
        ("top gainers", "TRADING"),
    ]

    for text, expected in tests:
        result = classify_intent(text)
        assert result.type == expected, f"'{text}' → {result.type}, expected {expected}"

    print("[PASS] test_intent_router_trading")


def test_intent_router_file():
    """Test FILE intent detection."""
    tests = [
        ("create file test.txt", "FILE"),
        ("read myfile.txt", "FILE"),
        ("list files in Documents", "FILE"),
    ]

    for text, expected in tests:
        result = classify_intent(text)
        assert result.type == expected, f"'{text}' → {result.type}, expected {expected}"

    print("[PASS] test_intent_router_file")


def test_orchestrator_basic():
    """Test orchestrator processes input end-to-end."""
    from core.orchestrator import AirisOrchestrator

    orch = AirisOrchestrator()

    # Simple chat
    result = orch.process("hello")
    assert "response" in result
    assert result["intent"] in ("CHAT",)
    assert result["session_id"] is not None

    # Session tracking
    info = orch.get_session_info()
    assert info["turns"] == 2  # user + assistant
    assert info["session_id"] == result["session_id"]

    # Clear
    orch.clear_session()
    assert orch.memory.count == 0

    print("[PASS] test_orchestrator_basic")


def test_executor_verification():
    """Test executor never claims success without verification."""
    from core.executor import VerifiedExecutor

    exe = VerifiedExecutor()

    # Unknown tool should fail cleanly
    result = exe.execute("nonexistent_tool")
    assert result["success"] is False
    assert result["verified"] is False

    # History tracking
    assert len(exe.get_history()) == 1

    # Clear
    exe.clear_history()
    assert len(exe.get_history()) == 0

    print("[PASS] test_executor_verification")


def test_verifier():
    """Test verifier utilities."""
    from tools.verifier import verify_file_exists, verify_command_success
    from tools import ToolResult

    # Non-existent file
    v, msg = verify_file_exists("/nonexistent/path/file.txt")
    assert not v
    assert "not found" in msg

    # Successful tool result
    tr = ToolResult(success=True, message="Done")
    v, msg = verify_command_success(tr)
    assert v
    assert "Done" in msg

    # Failed tool result
    tr = ToolResult(success=False, message="Error occurred")
    v, msg = verify_command_success(tr)
    assert not v

    print("[PASS] test_verifier")


if __name__ == "__main__":
    print("=" * 60)
    print("AIRIS ARCHITECTURE TESTS")
    print("=" * 60)

    tests = [
        test_conversation_memory,
        test_intent_router_chat,
        test_intent_router_system,
        test_intent_router_web,
        test_intent_router_reminder,
        test_intent_router_trading,
        test_intent_router_file,
        test_orchestrator_basic,
        test_executor_verification,
        test_verifier,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"[FAIL] {test.__name__}: {e}")
            failed += 1

    print()
    print(f"Results: {passed}/{len(tests)} passed, {failed} failed")
    if failed > 0:
        sys.exit(1)
