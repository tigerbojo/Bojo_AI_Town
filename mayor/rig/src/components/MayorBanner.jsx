const containerStyle = {
  background: 'var(--card)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: '20px 24px',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  flexWrap: 'wrap',
};

const iconStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #0071e3 0%, #005bb5 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '22px',
  flexShrink: 0,
};

const infoStyle = {
  flex: 1,
};

const nameStyle = {
  fontSize: '17px',
  fontWeight: '600',
  color: 'var(--text)',
  margin: '0 0 4px 0',
  letterSpacing: '-0.01em',
};

const metaStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};

const metaItemStyle = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
};

export default function MayorBanner({ mayor, isLoading }) {
  if (isLoading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...iconStyle, background: 'var(--bg-secondary)' }} />
        <div style={infoStyle}>
          <div className="skeleton" style={{ height: '20px', width: '200px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '14px', width: '300px' }} />
        </div>
      </div>
    );
  }

  const attached = mayor?.status === 'attached';

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>🏛</div>

      <div style={infoStyle}>
        <p style={nameStyle}>市長節點</p>
        <div style={metaStyle}>
          <span
            className={`badge ${attached ? 'green' : 'red'}`}
            style={{ fontSize: '12px' }}
          >
            <span className={`dot ${attached ? 'green pulse' : 'red'}`} />
            {attached ? '在線' : '離線'}
          </span>

          {mayor?.activity && (
            <span style={metaItemStyle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              最後活動：{mayor.activity}
            </span>
          )}

          {mayor?.runtime && (
            <span style={metaItemStyle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/><path d="M20.5 15a9 9 0 1 1-.1-5.3L23 10"/>
              </svg>
              運行時長：{mayor.runtime}
            </span>
          )}

          {mayor?.raw && !mayor.activity && !mayor.runtime && (
            <span style={{ ...metaItemStyle, maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mayor.raw}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
