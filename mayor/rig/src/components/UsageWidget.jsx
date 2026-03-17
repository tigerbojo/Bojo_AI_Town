import { useQuery } from '@tanstack/react-query';

function fetchUsageData() {
  return fetch('/usage-data').then(r => r.json());
}

function formatTokens(n) {
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

function getBarColor(pct) {
  if (pct >= 80) return 'var(--red)';
  if (pct >= 50) return 'var(--orange)';
  return 'var(--green)';
}

function formatRelativeTime(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.floor(h / 24)} 天前`;
}

function ModelCard({ m }) {
  const ctx = m.contextUsage ?? m.totalTokens ?? 0;
  const max = m.contextWindow || 200000;
  const pct = max > 0 ? Math.min(100, Math.round((ctx / max) * 100)) : 0;
  const color = getBarColor(pct);

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      padding: '14px 16px',
      minWidth: '200px',
      flex: '1 1 200px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {m.model}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>
            {m.provider}
          </div>
        </div>
        <div style={{ fontSize: '13px', fontWeight: '600', color, tabularNums: true }}>
          {pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: 'var(--bg-secondary, #e8e8ed)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '3px',
          transition: 'width 0.4s ease',
        }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          {formatTokens(ctx)} / {formatTokens(max)}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {formatRelativeTime(m.lastActive)}
        </span>
      </div>
    </div>
  );
}

export default function UsageWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsageData,
    refetchInterval: 60_000,
    retry: 1,
  });

  if (isError) return null;

  const models = data?.models ?? [];

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '15px', marginRight: '8px' }}>🤖</span>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', margin: 0, letterSpacing: '-0.01em' }}>
          AI 使用量
        </h2>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: '14px 16px', minWidth: '200px', flex: '1 1 200px' }}>
              <div className="skeleton" style={{ height: '14px', width: '120px', borderRadius: '4px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '6px', borderRadius: '3px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '11px', width: '80px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      ) : models.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>無使用量資料</div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {models.map(m => <ModelCard key={m.model} m={m} />)}
        </div>
      )}
    </section>
  );
}
