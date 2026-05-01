import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMic, FiMicOff, FiUser, FiCpu } from 'react-icons/fi';

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
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        backgroundColor: isUser ? '#1e1e1e' : '#1a2a3a',
        border: `1px solid ${isUser ? '#2a2a2a' : '#1e3a5a'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '1px',
      }}>
        {isUser
          ? <FiUser size={13} style={{ color: '#8b8b8b' }} />
          : <FiCpu size={13} style={{ color: '#3b82f6' }} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '500',
          color: isUser ? '#8b8b8b' : '#3b82f6',
          marginBottom: '4px',
          letterSpacing: '0.02em',
        }}>
          {isUser ? 'You' : 'Jarvis'}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#d8d8d8',
          lineHeight: '1.6',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {content}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div style={{
    display: 'flex',
    gap: '12px',
    padding: '12px 24px',
    alignItems: 'flex-start',
    backgroundColor: '#0d0d0d',
    borderTop: '1px solid #141414',
  }}>
    <div style={{
      width: '28px',
      height: '28px',
      borderRadius: '4px',
      backgroundColor: '#1a2a3a',
      border: '1px solid #1e3a5a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <FiCpu size={13} style={{ color: '#3b82f6' }} />
    </div>
    <div style={{ paddingTop: '6px', display: 'flex', gap: '4px', alignItems: 'center' }}>
      {[0, 0.15, 0.3].map((delay, i) => (
        <div
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
    </div>
  </div>
);

const EmptyState = () => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '40px',
  }}>
    <FiCpu size={32} style={{ color: '#2a2a2a', marginBottom: '8px' }} />
    <div style={{ fontSize: '15px', color: '#4a4a4a', fontWeight: '500' }}>
      Start a conversation
    </div>
    <div style={{ fontSize: '12px', color: '#3a3a3a', textAlign: 'center', maxWidth: '280px' }}>
      Type a message below or press <kbd style={{
        display: 'inline',
        padding: '1px 5px',
        backgroundColor: '#1e1e1e',
        border: '1px solid #2a2a2a',
        borderRadius: '3px',
        fontFamily: 'Geist Mono, monospace',
        fontSize: '11px',
        color: '#5a5a5a',
      }}>Ctrl+K</kbd> to open the command palette
    </div>
  </div>
);

const ChatInterface = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const [micActive, setMicActive] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* Tab bar */}
      <div style={{
        height: '36px',
        backgroundColor: '#111111',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderRight: '1px solid #1e1e1e',
          borderBottom: '1px solid #3b82f6',
          backgroundColor: '#0a0a0a',
          fontSize: '13px',
          color: '#e8e8e8',
          gap: '6px',
        }}>
          <FiCpu size={13} style={{ color: '#3b82f6' }} />
          <span>chat</span>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 && !isTyping
          ? <EmptyState />
          : (
            <div style={{ flex: 1 }}>
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} msg={msg} />
              ))}
              {isTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )
        }
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid #1e1e1e',
        backgroundColor: '#111111',
        padding: '12px 16px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
          backgroundColor: '#0a0a0a',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '8px 8px 8px 12px',
          transition: 'border-color 0.15s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#2a2a2a'}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKeyDown}
            placeholder="Message Jarvis... (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              flex: 1,
              minHeight: '22px',
              maxHeight: '180px',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8e8e8',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'none',
              fontFamily: "'Geist', sans-serif",
            }}
          />
          <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', paddingBottom: '1px' }}>
            <button
              onClick={() => setMicActive(!micActive)}
              title="Toggle microphone"
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                color: micActive ? '#3b82f6' : '#5a5a5a',
                backgroundColor: micActive ? '#1a2a3a' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!micActive) e.currentTarget.style.backgroundColor = '#1a1a1a'; }}
              onMouseLeave={e => { if (!micActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {micActive ? <FiMic size={15} /> : <FiMicOff size={15} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              title="Send message (Enter)"
              style={{
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                backgroundColor: input.trim() ? '#3b82f6' : '#1a1a1a',
                color: input.trim() ? '#ffffff' : '#4a4a4a',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              <FiSend size={14} />
            </button>
          </div>
        </div>
        <div style={{
          marginTop: '6px',
          fontSize: '11px',
          color: '#3a3a3a',
          textAlign: 'center',
        }}>
          Jarvis can make mistakes. Verify important information.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
