import '../styles/design-system.css';

const navbarStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 100,
  height: '52px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(20px) saturate(180%)',
  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  borderBottom: '1px solid rgba(0,0,0,0.08)',
};

const titleStyle = {
  fontSize: '17px',
  fontWeight: '600',
  color: '#1d1d1f',
  letterSpacing: '-0.01em',
  margin: 0,
};

const mainStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '28px 24px 48px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

export default function Layout({ children, lastUpdated, onRefresh, isLoading }) {
  const formatTime = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <nav style={navbarStyle}>
        <h1 style={titleStyle}>🏙 氣站控制中心</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              更新：{formatTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="立即更新"
            style={{
              background: 'none',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '13px',
              color: isLoading ? '#aaa' : '#1d1d1f',
              cursor: isLoading ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <span style={{ display: 'inline-block', animation: isLoading ? 'spin 0.8s linear infinite' : 'none' }}>↻</span>
            更新
          </button>
        </div>
      </nav>
      <main style={mainStyle}>
        {children}
      </main>
    </div>
  );
}
