"""
Web Browser Tool — Open URLs, search, navigate.
"""

import webbrowser
from typing import Optional
from backend.tools import ToolResult, tool_registry


def open_url(url: str) -> ToolResult:
    """
    Open a URL in the default browser.
    
    Args:
        url: URL to open
    """
    try:
        # Ensure URL has protocol
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        
        webbrowser.open(url)
        return ToolResult(
            success=True,
            message=f"Opening {url}..."
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Failed to open URL: {e}")


def search_google(query: str) -> ToolResult:
    """
    Search Google for a query.
    
    Args:
        query: Search query
    """
    try:
        search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        webbrowser.open(search_url)
        return ToolResult(
            success=True,
            message=f"Searching Google for '{query}'..."
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Search failed: {e}")


def search_youtube(query: str) -> ToolResult:
    """
    Search YouTube for a query.
    
    Args:
        query: Search query
    """
    try:
        search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"
        webbrowser.open(search_url)
        return ToolResult(
            success=True,
            message=f"Searching YouTube for '{query}'..."
        )
    except Exception as e:
        return ToolResult(success=False, message=f"YouTube search failed: {e}")


def search_wikipedia(query: str) -> ToolResult:
    """
    Search Wikipedia for a query.
    
    Args:
        query: Search query
    """
    try:
        search_url = f"https://en.wikipedia.org/wiki/{query.replace(' ', '_')}"
        webbrowser.open(search_url)
        return ToolResult(
            success=True,
            message=f"Opening Wikipedia for '{query}'..."
        )
    except Exception as e:
        return ToolResult(success=False, message=f"Wikipedia search failed: {e}")


def open_gmail() -> ToolResult:
    """Open Gmail."""
    return open_url("https://mail.google.com")


def open_github() -> ToolResult:
    """Open GitHub."""
    return open_url("https://github.com")


def open_stackoverflow() -> ToolResult:
    """Open Stack Overflow."""
    return open_url("https://stackoverflow.com")


def open_reddit() -> ToolResult:
    """Open Reddit."""
    return open_url("https://reddit.com")


def open_twitter() -> ToolResult:
    """Open Twitter/X."""
    return open_url("https://twitter.com")


# Register tools
tool_registry.register("open_url", open_url)
tool_registry.register("search_google", search_google)
tool_registry.register("search_youtube", search_youtube)
tool_registry.register("search_wikipedia", search_wikipedia)
tool_registry.register("open_gmail", open_gmail)
tool_registry.register("open_github", open_github)
tool_registry.register("open_stackoverflow", open_stackoverflow)
tool_registry.register("open_reddit", open_reddit)
tool_registry.register("open_twitter", open_twitter)
