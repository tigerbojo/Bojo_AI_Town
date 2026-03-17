import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

function fetchUsageData() {
  return fetch('/usage-data').then(r => r.json());
}

function fetchUsageReport() {
  return fetch('/usage-report').then(r => r.json());
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

function formatTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

function ClaudeModelBar({ entry, color, maxOutput }) {
  const label = MODEL_LABELS[entry.model] ?? entry.model;
  const pct = maxOutput > 0 ? Math.round((entry.output / maxOutput) * 100) : 0;

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--divider)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{label}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <span style={{ color: 'var(--text)', fontWeight: '600' }}>{fmt(entry.output)}</span>
          {' out · '}
          {fmt(entry.cacheRead)} cache
          {' · '}
          {entry.calls} calls
        </div>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-secondary, #e8e8ed)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.4s ease', opacity: 0.85 }} />
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

function UsageReportModal({ onClose }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['usage-report'],
    queryFn: fetchUsageReport,
    staleTime: 0,
  });

  const models = data?.models ?? [];
  const resetInMin = data?.resetInMin;
  const resetAt = data?.resetAt;
  const windowStart = data?.windowStart;

  const resetLabel = resetInMin != null
    ? resetInMin <= 0
      ? '視窗已重置'
      : resetInMin < 60
        ? `${resetInMin} 分鐘後重置`
        : `${Math.floor(resetInMin / 60)}h ${resetInMin % 60}m 後重置`
    : '—';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--card)', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', width: '480px', maxWidth: '92vw', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>Claude Code Max — 使用量報告</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>過去 5 小時視窗</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '14px' }}>讀取中…</div>
          ) : isError ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--red)', fontSize: '14px' }}>讀取失敗</div>
          ) : (
            <>
              {/* Reset time banner */}
              <div style={{ background: resetInMin != null && resetInMin <= 30 ? 'var(--orange-light)' : 'var(--bg)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>視窗開始</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)' }}>{formatTime(windowStart)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>下次重置</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: resetInMin != null && resetInMin <= 30 ? 'var(--orange)' : 'var(--green)' }}>
                    {formatTime(resetAt)} （{resetLabel}）
                  </div>
                </div>
              </div>

              {/* Per-model rows */}
              {models.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontSize: '13px' }}>此視窗無使用記錄</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['模型', 'Output', 'Cache Read', 'Cache Write', 'Calls'].map(h => (
                        <th key={h} style={{ textAlign: h === '模型' ? 'left' : 'right', padding: '6px 8px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '1px solid var(--divider)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {models.sort((a, b) => b.output - a.output).map(m => (
                      <tr key={m.model}>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid var(--divider)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: MODEL_COLORS[m.model] ?? '#888', flexShrink: 0 }} />
                            <span style={{ fontWeight: '600', color: 'var(--text)' }}>{MODEL_LABELS[m.model] ?? m.model}</span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', borderBottom: '1px solid var(--divider)', fontWeight: '600', color: 'var(--text)' }}>{fmt(m.output)}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', borderBottom: '1px solid var(--divider)', color: 'var(--text-secondary)' }}>{fmt(m.cacheRead)}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', borderBottom: '1px solid var(--divider)', color: 'var(--text-secondary)' }}>{fmt(m.cacheWrite)}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'right', borderBottom: '1px solid var(--divider)', color: 'var(--text-secondary)' }}>{m.calls.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ marginTop: '14px', textAlign: 'right' }}>
                <button
                  onClick={() => refetch()}
                  style={{ fontSize: '12px', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}
                >
                  重新整理
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsageWidget() {
  const [timeWindow, setTimeWindow] = useState('5h');
  const [showReport, setShowReport] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsageData,
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isError) return null;

  const claudeModels = (data?.claude?.[timeWindow] ?? [])
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
        <button
          onClick={() => setShowReport(true)}
          style={{ fontSize: '12px', fontWeight: '600', padding: '5px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'var(--blue)', color: '#fff', transition: 'opacity 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          /usage
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Claude Code Max section */}
        <div style={sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)' }}>Claude Code Max</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg)', borderRadius: '8px', padding: '2px' }}>
              {['5h', '24h'].map(w => (
                <button key={w} style={tabBtn(timeWindow === w)} onClick={() => setTimeWindow(w)}>{w}</button>
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
                <ClaudeModelBar
                  key={m.model}
                  entry={m}
                  color={MODEL_COLORS[m.model] ?? '#888'}
                  maxOutput={claudeModels[0]?.output ?? 1}
                />
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

      {showReport && <UsageReportModal onClose={() => setShowReport(false)} />}
    </section>
  );
}
