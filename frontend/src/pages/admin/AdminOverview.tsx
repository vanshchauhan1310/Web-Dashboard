import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Database, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '../../api/client';

interface Stats {
  total_orgs: number;
  active_orgs: number;
  total_users: number;
  active_users: number;
  total_datasources: number;
  connected_datasources: number;
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
}> = ({ icon, label, value, sub, color }) => (
  <div style={{
    background: 'rgba(14,28,48,0.9)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '20px 24px',
    display: 'flex', alignItems: 'center', gap: 16,
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
      background: `${color}18`, border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color,
    }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: 26, fontWeight: 700, color: '#F1F5F9', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>{label}</p>
      <p style={{ fontSize: 11, color: '#334155', marginTop: 1 }}>{sub}</p>
    </div>
  </div>
);

const AdminOverview: React.FC = () => {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await apiClient.get('/admin/stats')).data,
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
        <Loader2 style={{ width: 28, height: 28, color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>Overview</h1>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Platform-wide summary for Aion Tech Admin</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard
          icon={<Building2 style={{ width: 20, height: 20 }} />}
          label="Organisations"
          value={stats?.total_orgs ?? 0}
          sub={`${stats?.active_orgs ?? 0} active`}
          color="#3B82F6"
        />
        <StatCard
          icon={<Users style={{ width: 20, height: 20 }} />}
          label="Client Users"
          value={stats?.total_users ?? 0}
          sub={`${stats?.active_users ?? 0} active`}
          color="#8B5CF6"
        />
        <StatCard
          icon={<Database style={{ width: 20, height: 20 }} />}
          label="Data Sources"
          value={stats?.total_datasources ?? 0}
          sub={`${stats?.connected_datasources ?? 0} connected`}
          color="#10B981"
        />
        <StatCard
          icon={<CheckCircle2 style={{ width: 20, height: 20 }} />}
          label="Connection Health"
          value={stats?.total_datasources
            ? Math.round((stats.connected_datasources / stats.total_datasources) * 100)
            : 0}
          sub="% sources connected"
          color="#F59E0B"
        />
      </div>

      <div style={{
        background: 'rgba(14,28,48,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, padding: 24,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94A3B8', marginBottom: 16 }}>Quick Start</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { step: '1', text: 'Create an Organisation under Organisations tab', done: (stats?.total_orgs ?? 0) > 0 },
            { step: '2', text: 'Add users to the organisation', done: (stats?.total_users ?? 0) > 0 },
            { step: '3', text: 'Connect a database to the organisation', done: (stats?.total_datasources ?? 0) > 0 },
            { step: '4', text: 'Users can now log in and select their data source', done: (stats?.connected_datasources ?? 0) > 0 },
          ].map(({ step, text, done }) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {done
                ? <CheckCircle2 style={{ width: 16, height: 16, color: '#10B981', flexShrink: 0 }} />
                : <div style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: '1.5px solid #334155',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#475569',
                  }}>{step}</div>
              }
              <span style={{ fontSize: 13, color: done ? '#94A3B8' : '#64748B' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
