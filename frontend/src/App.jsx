import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import ActivityBar          from './components/ActivityBar';
import Sidebar              from './components/Sidebar';
import ChatInterface        from './components/ChatInterface';
import CommandPalette       from './components/CommandPalette';
import AgentTaskView        from './components/AgentTaskView';
import StatusBar            from './components/StatusBar';
import Settings             from './components/Settings';
import VibeCoder            from './components/VibeCoder';
import CanvasBoard          from './components/CanvasBoard';
import ConversationHistory  from './components/ConversationHistory';
import LandingPage          from './pages/LandingPage';
import TradingPage          from './pages/TradingPage';
import LoginPage            from './pages/LoginPage';
import DownloadPage         from './pages/DownloadPage';
import useStore             from './store/useStore';
import { api }              from './services/api';
import { useBreakpoint }    from './hooks/useBreakpoint';
import { useAuth }          from './contexts/AuthContext';
import { parseActions, executeActions, getAppState } from './utils/actionParser';

const SIDEBAR_PANELS = ['chat', 'memory', 'trading', 'reminders', 'skills', 'analytics', 'brain'];
const VIBE_TRIGGERS  = ['build me', 'build a', 'vibe code', 'vibe coder', 'create a component', 'write a script', 'make me a', 'code me a'];
const FULL_PANELS    = ['settings', 'vibe', 'canvas'];

function GuestBanner() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'linear-gradient(90deg, rgba(67,125,253,0.12), rgba(253,91,93,0.08))', borderBottom: '1px solid rgba(67,125,253,0.15)', padding: '7px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ fontSize: 12.5, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>👤</span>
        You're in <strong>Guest Mode</strong> — chats won't be saved
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => navigate('/login?signup=1')}
          style={{ fontSize: 12, fontWeight: 600, color: '#fff', background: '#437DFD', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sign up free
        </button>
        <button
          onClick={() => navigate('/login')}
          style={{ fontSize: 12, fontWeight: 500, color: '#437DFD', background: 'rgba(67,125,253,0.1)', border: 'none', borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();
  const navigate          = useNavigate();
  const isGuest           = user?.isAnonymous ?? false;

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading]);

  const [activePanel,       setActivePanel]       = useState('chat');
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [commandOpen,       setCommandOpen]       = useState(false);
  const [voiceState,        setVoiceState]        = useState('idle');
  const [hasProvider,       setHasProvider]       = useState(null);
  const [vibeInitialPrompt, setVibeInitialPrompt] = useState('');

  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const { messages, isTyping, tasks, addMessage, setTyping, addTask, updateTask } = useStore();

  useEffect(() => {
    if (isDesktop && SIDEBAR_PANELS.includes(activePanel)) setSidebarOpen(true);
  }, [isDesktop]);

  useEffect(() => {
    api.getProviderStatus().then(r => setHasProvider(r.has_provider)).catch(() => setHasProvider(false));
  }, []);

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
    if (FULL_PANELS.includes(panel)) {
      setActivePanel(panel); setSidebarOpen(false); return;
    }
    if (isMobile) {
      if (SIDEBAR_PANELS.includes(panel)) {
        if (activePanel === panel && sidebarOpen) { setSidebarOpen(false); }
        else { setActivePanel(panel); setSidebarOpen(true); }
      } else { setActivePanel(panel); setSidebarOpen(false); }
      return;
    }
    if (activePanel === panel && SIDEBAR_PANELS.includes(panel)) { setSidebarOpen(o => !o); }
    else { setActivePanel(panel); if (SIDEBAR_PANELS.includes(panel)) setSidebarOpen(true); }
  };

  const handleVisionMessage = async (text, imageBase64) => {
    addMessage({ role: 'user', content: text });
    setTyping(true);
    try {
      const result = await api.visionChat(text, imageBase64);
      const reply = result?.reply || 'I could not analyze the screen.';
      addMessage({ role: 'assistant', content: reply });
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Vision API error';
      addMessage({ role: 'assistant', content: `[Screen vision error: ${msg}]` });
    } finally {
      setTyping(false);
    }
  };

  const handleSendMessage = async (text) => {
    const lc = text.toLowerCase();
    if (VIBE_TRIGGERS.some(t => lc.startsWith(t) || lc.includes(t))) {
      setVibeInitialPrompt(text); setActivePanel('vibe'); setSidebarOpen(false); return;
    }
    addMessage({ role: 'user', content: text });
    setTyping(true);
    try {
      const appState = getAppState(activePanel, window.location.pathname);
      const response = await api.chat(text, appState);
      const rawContent = typeof response === 'string' ? response
        : response?.reply || response?.message || response?.output || 'Done.';

      const { cleanText, actions } = parseActions(rawContent);
      addMessage({ role: 'assistant', content: cleanText || rawContent, mode: response?.mode });

      if (actions.length > 0) {
        setTimeout(() => {
          executeActions(actions, { navigate, setActivePanel, setSidebarOpen, setVibeInitialPrompt });
        }, 350);
      }

      if (hasProvider === false) {
        api.getProviderStatus().then(r => setHasProvider(r.has_provider)).catch(() => {});
      }
    } catch (error) {
      const msg   = error?.response?.data?.error || error?.message || '';
      const noKey = msg.toLowerCase().includes('no ai') || msg.toLowerCase().includes('groq')
        || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('provider');
      addMessage({
        role: 'assistant',
        content: noKey
          ? '⚙️ No AI provider configured yet. Click the **gear icon** → **AI Engine** tab → paste your Groq API key → Save. Get a free key at console.groq.com'
          : `Error: ${msg || 'Could not reach backend.'}`,
      });
    } finally { setTyping(false); }
  };

  const handleNewChat = () => {
    window.localStorage.removeItem('airis_chat_messages');
    window.location.reload();
  };

  const handleOpenConversation = (convo) => {
    const seed = convo?.preview ? convo.preview : 'Resume this conversation.';
    addMessage({ role: 'user', content: `Open chat: ${convo?.title || 'Conversation'}` });
    addMessage({ role: 'assistant', content: seed });
  };

  const handleCommand = async (commandId) => {
    const MAP = {
      'open-chrome':     'Browse chrome',
      'open-vscode':     'Browse vscode',
      'search-nifty':    'Search NIFTY 50 trend analysis',
      'check-emails':    'Open Gmail in browser and check emails',
      'analyze-trading': 'Analyze trading setup for today',
      'system-status':   'Show full system status',
    };
    const text = MAP[commandId]; if (!text) return;
    addTask({ step: text, status: 'pending', result: null });
    const idx = tasks.length;
    try {
      updateTask(idx, { status: 'running' });
      const r = await api.run(text);
      updateTask(idx, { status: 'done', result: typeof r === 'string' ? r : r?.reply || 'Completed' });
    } catch (e) { updateTask(idx, { status: 'failed', result: e.message }); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F4F2', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <img src="/airis-sphere.png" alt="Airis" style={{ width: 60, height: 60, objectFit: 'contain', animation: 'float 3s ease-in-out infinite' }} />
        <span style={{ color: '#aaa', fontSize: 14 }}>Loading Airis…</span>
        <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }`}</style>
      </div>
    </div>
  );

  if (!user) return null;

  const isSettings = activePanel === 'settings';
  const isVibe     = activePanel === 'vibe';
  const isCanvas   = activePanel === 'canvas';
  const isFullPanel = FULL_PANELS.includes(activePanel);
  const showSidebar = !isFullPanel && sidebarOpen && SIDEBAR_PANELS.includes(activePanel);
  const showHistory = !isFullPanel && isDesktop;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      overflow: 'hidden',
      background: '#F5F4F2',
    }}>
      {isGuest && <GuestBanner />}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {!isMobile && (
          <ActivityBar
            activePanel={activePanel}
            onPanelChange={handlePanelChange}
            onCommandOpen={() => setCommandOpen(true)}
            isMobile={false}
          />
        )}
        <Sidebar
          activePanel={activePanel}
          isOpen={showSidebar}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          {isSettings ? (
            <Settings isMobile={isMobile} />
          ) : isCanvas ? (
            <CanvasBoard isMobile={isMobile} />
          ) : isVibe ? (
            <VibeCoder initialPrompt={vibeInitialPrompt} isMobile={isMobile} isTablet={isTablet} />
          ) : (
            <>
              <AgentTaskView tasks={tasks} />
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onVisionSend={handleVisionMessage}
                isTyping={isTyping}
                voiceState={voiceState}
                onVoiceStateChange={setVoiceState}
                hasProvider={hasProvider}
                isMobile={isMobile}
              />
            </>
          )}
        </div>
        {showHistory && (
          <ConversationHistory messages={messages} isMobile={isMobile} onNewChat={handleNewChat} onOpenConversation={handleOpenConversation} />
        )}
      </div>
      <StatusBar
        voiceState={voiceState}
        aiStatus={isTyping ? 'Processing' : 'Ready'}
        hasProvider={hasProvider}
        isMobile={isMobile}
      />
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

export default function App() {
  return (
    <Routes>
      <Route path="/"        element={<LandingPage />} />
      <Route path="/login"   element={<LoginPage />} />
      <Route path="/app"     element={<ProtectedApp />} />
      <Route path="/trading"  element={<TradingPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
  );
}
