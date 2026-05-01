import os
import sys
import time

# Ensure we import correctly
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai_switcher import get_provider_status, has_provider_configured
from assistant_core import chat, generate_text, parse_reminder_command
from brain.brain import remember_fact, recall_fact, set_active_user, list_memories

def run_tests():
    print("🚀 Starting Assistant Tests...\n")
    
    # 1. Test Provider configuration
    print("1️⃣ Testing AI Provider Configuration...")
    status = get_provider_status()
    for p in status:
        print(f"   Provider {p['name']}: {'🟢 Enabled' if p['enabled'] else '🔴 Disabled'}")
    
    if not has_provider_configured():
        print("⚠️ No valid AI provider found in .env. LLM tests will be skipped.")
    else:
        print("✅ Provider is ready.\n")
        
        # 2. Test AI Flow
        print("2️⃣ Testing AI Chat Flow...")
        try:
            response = generate_text("Reply with exactly the word SUCCESS.")
            print(f"   Response from AI: '{response}'")
            if "SUCCESS" in response.upper():
                print("✅ AI basic flow logic is working.")
            else:
                print("⚠️ AI responded but not as expected.")
        except Exception as e:
            print(f"❌ AI Flow failed: {e}")

    # 3. Test Memory System
    print("\n3️⃣ Testing Brain & Memory System...")
    set_active_user("test_user_001")
    remember_fact("test_key", "test_value_42")
    recall = recall_fact("test_key")
    if recall == "test_value_42":
        print("✅ Memory successfully saved and recalled.")
    else:
        print(f"❌ Memory failed. Recalled: {recall}")
    
    memories = list_memories()
    if "test_key: test_value_42" in memories:
        print("✅ Memory listing works.")
    else:
        print("❌ Memory listing failed.")

    # 4. Test reminder command parser
    print("\n4️⃣ Testing Command Parsing...")
    text, dt = parse_reminder_command("remind me to feed the dog at 5pm")
    if text == "feed the dog" and dt == "5pm":
        print("✅ Reminder parsing works: text={}, time={}".format(text, dt))
    else:
        print(f"❌ Reminder parsing failed: text={text}, time={dt}")

    print("\n5️⃣ Testing Dynamic Py Agent Interception...")
    fake_reply = "I will create that for you. [EXECUTE_PYTHON]print('Hello from the dynamically generated python agent script!')\n[/EXECUTE_PYTHON]"
    
    import re
    from actions.data_agent import execute_python_code
    python_match = re.search(r"\[EXECUTE_PYTHON\](.*?)\[/EXECUTE_PYTHON\]", fake_reply, re.DOTALL)
    if python_match:
        code = python_match.group(1).strip()
        out = execute_python_code(code)
        if "Hello from the dynamically generated python agent script!" in out:
            print("✅ Data Agent Python Interpreter successfully extracted and executed code.")
        else:
            print(f"❌ Data Agent Python execution failed. Output: {out}")
    else:
        print("❌ Regex failed to extract.")

    print("\n🎉 Test suite completed!")

if __name__ == "__main__":
    run_tests()
