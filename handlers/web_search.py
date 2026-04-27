"""
Web search handler - Search Google, DuckDuckGo, or other search engines.
"""

from typing import Dict, Any
import webbrowser
import os

from core.logger import logger


def search_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle search commands."""
    # Extract query
    query = cmd.lower()
    for trigger in ["search", "google", "find", "look for", "search for"]:
        if trigger in query:
            query = query.replace(trigger, "").strip()
            break
    
    if not query:
        return "What would you like me to search for?"
    
    # Remove common filler words
    query = query.replace("the ", "").replace("for ", "")
    
    if not query or len(query) < 2:
        return "Please provide a search query."
    
    try:
        # Use Google Search
        search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        logger.info(f"Opening search: {query}")
        webbrowser.open(search_url)
        return f"Searching Google for '{query}'..."
    
    except Exception as e:
        logger.error(f"Search handler error: {e}")
        return f"Unable to search: {str(e)}"


def youtube_handler(cmd: str, context: Dict[str, Any]) -> str:
    """Handle YouTube play requests."""
    # Extract video query
    query = cmd.lower()
    for trigger in ["play", "youtube", "video"]:
        if trigger in query:
            query = query.replace(trigger, "").strip()
            break
    
    if not query:
        return "What would you like to play on YouTube?"
    
    try:
        # Use YouTube search
        youtube_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        logger.info(f"Opening YouTube: {query}")
        webbrowser.open(youtube_url)
        return f"Opening YouTube search for '{query}'..."
    
    except Exception as e:
        logger.error(f"YouTube handler error: {e}")
        return f"Unable to play video: {str(e)}"
