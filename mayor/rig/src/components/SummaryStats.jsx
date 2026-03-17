const STAT_CONFIG = [
  { key: 'polecats',    label: 'Polecats',  icon: '👷', color: (v) => '#60a5fa' },
  { key: 'hooks',       label: 'Hooks',     icon: '🔗', color: (v) => v > 0 ? '#a78bfa' : 'var(--text-secondary)' },
  { key: 'work',        label: 'Work',      icon: '⚙', color: (v) => v > 0 ? 'var(--green)' : 'var(--text-secondary)' },
  { key: 'convoys',     label: 'Convoys',   icon: '🚛', color: (v) => v > 0 ? 'var(--orange)' : 'var(--text-secondary)' },
  { key: 'escalations', label: 'Alerts',    icon: '⚡', color: (v) => v > 0 ? 'var(--red)' : 'var(--text-secondary)' },
];

function StatCard({ icon, label, value, color, isLoading }) {
  if (isLoading) {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 16px' }}>
        <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '28px', width: '48px', marginBottom: '4px' }} />
        <div className="skeleton" style={{ height: '11px', width: '60px' }} />
      </div>
    );
  }

  const v = parseInt(value, 10) || 0;
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '14px 16px',
      transition: 'border-color var(--transition)',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: '16px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.04em', lineHeight: 1, color, fontVariantNumeric: 'tabular-nums', marginBottom: '4px' }}>
        {value != null ? String(value) : '—'}
      </div>
      <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
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
      {summary?.noHeartbeat && !isLoading && (
        <div style={{ background: 'var(--red-light)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '7px 12px', fontSize: '12px', color: '#f87171', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💔 無心跳訊號
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
        {STAT_CONFIG.map(({ key, label, icon, color }) => {
          const v = getValue(key);
          return (
            <StatCard key={key} icon={icon} label={label} value={v} color={color(parseInt(v, 10) || 0)} isLoading={isLoading} />
          );
        })}
      </div>
    </section>
  );
}
