import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Search, ChevronRight,
  Users, Database, MoreVertical, Power, Pencil, Trash2, Loader2,
} from 'lucide-react';
import apiClient from '../../api/client';

interface Org {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  dashboards: string;
  is_active: boolean;
  user_count: number;
  datasource_count: number;
}

const DASHBOARD_OPTS = [
  { key: 'sales', label: 'Sales' },
  { key: 'procurement', label: 'Procurement' },
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#F1F5F9',
  padding: '9px 12px', fontSize: 13,
  width: '100%', outline: 'none',
};

interface OrgModalProps {
  initial?: Org | null;
  onClose: () => void;
  onSave: (data: { name: string; dashboards: string; logo_url: string }) => void;
  loading: boolean;
}

const OrgModal: React.FC<OrgModalProps> = ({ initial, onClose, onSave, loading }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? '');
  const [selectedDash, setSelectedDash] = useState<string[]>(
    initial?.dashboards.split(',').map(s => s.trim()).filter(Boolean) ?? ['sales']
  );

  const toggleDash = (key: string) =>
    setSelectedDash(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: 440,
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>
          {initial ? 'Edit Organisation' : 'New Organisation'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Organisation Name *</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corp" />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Logo URL (optional)</label>
            <input style={inputStyle} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Dashboard Access</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DASHBOARD_OPTS.map(({ key, label }) => {
                const active = selectedDash.includes(key);
                return (
                  <button key={key} onClick={() => toggleDash(key)} style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: active ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                    background: active ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: active ? '#60A5FA' : '#64748B',
                    transition: 'all 0.15s',
                  }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: '#64748B', cursor: 'pointer',
          }}>Cancel</button>
          <button
            disabled={!name.trim() || loading}
            onClick={() => onSave({ name: name.trim(), dashboards: selectedDash.join(','), logo_url: logoUrl })}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
              border: 'none', color: '#fff', cursor: 'pointer',
              opacity: (!name.trim() || loading) ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            {initial ? 'Save Changes' : 'Create Organisation'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrganisationsPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const { data: orgs = [], isLoading } = useQuery<Org[]>({
    queryKey: ['admin-orgs'],
    queryFn: async () => (await apiClient.get('/admin/organisations')).data,
  });

  const createMut = useMutation({
    mutationFn: (body: object) => apiClient.post('/admin/organisations', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orgs'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); setShowModal(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) => apiClient.patch(`/admin/organisations/${id}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orgs'] }); setEditOrg(null); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiClient.patch(`/admin/organisations/${id}`, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orgs'] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/organisations/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orgs'] }); qc.invalidateQueries({ queryKey: ['admin-stats'] }); },
  });

  const filtered = orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F1F5F9' }}>Organisations</h1>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Manage client companies and their access</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
            border: 'none', color: '#fff', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
          }}
        >
          <Plus style={{ width: 15, height: 15 }} />
          New Organisation
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
        <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#475569' }} />
        <input
          style={{ ...inputStyle, paddingLeft: 34 }}
          placeholder="Search organisations…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Loader2 style={{ width: 28, height: 28, color: '#3B82F6', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
          <Building2 style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No organisations yet</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>Create your first organisation to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(org => (
            <div key={org.id} style={{
              background: 'rgba(14,28,48,0.9)',
              border: `1px solid ${org.is_active ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              opacity: org.is_active ? 1 : 0.5,
              position: 'relative',
            }}>
              {/* Logo / initials */}
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff',
              }}>
                {org.logo_url
                  ? <img src={org.logo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                  : org.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>{org.name}</span>
                  {!org.is_active && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
                    }}>DISABLED</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 5 }}>
                  <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users style={{ width: 12, height: 12 }} /> {org.user_count} users
                  </span>
                  <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Database style={{ width: 12, height: 12 }} /> {org.datasource_count} data sources
                  </span>
                  {org.dashboards.split(',').map(d => (
                    <span key={d} style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                      background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#60A5FA',
                    }}>{d.trim()}</span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => navigate(`/admin/orgs/${org.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                    color: '#60A5FA', cursor: 'pointer',
                  }}
                >
                  Manage <ChevronRight style={{ width: 12, height: 12 }} />
                </button>

                {/* Kebab menu */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === org.id ? null : org.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'transparent', color: '#64748B', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <MoreVertical style={{ width: 14, height: 14 }} />
                  </button>
                  {menuOpenId === org.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: 34, zIndex: 20,
                      background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10, padding: 6, minWidth: 160,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    }}>
                      <button onClick={() => { setEditOrg(org); setMenuOpenId(null); }} style={menuBtnStyle}>
                        <Pencil style={{ width: 13, height: 13 }} /> Edit
                      </button>
                      <button onClick={() => { toggleMut.mutate({ id: org.id, active: !org.is_active }); setMenuOpenId(null); }} style={menuBtnStyle}>
                        <Power style={{ width: 13, height: 13 }} /> {org.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${org.name}"? This cannot be undone.`)) {
                            deleteMut.mutate(org.id);
                          }
                          setMenuOpenId(null);
                        }}
                        style={{ ...menuBtnStyle, color: '#EF4444' }}
                      >
                        <Trash2 style={{ width: 13, height: 13 }} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <OrgModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}
      {editOrg && (
        <OrgModal
          initial={editOrg}
          onClose={() => setEditOrg(null)}
          onSave={(data) => updateMut.mutate({ id: editOrg.id, body: data })}
          loading={updateMut.isPending}
        />
      )}
    </div>
  );
};

const menuBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  width: '100%', padding: '7px 10px', borderRadius: 7,
  border: 'none', background: 'transparent',
  color: '#94A3B8', cursor: 'pointer', fontSize: 12, fontWeight: 500,
  textAlign: 'left',
};

export default OrganisationsPage;
