import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { LogOut, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/client';
import Topbar from './Topbar';

interface MasterDashboard {
  id: number; title: string; description: string | null;
  template_type: string; gradient: string | null; glow: string | null;
}
interface SubDashboard {
  id: number; title: string; description: string | null; order_index: number;
}

function companyColor(name: string): string {
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}
function companyInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const CustomDashboardLayout: React.FC = () => {
  const { masterId } = useParams<{ masterId: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const { user, logout } = useAuthStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const company   = user?.company || '';
  const compColor = company ? companyColor(company) : '#3B82F6';
  const compInit  = company ? companyInitials(company) : 'NA';
  const userInit  = (user?.full_name ?? user?.email ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const { data: master } = useQuery<MasterDashboard | null>({
    queryKey: ['viewer-master', masterId],
    queryFn: () => apiClient.get('/builder/master-dashboards')
      .then(r => (r.data as MasterDashboard[]).find(d => d.id === Number(masterId)) ?? null),
    enabled: !!masterId,
  });

  const { data: subDashboards = [] } = useQuery<SubDashboard[]>({
    queryKey: ['viewer-sub', masterId],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${masterId}/dashboards`).then(r => r.data),
    enabled: !!masterId,
  });

  // Auto-redirect to first sub-dashboard when landing on /view/:masterId with no sub-page
  useEffect(() => {
    const hasSubId = location.pathname.split('/').length > 3;
    if (!hasSubId && subDashboards.length > 0) {
      navigate(`/view/${masterId}/${subDashboards[0].id}`, { replace: true });
    }
  }, [subDashboards, location.pathname, masterId, navigate]);

  const gradient    = master?.gradient ?? 'linear-gradient(135deg,#6366F1,#8B5CF6)';
  const glow        = master?.glow     ?? 'rgba(99,102,241,0.35)';
  const accentColor = gradient.match(/#[A-Fa-f0-9]{6}/g)?.[0] ?? '#6366F1';
  const accentRgb   = glow;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-textMain font-sans">

      {/* ── Sidebar ─────────────────────────────────── */}
      <div className="flex h-full flex-col w-64 shrink-0"
        style={{ background: 'linear-gradient(180deg,#091525 0%,#060D1A 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Company brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 px-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: `linear-gradient(135deg,${compColor},${compColor}bb)`, boxShadow: `0 4px 12px ${compColor}50` }}>
              {compInit}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px]"
              style={{ background: '#10B981', borderColor: '#091525' }} />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight truncate flex-1">
            {company || 'Dashboard'}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-semibold tracking-widest" style={{ color: '#10B981' }}>LIVE</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col px-3 py-3 gap-0.5 overflow-y-auto">

          {/* Back to all dashboards */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-2 transition-all hover:bg-white/[0.04]"
            style={{ color: '#475569' }}>
            <span style={{ fontSize: 10, letterSpacing: '0.05em' }}>← All Dashboards</span>
          </button>

          {/* Dashboard title */}
          <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-textMuted mb-2">
            {master?.title ?? '…'}
          </p>

          {/* Sub-dashboard pages */}
          {subDashboards.map((sub) => {
            const path     = `/view/${masterId}/${sub.id}`;
            const isActive = location.pathname === path;
            return (
              <Link key={sub.id} to={path}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative"
                style={isActive
                  ? { color: '#fff', background: `${accentRgb.replace(/[\d.]+\)$/, '0.1)')}`, boxShadow: `inset 0 0 0 1px ${accentRgb.replace(/[\d.]+\)$/, '0.18)')}` }
                  : { color: '#64748B' }}>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: `linear-gradient(180deg,${accentColor},${accentColor}88)` }} />
                )}
                <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-150"
                  style={isActive
                    ? { background: `${accentRgb.replace(/[\d.]+\)$/, '0.15)')}`, color: accentColor }
                    : { background: 'rgba(255,255,255,0.04)', color: '#475569' }}>
                  {sub.title.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] leading-tight">{sub.title}</span>
                  {sub.description && (
                    <span className="text-[11px] text-textMuted leading-tight mt-0.5 truncate">{sub.description}</span>
                  )}
                </div>
              </Link>
            );
          })}

          {subDashboards.length === 0 && (
            <div className="flex flex-col items-center py-8 gap-2">
              <LayoutGrid className="w-6 h-6 text-[#334155]" />
              <p className="text-xs text-[#334155] text-center">No pages yet</p>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3 p-2.5 rounded-xl"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
              style={{ background: `linear-gradient(135deg,${compColor},${compColor}99)` }}>
              {userInit}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-semibold text-textMain truncate">
                {user?.full_name || user?.email || 'User'}
              </span>
              <span className="text-[11px] text-textMuted truncate">{company || 'Client'}</span>
            </div>
            <button onClick={handleLogout}
              className="p-1.5 rounded-lg transition-all hover:bg-white/[0.08] shrink-0"
              style={{ color: '#475569' }} title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CustomDashboardLayout;
