import subprocess


def git_commit(message: str) -> str:
    try:
        subprocess.run(["git", "add", "--all"], check=True)
        subprocess.run(["git", "commit", "-m", message], check=True)
        return "Git commit created successfully."
    except subprocess.CalledProcessError as exc:
        return f"Git commit failed: {exc}"


def git_status() -> str:
    result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    return result.stdout.strip()
