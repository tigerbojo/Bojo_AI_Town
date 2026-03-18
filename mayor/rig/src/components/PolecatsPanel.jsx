const sectionStyle = {};

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

const nameStyle = {
  fontWeight: '600',
  color: 'var(--text)',
  fontSize: '14px',
  fontFamily: 'var(--font-mono)',
};

const emptyStyle = {
  padding: '40px',
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: '14px',
};

function getTypeBadge(type) {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower === 'polecat' || lower.includes('worker') || lower.includes('工人')) return { label: '工人', cls: 'blue' };
  if (lower === 'refinery' || lower.includes('refiner') || lower.includes('精煉')) return { label: '整合員', cls: 'purple' };
  if (lower === 'witness' || lower.includes('見證')) return { label: '監察員', cls: 'orange' };
  if (lower === 'mayor' || lower.includes('市長')) return { label: '市長', cls: 'green' };
  if (lower === 'deacon' || lower.includes('執事')) return { label: '管家', cls: 'gray' };
  return { label: type, cls: 'gray' };
}

function getActivityDotCls(activityColor) {
  if (!activityColor) return 'gray';
  if (activityColor.includes('green')) return 'green pulse';
  if (activityColor.includes('yellow')) return 'yellow';
  if (activityColor.includes('red')) return 'red';
  return 'gray';
}

function getStatusInfo(status) {
  if (!status) return { label: '未知', cls: 'gray', dotCls: 'gray' };
  const lower = status.toLowerCase();
  if (lower.includes('work') || lower.includes('active') || lower.includes('工作') || lower.includes('運行')) {
    return { label: '工作中', cls: 'green', dotCls: 'green' };
  }
  if (lower.includes('idle') || lower.includes('閒置') || lower.includes('等待')) {
    return { label: '閒置', cls: 'gray', dotCls: 'gray' };
  }
  if (lower.includes('error') || lower.includes('fail') || lower.includes('錯誤')) {
    return { label: '錯誤', cls: 'red', dotCls: 'red' };
  }
  return { label: status, cls: 'gray', dotCls: 'gray' };
}

function SkeletonRow() {
  return (
    <tr>
      {[140, 70, 120, 180, 80, 100].map((w, i) => (
        <td key={i} style={tdStyle}>
          <div className="skeleton" style={{ height: '16px', width: `${w}px`, borderRadius: '4px' }} />
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
    <section style={sectionStyle}>
      <div style={cardStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: '18px' }}>👷</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>
              工人節點
            </h2>
            {!isLoading && polecats != null && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                共 {polecats.length} 個節點
              </p>
            )}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['名稱', '類型', '工程', '當前任務', '狀態', '最後活動'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : polecats?.length === 0 || !polecats ? (
                <tr>
                  <td colSpan={6} style={emptyStyle}>
                    暫無工人節點資料
                  </td>
                </tr>
              ) : (
                polecats.map((p, i) => (
                  <tr
                    key={i}
                    style={{ transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>
                      <span style={nameStyle}>{p.name}</span>
                    </td>
                    <td style={tdStyle}>{typeBadge(p.type)}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {p.rig ?? '—'}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '240px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.issue ?? '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>{statusBadge(p.status)}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
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
