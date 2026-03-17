export default function MayorBanner({ mayor, isLoading }) {
  const attached = mayor?.status === 'attached';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: '13px', width: '120px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ height: '11px', width: '200px' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px',
      background: 'var(--card)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
      }}>🏛</div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>mayor</span>
          <span className={`badge ${attached ? 'green' : 'red'}`}>
            <span className={`dot ${attached ? 'green pulse' : 'red'}`} />
            {attached ? '在線' : '離線'}
          </span>
        </div>
        {(mayor?.activity || mayor?.runtime) && (
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '16px' }}>
            {mayor.activity && <span>活動: {mayor.activity}</span>}
            {mayor.runtime && <span>運行: {mayor.runtime}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
