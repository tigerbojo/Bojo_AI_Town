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

function getRoleBadge(role) {
  if (!role) return { label: 'unknown', cls: 'gray' };
  const l = role.toLowerCase();
  if (l.includes('mayor')) return { label: 'mayor', cls: 'blue' };
  if (l.includes('worker') || l.includes('polecat')) return { label: 'worker', cls: 'green' };
  if (l.includes('refiner')) return { label: 'refinery', cls: 'purple' };
  if (l.includes('witness')) return { label: 'witness', cls: 'orange' };
  return { label: role, cls: 'gray' };
}

function SkeletonRow() {
  return (
    <tr>
      {[70, 120, 120, 100].map((w, i) => (
        <td key={i} style={tdStyle}>
          <div className="skeleton" style={{ height: '13px', width: `${w}px`, borderRadius: '3px' }} />
        </td>
      ))}
    </tr>
  );
}

export default function SessionsPanel({ sessions, isLoading }) {
  return (
    <section>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: '14px' }}>🖥</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>sessions</span>
          {!isLoading && sessions != null && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px', fontFamily: 'var(--font-mono)' }}>
              [{sessions.length}]
            </span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['role', 'rig', 'worker', 'activity'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : !sessions?.length ? (
                <tr>
                  <td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-tertiary)', padding: '32px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                    no sessions
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => {
                  const badge = getRoleBadge(s.role);
                  return (
                    <tr key={i}
                      style={{ transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--blue)' }}>
                        {s.rig || <span style={{ color: 'var(--text-tertiary)' }}>—</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>{s.worker ?? '—'}</td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{s.activity ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
