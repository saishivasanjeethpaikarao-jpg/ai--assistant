import os


def create_file(path: str, content: str = "") -> str:
    """Create a file with given content. If content is default, uses AI to generate it."""
    if not path:
        return "No file path provided."
    
    # Auto-generate content if not provided
    if content == "" or content == "# New file":
        prompt = f"Write concise, runnable code for {path}. Output only the file body, no markdown."
        try:
            from assistant_core import generate_text
            generated = generate_text(prompt)
            content = (generated or "").strip() or "# New file\n"
        except (ImportError, Exception):
            content = "# New file\n"
    
    # Create directories if needed
    os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
    with open(path, "w", encoding="utf-8") as file:
        file.write(content)
    return f"Created file: {path}"


def read_file(path: str) -> str:
    """Read file contents."""
    if not os.path.exists(path):
        return f"File not found: {path}"
    with open(path, "r", encoding="utf-8") as file:
        return file.read()
