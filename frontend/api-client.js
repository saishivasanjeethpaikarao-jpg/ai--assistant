// AI Chat API Client
// Handles communication with backend

class AIChat {
  constructor() {
    this.messages = [];
    this.isLoading = false;
    // Try Netlify first, fall back to local backend or direct API
    this.baseURL = window.location.origin.includes("netlify") 
      ? "/.netlify/functions"
      : "http://localhost:5000/api";
    this.initializeFromLocalStorage();
  }

  initializeFromLocalStorage() {
    const saved = localStorage.getItem("chat_messages");
    if (saved) {
      this.messages = JSON.parse(saved);
    }
  }

  saveToLocalStorage() {
    localStorage.setItem("chat_messages", JSON.stringify(this.messages));
  }

  async sendMessage(message) {
    if (!message.trim()) {
      throw new Error("Message cannot be empty");
    }

    // Add user message
    this.messages.push({
      id: Date.now(),
      text: message,
      sender: "user",
      timestamp: new Date().toISOString()
    });

    this.isLoading = true;
    this.saveToLocalStorage();

    try {
      // Try local backend first
      let response;
      const endpoint = this.baseURL.includes("netlify") 
        ? `${this.baseURL}/chat`
        : `${this.baseURL}/request`;
      
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Add AI response
      this.messages.push({
        id: Date.now() + 1,
        text: data.reply || "No response",
        sender: "ai",
        type: data.type || "response",
        thinking: data.thinking,
        timestamp: new Date().toISOString()
      });

      this.saveToLocalStorage();
      return data;

    } catch (error) {
      console.error("Error:", error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async clearHistory() {
    this.messages = [];
    localStorage.removeItem("chat_messages");
  }

  getMessages() {
    return this.messages;
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }
}

// Export for use
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIChat;
}
