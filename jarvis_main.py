"""
Jarvis AI Assistant - Main Application Entry Point (Phase 1)
Production-ready command-line interface with proper threading and error handling.
"""

import sys
import os
from pathlib import Path

# Setup path
BASE_DIR = Path(__file__).parent
sys.path.insert(0, str(BASE_DIR))

# Initialize core modules
from core import logger, message_queue, command_engine, config
from core.message_queue import CommandPriority


def setup_application() -> None:
    """Initialize application and register command handlers."""
    logger.info("=" * 60)
    logger.info("JARVIS AI Assistant Starting...")
    logger.info("=" * 60)
    
    # Register default handlers
    _register_system_commands()
    _register_action_commands()
    
    logger.info(f"Configuration loaded: {config.config_file}")
    logger.debug(f"Voice config: {config.voice}")


def _register_system_commands() -> None:
    """Register built-in system commands."""
    
    def daily_briefing(cmd: str, ctx: dict) -> str:
        """Provide a daily briefing."""
        from datetime import datetime
        now = datetime.now()
        return f"Good morning! It's {now.strftime('%A, %B %d, %Y at %I:%M %p')}. Ready to assist you today."
    
    def reminder_handler(cmd: str, ctx: dict) -> str:
        """Handle reminder commands."""
        try:
            from memory.reminders import list_reminders
            reminders = list_reminders()
            if not reminders:
                return "No reminders set."
            return "Reminders:\n" + "\n".join(f"  • {r}" for r in reminders[:5])
        except Exception as e:
            logger.error(f"Reminder handler error: {e}")
            return f"Reminders not available: {str(e)}"
    
    def memory_handler(cmd: str, ctx: dict) -> str:
        """Handle memory commands."""
        if "remember" in cmd.lower():
            fact = cmd.lower().replace("remember", "").strip()
            if not fact:
                return "Please tell me what you'd like me to remember."
            try:
                from brain.brain import remember_fact
                remember_fact(fact)
                return f"I'll remember: {fact}"
            except Exception as e:
                logger.error(f"Memory handler error: {e}")
                return "Unable to save memory."
        
        if "recall" in cmd.lower():
            try:
                from brain.brain import list_memories
                mems = list_memories()
                if not mems:
                    return "I don't have any memories."
                return "My memories:\n" + "\n".join(f"  • {m}" for m in mems[:5])
            except Exception as e:
                logger.error(f"Recall handler error: {e}")
                return "Unable to recall memories."
        
        return "Memory command not recognized."
    
    # Register handlers
    command_engine.register(
        keywords=["briefing", "good morning", "status"],
        handler=daily_briefing,
        description="Get daily briefing"
    )
    
    command_engine.register(
        keywords=["reminder", "remind", "reminders"],
        handler=reminder_handler,
        description="Show reminders"
    )
    
    command_engine.register(
        keywords=["remember", "recall", "memory"],
        handler=memory_handler,
        description="Remember or recall facts"
    )


def _register_action_commands() -> None:
    """Register action-based commands."""
    
    def search_handler(cmd: str, ctx: dict) -> str:
        """Search the web."""
        query = cmd.lower().replace("search", "").replace("for", "").strip()
        if not query:
            return "What would you like me to search for?"
        try:
            from browser import search_google
            logger.info(f"Searching for: {query}")
            search_google(query)
            return f"Searching for '{query}'..."
        except Exception as e:
            logger.error(f"Search handler error: {e}")
            return f"Unable to search: {str(e)}"
    
    def file_handler(cmd: str, ctx: dict) -> str:
        """Handle file operations."""
        if "open" in cmd.lower():
            file_path = cmd.lower().replace("open", "").strip()
            if not file_path:
                return "Which file would you like me to open?"
            try:
                os.startfile(file_path)
                return f"Opening {file_path}..."
            except Exception as e:
                logger.error(f"File handler error: {e}")
                return f"Unable to open file: {str(e)}"
        
        return "File command not recognized."
    
    def app_handler(cmd: str, ctx: dict) -> str:
        """Launch applications."""
        app_map = {
            "chrome": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "browser": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "vscode": "C:\\Users\\santo\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
            "explorer": "explorer.exe",
            "files": "explorer.exe",
            "notepad": "notepad.exe",
        }
        
        for app_name, path in app_map.items():
            if app_name in cmd.lower():
                try:
                    if os.path.exists(path):
                        os.startfile(path)
                        return f"Launching {app_name}..."
                    else:
                        return f"{app_name} not found on this system."
                except Exception as e:
                    logger.error(f"App launcher error: {e}")
                    return f"Unable to launch {app_name}: {str(e)}"
        
        return f"Application not recognized. Try: chrome, vscode, explorer, notepad"
    
    command_engine.register(
        keywords=["search", "google"],
        handler=search_handler,
        description="Search the web"
    )
    
    command_engine.register(
        keywords=["open", "file"],
        handler=file_handler,
        description="Open a file"
    )
    
    command_engine.register(
        keywords=["launch", "open app", "start", "run"],
        handler=app_handler,
        description="Launch an application"
    )


def chat_loop() -> None:
    """Main interactive chat loop."""
    print("\n" + "=" * 60)
    print("JARVIS AI Assistant - Interactive Mode")
    print("=" * 60)
    print("Type 'help' for available commands")
    print("Type 'exit' to quit\n")
    
    def process_command(cmd):
        """Process a single command."""
        if not cmd or not cmd.strip():
            return
        
        response = command_engine.execute(cmd)
        print(f"Jarvis: {response}\n")
    
    # Start command processor
    message_queue.start_processor(lambda cmd: command_engine.execute(cmd.text, cmd.context))
    
    try:
        while True:
            try:
                user_input = input("You: ").strip()
            except KeyboardInterrupt:
                print("\n\nGoodbye!")
                break
            except EOFError:
                print("\n\nGoodbye!")
                break
            
            if not user_input:
                continue
            
            if user_input.lower() in ["exit", "quit", "bye"]:
                print("Jarvis: Goodbye!")
                break
            
            # Execute directly for now (Phase 1)
            response = command_engine.execute(user_input)
            print(f"Jarvis: {response}\n")
    
    finally:
        message_queue.stop_processor()
        logger.info("Chat loop ended")


def main():
    """Main entry point."""
    try:
        setup_application()
        chat_loop()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.exception("Fatal error in main")
        print(f"Fatal error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        logger.info("Jarvis AI Assistant Shutting Down")
        print("\nShutdown complete.")


if __name__ == "__main__":
    main()
