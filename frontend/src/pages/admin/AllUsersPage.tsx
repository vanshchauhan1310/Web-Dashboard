import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Power, KeyRound, Trash2, Loader2, Eye, EyeOff, Building2 } from 'lucide-react';
import apiClient from '../../api/client';

interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  company: string | null;
  organisation_id: number | null;
  org_name: string | null;
  dashboards: string[];
  is_active: boolean;
  is_admin: boolean;
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#F1F5F9', padding: '9px 12px', fontSize: 13,
  width: '100%', outline: 'none',
};

const ResetPwModal: React.FC<{ email: string; onClose: () => void; onSave: (pw: string) => void; loading: boolean }> = ({ email, onClose, onSave, loading }) => {
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 }}>Reset Password</h2>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 18 }}>{email}</p>
        <div style={{ position: 'relative' }}>
          <input style={{ ...inputStyle, paddingRight: 36 }} type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} placeholder="New password" />
          <button type="button" onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
            {show ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748B', cursor: 'pointer' }}>Cancel</button>
          <button disabled={!pw || loading} onClick={() => onSave(pw)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: '#fff', cursor: 'pointer', opacity: (!pw || loading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

const AllUsersPage: React.FC = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-all-users'],
    queryFn: async () => (await apiClient.get('/admin/users')).data,
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => apiClient.patch(`/admin/users/${id}`, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-all-users'] }),
  });
  const resetPwMut = useMutation({
    mutationFn: ({ id, pw }: { id: number; pw: string }) => apiClient.post(`/admin/users/${id}/reset-password`, { new_password: pw }),
    onSuccess: () => setResetTarget(null),
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-all-users'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.org_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const clientUsers = filtered.filter(u => !u.is_admin);

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>All Users</h1>
        <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Global view of all client users across organisations</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#475569' }} />
        <input style={{ ...inputStyle, paddingLeft: 34 }} placeholder="Search by email, name, org…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 style={{ width: 28, height: 28, color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : clientUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <Users style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No users found</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Add users via Organisations → Select Org → Users tab</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(14,28,48,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 140px 100px 90px', gap: 0, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['User', 'Organisation', 'Dashboards', 'Status', 'Actions'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {clientUsers.map((u, i) => (
            <div key={u.id} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 140px 100px 90px',
              padding: '12px 16px', alignItems: 'center',
              borderBottom: i < clientUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              opacity: u.is_active ? 1 : 0.5,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{u.full_name || '—'}</p>
                <p style={{ fontSize: 11, color: '#64748B' }}>{u.email}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Building2 style={{ width: 12, height: 12, color: '#475569' }} />
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{u.org_name ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {u.dashboards.map(d => (
                  <span key={d} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#60A5FA', fontWeight: 600 }}>{d}</span>
                ))}
              </div>
              <div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                  background: u.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  border: u.is_active ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)',
                  color: u.is_active ? '#10B981' : '#EF4444',
                }}>{u.is_active ? 'Active' : 'Disabled'}</span>
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                <button title="Reset Password" onClick={() => setResetTarget(u)} style={iconBtnStyle}><KeyRound style={{ width: 12, height: 12 }} /></button>
                <button title={u.is_active ? 'Disable' : 'Enable'} onClick={() => toggleMut.mutate({ id: u.id, active: !u.is_active })} style={{ ...iconBtnStyle, color: u.is_active ? '#64748B' : '#10B981' }}><Power style={{ width: 12, height: 12 }} /></button>
                <button title="Delete" onClick={() => { if (confirm(`Delete ${u.email}?`)) deleteMut.mutate(u.id); }} style={{ ...iconBtnStyle, color: '#EF4444' }}><Trash2 style={{ width: 12, height: 12 }} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {resetTarget && (
        <ResetPwModal email={resetTarget.email} onClose={() => setResetTarget(null)} onSave={(pw) => resetPwMut.mutate({ id: resetTarget.id, pw })} loading={resetPwMut.isPending} />
      )}
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = { width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default AllUsersPage;
