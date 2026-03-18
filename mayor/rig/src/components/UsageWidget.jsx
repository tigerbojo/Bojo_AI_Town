import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function fmtTime(iso, tz = 'Asia/Taipei') {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', timeZone: tz });
}

function fmtDate(iso, tz = 'Asia/Taipei') {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', timeZone: tz });
}

function Countdown({ endTime }) {
  const [txt, setTxt] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime) - Date.now();
      if (diff <= 0) { setTxt('已重置'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTxt(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endTime]);
  return <span>{txt}</span>;
}

function UsageRow({ label, cost, resetLabel, color = '#0071e3', maxCost }) {
  const pct = maxCost > 0 ? Math.min(100, (cost / maxCost) * 100) : 0;
  const barColor = pct > 80 ? '#ff3b30' : pct > 60 ? '#ff9500' : color;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{resetLabel}</span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border)', overflow: 'hidden', marginBottom: '4px' }}>
        <div style={{ height: '100%', width: (maxCost > 0 ? pct : 100) + '%', background: barColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: 'var(--text-secondary)', fontSize: '13px' }}>${cost.toFixed(2)}</span>
        {maxCost > 0 && <span>{pct.toFixed(0)}% 已用</span>}
      </div>
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
  const thisWeek = data?.weekly?.[data.weekly.length - 1];
  const sonnetWeek = thisWeek?.modelBreakdowns?.find(m => m.modelName.includes('sonnet'));
  const sessionCost = activeBlock?.costUSD ?? 0;
  const weekCost = thisWeek?.totalCost ?? 0;
  const sonnetCost = sonnetWeek?.cost ?? 0;
  const burnRate = activeBlock?.burnRate?.costPerHour;

  // Week resets every Sunday — compute next Sunday midnight Taipei
  const nextWeekReset = (() => {
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const daysUntilSun = day === 0 ? 7 : 7 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilSun);
    next.setHours(0, 0, 0, 0);
    return next.toISOString();
  })();

  return (
    <section>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {/* Header */}
        <div onClick={toggle} style={{ padding: '18px 20px 14px', borderBottom: collapsed ? 'none' : '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>Claude Code 用量</h2>
            {!collapsed && activeBlock && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                本視窗 ${sessionCost.toFixed(2)}　·　{burnRate ? `$${burnRate.toFixed(1)}/h` : ''}　·　重置 <Countdown endTime={activeBlock.endTime} />
              </p>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
        </div>

        {!collapsed && (
          <div style={{ padding: '18px 20px 16px' }}>
            {isLoading && [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '44px', borderRadius: '6px', marginBottom: '12px' }} />)}

            {!isLoading && data?.error && (
              <p style={{ fontSize: '13px', color: 'var(--red, #ff3b30)' }}>錯誤：{data.error}</p>
            )}

            {!isLoading && !data?.error && (
              <>
                {/* Current session (5h block) */}
                <UsageRow
                  label="本計費視窗（5 小時）"
                  cost={sessionCost}
                  resetLabel={activeBlock ? `重置 ${fmtTime(activeBlock.endTime)}` : '無活躍視窗'}
                  color="#0071e3"
                  maxCost={0}
                />

                {/* Current week all models */}
                <UsageRow
                  label="本週（所有模型）"
                  cost={weekCost}
                  resetLabel={`重置 ${fmtDate(nextWeekReset)} 00:00`}
                  color="#9333ea"
                  maxCost={0}
                />

                {/* Current week Sonnet only */}
                <UsageRow
                  label="本週（Sonnet）"
                  cost={sonnetCost}
                  resetLabel={weekCost > 0 ? `佔本週 ${(sonnetCost/weekCost*100).toFixed(0)}%` : ''}
                  color="#16a34a"
                  maxCost={weekCost}
                />

                {/* Model breakdown */}
                {thisWeek?.modelBreakdowns?.length > 0 && (
                  <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {thisWeek.modelBreakdowns.map(m => (
                      <span key={m.modelName} style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                        {m.modelName.replace('claude-','').replace('-20251001','')}　${m.cost.toFixed(2)}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '12px', textAlign: 'right' }}>
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
