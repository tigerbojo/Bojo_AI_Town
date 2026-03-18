import { useEffect, useState } from 'react';

function getAlertType(text) {
  const t = text.toLowerCase();
  if (t.includes('hook')) return 'hooks';
  if (t.includes('p1') || t.includes('p2')) return 'p1p2';
  if (t.includes('dead') || t.includes('crash')) return 'dead';
  return 'unknown';
}

function getTitle(type) {
  if (type === 'hooks') return '⏰ Stale Hooks';
  if (type === 'p1p2') return '🔥 P1/P2 開放中';
  if (type === 'dead') return '☠️ 崩潰紀錄';
  return '警報詳情';
}

export default function AlertModal({ alertText, onClose }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const type = getAlertType(alertText);

  useEffect(() => {
    fetch(`/alert-detail?type=${type}`)
      .then(r => r.json())
      .then(d => setItems(d.items))
      .catch(e => setError(e.message));
  }, [type]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          width: '560px', maxWidth: '90vw',
          maxHeight: '70vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>
            {getTitle(type)}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '18px', color: 'var(--text-secondary)',
              lineHeight: 1, padding: '2px 6px', borderRadius: '6px',
            }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '12px 20px 20px' }}>
          {!items && !error && (
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              {[200, 340, 280, 310, 260].map((w, i) => (
                <div key={i} className="skeleton" style={{ height: '14px', width: `${w}px`, borderRadius: '4px' }} />
              ))}
            </div>
          )}
          {error && (
            <p style={{ color: 'var(--red, #ff3b30)', fontSize: '13px' }}>載入失敗：{error}</p>
          )}
          {items && items.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>沒有資料</p>
          )}
          {items && items.length > 0 && (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((item, i) => (
                <li key={i} style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '12px',
                  color: 'var(--text)',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                  lineHeight: 1.5,
                  wordBreak: 'break-all',
                }}>
                  {item}
                </li>
              ))}
            </ul>
          )}
          {items && (
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '12px', marginBottom: 0 }}>
              共 {items.length} 筆　·　點擊空白處或按 Esc 關閉
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
