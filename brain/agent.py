def decide_action(command: str) -> str:
    normalized = command.strip().lower()
    if "open" in normalized:
        return "system"
    elif "search" in normalized:
        return "browser"
    elif "file" in normalized:
        return "file"
    else:
        return "ai"
