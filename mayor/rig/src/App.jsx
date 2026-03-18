import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from './lib/api';
import Layout from './components/Layout';
import MayorBanner from './components/MayorBanner';
import SummaryStats from './components/SummaryStats';
import PolecatsPanel from './components/PolecatsPanel';
import SessionsPanel from './components/SessionsPanel';
import './styles/design-system.css';

const errorBannerStyle = {
  background: 'var(--red-light)',
  border: '1px solid rgba(255, 59, 48, 0.2)',
  borderRadius: 'var(--radius-md)',
  padding: '14px 18px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '14px',
  color: '#c0392b',
};

export default function App() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 15_000,
    retry: 2,
    retryDelay: 3_000,
  });

  return (
    <Layout lastUpdated={data?.fetchedAt}>
      {isError && (
        <div style={errorBannerStyle}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong>無法連線至控制中心</strong>
            <div style={{ fontSize: '12px', marginTop: '2px', opacity: 0.8 }}>
              {error?.message ?? '請確認 localhost:8081 是否正在運行'}
            </div>
          </div>
        </div>
      )}

      <MayorBanner mayor={data?.mayor} isLoading={isLoading} />
      <SummaryStats summary={data?.summary} isLoading={isLoading} />
      <PolecatsPanel polecats={data?.polecats} isLoading={isLoading} />
      <SessionsPanel sessions={data?.sessions} isLoading={isLoading} />
    </Layout>
  );
}
