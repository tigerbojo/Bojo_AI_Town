const cardStyle = {
  background: 'var(--card)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const headerStyle = {
  padding: '14px 16px 12px',
  borderBottom: '1px solid var(--divider)',
  display: 'flex', alignItems: 'center', gap: '8px',
};

const thStyle = {
  padding: '8px 14px',
  textAlign: 'left',
  fontSize: '10px', fontWeight: '700',
  color: 'var(--text-tertiary)',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  background: 'rgba(255,255,255,0.02)',
  borderBottom: '1px solid var(--divider)',
  fontFamily: 'var(--font-mono)',
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '13px', color: 'var(--text)',
  borderBottom: '1px solid var(--divider)',
  verticalAlign: 'middle',
};

function getTypeBadge(type) {
  if (!type) return null;
  const l = type.toLowerCase();
  if (l === 'polecat' || l.includes('worker')) return { label: 'worker', cls: 'blue' };
  if (l === 'refinery') return { label: 'refinery', cls: 'purple' };
  if (l === 'witness') return { label: 'witness', cls: 'orange' };
  if (l === 'mayor') return { label: 'mayor', cls: 'green' };
  return { label: type, cls: 'gray' };
}

function getStatusInfo(status) {
  if (!status) return { label: 'idle', cls: 'gray', dotCls: 'gray' };
  const l = status.toLowerCase();
  if (l.includes('work') || l.includes('active')) return { label: 'working', cls: 'green', dotCls: 'green' };
  if (l.includes('idle') || l.includes('閒置')) return { label: 'idle', cls: 'gray', dotCls: 'gray' };
  if (l.includes('error') || l.includes('fail')) return { label: 'error', cls: 'red', dotCls: 'red' };
  return { label: status, cls: 'gray', dotCls: 'gray' };
}

function getActivityDotCls(c) {
  if (!c) return 'gray';
  if (c.includes('green')) return 'green pulse';
  if (c.includes('yellow')) return 'yellow';
  if (c.includes('red')) return 'red';
  return 'gray';
}

function SkeletonRow() {
  return (
    <tr>
      {[120, 60, 100, 160, 70, 90].map((w, i) => (
        <td key={i} style={tdStyle}>
          <div className="skeleton" style={{ height: '13px', width: `${w}px`, borderRadius: '3px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function PolecatsPanel({ polecats, isLoading }) {
  const typeBadge = (type) => {
    const info = getTypeBadge(type);
    if (!info) return <span style={{ color: 'var(--text-tertiary)' }}>—</span>;
    return <span className={`badge ${info.cls}`}>{info.label}</span>;
  };

  const statusBadge = (status) => {
    const info = getStatusInfo(status);
    return (
      <span className={`badge ${info.cls}`}>
        <span className={`dot ${info.dotCls}${info.dotCls === 'green' ? ' pulse' : ''}`} />
        {info.label}
      </span>
    );
  };

  return (
    <section>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: '14px' }}>👷</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>polecats</span>
          {!isLoading && polecats != null && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>
              [{polecats.length}]
            </span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['name', 'type', 'rig', 'task', 'status', 'activity'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !polecats?.length ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    no polecats
                  </td>
                </tr>
              ) : (
                polecats.map((p, i) => (
                  <tr key={i}
                    style={{ transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600', color: 'var(--text)' }}>{p.name}</span>
                    </td>
                    <td style={tdStyle}>{typeBadge(p.type)}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-tertiary)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>{p.rig ?? '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: '220px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {p.issue ?? '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{statusBadge(p.status)}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span className={`dot ${getActivityDotCls(p.activityColor)}`} />
                        {p.activity ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
