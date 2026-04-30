"""
Test script for SmartOrchestrator V2 integration.
Tests the adaptive reasoning controller with sample inputs.
"""

import sys
import os

# Setup path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from dotenv import load_dotenv
from config_paths import ensure_user_env, get_dotenv_path

# Initialize environment
ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

def test_orchestrator():
    """Test SmartOrchestrator with sample inputs."""
    print("=" * 60)
    print("SMART ORCHESTRATOR V2 - INTEGRATION TEST")
    print("=" * 60)
    
    try:
        from orchestrator_v2 import SmartOrchestrator
        print("✅ SmartOrchestrator imported successfully")
    except ImportError as e:
        print(f"❌ Failed to import SmartOrchestrator: {e}")
        return False
    
    # Initialize orchestrator
    orchestrator = SmartOrchestrator(max_loops=3)
    print("✅ SmartOrchestrator initialized")
    
    # Test inputs
    test_inputs = [
        "Prepare my trading setup",
        "Research NIFTY trend and suggest trade",
        "Organize my files"
    ]
    
    print("\n" + "=" * 60)
    print("RUNNING TESTS")
    print("=" * 60)
    
    for i, test_input in enumerate(test_inputs, 1):
        print(f"\n--- Test {i}: {test_input} ---")
        print(f"Input: {test_input}")
        
        try:
            # Test intent detection
            intent = orchestrator.detect_intent(test_input)
            print(f"Detected Intent: {intent}")
            
            # Test full execution (this will use the LLM)
            print("Running full execution...")
            result = orchestrator.run(test_input)
            print(f"Result preview: {result[:300]}...")
            
        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)
    return True

if __name__ == "__main__":
    success = test_orchestrator()
    sys.exit(0 if success else 1)
