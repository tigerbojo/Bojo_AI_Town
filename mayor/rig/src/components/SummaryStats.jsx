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
  { key: 'polecats', label: '工人數', icon: '👷' },
  { key: 'hooks', label: '掛鉤', icon: '🔗' },
  { key: 'work', label: '進行中', icon: '⚙️' },
  { key: 'convoys', label: '車隊', icon: '🚛' },
  { key: 'escalations', label: '待處理', icon: '⚡️' },
  { key: 'alerts', label: '警報', icon: '🚨' },
];

function StatCard({ icon, label, value, color, isLoading }) {
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
      style={cardStyle}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <span style={iconStyle}>{icon}</span>
      <span style={{ ...valueStyle, color: color }}>{display}</span>
      <span style={labelStyle}>{label}</span>
    </div>
  );
}

export default function SummaryStats({ summary, isLoading }) {
  const getValue = (key) => {
    if (!summary) return null;
    if (key === 'alerts') return summary.alerts?.length ?? 0;
    return summary[key];
  };

  return (
    <section>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text)', margin: '0 0 14px 0', letterSpacing: '-0.01em' }}>
        系統概覽
      </h2>
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
        {STAT_CONFIG.map(({ key, label, icon }) => (
          <StatCard
            key={key}
            icon={icon}
            label={label}
            value={getValue(key)}
            color={getColor(key, getValue(key))}
            isLoading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}
