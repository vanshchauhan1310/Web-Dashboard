import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { MASTER_DASHBOARDS } from '../config/dashboards';

interface DataSourcePublic {
  id: number;
  name: string;
  db_type: string;
  datasource_key: string | null;
  is_active: boolean;
  is_default: boolean;
  status: string;
}

interface Props {
  dashboardKey: string;   // key from MASTER_DASHBOARDS, e.g. 'sales'
  children: React.ReactNode;
}

const DatasourceGate: React.FC<Props> = ({ dashboardKey, children }) => {
  const navigate = useNavigate();
  const dashboard = MASTER_DASHBOARDS[dashboardKey];
  const requiredKey = dashboard?.requiredDatasourceKey ?? null;

  const { data: sources = [], isLoading } = useQuery<DataSourcePublic[]>({
    queryKey: ['my-datasources'],
    queryFn: () => apiClient.get('/analytics/my-datasources').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // No key required — always render
  if (!requiredKey) return <>{children}</>;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <Loader2 style={{ width: 28, height: 28, color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748B', fontSize: 14 }}>Checking datasource…</p>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Check if ANY active datasource carries the required key — not just the default one.
  // This lets an org have multiple active datasources (one per dashboard) simultaneously.
  const matchingSource = sources.find(s => s.datasource_key === requiredKey);
  if (matchingSource) return <>{children}</>;

  // ── Blocked screen ────────────────────────────────────────────────────────
  const hasSomeActive = sources.length > 0;
  const activeKeys = sources
    .map(s => s.datasource_key)
    .filter(Boolean) as string[];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '60vh', gap: 20, padding: 32, textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: hasSomeActive ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${hasSomeActive ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasSomeActive
          ? <AlertTriangle style={{ width: 28, height: 28, color: '#F59E0B' }} />
          : <Database style={{ width: 28, height: 28, color: '#EF4444' }} />
        }
      </div>

      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F1F5F9', marginBottom: 8 }}>
          {hasSomeActive ? 'No Matching Datasource' : 'No Datasource Configured'}
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 440, lineHeight: 1.6 }}>
          {hasSomeActive
            ? <>
                This dashboard needs a datasource tagged{' '}
                <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4, color: '#60A5FA', fontFamily: 'monospace' }}>
                  {requiredKey}
                </code>
                {activeKeys.length > 0 && (
                  <>, but your active datasources are tagged{' '}
                    {activeKeys.map((k, i) => (
                      <span key={k}>
                        <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4, color: '#F59E0B', fontFamily: 'monospace' }}>{k}</code>
                        {i < activeKeys.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </>
                )}
                . Ask your admin to activate the <code style={{ color: '#60A5FA', fontFamily: 'monospace' }}>{requiredKey}</code> datasource.
              </>
            : <>
                No active datasource is configured for your organisation. Ask your admin to connect a database and tag it{' '}
                <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 6px', borderRadius: 4, color: '#60A5FA', fontFamily: 'monospace' }}>
                  {requiredKey}
                </code>
                .
              </>
          }
        </p>
      </div>

      <div style={{
        padding: '14px 20px', borderRadius: 12,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'left', fontSize: 12, color: '#475569', lineHeight: 1.8, maxWidth: 400,
      }}>
        <p style={{ fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Admin steps to fix:</p>
        <p>1. Go to <strong style={{ color: '#94A3B8' }}>Admin Portal → Organisations → [Org] → Data Sources</strong></p>
        <p>2. Add or edit a datasource</p>
        <p>3. Set its <strong style={{ color: '#94A3B8' }}>Datasource Key</strong> to{' '}
          <code style={{ color: '#60A5FA', fontFamily: 'monospace' }}>{requiredKey}</code>
        </p>
        <p>4. Click <strong style={{ color: '#94A3B8' }}>Activate</strong> — other datasources stay active</p>
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          color: '#60A5FA', cursor: 'pointer',
        }}
      >
        Back to Dashboard Selector
      </button>
    </div>
  );
};

export default DatasourceGate;
