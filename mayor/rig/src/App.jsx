import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardData } from './lib/api';
import Layout from './components/Layout';
import MayorBanner from './components/MayorBanner';
import SummaryStats from './components/SummaryStats';
import PolecatsPanel from './components/PolecatsPanel';
import SessionsPanel from './components/SessionsPanel';
import UsageWidget from './components/UsageWidget';
import './styles/design-system.css';

export default function App() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 30_000,
    retry: 2,
    retryDelay: 3_000,
  });

  // SSE: re-fetch immediately on dashboard-update event
  useEffect(() => {
    const es = new EventSource('/events');
    es.addEventListener('dashboard-update', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
    es.onerror = () => {}; // silent reconnect
    return () => es.close();
  }, [queryClient]);

  return (
    <Layout lastUpdated={data?.fetchedAt} live={!isError}>
      {isError && (
        <div style={{
          background: 'var(--red-light)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontSize: '13px', color: '#f87171',
        }}>
          <span>⚠</span>
          <div>
            <strong>無法連線至控制中心</strong>
            <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.7 }}>
              {error?.message ?? 'localhost:8084 未回應'}
            </div>
          </div>
        </div>
      )}
      <MayorBanner mayor={data?.mayor} isLoading={isLoading} />
      <SummaryStats summary={data?.summary} isLoading={isLoading} />
      <UsageWidget />
      <PolecatsPanel polecats={data?.polecats} isLoading={isLoading} />
      <SessionsPanel sessions={data?.sessions} isLoading={isLoading} />
    </Layout>
  );
}
