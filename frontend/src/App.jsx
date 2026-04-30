import { useEffect } from 'react';
import FloatingPanel from './components/FloatingPanel';
import ChatInterface from './components/ChatInterface';
import VoiceWaveform from './components/VoiceWaveform';
import AgentTaskView from './components/AgentTaskView';
import CommandInput from './components/CommandInput';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/Toast';
import useStore from './store/useStore';
import { api } from './services/api';

function App() {
  const {
    isPanelExpanded,
    isSidebarOpen,
    voiceState,
    isVoiceActive,
    messages,
    isTyping,
    tasks,
    toasts,
    togglePanel,
    toggleSidebar,
    setVoiceState,
    toggleVoice,
    addMessage,
    setTyping,
    addTask,
    updateTask,
    clearTasks,
    addToast,
    removeToast,
  } = useStore();

  const handleSendMessage = async (text) => {
    addMessage({ role: 'user', content: text });
    setTyping(true);

    try {
      const response = await api.chat(text);
      addMessage({ role: 'assistant', content: response });
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to send message' });
    } finally {
      setTyping(false);
    }
  };

  const handleCommand = async (command) => {
    addTask({ step: command, status: 'pending', result: null });
    const taskIndex = tasks.length;

    try {
      updateTask(taskIndex, { status: 'running' });
      const response = await api.run(command);
      updateTask(taskIndex, { status: 'done', result: response });
      addToast({ type: 'success', message: 'Command completed' });
    } catch (error) {
      updateTask(taskIndex, { status: 'failed', result: error.message });
      addToast({ type: 'error', message: 'Command failed' });
    }
  };

  const handleVoiceToggle = () => {
    toggleVoice();
    if (!isVoiceActive) {
      setVoiceState('listening');
    } else {
      setVoiceState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Command Bar */}
        <div className="p-4 border-b border-gray-800">
          <CommandInput
            onCommand={handleCommand}
            suggestions={[
              'Open Chrome',
              'Search NIFTY trend',
              'Check emails',
              'Open VS Code',
              'Analyze trading setup',
            ]}
          />
        </div>

        {/* Floating Panel */}
        <FloatingPanel
          isExpanded={isPanelExpanded}
          onToggle={togglePanel}
          onClose={() => {}}
        >
          {/* Voice Control */}
          <div className="p-4 border-b border-gray-800">
            <VoiceWaveform
              isActive={isVoiceActive}
              state={voiceState}
              onToggle={handleVoiceToggle}
            />
          </div>

          {/* Chat Interface */}
          <ChatInterface
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
          />

          {/* Agent Task View */}
          {tasks.length > 0 && <AgentTaskView tasks={tasks} />}
        </FloatingPanel>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default App;
