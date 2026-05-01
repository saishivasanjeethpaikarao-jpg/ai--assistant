// Main Chat Application Script

class ChatApp {
  constructor() {
    this.chatBox = document.getElementById("chat");
    this.messageInput = document.getElementById("messageInput");
    this.sendBtn = document.getElementById("sendBtn");
    this.loadingIndicator = document.getElementById("loadingIndicator");
    
    this.apiClient = new AIChat();
    this.init();
  }

  init() {
    // Event listeners
    this.sendBtn.addEventListener("click", () => this.handleSendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Load existing messages
    this.renderMessages();
  }

  async handleSendMessage() {
    const message = this.messageInput.value.trim();

    if (!message) {
      return;
    }

    // Clear input
    this.messageInput.value = "";
    this.messageInput.focus();

    // Disable send button
    this.sendBtn.disabled = true;

    try {
      // Add user message to display
      this.addMessageToDisplay(message, "user");

      // Show loading indicator
      this.showLoading(true);

      // Send to API
      const response = await this.apiClient.sendMessage(message);

      // Hide loading
      this.showLoading(false);

      // Add AI response
      this.addMessageToDisplay(response.reply, "ai", response.thinking);

      // Scroll to bottom
      this.scrollToBottom();

    } catch (error) {
      console.error("Error:", error);
      this.showLoading(false);
      this.addMessageToDisplay(
        `Error: ${error.message || "Failed to get response"}`,
        "error"
      );
    } finally {
      this.sendBtn.disabled = false;
    }
  }

  addMessageToDisplay(text, sender, metadata = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = text;

    if (metadata) {
      const metaDiv = document.createElement("small");
      metaDiv.style.opacity = "0.7";
      metaDiv.style.display = "block";
      metaDiv.style.marginTop = "8px";
      metaDiv.textContent = `(${metadata.length || 0} steps planned)`;
      contentDiv.appendChild(metaDiv);
    }

    messageDiv.appendChild(contentDiv);
    this.chatBox.appendChild(messageDiv);
    this.scrollToBottom();
  }

  renderMessages() {
    this.chatBox.innerHTML = `
      <div class="message ai-message">
        <div class="message-content">
          Welcome! I'm your AI assistant. Type a message below and I'll help you. 
          <br><br>
          I can help with:
          <ul style="margin: 8px 0 0 20px;">
            <li>Answering questions</li>
            <li>Writing and editing</li>
            <li>Analysis and planning</li>
            <li>Problem solving</li>
          </ul>
        </div>
      </div>
    `;

    // Render existing messages
    const messages = this.apiClient.getMessages();
    messages.forEach(msg => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${msg.sender}-message`;
      
      const contentDiv = document.createElement("div");
      contentDiv.className = "message-content";
      contentDiv.textContent = msg.text;
      
      if (msg.thinking) {
        const metaDiv = document.createElement("small");
        metaDiv.style.opacity = "0.7";
        metaDiv.style.display = "block";
        metaDiv.style.marginTop = "8px";
        metaDiv.textContent = `(${msg.thinking.length || 0} steps)`;
        contentDiv.appendChild(metaDiv);
      }
      
      messageDiv.appendChild(contentDiv);
      this.chatBox.appendChild(messageDiv);
    });

    this.scrollToBottom();
  }

  showLoading(show) {
    this.loadingIndicator.style.display = show ? "flex" : "none";
    if (show) {
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  clearChat() {
    if (confirm("Clear all messages?")) {
      this.apiClient.clearHistory();
      this.renderMessages();
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new ChatApp();
});

// Handle keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl+K to focus input
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    document.getElementById("messageInput").focus();
  }
  
  // Ctrl+L to clear
  if ((e.ctrlKey || e.metaKey) && e.key === "l") {
    e.preventDefault();
    if (window.chatApp) {
      window.chatApp.clearChat();
    }
  }
});
