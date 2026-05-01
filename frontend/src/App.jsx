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
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
      // Toggle sidebar with Ctrl+B like VS Code
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanelChange = (panel) => {
    if (activePanel === panel) {
      setSidebarOpen(o => !o);
    } else {
      setActivePanel(panel);
      setSidebarOpen(true);
    }
  };

  const handleSendMessage = async (text) => {
    addMessage({ role: 'user', content: text });
    setTyping(true);

    try {
      const response = await api.chat(text);
      const content =
        typeof response === 'string'
          ? response
          : response?.reply || response?.message || response?.output || 'Done.';
      addMessage({ role: 'assistant', content });
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        role: 'assistant',
        content: 'Unable to reach the backend. Make sure the API server is running.',
      });
    } finally {
      setTyping(false);
    }
  };

  const handleCommand = async (commandId) => {
    const commandMap = {
      'open-chrome': 'Open Chrome',
      'open-vscode': 'Open VS Code',
      'search-nifty': 'Search NIFTY trend',
      'check-emails': 'Check emails',
      'analyze-trading': 'Analyze trading setup',
      'system-status': 'System status',
    };

    const commandText = commandMap[commandId];
    if (!commandText) return;

    addTask({ step: commandText, status: 'pending', result: null });
    const taskIndex = tasks.length;

    try {
      updateTask(taskIndex, { status: 'running' });
      const response = await api.run(commandText);
      const result =
        typeof response === 'string'
          ? response
          : response?.reply || response?.message || 'Completed';
      updateTask(taskIndex, { status: 'done', result });
    } catch (error) {
      updateTask(taskIndex, { status: 'failed', result: error.message });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#e8e8e8',
      overflow: 'hidden',
    }}>
      {/* Body: activity bar + sidebar + main */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          onCommandOpen={() => setIsCommandPaletteOpen(true)}
        />

        <Sidebar
          activePanel={activePanel}
          isOpen={sidebarOpen}
        />

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <AgentTaskView tasks={tasks} />
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      </div>

      <StatusBar voiceState={voiceState} aiStatus={isTyping ? 'Processing' : 'Ready'} />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onCommand={handleCommand}
      />
    </div>
  );
}

export default App;
