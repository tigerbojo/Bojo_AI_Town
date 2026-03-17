const cardStyle = {
  background: 'var(--card)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  overflow: 'hidden',
};

const headerStyle = {
  padding: '18px 20px 14px',
  borderBottom: '1px solid var(--divider)',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--divider)',
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--text)',
  borderBottom: '1px solid var(--divider)',
  verticalAlign: 'middle',
};

const monoStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '13px',
  color: 'var(--blue)',
  background: 'var(--blue-light)',
  padding: '2px 6px',
  borderRadius: '4px',
};

const emptyStyle = {
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: '14px',
};

function SkeletonRow() {
  return (
    <tr>
      {[90, 140, 140, 120].map((w, i) => (
        <td key={i} style={tdStyle}>
          <div className="skeleton" style={{ height: '16px', width: `${w}px`, borderRadius: '4px' }} />
        </td>
      ))}
    </tr>
  );
}

function getRoleBadge(role) {
  if (!role) return { label: '未知', cls: 'gray' };
  const lower = role.toLowerCase();
  if (lower.includes('mayor') || lower.includes('市長')) return { label: '市長', cls: 'blue' };
  if (lower.includes('worker') || lower.includes('工人')) return { label: '工人', cls: 'green' };
  if (lower.includes('refiner') || lower.includes('精煉')) return { label: '精煉廠', cls: 'purple' };
  if (lower.includes('witness') || lower.includes('見證')) return { label: '見證者', cls: 'orange' };
  return { label: role, cls: 'gray' };
}

export default function SessionsPanel({ sessions, isLoading }) {
  return (
    <section>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: '18px' }}>🖥</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>
              會話列表
            </h2>
            {!isLoading && sessions != null && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                共 {sessions.length} 個工作階段
              </p>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['角色', '工程', '工人', '最後活動'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sessions?.length === 0 || !sessions ? (
                <tr>
                  <td colSpan={4} style={emptyStyle}>
                    暫無會話資料
                  </td>
                </tr>
              ) : (
                sessions.map((s, i) => {
                  const badge = getRoleBadge(s.role);
                  return (
                    <tr
                      key={i}
                      style={{ transition: 'background var(--transition-fast)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={tdStyle}>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td style={tdStyle}>
                        {s.rig
                          ? <span style={monoStyle}>{s.rig}</span>
                          : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        }
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px' }}>
                        {s.worker ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {s.activity ?? '—'}
                      </td>
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
