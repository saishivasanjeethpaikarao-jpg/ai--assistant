import { useState, useEffect } from 'react';
import ActivityBar from './components/ActivityBar';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import CommandPalette from './components/CommandPalette';
import AgentTaskView from './components/AgentTaskView';
import StatusBar from './components/StatusBar';
import Settings from './components/Settings';
import VibeCoder from './components/VibeCoder';
import useStore from './store/useStore';
import { api } from './services/api';
import { useBreakpoint } from './hooks/useBreakpoint';

const SIDEBAR_PANELS = ['chat', 'memory', 'trading', 'reminders', 'skills', 'analytics', 'brain'];
const VIBE_TRIGGERS  = ['build me', 'build a', 'vibe code', 'vibe coder', 'create a component', 'write a script', 'make me a', 'code me a'];

function App() {
  const [activePanel,       setActivePanel]       = useState('chat');
  const [sidebarOpen,       setSidebarOpen]       = useState(false); // start closed on all devices
  const [commandOpen,       setCommandOpen]       = useState(false);
  const [voiceState,        setVoiceState]        = useState('idle');
  const [hasProvider,       setHasProvider]       = useState(null);
  const [vibeInitialPrompt, setVibeInitialPrompt] = useState('');

  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { messages, isTyping, tasks, addMessage, setTyping, addTask, updateTask } = useStore();

  // Open sidebar by default on desktop for sidebar panels
  useEffect(() => {
    if (isDesktop && SIDEBAR_PANELS.includes(activePanel)) {
      setSidebarOpen(true);
    }
  }, [isDesktop]);

  // Check provider status once on load
  useEffect(() => {
    api.getProviderStatus().then(r => setHasProvider(r.has_provider)).catch(() => setHasProvider(false));
  }, []);

  // Keyboard shortcuts (desktop only)
  useEffect(() => {
    const down = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setCommandOpen(true); }
      if (e.key === 'Escape') { setCommandOpen(false); if (isMobile) setSidebarOpen(false); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); setSidebarOpen(o => !o); }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [isMobile]);

  const handlePanelChange = (panel) => {
    if (panel === 'settings' || panel === 'vibe') {
      setActivePanel(panel);
      setSidebarOpen(false);
      return;
    }
    if (isMobile) {
      // On mobile: tapping a nav item opens the sidebar drawer for that panel
      if (SIDEBAR_PANELS.includes(panel)) {
        if (activePanel === panel && sidebarOpen) {
          setSidebarOpen(false); // toggle off
        } else {
          setActivePanel(panel);
          setSidebarOpen(true);
        }
      } else {
        setActivePanel(panel);
        setSidebarOpen(false);
      }
      return;
    }
    // Desktop behaviour
    if (activePanel === panel && SIDEBAR_PANELS.includes(panel)) {
      setSidebarOpen(o => !o);
    } else {
      setActivePanel(panel);
      if (SIDEBAR_PANELS.includes(panel)) setSidebarOpen(true);
    }
  };

  const handleSendMessage = async (text) => {
    const lc = text.toLowerCase();
    const isVibeTrigger = VIBE_TRIGGERS.some(t => lc.startsWith(t) || lc.includes(t));
    if (isVibeTrigger) {
      setVibeInitialPrompt(text);
      setActivePanel('vibe');
      setSidebarOpen(false);
      return;
    }
    addMessage({ role: 'user', content: text });
    setTyping(true);
    try {
      const response = await api.chat(text);
      const content = typeof response === 'string'
        ? response
        : response?.reply || response?.message || response?.output || 'Done.';
      addMessage({ role: 'assistant', content, mode: response?.mode });
      if (hasProvider === false) {
        api.getProviderStatus().then(r => setHasProvider(r.has_provider)).catch(() => {});
      }
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || '';
      const noKey = msg.toLowerCase().includes('no ai') || msg.toLowerCase().includes('groq')
        || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('provider');
      addMessage({
        role: 'assistant',
        content: noKey
          ? '⚙️ No AI provider configured yet. Click the **gear icon** → **AI Engine** tab → paste your Groq API key → Save. Get a free key at console.groq.com'
          : `Error: ${msg || 'Could not reach backend.'}`,
      });
    } finally {
      setTyping(false);
    }
  };

  const handleCommand = async (commandId) => {
    const MAP = {
      'open-chrome':    'Open Chrome browser',
      'open-vscode':    'Open VS Code',
      'search-nifty':   'Search NIFTY 50 trend analysis',
      'check-emails':   'Open Gmail and check emails',
      'analyze-trading':'Analyze trading setup for today',
      'system-status':  'Show full system status',
    };
    const text = MAP[commandId];
    if (!text) return;
    addTask({ step: text, status: 'pending', result: null });
    const idx = tasks.length;
    try {
      updateTask(idx, { status: 'running' });
      const r = await api.run(text);
      const result = typeof r === 'string' ? r : r?.reply || r?.message || 'Completed';
      updateTask(idx, { status: 'done', result });
    } catch (e) {
      updateTask(idx, { status: 'failed', result: e.message });
    }
  };

  const isSettings = activePanel === 'settings';
  const isVibe     = activePanel === 'vibe';
  const showSidebar = !isSettings && !isVibe && sidebarOpen && SIDEBAR_PANELS.includes(activePanel);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',          // dvh handles mobile browser chrome
      backgroundColor: '#0a0a0a',
      color: '#e8e8e8',
      overflow: 'hidden',
    }}>

      {/* ── Main body ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        // On mobile, ActivityBar goes to the bottom so content stacks differently
        flexDirection: 'row',
      }}>
        {/* Left Activity Bar — desktop only */}
        {!isMobile && (
          <ActivityBar
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
            onCommandOpen={() => setCommandOpen(true)}
            isMobile={false}
          />
        )}

        {/* Sidebar — static on desktop, overlay drawer on mobile */}
        <Sidebar
          activePanel={activePanel}
          isOpen={showSidebar}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {isSettings ? (
            <Settings isMobile={isMobile} />
          ) : isVibe ? (
            <VibeCoder initialPrompt={vibeInitialPrompt} isMobile={isMobile} isTablet={isTablet} />
          ) : (
            <>
              <AgentTaskView tasks={tasks} />
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isTyping={isTyping}
                voiceState={voiceState}
                onVoiceStateChange={setVoiceState}
                hasProvider={hasProvider}
                isMobile={isMobile}
              />
            </>
          )}
        </div>
      </div>

      {/* ── Bottom zone ───────────────────────────────────────────────── */}
      <StatusBar
        voiceState={voiceState}
        aiStatus={isTyping ? 'Processing' : 'Ready'}
        hasProvider={hasProvider}
        isMobile={isMobile}
      />

      {/* Mobile bottom Activity Bar — rendered after status bar so it sits above safe area */}
      {isMobile && (
        <ActivityBar
          activePanel={activePanel}
          onPanelChange={handlePanelChange}
          onCommandOpen={() => setCommandOpen(true)}
          isMobile={true}
        />
      )}

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} onCommand={handleCommand} />
    </div>
  );
}

export default App;
