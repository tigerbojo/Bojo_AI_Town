import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const MAX_COST_PER_WINDOW = 50; // Claude Max ~$50/5h window (adjust if needed)

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function Countdown({ endTime }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) { setRemaining('已重置'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return <span>{remaining}</span>;
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const barColor = pct > 80 ? '#ff3b30' : pct > 60 ? '#ff9500' : color || '#0071e3';
  return (
    <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: '4px', transition: 'width 0.5s ease' }} />
    </div>
  );
}

export default function UsageWidget() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('gt-usage-collapsed') === 'true'
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage-blocks'],
    queryFn: () => fetch('/usage-data').then(r => r.json()),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('gt-usage-collapsed', String(next));
  };

  const activeBlock = data?.blocks?.find(b => b.isActive && !b.isGap);
  const cost = activeBlock?.costUSD ?? 0;
  const pct = Math.min(100, (cost / MAX_COST_PER_WINDOW) * 100);
  const burnRate = activeBlock?.burnRate?.costPerHour;
  const models = activeBlock?.models ?? [];

  return (
    <section>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Header */}
        <div onClick={toggle} style={{ padding: '18px 20px 14px', borderBottom: collapsed ? 'none' : '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>Claude Code 用量</h2>
            {activeBlock && !collapsed && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                ${cost.toFixed(2)} 已用　·　重置：<Countdown endTime={activeBlock.endTime} />
              </p>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
        </div>

        {!collapsed && (
          <div style={{ padding: '16px 20px 18px' }}>
            {isLoading && <div className="skeleton" style={{ height: '60px', borderRadius: '8px' }} />}

            {!isLoading && data?.error && (
              <p style={{ fontSize: '13px', color: 'var(--red, #ff3b30)' }}>錯誤：{data.error}</p>
            )}

            {!isLoading && !activeBlock && !data?.error && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>目前無活躍計費視窗</p>
            )}

            {!isLoading && activeBlock && (
              <>
                {/* Main progress bar */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.03em', color: pct > 80 ? '#ff3b30' : pct > 60 ? '#ff9500' : 'var(--text)' }}>
                      ${cost.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>/ ~${MAX_COST_PER_WINDOW}</span>
                  </div>
                  <ProgressBar value={cost} max={MAX_COST_PER_WINDOW} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <span>{fmtTime(activeBlock.startTime)} 開始</span>
                    <span style={{ color: pct > 80 ? '#ff3b30' : 'inherit' }}>{pct.toFixed(0)}% 已用</span>
                    <span>重置 {fmtTime(activeBlock.endTime)}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: '輸出 Token', value: fmt(activeBlock.tokenCounts.outputTokens) },
                    { label: '燒錢速率', value: burnRate ? `$${burnRate.toFixed(2)}/h` : '—' },
                    { label: '倒數重置', value: <Countdown endTime={activeBlock.endTime} /> },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>{label}</div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Models */}
                {models.length > 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    使用模型：{models.map(m => m.replace('claude-', '').replace('-20251001', '')).join('、')}
                  </div>
                )}

                <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <button onClick={() => refetch()} style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>↻ 更新</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
