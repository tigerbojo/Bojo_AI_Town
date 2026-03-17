import '../styles/design-system.css';

export default function Layout({ children, lastUpdated, live }) {
  const formatTime = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return null; }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        height: '48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(13,13,16,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>🏙</span>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>
            gas-town
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>/control</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {live && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', animation: 'live-blink 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '11px', color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: '600' }}>LIVE</span>
            </div>
          )}
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {formatTime(lastUpdated)}
            </span>
          )}
        </div>
      </nav>
      <main style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '20px 20px 40px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {children}
      </main>
    </div>
  );
}
