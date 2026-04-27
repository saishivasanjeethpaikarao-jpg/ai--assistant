import webbrowser


def search_google(query: str) -> str:
    if not query:
        return "No search query provided."
    url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
    webbrowser.open(url)
    return f"Opened browser for: {query}"


def open_url(url: str) -> str:
    webbrowser.open(url)
    return f"Opened URL: {url}"
