import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

function fetchUsageData() {
  return fetch('/usage-data').then(r => r.json());
}

const MODEL_LABELS = {
  'claude-sonnet-4-6': 'Sonnet 4.6',
  'claude-opus-4-6': 'Opus 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
  'MiniMax-M2.5': 'MiniMax M2.5',
  'MiniMax-M2.1': 'MiniMax M2.1',
};

const MODEL_COLORS = {
  'claude-opus-4-6': '#7c3aed',
  'claude-sonnet-4-6': '#0071e3',
  'claude-haiku-4-5-20251001': '#28c840',
  'MiniMax-M2.5': '#ff9500',
  'MiniMax-M2.1': '#ff6b00',
};

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function formatRelTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return `${m}m 前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h 前`;
  return `${Math.floor(h / 24)}d 前`;
}

function ClaudeModelRow({ entry, color }) {
  const label = MODEL_LABELS[entry.model] ?? entry.model;
  // output tokens are the most meaningful for "work done"
  const total = entry.output + entry.cacheRead;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{label}</div>
      </div>
      <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        <span style={{ color: 'var(--text)', fontWeight: '500' }}>{fmt(entry.output)}</span> out
        {' · '}
        <span>{fmt(entry.cacheRead)}</span> cache
        {' · '}
        <span>{entry.calls}</span> calls
      </div>
    </div>
  );
}

function OpenClawBar({ m }) {
  const ctx = m.contextUsage ?? m.totalTokens ?? 0;
  const max = m.contextWindow || 200000;
  const pct = max > 0 ? Math.min(100, Math.round((ctx / max) * 100)) : 0;
  const color = pct >= 80 ? 'var(--red)' : pct >= 50 ? 'var(--orange)' : 'var(--green)';
  const label = MODEL_LABELS[m.model] ?? m.model;

  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: '12px', color, fontWeight: '600' }}>{fmt(ctx)} / {fmt(max)} ({pct}%)</span>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-secondary, #e8e8ed)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function UsageWidget() {
  const [window, setWindow] = useState('5h');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsageData,
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isError) return null;

  const claudeModels = (data?.claude?.[window] ?? [])
    .filter(m => m.calls > 0)
    .sort((a, b) => b.output - a.output);

  const openclawModels = data?.openclaw ?? [];

  const sectionCard = {
    background: 'var(--card)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    padding: '16px 18px',
    flex: '1 1 280px',
    minWidth: 0,
  };

  const tabBtn = (active) => ({
    fontSize: '12px',
    fontWeight: active ? '600' : '400',
    padding: '3px 10px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--blue)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'background 0.15s',
  });

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '10px' }}>
        <span style={{ fontSize: '15px' }}>📊</span>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', margin: 0, letterSpacing: '-0.01em', flex: 1 }}>
          AI 使用量
        </h2>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Claude Code Max section */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Claude Code Max</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg)', borderRadius: '8px', padding: '2px' }}>
              {['5h', '24h'].map(w => (
                <button key={w} style={tabBtn(window === w)} onClick={() => setWindow(w)}>{w}</button>
              ))}
            </div>
          </div>

          {isLoading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--divider)' }}>
                <div className="skeleton" style={{ width: '10px', height: '10px', borderRadius: '50%' }} />
                <div className="skeleton" style={{ flex: 1, height: '13px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '120px', height: '12px', borderRadius: '4px' }} />
              </div>
            ))
          ) : claudeModels.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', padding: '12px 0', textAlign: 'center' }}>
              此時段無使用記錄
            </div>
          ) : (
            <>
              {claudeModels.map(m => (
                <ClaudeModelRow key={m.model} entry={m} color={MODEL_COLORS[m.model] ?? '#888'} />
              ))}
              <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                共 {claudeModels.reduce((s, m) => s + m.calls, 0).toLocaleString()} 次 API 呼叫
              </div>
            </>
          )}
        </div>

        {/* OpenClaw context window section */}
        {openclawModels.length > 0 && (
          <div style={{ ...sectionCard, flex: '0 1 260px' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '12px' }}>
              OpenClaw 上下文
            </div>
            {openclawModels.map(m => <OpenClawBar key={m.model} m={m} />)}
            <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'right' }}>
              {formatRelTime(Math.max(...openclawModels.map(m => m.lastActive)))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
