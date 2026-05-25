import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, LogOut, ArrowRight,
  Shield, Sparkles, Activity,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { MASTER_DASHBOARDS } from '../config/dashboards';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function companyColor(name: string): string {
  const palette = ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function companyInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

const DashboardSelector: React.FC = () => {
  const navigate   = useNavigate();
  const { user, logout } = useAuthStore();

  const allowedKeys: string[] = user?.dashboards ?? [];
  const available = allowedKeys.map(k => MASTER_DASHBOARDS[k]).filter(Boolean);

  const firstName  = user?.full_name?.split(' ')[0] || 'there';
  const company    = user?.company || '';
  const compColor  = useMemo(() => company ? companyColor(company) : '#3B82F6', [company]);
  const compInit   = useMemo(() => company ? companyInitials(company) : '?', [company]);
  const userInit   = (user?.full_name ?? user?.email ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse-ring { 0%,100% { transform:scale(1); opacity:.5; } 50% { transform:scale(1.15); opacity:.15; } }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.08);} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-20px,30px) scale(1.06);} }
        @keyframes orb3 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(15px,25px) scale(1.05);} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .card-hover { transition: transform 0.3s cubic-bezier(.22,.68,0,1.2), box-shadow 0.3s ease, border-color 0.3s ease; }
        .card-hover:hover { transform: translateY(-6px); }
      `}</style>

      <div className="min-h-screen flex flex-col relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, #0D1E36 0%, #060D1A 45%, #060C18 100%)' }}>

        {/* ── Ambient orbs ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{ position:'absolute', top:'8%', left:'12%', width:600, height:600, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            animation:'orb1 18s ease-in-out infinite', filter:'blur(1px)' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'8%', width:500, height:500, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
            animation:'orb2 22s ease-in-out infinite', filter:'blur(1px)' }} />
          <div style={{ position:'absolute', top:'50%', right:'25%', width:300, height:300, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)',
            animation:'orb3 14s ease-in-out infinite' }} />
          {/* Grid overlay */}
          <div style={{ position:'absolute', inset:0, opacity:0.025,
            backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize:'60px 60px' }} />
          {/* Top accent line */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
            background:'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.6) 30%, rgba(139,92,246,0.6) 70%, transparent 100%)' }} />
        </div>

        {/* ── Topbar ── */}
        <header className="relative flex items-center justify-between px-8 shrink-0"
          style={{ height:64, borderBottom:'1px solid rgba(255,255,255,0.06)',
            background:'rgba(6,13,26,0.7)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
            animation:'fadeIn .4s ease both' }}>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', boxShadow:'0 4px 14px rgba(59,130,246,0.4)' }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-[15px] font-bold text-white tracking-tight">Nexus</span>
                <span className="text-[15px] font-bold tracking-tight"
                  style={{ background:'linear-gradient(135deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  {' '}Analytics
                </span>
              </div>
              <div className="text-[10px] tracking-widest font-semibold" style={{ color:'#334155' }}>ENTERPRISE PLATFORM</div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', color:'#10B981' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live data
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[13px] font-semibold text-white leading-tight">{user?.full_name || user?.email}</p>
              <p className="text-[11px] leading-tight" style={{ color:'#475569' }}>{company}</p>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
              style={{ background:`linear-gradient(135deg,${compColor},${compColor}99)`, boxShadow:`0 4px 12px ${compColor}50` }}>
              {userInit}
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-lg transition-all"
              style={{ color:'#475569', border:'1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => (e.currentTarget.style.color='#94A3B8')}
              onMouseLeave={e => (e.currentTarget.style.color='#475569')}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </header>

        {/* ── Body ── */}
        <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-16">

          {/* ── Hero ── */}
          <div className="text-center mb-14" style={{ animation:'fadeUp .5s ease .1s both' }}>
            {/* Company badge */}
            {company && (
              <div className="inline-flex items-center gap-2.5 mb-6 px-4 py-2 rounded-full"
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
                  backdropFilter:'blur(10px)' }}>
                <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black text-white"
                  style={{ background:`linear-gradient(135deg,${compColor},${compColor}bb)` }}>
                  {compInit}
                </div>
                <span className="text-[12px] font-semibold" style={{ color:'#94A3B8' }}>{company}</span>
                <Shield className="w-3 h-3" style={{ color:compColor }} />
              </div>
            )}

            <h1 className="font-black tracking-tight leading-none mb-4"
              style={{ fontSize:'clamp(2.4rem,5vw,3.8rem)',
                background:'linear-gradient(135deg,#FFFFFF 0%,rgba(255,255,255,0.75) 100%)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              {timeGreeting()}, {firstName}
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color:'#475569' }}>
              Your analytics workspace is ready. Select a dashboard to continue.
            </p>
          </div>

          {/* ── Cards ── */}
          {available.length === 0 ? (
            <div className="text-center py-16" style={{ color:'#334155', animation:'fadeUp .5s ease .2s both' }}>
              <Sparkles className="w-10 h-10 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold mb-1">No dashboards assigned</p>
              <p className="text-sm">Contact your administrator to get access.</p>
            </div>
          ) : (
            <div className="w-full max-w-3xl flex flex-col gap-5">
              {available.map((dashboard, idx) => {
                const Icon = dashboard.icon;
                return (
                  <button key={dashboard.key} onClick={() => navigate(dashboard.defaultPath)}
                    className="card-hover text-left w-full relative overflow-hidden rounded-2xl"
                    style={{ animation:`fadeUp .5s ease ${0.2 + idx * 0.1}s both`,
                      background:'linear-gradient(135deg,rgba(14,28,48,0.95),rgba(10,20,38,0.98))',
                      border:'1px solid rgba(255,255,255,0.08)',
                      boxShadow:'0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${dashboard.gradient.includes('#3B82F6') ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}, inset 0 1px 0 rgba(255,255,255,0.08)`;
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    }}>

                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-px"
                      style={{ background:`linear-gradient(90deg,transparent 0%,${dashboard.gradient.match(/#[A-Fa-f0-9]{6}/g)?.[0] ?? '#3B82F6'}80 40%,${dashboard.gradient.match(/#[A-Fa-f0-9]{6}/g)?.[1] ?? '#8B5CF6'}80 60%,transparent 100%)` }} />

                    {/* Background glow on hover (via pseudo-like absolutely placed div) */}
                    <div className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
                      style={{ background:`radial-gradient(ellipse at 20% 50%, ${dashboard.glow.replace('0.35','0.06')} 0%, transparent 60%)` }} />

                    <div className="relative flex items-center gap-7 p-7">
                      {/* Icon block */}
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
                          style={{ background:dashboard.gradient, boxShadow:`0 8px 28px ${dashboard.glow}` }}>
                          <Icon className="w-7 h-7 text-white" />
                          <div className="absolute inset-0 rounded-2xl"
                            style={{ background:'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,transparent 60%)' }} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h2 className="text-[20px] font-bold text-white leading-tight">{dashboard.title}</h2>
                          <div className="flex items-center gap-1.5 shrink-0 text-[12px] font-semibold mt-0.5 transition-all duration-200"
                            style={{ color: dashboard.gradient.match(/#[A-Fa-f0-9]{6}/g)?.[0] ?? '#3B82F6' }}>
                            Enter <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <p className="text-[13px] leading-relaxed mb-4" style={{ color:'#64748B' }}>
                          {dashboard.description}
                        </p>

                        {/* Sub-routes with icons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dashboard.subRoutes.map(s => {
                            const RouteIcon = s.icon;
                            return (
                              <span key={s.path}
                                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg"
                                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)', color:'#94A3B8' }}>
                                <RouteIcon className="w-3 h-3 opacity-70" />
                                {s.name}
                              </span>
                            );
                          })}
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-5" style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:14 }}>
                          <div className="flex items-center gap-1.5 text-[11px]" style={{ color:'#334155' }}>
                            <Activity className="w-3 h-3" style={{ color:'#10B981' }} />
                            <span style={{ color:'#475569' }}>{dashboard.stats}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px]" style={{ color:'#334155' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            <span style={{ color:'#475569' }}>Connected · Updated now</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="relative text-center pb-8 pt-2" style={{ animation:'fadeIn .6s ease .4s both' }}>
          <p className="text-[11px]" style={{ color:'#1E293B' }}>
            Nexus Analytics Platform &nbsp;·&nbsp; Enterprise Edition &nbsp;·&nbsp; &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </>
  );
};

export default DashboardSelector;
