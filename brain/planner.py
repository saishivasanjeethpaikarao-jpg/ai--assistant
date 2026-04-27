import os
from dotenv import load_dotenv
from openai import OpenAI

from assistant_core import handle_command
from config_paths import ensure_user_env, get_dotenv_path

ensure_user_env()
load_dotenv(get_dotenv_path(), override=True)

_groq = os.getenv("GROQ_API_KEY", "").strip()
_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
client = (
    OpenAI(api_key=_groq, base_url="https://api.groq.com/openai/v1")
    if _groq
    else None
)


def plan_task(command):
    if client is None:
        return ["Set GROQ_API_KEY in .env or Settings.", "Then retry this task."]
    prompt = f"""
Break this task into steps:
{command}

Return steps in short lines.
"""

    response = client.chat.completions.create(
        model=_model,
        messages=[{"role": "user", "content": prompt}],
    )
    steps = response.choices[0].message.content
    return steps.split("\n")


def run_task(command):
    steps = plan_task(command)
    results = []

    for step in steps:
        if step.strip() == "":
            continue
        result = handle_command(step.lower())
        results.append(result)

    return "\n".join(results)
