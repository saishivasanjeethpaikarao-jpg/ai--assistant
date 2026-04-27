import time
import json
import os
import schedule
import threading

ROUTINES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "routines.json")

def load_routines():
    if not os.path.exists(ROUTINES_FILE):
        return []
    with open(ROUTINES_FILE, 'r') as f:
        return json.load(f)

def save_routines(routines):
    with open(ROUTINES_FILE, 'w') as f:
        json.dump(routines, f, indent=4)

def execute_routine(command, uid):
    from assistant_core import handle_command
    print(f"⏰ [AUTOMATION] Running routine: {command}")
    try:
        handle_command(command)
    except Exception as e:
        print(f"Routine failed: {e}")

def reload_scheduler():
    schedule.clear()
    routines = load_routines()
    for r in routines:
        routine_time = r.get("time") # format "09:00"
        command = r.get("command")
        uid = r.get("uid", "guest")
        if routine_time and command:
            schedule.every().day.at(routine_time).do(execute_routine, command, uid)

def automation_loop():
    reload_scheduler()
    while True:
        schedule.run_pending()
        time.sleep(10)

def start_automation_agent():
    t = threading.Thread(target=automation_loop, daemon=True)
    t.start()

def add_routine(time_str: str, command: str, uid: str = "guest"):
    """Adds a new daily routine. Triggered by assistant_core if user requests it."""
    routines = load_routines()
    routines.append({"time": time_str, "command": command, "uid": uid})
    save_routines(routines)
    reload_scheduler()
    return f"Routine successfully scheduled for {time_str} daily."
