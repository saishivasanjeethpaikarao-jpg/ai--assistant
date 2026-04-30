#!/usr/bin/env python3
"""
COMPREHENSIVE TEST SUITE - 12-LAYER AUTONOMOUS AI SYSTEM

Tests all 12 layers integrated together with complete workflow verification.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from advanced_system import (
    get_layer_prompt,
    is_advanced_system_enabled,
    get_all_layers,
    get_layer_count,
)
from autonomous_executor import get_executor, reset_executor, AutonomousExecutor
from adaptive_memory import get_memory, reset_memory, AdaptiveMemory
from system_coordinator import (
    get_coordinator,
    process_user_request,
    get_system_status,
    export_session,
    reset_coordinator,
)


def test_layer_1_intent_detector():
    """Test Layer 1: Intent Detection"""
    print("\n[TEST 1] LAYER 1: INTENT DETECTOR")
    print("-" * 60)
    
    executor = get_executor()
    
    test_cases = [
        ("open Chrome", "COMMAND", "LOW"),
        ("analyze sales data", "GOAL", "MEDIUM"),
        ("how is the weather", "CHAT", "LOW"),
        ("build and deploy a web application", "GOAL", "HIGH"),
    ]
    
    passed = 0
    for user_input, expected_type, expected_complexity in test_cases:
        intent = executor.detect_intent(user_input)
        type_ok = intent["type"] == expected_type
        complexity_ok = intent["complexity"] == expected_complexity
        
        status = "OK" if (type_ok and complexity_ok) else "FAIL"
        print(f"  {status}: '{user_input}'")
        print(f"         Type: {intent['type']} ({expected_type}), Complexity: {intent['complexity']} ({expected_complexity})")
        
        if type_ok and complexity_ok:
            passed += 1
    
    print(f"  Score: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_layer_2_3_planning_and_critique():
    """Test Layers 2-3: Planning & Critique"""
    print("\n[TEST 2-3] LAYERS 2-3: PLANNING & CRITIQUE")
    print("-" * 60)
    
    executor = get_executor()
    
    goals = [
        "analyze product sales data",
        "build a Python web application",
        "debug memory leak in code",
    ]
    
    passed = 0
    for goal in goals:
        plan = executor.create_plan(goal)
        is_approved, feedback = executor.critique_plan(plan)
        
        # Both checks should pass
        has_steps = len(plan) > 0 and len(plan) <= 5
        approved = is_approved
        
        status = "OK" if (has_steps and approved) else "FAIL"
        print(f"  {status}: '{goal}'")
        print(f"         Plan steps: {len(plan)}, Approved: {approved}")
        
        if has_steps and approved:
            passed += 1
    
    print(f"  Score: {passed}/{len(goals)}")
    return passed == len(goals)


def test_layer_4_execution_engine():
    """Test Layer 4: Execution Engine"""
    print("\n[TEST 4] LAYER 4: EXECUTION ENGINE")
    print("-" * 60)
    
    executor = get_executor()
    
    steps = [
        "Read the configuration file",
        "Create a backup directory",
        "Analyze the data set",
    ]
    
    passed = 0
    for step in steps:
        execution = executor.execute_step(step)
        has_command = "command" in execution and len(execution["command"]) > 0
        status = "OK" if has_command else "FAIL"
        print(f"  {status}: '{step}'")
        print(f"         Command: {execution['command'][:50]}")
        
        if has_command:
            passed += 1
    
    print(f"  Score: {passed}/{len(steps)}")
    return passed == len(steps)


def test_layer_5_decision_engine():
    """Test Layer 5: Decision Engine"""
    print("\n[TEST 5] LAYER 5: DECISION ENGINE")
    print("-" * 60)
    
    executor = get_executor()
    
    goal = "Deploy application"
    options = [
        "Manual deployment with validation",
        "Automated deployment with tests",
        "Staged rollout deployment"
    ]
    
    decision = executor.decide_best_option(goal, options)
    
    has_best = decision.get("best_option") in options
    has_score = 1 <= decision.get("score", 0) <= 10
    has_reasoning = len(decision.get("reasoning", "")) > 0
    
    all_ok = has_best and has_score and has_reasoning
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: Decision made")
    print(f"         Best: {decision.get('best_option')}")
    print(f"         Score: {decision.get('score')}/10")
    print(f"         Reasoning: {decision.get('reasoning')}")
    
    return all_ok


def test_layer_6_safety_filter():
    """Test Layer 6: Safety Filter"""
    print("\n[TEST 6] LAYER 6: SAFETY FILTER")
    print("-" * 60)
    
    executor = get_executor()
    
    test_cases = [
        ("python script.py", True, "safe"),
        ("shutdown /s", False, "blocked"),
        ("del /s /q C:\\files", False, "blocked"),
        ("run backup.bat", True, "safe"),
    ]
    
    passed = 0
    for command, should_be_safe, label in test_cases:
        is_safe, reason = executor.validate_safety(command)
        is_correct = is_safe == should_be_safe
        
        status = "OK" if is_correct else "FAIL"
        print(f"  {status}: '{command}'")
        print(f"         Safe: {is_safe} (expected {should_be_safe}) - {label}")
        
        if is_correct:
            passed += 1
    
    print(f"  Score: {passed}/{len(test_cases)}")
    return passed == len(test_cases)


def test_layer_7_self_reflection():
    """Test Layer 7: Self-Reflection"""
    print("\n[TEST 7] LAYER 7: SELF-REFLECTION")
    print("-" * 60)
    
    executor = get_executor()
    
    goal = "Deploy application"
    plan = ["Build application", "Run tests", "Deploy to server"]
    results = [
        {"status": "executed", "output": "success"},
        {"status": "executed", "output": "success"},
        {"status": "executed", "output": "success"},
    ]
    
    reflection = executor.reflect_on_outcome(goal, plan, results)
    
    has_status = reflection.get("status") in ["ACHIEVED", "PARTIAL", "FAILED"]
    has_analysis = len(reflection.get("analysis", "")) > 0
    has_improvements = len(reflection.get("improvements", [])) > 0
    
    all_ok = has_status and has_analysis and has_improvements
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: Reflection complete")
    print(f"         Status: {reflection.get('status')}")
    print(f"         Analysis: {reflection.get('analysis')}")
    
    return all_ok


def test_layer_8_adaptive_memory():
    """Test Layer 8: Adaptive Memory"""
    print("\n[TEST 8] LAYER 8: ADAPTIVE MEMORY")
    print("-" * 60)
    
    memory = get_memory()
    reset_memory()
    memory = get_memory()  # Fresh instance
    
    # Store learning
    memory.store_preference("favorite_language", "Python", "high")
    memory.store_pattern("User prefers efficient solutions", "usage")
    memory.store_successful_strategy("analyze data", ["load", "process", "visualize"], {"status": "ACHIEVED"})
    
    # Retrieve and verify
    pref = memory.get_preference("favorite_language")
    patterns = memory.get_patterns()
    strategies = memory.strategies
    
    pref_ok = pref == "Python"
    pattern_ok = len(patterns) > 0
    strategy_ok = len(strategies) > 0
    
    all_ok = pref_ok and pattern_ok and strategy_ok
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: Memory operations")
    print(f"         Preferences stored: {pref_ok}")
    print(f"         Patterns detected: {pattern_ok} ({len(patterns)})")
    print(f"         Strategies learned: {strategy_ok} ({len(strategies)})")
    
    return all_ok


def test_complete_workflow():
    """Test 9: Complete workflow integration"""
    print("\n[TEST 9] COMPLETE WORKFLOW INTEGRATION")
    print("-" * 60)
    
    reset_executor()
    reset_memory()
    reset_coordinator()
    
    user_input = "analyze sales data and create a report"
    
    result = process_user_request(user_input)
    
    has_status = "status" in result and result["status"] == "complete"
    has_type = "type" in result
    has_plan = "plan" in result and len(result["plan"]) > 0
    has_results = "results" in result
    has_reflection = "reflection" in result
    has_learning = "learning" in result
    
    all_ok = all([has_status, has_type, has_plan, has_results, has_reflection, has_learning])
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: Workflow complete")
    print(f"         Input: '{user_input}'")
    print(f"         Type: {result.get('type')}, Complexity: {result.get('complexity')}")
    print(f"         Plan steps: {len(result.get('plan', []))}")
    print(f"         Learning: {result.get('learning', {}).get('learning', '')}")
    
    return all_ok


def test_system_coordination():
    """Test 10: System coordination"""
    print("\n[TEST 10] SYSTEM COORDINATION")
    print("-" * 60)
    
    status = get_system_status()
    
    has_layers = "total_layers" in status and status["total_layers"] == 12
    has_enabled = status.get("system_enabled", False)
    has_execution = "execution" in status
    has_memory = "memory" in status
    has_session = "session" in status
    
    all_ok = all([has_layers, has_enabled, has_execution, has_memory, has_session])
    status_ok = "OK" if all_ok else "FAIL"
    
    print(f"  {status_ok}: System coordination")
    print(f"         Layers: {status.get('total_layers')}/12")
    print(f"         Enabled: {has_enabled}")
    print(f"         Sessions: {status['session'].get('interactions')}")
    
    return all_ok


def test_all_layers_available():
    """Test 11: All 12 layers available"""
    print("\n[TEST 11] ALL 12 LAYERS AVAILABLE")
    print("-" * 60)
    
    layers = get_all_layers()
    count = get_layer_count()
    
    expected_layers = [
        "intent_detector",
        "strategic_planner",
        "plan_critic",
        "execution_engine",
        "decision_engine",
        "safety_filter",
        "self_reflection",
        "adaptive_memory",
        "replanning_engine",
        "chat_mode",
        "meta_improvement",
        "orchestrator",
    ]
    
    all_present = all(layer in layers for layer in expected_layers)
    count_ok = count == 12
    
    all_ok = all_present and count_ok
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: All layers present")
    print(f"         Total layers: {count}/12")
    for i, layer in enumerate(layers, 1):
        print(f"         {i}. {layer}")
    
    return all_ok


def test_memory_export():
    """Test 12: Memory export and session data"""
    print("\n[TEST 12] SESSION EXPORT & DATA")
    print("-" * 60)
    
    export_data = export_session()
    
    has_metadata = "session_metadata" in export_data
    has_history = "execution_history" in export_data
    has_strategies = "learned_strategies" in export_data
    has_memory = "memory_statistics" in export_data
    has_preferences = "user_preferences" in export_data
    
    all_ok = all([has_metadata, has_history, has_strategies, has_memory, has_preferences])
    status = "OK" if all_ok else "FAIL"
    
    print(f"  {status}: Session export")
    print(f"         Metadata: {has_metadata}")
    print(f"         History: {has_history}")
    print(f"         Strategies: {has_strategies}")
    print(f"         Memory stats: {has_memory}")
    print(f"         Preferences: {has_preferences}")
    
    return all_ok


def main():
    """Run all tests"""
    print("=" * 60)
    print("12-LAYER AUTONOMOUS AI SYSTEM - COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    
    tests = [
        ("Layer 1: Intent Detector", test_layer_1_intent_detector),
        ("Layers 2-3: Planning & Critique", test_layer_2_3_planning_and_critique),
        ("Layer 4: Execution Engine", test_layer_4_execution_engine),
        ("Layer 5: Decision Engine", test_layer_5_decision_engine),
        ("Layer 6: Safety Filter", test_layer_6_safety_filter),
        ("Layer 7: Self-Reflection", test_layer_7_self_reflection),
        ("Layer 8: Adaptive Memory", test_layer_8_adaptive_memory),
        ("Complete Workflow", test_complete_workflow),
        ("System Coordination", test_system_coordination),
        ("All 12 Layers Available", test_all_layers_available),
        ("Session Export", test_memory_export),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed_tests = sum(1 for _, passed in results if passed)
    total_tests = len(results)
    
    for test_name, passed in results:
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} {test_name}")
    
    print("\n" + "=" * 60)
    print(f"OVERALL: {passed_tests}/{total_tests} tests passed")
    print("=" * 60)
    
    if passed_tests == total_tests:
        print("\n*** ALL TESTS PASSED - 12-LAYER SYSTEM READY FOR PRODUCTION ***")
        return 0
    else:
        print(f"\n*** WARNING: {total_tests - passed_tests} tests failed ***")
        return 1


if __name__ == "__main__":
    sys.exit(main())
