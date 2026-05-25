import { LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { MASTER_DASHBOARDS } from '../config/dashboards';

function companyColor(name: string): string {
  const palette = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function companyInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const Sidebar = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();

  const company   = user?.company || '';
  const compColor = company ? companyColor(company) : '#3B82F6';
  const compInit  = company ? companyInitials(company) : 'NA';

  const userInitials = (user?.full_name ?? user?.email ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  // Derive active master dashboard from URL prefix (e.g. /sales/executive → 'sales')
  const prefix          = location.pathname.split('/')[1];
  const activeDashboard = MASTER_DASHBOARDS[prefix];
  const navItems        = activeDashboard?.subRoutes ?? [];
  const dashTitle       = activeDashboard?.title ?? 'Dashboard';

  // Active indicator color from the dashboard's gradient first color
  const accentColor = activeDashboard?.gradient.match(/#[A-Fa-f0-9]{6}/g)?.[0] ?? '#3B82F6';
  const accentRgb   = activeDashboard?.glow ?? 'rgba(59,130,246,0.35)';

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex h-full flex-col w-64 shrink-0"
      style={{ background:'linear-gradient(180deg,#091525 0%,#060D1A 100%)', borderRight:'1px solid rgba(255,255,255,0.07)' }}>

      {/* ── Company brand (dynamic per client) ── */}
      <div className="flex h-14 shrink-0 items-center gap-3 px-4"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white"
            style={{ background:`linear-gradient(135deg,${compColor},${compColor}bb)`,
              boxShadow:`0 4px 12px ${compColor}50` }}>
            {compInit}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-[1.5px]"
            style={{ background:'#10B981', borderColor:'#091525' }} />
        </div>

        <span className="text-[15px] font-bold text-white tracking-tight truncate flex-1">
          {company || 'Dashboard'}
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-semibold tracking-widest" style={{ color:'#10B981' }}>LIVE</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col px-3 py-2 gap-0.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-textMuted mb-2 mt-2">
          {dashTitle}
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              className={clsx(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 relative',
                isActive ? 'text-white' : 'text-textMuted hover:text-textSub hover:bg-white/[0.04]'
              )}
              style={isActive ? {
                background: `${accentRgb.replace('0.35','0.1')}`,
                boxShadow: `inset 0 0 0 1px ${accentRgb.replace('0.35','0.18')}`,
              } : undefined}>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ background:`linear-gradient(180deg,${accentColor},${accentColor}88)` }} />
              )}
              <div className={clsx(
                  'w-8 h-8 rounded-md flex items-center justify-center shrink-0 transition-all duration-150',
                  isActive ? '' : 'text-textMuted group-hover:text-textSub'
                )}
                style={isActive
                  ? { background:`${accentRgb.replace('0.35','0.15')}`, color: accentColor }
                  : { background:'rgba(255,255,255,0.04)' }}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] leading-tight">{item.name}</span>
                <span className="text-[11px] text-textMuted leading-tight mt-0.5">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* ── User footer ── */}
      <div className="p-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ border:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
            style={{ background:`linear-gradient(135deg,${compColor},${compColor}99)` }}>
            {userInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-textMain truncate">
              {user?.full_name || user?.email || 'User'}
            </span>
            <span className="text-[11px] text-textMuted truncate">{company || 'Client'}</span>
          </div>
          <button onClick={handleLogout}
            className="p-1.5 rounded-lg transition-all hover:bg-white/[0.08] shrink-0"
            style={{ color:'#475569' }} title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
