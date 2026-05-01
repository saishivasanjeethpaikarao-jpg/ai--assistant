import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMic } from 'react-icons/fi';

const ChatInterface = ({ messages, onSendMessage, isTyping }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        onSendMessage(input);
        setInput('');
      }
    }
  };

  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0a',
      overflow: 'hidden',
    }}>
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b6b6b',
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>Start a conversation</div>
            <div style={{ fontSize: '13px' }}>Type a message or use Ctrl+K for commands</div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                maxWidth: '70%',
                padding: '12px 16px',
                backgroundColor: msg.role === 'user' ? '#181818' : '#111111',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                fontSize: '13px',
                lineHeight: '1.5',
                color: '#e8e8e8',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#6b6b6b',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b6b6b', animation: 'pulse 1s infinite' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b6b6b', animation: 'pulse 1s infinite 0.2s' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6b6b6b', animation: 'pulse 1s infinite 0.4s' }} />
            </div>
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #2a2a2a',
        backgroundColor: '#111111',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'flex-end',
        }}>
          <button
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#181818',
              border: '1px solid #2a2a2a',
              color: '#8b8b8b',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
          >
            <FiMic size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              flex: 1,
              minHeight: '40px',
              maxHeight: '200px',
              padding: '10px 12px',
              backgroundColor: '#0a0a0a',
              border: '1px solid #2a2a2a',
              borderRadius: '4px',
              color: '#e8e8e8',
              fontSize: '13px',
              fontFamily: 'Geist, sans-serif',
              resize: 'none',
              outline: 'none',
            }}
          />

          <button
            onClick={() => {
              if (input.trim()) {
                onSendMessage(input);
                setInput('');
              }
            }}
            disabled={!input.trim()}
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: input.trim() ? '#3b82f6' : '#181818',
              border: '1px solid #2a2a2a',
              color: input.trim() ? '#ffffff' : '#6b6b6b',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              borderRadius: '4px',
            }}
          >
            <FiSend size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
