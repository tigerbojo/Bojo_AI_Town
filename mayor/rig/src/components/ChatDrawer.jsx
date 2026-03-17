import { useState, useRef, useEffect } from 'react';

const DRAWER_HEIGHT = 420;
const HANDLE_HEIGHT = 52;

const drawerStyle = (open) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
  height: open ? `${DRAWER_HEIGHT}px` : `${HANDLE_HEIGHT}px`,
  transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  borderTop: '1px solid rgba(0,0,0,0.1)',
  boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
});

const handleStyle = {
  height: `${HANDLE_HEIGHT}px`,
  minHeight: `${HANDLE_HEIGHT}px`,
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  cursor: 'pointer',
  userSelect: 'none',
  gap: '10px',
};

const messagesStyle = {
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const inputRowStyle = {
  padding: '10px 16px 14px',
  display: 'flex',
  gap: '10px',
  alignItems: 'flex-end',
  borderTop: '1px solid rgba(0,0,0,0.06)',
};

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '75%',
        padding: '9px 13px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--blue)' : 'rgba(0,0,0,0.06)',
        color: isUser ? '#fff' : 'var(--text)',
        fontSize: '14px',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.streaming && <span style={{ opacity: 0.5, animation: 'pulse 1s infinite' }}>▌</span>}
      </div>
    </div>
  );
}

export default function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '', streaming: true }]);
    setInput('');
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/claude-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: fullText, streaming: true };
          return next;
        });
      }

      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: fullText };
        return next;
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content };
          return next;
        });
      } else {
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: 'assistant', content: `❌ 錯誤：${err.message}` };
          return next;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape' && loading) {
      abortRef.current?.abort();
    }
  }

  return (
    <div style={drawerStyle(open)}>
      {/* Handle bar */}
      <div style={handleStyle} onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: '16px' }}>✦</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', flex: 1, letterSpacing: '-0.01em' }}>
          Claude
        </span>
        {messages.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', padding: '2px 8px' }}>
            {messages.length} 則
          </span>
        )}
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', transition: 'transform 0.3s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>
          ▲
        </span>
      </div>

      {open && (
        <>
          <div style={messagesStyle}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px', marginTop: '20px' }}>
                Sonnet 4.6 · Max
              </div>
            )}
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && !messages[messages.length - 1]?.streaming && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '9px 13px', borderRadius: '16px 16px 16px 4px', background: 'rgba(0,0,0,0.06)', fontSize: '20px', letterSpacing: '2px' }}>
                  ···
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={inputRowStyle}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="輸入訊息… (Enter 送出，Shift+Enter 換行，Esc 停止)"
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                border: '1px solid var(--border-strong)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '14px',
                fontFamily: 'var(--font)',
                background: 'rgba(255,255,255,0.8)',
                color: 'var(--text)',
                outline: 'none',
                lineHeight: 1.5,
                maxHeight: '100px',
                overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
            />
            <button
              onClick={loading ? () => abortRef.current?.abort() : sendMessage}
              style={{
                background: loading ? 'var(--red)' : input.trim() ? 'var(--blue)' : 'var(--border)',
                color: loading || input.trim() ? '#fff' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? '停止' : '送出'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
