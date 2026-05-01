import { useState, useEffect } from 'react';
import ActivityBar from './components/ActivityBar';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CommandPalette from './components/CommandPalette';
import AgentTaskView from './components/AgentTaskView';
import StatusBar from './components/StatusBar';
import useStore from './store/useStore';
import { api } from './services/api';

function App() {
  const [activePanel, setActivePanel] = useState('chat');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const {
    voiceState,
    messages,
    isTyping,
    tasks,
    addMessage,
    setTyping,
    addTask,
    updateTask,
  } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (text) => {
    addMessage({ role: 'user', content: text });
    setTyping(true);

    try {
      const response = await api.chat(text);
      const content =
        typeof response === 'string'
          ? response
          : response?.reply || response?.message || response?.response || 'Done.';
      addMessage({ role: 'assistant', content });
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' });
    } finally {
      setTyping(false);
    }
  };

  const handleCommand = async (commandId) => {
    const commands = {
      'open-chrome': 'Open Chrome',
      'open-vscode': 'Open VS Code',
      'search-nifty': 'Search NIFTY trend',
      'check-emails': 'Check emails',
      'analyze-trading': 'Analyze trading setup',
      'system-status': 'System status',
    };

    const command = commands[commandId];
    if (command) {
      addTask({ step: command, status: 'pending', result: null });
      const taskIndex = tasks.length;

      try {
        updateTask(taskIndex, { status: 'running' });
        const response = await api.run(command);
        updateTask(taskIndex, { status: 'done', result: response });
      } catch (error) {
        updateTask(taskIndex, { status: 'failed', result: error.message });
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      fontFamily: 'Geist, sans-serif',
      fontSize: '13px',
      color: '#e8e8e8',
    }}>
      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Activity Bar */}
        <ActivityBar activePanel={activePanel} onPanelChange={setActivePanel} />

        {/* Sidebar */}
        <Sidebar activePanel={activePanel} />

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Agent Task View */}
          <AgentTaskView tasks={tasks} />

          {/* Chat Interface */}
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar voiceState={voiceState} aiStatus={isTyping ? 'Processing' : 'Ready'} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommand={handleCommand}
      />
    </div>
  );
}

export default App;
