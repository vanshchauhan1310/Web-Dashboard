import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Users,
  LogOut, ChevronLeft, ChevronRight, Shield,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const NAV = [
  { to: '/admin',          icon: LayoutDashboard, label: 'Overview',      end: true },
  { to: '/admin/orgs',     icon: Building2,        label: 'Organisations'            },
  { to: '/admin/users',    icon: Users,            label: 'All Users'                },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#060D1A', color: '#E2E8F0' }}>

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? 64 : 220,
          transition: 'width 0.22s ease',
          background: 'rgba(8,18,34,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 10, overflow: 'hidden',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield style={{ width: 16, height: 16, color: '#fff' }} />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2, whiteSpace: 'nowrap' }}>Admin Portal</p>
              <p style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>Aion Tech</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 12px' : '9px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13, fontWeight: 500,
                color: isActive ? '#F1F5F9' : '#64748B',
                background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                transition: 'all 0.15s',
                overflow: 'hidden', whiteSpace: 'nowrap',
              })}
            >
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* User + Collapse */}
        <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {!collapsed && (
            <div style={{
              padding: '8px 10px', borderRadius: 8, marginBottom: 6,
              background: 'rgba(255,255,255,0.03)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.email}
              </p>
              <p style={{ fontSize: 10, color: '#334155' }}>Super Admin</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: collapsed ? '8px 12px' : '8px 10px',
              borderRadius: 8, border: 'none', background: 'transparent',
              color: '#475569', cursor: 'pointer', fontSize: 12,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            <LogOut style={{ width: 14, height: 14, flexShrink: 0 }} />
            {!collapsed && 'Sign out'}
          </button>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.03)', color: '#334155', cursor: 'pointer',
              transition: 'color 0.15s', marginTop: 2,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            {collapsed
              ? <ChevronRight style={{ width: 14, height: 14 }} />
              : <ChevronLeft style={{ width: 14, height: 14 }} />
            }
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(6,13,26,0.8)', backdropFilter: 'blur(12px)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
            }}>
              ADMIN
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#334155' }}>
            {user?.email}
          </div>
        </header>
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
