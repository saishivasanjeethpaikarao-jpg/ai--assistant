/**
 * JARVIS AI Assistant - Main UI Controller
 * Handles modes, dashboard, chat, recommendations, and system integration
 */

class JarvisAssistant {
  constructor() {
    this.apiClient = new AIChat();
    this.currentMode = 'chat';
    this.sessionStats = {
      tasksCompleted: 0,
      interactions: 0,
      learningEvents: 0
    };
    this.startTime = Date.now();
    
    this.initializeUI();
    this.setupEventListeners();
    this.updateStats();
  }

  initializeUI() {
    this.elements = {
      userInput: document.getElementById('userInput'),
      sendBtn: document.getElementById('sendBtn'),
      messagesContainer: document.getElementById('messagesContainer'),
      modeIndicator: document.getElementById('modeIndicator'),
      modeSelect: document.getElementById('modeSelect'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      sessionMode: document.getElementById('sessionMode'),
      sessionComplexity: document.getElementById('sessionComplexity'),
      sessionIntent: document.getElementById('sessionIntent'),
      tasksCount: document.getElementById('tasksCount'),
      interactionCount: document.getElementById('interactionCount'),
      learningCount: document.getElementById('learningCount'),
      recList: document.getElementById('recList'),
      uptime: document.getElementById('uptime')
    };
  }

  setupEventListeners() {
    // Send button
    this.elements.sendBtn.addEventListener('click', () => this.handleSend());
    
    // Enter key
    this.elements.userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
    
    // Mode buttons in sidebar
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchMode(e.target.closest('[data-mode]').dataset.mode));
    });
    
    // Quick action buttons
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleQuickAction(e.target.closest('[data-action]').dataset.action));
    });
    
    // Voice button
    document.getElementById('voiceBtn').addEventListener('click', () => this.toggleVoice());
    
    // Mode select dropdown
    this.elements.modeSelect.addEventListener('change', (e) => this.switchMode(e.target.value));
    
    // Mark nav items
    this.updateNavigation();
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    // Update UI
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Update mode indicator
    const icons = { chat: '💬', command: '⚡', goal: '🎯', analytics: '📊', trading: '📈' };
    const names = { chat: 'Chat Mode', command: 'Command Mode', goal: 'Goal Planning', analytics: 'Analytics', trading: 'Trading' };
    
    this.elements.modeIndicator.innerHTML = `
      <span class="mode-icon">${icons[mode] || '💬'}</span>
      <span class="mode-name">${names[mode] || 'Chat'}</span>
    `;
    
    this.elements.modeSelect.value = mode;
    this.elements.sessionMode.textContent = names[mode] || 'Chat';
    
    // Clear chat for new mode
    this.elements.messagesContainer.innerHTML = `
      <div class="message system-message">
        <div class="message-content">
          <strong>Switched to ${names[mode]}</strong><br>
          Ready to assist in this mode. What would you like to do?
        </div>
      </div>
    `;
  }

  async handleSend() {
    const message = this.elements.userInput.value.trim();
    
    if (!message) return;
    
    this.elements.userInput.value = '';
    this.elements.sendBtn.disabled = true;
    this.showLoading(true);
    
    try {
      // Add user message
      this.addMessage(message, 'user');
      
      // Prepare request with mode
      const request = {
        message: message,
        mode: this.currentMode,
        timestamp: new Date().toISOString()
      };
      
      // Send to backend with mode context
      const response = await this.sendWithMode(request);
      
      // Update session info
      if (response.response) {
        this.updateSessionInfo(response.response);
      }
      
      // Add AI response
      this.addMessage(response.reply || 'Processing complete', 'ai', response.response);
      
      // Update stats
      this.sessionStats.interactions++;
      if (response.response?.memory_insights?.total_strategies) {
        this.sessionStats.learningEvents++;
      }
      this.updateStats();
      
      // Scroll to bottom
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
      
    } catch (error) {
      console.error('Error:', error);
      this.addMessage(`Error: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
      this.elements.sendBtn.disabled = false;
      this.elements.userInput.focus();
    }
  }

  async sendWithMode(request) {
    // For now, use the basic API client
    // In production, this would route through mode-specific endpoints
    return await this.apiClient.sendMessage(request.message);
  }

  handleQuickAction(action) {
    const actions = {
      briefing: "Give me a daily briefing with today's agenda and priorities",
      reminders: "Show my reminders and upcoming events",
      memory: "Show me what you've learned about me"
    };
    
    if (actions[action]) {
      this.elements.userInput.value = actions[action];
      this.handleSend();
    }
  }

  addMessage(text, sender, metadata = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;
    
    if (metadata && (metadata.type || metadata.complexity)) {
      const metaDiv = document.createElement('small');
      metaDiv.style.display = 'block';
      metaDiv.style.marginTop = '8px';
      metaDiv.style.opacity = '0.7';
      metaDiv.textContent = `[${metadata.type || 'RESPONSE'} - ${metadata.complexity || 'UNKNOWN'}]`;
      contentDiv.appendChild(metaDiv);
    }
    
    messageDiv.appendChild(contentDiv);
    this.elements.messagesContainer.appendChild(messageDiv);
    
    // Auto scroll
    setTimeout(() => {
      this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }, 50);
  }

  updateSessionInfo(response) {
    if (response.intent) {
      this.elements.sessionIntent.textContent = response.intent.type || 'UNKNOWN';
      this.elements.sessionComplexity.textContent = response.intent.complexity || 'UNKNOWN';
    }
  }

  updateStats() {
    this.elements.tasksCount.textContent = this.sessionStats.tasksCompleted;
    this.elements.interactionCount.textContent = this.sessionStats.interactions;
    this.elements.learningCount.textContent = this.sessionStats.learningEvents;
    
    // Update uptime
    const elapsed = Date.now() - this.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    this.elements.uptime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Update periodically
    setTimeout(() => this.updateStats(), 1000);
  }

  showLoading(show) {
    this.elements.loadingIndicator.style.display = show ? 'flex' : 'none';
  }

  toggleVoice() {
    alert('Voice control coming soon! 🎤');
  }

  updateNavigation() {
    // Set active nav item
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector('[data-mode="chat"]').classList.add('active');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.jarvisAssistant = new JarvisAssistant();
});
