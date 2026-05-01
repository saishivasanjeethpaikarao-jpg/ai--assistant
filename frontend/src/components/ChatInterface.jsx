import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiMic, FiMicOff, FiUser, FiCpu, FiVolume2, FiVolumeX } from 'react-icons/fi';

// ── Voice helpers ──────────────────────────────────────────────────────────

const SpeechRecognitionAPI =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

function useSpeechToText({ onResult, onStateChange }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (recRef.current) recRef.current.stop();

    const rec = new SpeechRecognitionAPI();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => {
      setListening(true);
      onStateChange?.('listening');
    };
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult?.(text);
    };
    rec.onerror = (e) => {
      console.warn('STT error:', e.error);
      setListening(false);
      onStateChange?.('idle');
    };
    rec.onend = () => {
      setListening(false);
      onStateChange?.('idle');
    };

    recRef.current = rec;
    rec.start();
  }, [onResult, onStateChange]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
    onStateChange?.('idle');
  }, [onStateChange]);

  return { listening, start, stop, supported: !!SpeechRecognitionAPI };
}

function speakText(text, onStart, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 1.05;
  utt.pitch = 0.95;
  utt.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural')
  ) || voices.find(v => v.lang === 'en-US') || voices[0];
  if (preferred) utt.voice = preferred;
  utt.onstart = onStart;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Sub-components ─────────────────────────────────────────────────────────

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '12px 24px',
      alignItems: 'flex-start',
      backgroundColor: isUser ? 'transparent' : '#0d0d0d',
      borderTop: '1px solid #141414',
    }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '4px',
        backgroundColor: isUser ? '#1e1e1e' : '#1a2a3a',
        border: `1px solid ${isUser ? '#2a2a2a' : '#1e3a5a'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: '1px',
      }}>
        {isUser
          ? <FiUser size={13} style={{ color: '#8b8b8b' }} />
          : <FiCpu size={13} style={{ color: '#3b82f6' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px', fontWeight: '500',
          color: isUser ? '#8b8b8b' : '#3b82f6',
          marginBottom: '4px', letterSpacing: '0.02em',
        }}>
          {isUser ? 'You' : 'Jarvis'}
        </div>
        <div style={{
          fontSize: '13px', color: '#d8d8d8',
          lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div style={{
    display: 'flex', gap: '12px', padding: '12px 24px',
    alignItems: 'flex-start', backgroundColor: '#0d0d0d', borderTop: '1px solid #141414',
  }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '4px',
      backgroundColor: '#1a2a3a', border: '1px solid #1e3a5a',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <FiCpu size={13} style={{ color: '#3b82f6' }} />
    </div>
    <div style={{ paddingTop: '6px', display: 'flex', gap: '4px' }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <div key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: '#3b82f6',
          animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
        }} />
      ))}
    </div>
  </div>
);

const ListeningIndicator = () => (
  <div style={{
    display: 'flex', gap: '12px', padding: '12px 24px',
    alignItems: 'flex-start', backgroundColor: '#0a1a0a', borderTop: '1px solid #0d2a0d',
  }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '4px',
      backgroundColor: '#0a2a1a', border: '1px solid #10b98166',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <FiMic size={13} style={{ color: '#10b981' }} />
    </div>
    <div style={{ flex: 1, paddingTop: '4px' }}>
      <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '500', marginBottom: '4px' }}>
        Listening...
      </div>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '20px' }}>
        {[1, 0.6, 1, 0.4, 0.8, 0.5, 1, 0.7].map((h, i) => (
          <div key={i} style={{
            width: '3px', borderRadius: '2px',
            backgroundColor: '#10b981',
            height: `${h * 16}px`,
            animation: `pulse 0.8s ease-in-out ${i * 0.1}s infinite`,
            opacity: 0.7,
          }} />
        ))}
      </div>
    </div>
  </div>
);

const SpeakingIndicator = () => (
  <div style={{
    display: 'flex', gap: '12px', padding: '12px 24px',
    alignItems: 'flex-start', backgroundColor: '#0a0d1a', borderTop: '1px solid #0d1530',
  }}>
    <div style={{
      width: '28px', height: '28px', borderRadius: '4px',
      backgroundColor: '#0a1535', border: '1px solid #3b82f666',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <FiVolume2 size={13} style={{ color: '#3b82f6' }} />
    </div>
    <div style={{ flex: 1, paddingTop: '4px' }}>
      <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '500', marginBottom: '4px' }}>
        Jarvis is speaking...
      </div>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '20px' }}>
        {[0.5, 1, 0.7, 1, 0.4, 0.9, 0.6, 1].map((h, i) => (
          <div key={i} style={{
            width: '3px', borderRadius: '2px',
            backgroundColor: '#3b82f6',
            height: `${h * 16}px`,
            animation: `pulse 1s ease-in-out ${i * 0.12}s infinite`,
            opacity: 0.8,
          }} />
        ))}
      </div>
    </div>
  </div>
);

const EmptyState = ({ onMicClick, micSupported }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '40px',
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '12px',
      backgroundColor: '#111111', border: '1px solid #1e1e1e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '12px',
    }}>
      <FiCpu size={28} style={{ color: '#2a2a2a' }} />
    </div>
    <div style={{ fontSize: '16px', color: '#4a4a4a', fontWeight: '500' }}>
      How can I help you?
    </div>
    <div style={{ fontSize: '12px', color: '#3a3a3a', textAlign: 'center', maxWidth: '300px', lineHeight: '1.7' }}>
      Type a message below, or{' '}
      {micSupported
        ? <button onClick={onMicClick} style={{
            color: '#10b981', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
            textDecoration: 'underline',
          }}>click the mic</button>
        : 'use the mic button'
      }{' '}
      to talk to Jarvis. Press{' '}
      <kbd style={{
        padding: '1px 5px', backgroundColor: '#1e1e1e',
        border: '1px solid #2a2a2a', borderRadius: '3px',
        fontSize: '11px', color: '#5a5a5a', fontFamily: 'Geist Mono, monospace',
      }}>Ctrl+K</kbd>{' '}
      for commands.
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────

const ChatInterface = ({ messages, onSendMessage, isTyping, voiceState, onVoiceStateChange }) => {
  const [input, setInput] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleVoiceResult = useCallback((text) => {
    if (text) onSendMessage(text);
  }, [onSendMessage]);

  const handleVoiceStateChange = useCallback((state) => {
    onVoiceStateChange?.(state);
  }, [onVoiceStateChange]);

  const { listening, start: startListening, stop: stopListening, supported: micSupported } =
    useSpeechToText({ onResult: handleVoiceResult, onStateChange: handleVoiceStateChange });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, listening, speaking]);

  useEffect(() => {
    if (!ttsEnabled) return;
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant') {
      const text = typeof last.content === 'string' ? last.content : '';
      if (text) {
        setSpeaking(true);
        onVoiceStateChange?.('speaking');
        speakText(
          text,
          () => {},
          () => { setSpeaking(false); onVoiceStateChange?.('idle'); }
        );
      }
    }
  }, [messages]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
    } else {
      if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); }
      startListening();
    }
  };

  const toggleTts = () => {
    if (speaking) { window.speechSynthesis?.cancel(); setSpeaking(false); }
    setTtsEnabled(v => !v);
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      backgroundColor: '#0a0a0a', overflow: 'hidden', minWidth: 0,
    }}>
      {/* Tab bar */}
      <div style={{
        height: '36px', backgroundColor: '#111111',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'stretch',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '0 16px',
          borderRight: '1px solid #1e1e1e', borderBottom: '1px solid #3b82f6',
          backgroundColor: '#0a0a0a', fontSize: '13px', color: '#e8e8e8', gap: '6px',
        }}>
          <FiCpu size={13} style={{ color: '#3b82f6' }} />
          <span>chat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: '12px', gap: '4px' }}>
          <button
            onClick={toggleTts}
            title={ttsEnabled ? 'Disable voice reply' : 'Enable voice reply'}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 8px', borderRadius: '4px',
              backgroundColor: ttsEnabled ? '#0a1a2a' : 'transparent',
              border: `1px solid ${ttsEnabled ? '#1e3a5a' : 'transparent'}`,
              color: ttsEnabled ? '#3b82f6' : '#4a4a4a',
              fontSize: '11px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {ttsEnabled ? <FiVolume2 size={12} /> : <FiVolumeX size={12} />}
            <span>Voice reply</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 && !isTyping && !listening
          ? <EmptyState onMicClick={toggleMic} micSupported={micSupported} />
          : (
            <div>
              {messages.map((msg, idx) => <MessageBubble key={idx} msg={msg} />)}
              {isTyping && <TypingIndicator />}
              {listening && <ListeningIndicator />}
              {speaking && !isTyping && <SpeakingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )
        }
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid #1e1e1e', backgroundColor: '#111111',
        padding: '12px 16px', flexShrink: 0,
      }}>
        <div
          style={{
            display: 'flex', gap: '8px', alignItems: 'flex-end',
            backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a',
            borderRadius: '6px', padding: '8px 8px 8px 12px',
            transition: 'border-color 0.15s',
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#2a2a2a'}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'Listening for voice...' : 'Message Jarvis... (Enter to send, Shift+Enter for newline)'}
            rows={1}
            disabled={listening}
            style={{
              flex: 1, minHeight: '22px', maxHeight: '180px',
              backgroundColor: 'transparent', border: 'none', outline: 'none',
              color: listening ? '#5a5a5a' : '#e8e8e8', fontSize: '13px',
              lineHeight: '1.6', resize: 'none', fontFamily: "'Geist', sans-serif",
            }}
          />
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', paddingBottom: '1px' }}>
            {micSupported && (
              <button
                onClick={toggleMic}
                title={listening ? 'Stop listening' : 'Start voice input'}
                style={{
                  width: '32px', height: '32px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
                  backgroundColor: listening ? '#0a2a1a' : 'transparent',
                  border: listening ? '1px solid #10b98166' : '1px solid transparent',
                  color: listening ? '#10b981' : '#5a5a5a',
                  cursor: 'pointer', transition: 'all 0.15s',
                  animation: listening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              >
                {listening ? <FiMic size={15} /> : <FiMicOff size={15} />}
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={!input.trim() || listening}
              title="Send (Enter)"
              style={{
                width: '32px', height: '32px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', borderRadius: '4px',
                backgroundColor: (input.trim() && !listening) ? '#3b82f6' : '#1a1a1a',
                color: (input.trim() && !listening) ? '#ffffff' : '#4a4a4a',
                cursor: (input.trim() && !listening) ? 'pointer' : 'not-allowed',
                border: 'none', transition: 'all 0.15s',
              }}
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#2a2a2a', textAlign: 'center' }}>
          Jarvis can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
