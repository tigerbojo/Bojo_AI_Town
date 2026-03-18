import { useState } from 'react';

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: '12px',
};

const cardStyle = {
  background: 'var(--card)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  transition: 'box-shadow var(--transition)',
  cursor: 'default',
  position: 'relative',
};

const valueStyle = {
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '-0.03em',
  lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
};

const labelStyle = {
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-secondary)',
  letterSpacing: '0.01em',
};

const descStyle = {
  fontSize: '11px',
  color: 'var(--text-tertiary, #aaa)',
  lineHeight: 1.4,
  marginTop: '2px',
};

const iconStyle = {
  fontSize: '18px',
  marginBottom: '4px',
};

function getColor(key, value) {
  const v = parseInt(value, 10);
  if (key === 'escalations' || key === 'alerts') {
    return v > 0 ? 'var(--red)' : 'var(--text-secondary)';
  }
  if (key === 'polecats') return 'var(--blue)';
  if (key === 'work') return v > 0 ? 'var(--green)' : 'var(--text-secondary)';
  if (key === 'convoys') return v > 0 ? 'var(--orange)' : 'var(--text-secondary)';
  return 'var(--text)';
}

const STAT_CONFIG = [
  { key: 'polecats',    label: '工人數',  icon: '👷', desc: '目前已連線的工人代理數量' },
  { key: 'hooks',       label: '掛鉤',    icon: '🔗', desc: '等待觸發的事件掛鉤數' },
  { key: 'work',        label: '進行中',  icon: '⚙️', desc: '正在執行中的工作項目數' },
  { key: 'convoys',     label: '車隊',    icon: '🚛', desc: '進行中的任務車隊數量' },
  { key: 'escalations', label: '待處理',  icon: '⚡️', desc: '已升級、等待處理的事項' },
  { key: 'alerts',      label: '警報',    icon: '🚨', desc: '系統目前的警示訊息數' },
];

const STORAGE_KEY = 'gt-hidden-stats';

function loadHidden() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveHidden(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

function StatCard({ icon, label, desc, value, color, isLoading, onHide }) {
  const [hovered, setHovered] = useState(false);

  if (isLoading) {
    return (
      <div style={cardStyle}>
        <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '6px', marginBottom: '6px' }} />
        <div className="skeleton" style={{ width: '60px', height: '36px', borderRadius: '6px' }} />
        <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px', marginTop: '4px' }} />
      </div>
    );
  }

  const display = value != null ? String(value) : '—';

  return (
    <div
      style={{ ...cardStyle, boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onHide(); }}
          title="隱藏此卡片"
          style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1,
            padding: '2px 4px', borderRadius: '4px',
          }}
        >×</button>
      )}
      <span style={iconStyle}>{icon}</span>
      <span style={{ ...valueStyle, color }}>{display}</span>
      <span style={labelStyle}>{label}</span>
      <span style={descStyle}>{desc}</span>
    </div>
  );
}

export default function SummaryStats({ summary, isLoading }) {
  const [hidden, setHidden] = useState(loadHidden);

  const hide = (key) => {
    const next = [...hidden, key];
    setHidden(next);
    saveHidden(next);
  };

  const restoreAll = () => {
    setHidden([]);
    saveHidden([]);
  };

  const getValue = (key) => {
    if (!summary) return null;
    if (key === 'alerts') return summary.alerts?.length ?? 0;
    return summary[key];
  };

  const visible = STAT_CONFIG.filter(s => !hidden.includes(s.key));

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
          系統概覽
        </h2>
        {hidden.length > 0 && (
          <button
            onClick={restoreAll}
            style={{
              background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              padding: '4px 10px', fontSize: '12px', color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            顯示全部 ({hidden.length} 隱藏)
          </button>
        )}
      </div>
      {summary?.noHeartbeat && !isLoading && (
        <div style={{ background: 'var(--red-light)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontSize: '13px', color: '#c0392b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💔 無心跳訊號
        </div>
      )}
      {summary?.alerts?.length > 0 && !isLoading && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {summary.alerts.map((a, i) => (
            <span key={i} style={{ background: 'var(--orange-light, rgba(255,149,0,0.12))', border: '1px solid rgba(255,149,0,0.3)', borderRadius: 'var(--radius-sm)', padding: '4px 10px', fontSize: '12px', color: 'var(--orange, #ff9500)' }}>
              {a}
            </span>
          ))}
        </div>
      )}
      <div style={gridStyle}>
        {visible.map(({ key, label, icon, desc }) => (
          <StatCard
            key={key}
            icon={icon}
            label={label}
            desc={desc}
            value={getValue(key)}
            color={getColor(key, getValue(key))}
            isLoading={isLoading}
            onHide={() => hide(key)}
          />
        ))}
      </div>
    </section>
  );
}
