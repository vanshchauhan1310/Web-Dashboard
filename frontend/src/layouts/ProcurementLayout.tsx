import React, { useState, useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, RotateCcw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { MASTER_DASHBOARDS } from '../config/dashboards';
import {
  ProcurementFiltersProvider,
  useProcurementFilters,
  DEFAULT_FILTERS,
  type ProcurementFilters,
} from '../context/ProcurementFiltersContext';
import Topbar from './Topbar';

// ── Helpers ──────────────────────────────────────────────────────────────────

function companyColor(name: string): string {
  const palette = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function companyInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Filter config ─────────────────────────────────────────────────────────────

const FILTER_LABELS: Record<keyof ProcurementFilters, string> = {
  time_period: 'Time Period',
  category:    'Category',
  department:  'Department',
  view_by:     'View By',
  supplier:    'Vendor',
  tier:        'Supplier Tier',
  status:      'PO Status',
  abc_class:   'ABC Class',
};

const FILTER_OPTIONS: Record<keyof ProcurementFilters, string[]> = {
  time_period: ['All Time', 'This Year', 'Last Year', 'Last 6 Months', 'Last Quarter', 'This Month'],
  category:    ['All Categories', 'Raw Materials', 'Electronics', 'Furniture', 'Consumables', 'IT & Software', 'Logistics', 'Office Supplies'],
  department:  ['All Departments', 'Operations', 'IT', 'Finance', 'Marketing', 'HR', 'R&D', 'Legal'],
  view_by:     ['Monthly', 'Weekly'],
  supplier:    ['All Suppliers', 'SupplyCo Ltd', 'TechVend Inc', 'LogiPro', 'ConsultPro', 'PowerGrid Co', 'MarkMedia', 'OfficeBase'],
  tier:        ['All Tiers', 'Tier A — Preferred', 'Tier B — Approved', 'Tier C — Conditional'],
  status:      ['All Statuses', 'Pending', 'Approved', 'Rejected', 'Closed', 'Delivered'],
  abc_class:   ['All Classes', 'Class A — High Value', 'Class B — Medium Value', 'Class C — Low Value'],
};

// Which filters to show per sub-dashboard
const ROUTE_FILTERS: Record<string, (keyof ProcurementFilters)[]> = {
  spend:    ['time_period', 'category', 'department', 'view_by'],
  supplier: ['time_period', 'supplier', 'category', 'tier'],
  orders:   ['time_period', 'status', 'supplier', 'category', 'department'],
  inventory:['time_period', 'abc_class', 'category', 'department', 'view_by'],
};

// ── Filter Sidebar ────────────────────────────────────────────────────────────

const FilterSidebar: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();
  const { filters, setFilter, resetFilters } = useProcurementFilters();

  const company   = user?.company || '';
  const compColor = company ? companyColor(company) : '#10B981';
  const compInit  = company ? companyInitials(company) : 'NA';
  const userInit  = (user?.full_name ?? user?.email ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Show only filters relevant to the active sub-dashboard
  const activeRoute = location.pathname.split('/')[2] ?? 'spend';
  const filterKeys  = useMemo(
    () => ROUTE_FILTERS[activeRoute] ?? ['time_period', 'category'],
    [activeRoute],
  );
  const hasChanges  = filterKeys.some(k => filters[k] !== DEFAULT_FILTERS[k]);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex h-full flex-col w-72 shrink-0"
      style={{ background: 'linear-gradient(180deg,#091525 0%,#060D1A 100%)', borderRight: '1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Company header ── */}
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

      {/* ── Filters ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#475569' }}>
            Filters
          </p>
          {hasChanges && (
            <button onClick={resetFilters}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-all hover:bg-white/[0.06]"
              style={{ color: '#10B981' }}>
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {filterKeys.map(key => (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold" style={{ color: '#64748B' }}>
              {FILTER_LABELS[key]}
            </label>
            <div className="relative">
              <select
                value={filters[key]}
                onChange={e => setFilter(key, e.target.value)}
                className="w-full text-[12px] font-medium rounded-xl px-3 py-2.5 appearance-none outline-none transition-all pr-8"
                style={{
                  background: filters[key] !== DEFAULT_FILTERS[key] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                  border:     filters[key] !== DEFAULT_FILTERS[key] ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.09)',
                  color:   '#E2E8F0',
                  cursor:  'pointer',
                }}>
                {FILTER_OPTIONS[key].map(opt => (
                  <option key={opt} value={opt} style={{ background: '#0D1B2E' }}>{opt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        ))}

        {/* Active filter chips */}
        {hasChanges && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {filterKeys.filter(k => filters[k] !== DEFAULT_FILTERS[k]).map(k => (
              <span key={k}
                className="text-[10px] font-medium px-2.5 py-1 rounded-full cursor-pointer"
                onClick={() => setFilter(k, DEFAULT_FILTERS[k])}
                style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', border: '1px solid rgba(16,185,129,0.2)' }}>
                {filters[k]} ×
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── User footer ── */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
            style={{ background: `linear-gradient(135deg,${compColor},${compColor}99)` }}>
            {userInit}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-textMain truncate">{user?.full_name || user?.email || 'User'}</span>
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
  );
};

// ── Tab Navigation ────────────────────────────────────────────────────────────

const TAB_ROUTES = MASTER_DASHBOARDS['procurement']?.subRoutes ?? [];

const TabNavigation: React.FC = () => (
  <div className="flex items-center gap-0 px-4 shrink-0"
    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,13,26,0.6)' }}>
    {TAB_ROUTES.map(route => {
      const Icon = route.icon;
      return (
        <NavLink key={route.path} to={route.path}
          className="relative flex items-center gap-2 px-4 py-3 text-[12px] font-medium transition-all whitespace-nowrap"
          style={({ isActive }) => ({ color: isActive ? '#fff' : '#64748B' })}>
          {({ isActive }) => (
            <>
              <Icon className="w-3.5 h-3.5" />
              <span>{route.name}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }} />
              )}
            </>
          )}
        </NavLink>
      );
    })}
  </div>
);

// ── Layout inner ──────────────────────────────────────────────────────────────

const ProcurementLayoutInner: React.FC = () => {
  const queryClient    = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-textMain font-sans">
      <FilterSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onRefresh={handleRefresh} isRefreshing={isRefreshing} />
        <TabNavigation />
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ── Exported layout ───────────────────────────────────────────────────────────

const ProcurementLayout: React.FC = () => (
  <ProcurementFiltersProvider>
    <ProcurementLayoutInner />
  </ProcurementFiltersProvider>
);

export default ProcurementLayout;
