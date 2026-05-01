import threading
import tkinter as tk
from tkinter.scrolledtext import ScrolledText

from assistant_core import handle_command, listen_voice_once, voice_loop, set_user, get_user_profile, start_reminder_monitor, cleanup_on_exit
from assistant_persona import ASSISTANT_NAME, ASSISTANT_TAGLINE


def login_user(signup: bool = False):
    from firebase_auth import sign_in, sign_up

    mode = "Sign Up" if signup else "Sign In"
    print(f"--- {mode} ---")
    identifier = input("Email or phone (digits only or +country): ").strip()
    password = input("Password: ").strip()
    if not identifier or not password:
        print("Please enter both email/phone and password.")
        return
    try:
        result = sign_up(identifier, password) if signup else sign_in(identifier, password)
        uid = result.get("localId")
        email = result.get("email")
        phone = result.get("phoneNumber")
        set_user(uid, email=email, phone=phone)
        start_reminder_monitor(uid)
        briefing = handle_command('daily briefing')
        print(f"✅ {mode} successful. Logged in as {email or phone or uid}")
        print(briefing)
    except Exception as exc:
        print(f"❌ {mode} failed: {exc}")


def guest_user():
    set_user('guest', email=None, phone=None)
    start_reminder_monitor('guest')
    print('✅ Guest mode enabled. You can use the assistant without signing in.')
    briefing = handle_command('daily briefing')
    print(briefing)


def logout_user():
    set_user('guest', email=None, phone=None)
    print('✅ Logged out. Guest mode is enabled.')


def show_profile():
    profile = get_user_profile()
    if not profile:
        print("Not signed in.")
        return
    print("Active profile:")
    for key, value in profile.items():
        print(f"  {key}: {value}")


def open_chat_window():
    window = tk.Tk()
    window.title(f"{ASSISTANT_NAME} Chat")
    window.geometry("560x420")

    chat_display = ScrolledText(window, state="disabled", wrap=tk.WORD)
    chat_display.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

    entry_frame = tk.Frame(window)
    entry_frame.pack(fill=tk.X, padx=10, pady=(0, 10))

    entry = tk.Entry(entry_frame)
    entry.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(0, 10))

    def append_message(sender: str, text: str):
        chat_display.configure(state="normal")
        chat_display.insert(tk.END, f"{sender}: {text}\n")
        chat_display.configure(state="disabled")
        chat_display.yview(tk.END)

    def send_text(_=None):
        user_text = entry.get().strip()
        if not user_text:
            return
        append_message("You", user_text)
        entry.delete(0, tk.END)
        response = handle_command(user_text)
        append_message("Assistant", response)

    def wake_assistant():
        voice_text = listen_voice_once()
        if voice_text:
            append_message("You", voice_text)
            response = handle_command(voice_text)
            append_message("Assistant", response)

    entry.bind("<Return>", send_text)

    wake_button = tk.Button(entry_frame, text="Wake", command=wake_assistant)
    wake_button.pack(side=tk.LEFT)

    send_button = tk.Button(entry_frame, text="Send", command=send_text)
    send_button.pack(side=tk.RIGHT)

    window.mainloop()


if __name__ == "__main__":
    print(f"🚀 {ASSISTANT_NAME} Started! {ASSISTANT_TAGLINE}")
    print("Type your command, 'login', 'signup', 'logout', 'profile', 'guest', 'voice', 'chat', or 'telugu'. Type 'exit' to quit.\n")

    threading.Thread(target=voice_loop, daemon=True).start()

    while True:
        user_input = input("You: ").strip()
        if not user_input:
            continue
        lowered = user_input.lower()
        if lowered == "exit":
            cleanup_on_exit()
            print("👋 Goodbye!")
            break
        if lowered == "login":
            login_user(False)
            continue
        if lowered == "signup":
            login_user(True)
            continue
        if lowered == "logout":
            logout_user()
            continue
        if lowered == "profile":
            show_profile()
            continue
        if lowered == "guest":
            guest_user()
            continue
        if lowered == "voice":
            command = listen_voice_once()
            if command:
                response = handle_command(command)
                if response:
                    print(response)
            continue
        if lowered == "chat":
            open_chat_window()
            continue
        if lowered == "telugu":
            handle_command("telugu mode")
            continue
        if lowered == "english":
            handle_command("english mode")
            continue
        response = handle_command(user_input)
        if response:
            print(response)
