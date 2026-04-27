import os

def open_app(app_name):
    if "chrome" in app_name:
        os.system("start chrome")
        return "Opening Chrome"
    elif "vs code" in app_name:
        os.system("code")
        return "Opening VS Code"
    return "App not found"
