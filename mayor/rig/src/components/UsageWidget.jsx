import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

const HOURS_OPTIONS = [1, 5, 24];

const MODEL_LABELS = {
  'claude-sonnet-4-6':         { short: 'Sonnet 4.6', color: '#0071e3' },
  'claude-opus-4-6':           { short: 'Opus 4.6',   color: '#9333ea' },
  'claude-haiku-4-5-20251001': { short: 'Haiku 4.5',  color: '#16a34a' },
};

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function ModelRow({ model, data, maxOut }) {
  const label = MODEL_LABELS[model] ?? { short: model.replace('claude-', ''), color: '#888' };
  const total = data.input + data.output + data.cache_read + data.cache_create;
  const barW = maxOut > 0 ? Math.max(2, (data.output / maxOut) * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ width: '90px', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: label.color }}>{label.short}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>輸入 {fmt(data.input)}</span>
          <span>輸出 {fmt(data.output)}</span>
          <span style={{ color: 'var(--text-tertiary)' }}>快取讀 {fmt(data.cache_read)}</span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: barW + '%', background: label.color, borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
      </div>
      <div style={{ width: '52px', textAlign: 'right', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{fmt(total)}</span>
      </div>
    </div>
  );
}

export default function UsageWidget() {
  const [hours, setHours] = useState(5);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('gt-usage-collapsed') === 'true'
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['usage', hours],
    queryFn: () => fetch('/usage-data?hours=' + hours).then(r => r.json()),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const models = data?.models ?? {};
  const hasData = Object.keys(models).length > 0;
  const maxOut = Math.max(1, ...Object.values(models).map(m => m.output));

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('gt-usage-collapsed', String(next));
  };

  const totals = ['input', 'output', 'cache_read', 'cache_create'].map(k =>
    Object.values(models).reduce((s, m) => s + (m[k] || 0), 0)
  );

  return (
    <section>
      <div style={{ background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div onClick={toggle} style={{ padding: '18px 20px 14px', borderBottom: collapsed ? 'none' : '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0, letterSpacing: '-0.01em' }}>Claude Code 用量</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>最近 {hours} 小時 token 使用量</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', transition: 'transform 0.2s', display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
        </div>

        {!collapsed && (
          <div style={{ padding: '14px 20px 18px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {HOURS_OPTIONS.map(h => (
                <button key={h} onClick={() => setHours(h)} style={{ padding: '4px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: hours === h ? 'var(--blue)' : 'none', color: hours === h ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: hours === h ? '600' : '400' }}>
                  {h}h
                </button>
              ))}
              <button onClick={() => refetch()} style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>↻</button>
            </div>

            {isLoading && [1,2].map(i => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '6px', marginBottom: '8px' }} />)}

            {!isLoading && !hasData && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>最近 {hours} 小時無使用紀錄</p>
            )}

            {!isLoading && hasData && (
              <>
                {Object.entries(models).sort((a, b) => b[1].output - a[1].output).map(([model, d]) => (
                  <ModelRow key={model} model={model} data={d} maxOut={maxOut} />
                ))}
                <div style={{ marginTop: '10px', display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {['輸入', '輸出', '快取讀', '快取建'].map((lbl, i) => (
                    <span key={lbl}>{lbl} <strong style={{ color: 'var(--text-secondary)' }}>{fmt(totals[i])}</strong></span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
