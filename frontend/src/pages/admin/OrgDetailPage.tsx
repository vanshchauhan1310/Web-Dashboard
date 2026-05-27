import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Users, Database, Plus, Loader2,
  CheckCircle2, XCircle, Clock, Power, KeyRound,
  Trash2, Wifi, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import apiClient from '../../api/client';

interface Org { id: number; name: string; dashboards: string; is_active: boolean; user_count: number; datasource_count: number; }
interface OrgUser { id: number; email: string; full_name: string | null; dashboards: string[]; is_active: boolean; }
interface DS {
  id: number; organisation_id: number; name: string; db_type: string;
  host: string | null; port: number | null; database_name: string | null;
  username: string | null; ssl_enabled: boolean; is_active: boolean;
  is_default: boolean; datasource_key: string | null; status: string; last_tested_at: string | null;
}

const DB_TYPES = [
  { key: 'postgres',  label: 'PostgreSQL', color: '#336791' },
  { key: 'mysql',     label: 'MySQL',      color: '#F29111' },
  { key: 'mssql',     label: 'SQL Server', color: '#CC2927' },
  { key: 'redshift',  label: 'Redshift',   color: '#8C4FFF' },
  { key: 'bigquery',  label: 'BigQuery',   color: '#4285F4' },
  { key: 'snowflake', label: 'Snowflake',  color: '#29B5E8' },
  { key: 'sqlite',    label: 'SQLite',     color: '#44B78B' },
];

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, color: '#F1F5F9', padding: '9px 12px', fontSize: 13,
  width: '100%', outline: 'none',
};

const DASH_OPTS = ['sales', 'procurement'];

// ─── Add User Modal ───────────────────────────────────────────────────────────
const AddUserModal: React.FC<{
  orgId: number; orgDashboards: string;
  onClose: () => void;
  onSave: (d: object) => void;
  loading: boolean;
}> = ({ orgId: _orgId, orgDashboards, onClose, onSave, loading }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [dashes, setDashes] = useState<string[]>(
    orgDashboards.split(',').map(s => s.trim()).filter(Boolean)
  );

  const toggle = (k: string) => setDashes(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>Add User</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div><label style={labelStyle}>Email *</label><input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.com" /></div>
          <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
          <div>
            <label style={labelStyle}>Temporary Password *</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 36 }} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Dashboard Access</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DASH_OPTS.map(k => {
                const on = dashes.includes(k);
                return (
                  <button key={k} onClick={() => toggle(k)} style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: on ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
                    background: on ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: on ? '#60A5FA' : '#64748B',
                  }}>{k}</button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            disabled={!email.trim() || !password.trim() || loading}
            onClick={() => onSave({ email: email.trim(), full_name: name, password, dashboards: dashes })}
            style={{ ...saveBtnStyle, opacity: (!email || !password || loading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            Add User
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Reset Password Modal ─────────────────────────────────────────────────────
const ResetPwModal: React.FC<{ userId: number; email: string; onClose: () => void; onSave: (pw: string) => void; loading: boolean }> = ({ email, onClose, onSave, loading }) => {
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
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button disabled={!pw || loading} onClick={() => onSave(pw)} style={{ ...saveBtnStyle, opacity: (!pw || loading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Parse a postgres/mysql connection URL into parts ─────────────────────────
function parseConnStr(raw: string): { dbType: string; host: string; port: string; dbName: string; username: string; password: string; ssl: boolean } | null {
  try {
    const trimmed = raw.trim();
    // Replace scheme+driver e.g. postgresql+asyncpg:// → postgresql://
    const normalised = trimmed.replace(/^([a-z]+)\+[a-z]+:\/\//, '$1://');
    const url = new URL(normalised);
    const scheme = url.protocol.replace(':', '').toLowerCase();
    const typeMap: Record<string, string> = {
      postgresql: 'postgres', postgres: 'postgres',
      mysql: 'mysql', mssql: 'mssql', redshift: 'redshift',
    };
    const dbType = typeMap[scheme] ?? 'postgres';
    const host = url.hostname;
    const port = url.port || (dbType === 'mysql' ? '3306' : '5432');
    const dbName = url.pathname.replace(/^\//, '');
    const username = decodeURIComponent(url.username);
    const password = decodeURIComponent(url.password);
    const ssl = url.searchParams.get('sslmode') !== 'disable';
    return { dbType, host, port, dbName, username, password, ssl };
  } catch {
    return null;
  }
}

// ─── Add Data Source Modal ────────────────────────────────────────────────────
const AddDSModal: React.FC<{ initial?: DS | null; onClose: () => void; onSave: (d: object) => void; loading: boolean }> = ({ initial, onClose, onSave, loading }) => {
  const [dbType, setDbType] = useState(initial?.db_type ?? 'postgres');
  const [name, setName] = useState(initial?.name ?? '');
  const [host, setHost] = useState(initial?.host ?? '');
  const [port, setPort] = useState(String(initial?.port ?? '5432'));
  const [dbName, setDbName] = useState(initial?.database_name ?? '');
  const [username, setUsername] = useState(initial?.username ?? '');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(initial?.ssl_enabled ?? false);
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false);
  const [dsKey, setDsKey] = useState(initial?.datasource_key ?? '');
  const [showPw, setShowPw] = useState(false);
  const [connStr, setConnStr] = useState('');
  const [parseErr, setParseErr] = useState('');

  const handleParse = () => {
    if (!connStr.trim()) return;
    const parsed = parseConnStr(connStr.trim());
    if (!parsed) { setParseErr('Could not parse — check the URL format.'); return; }
    setParseErr('');
    setDbType(parsed.dbType);
    setHost(parsed.host);
    setPort(parsed.port);
    setDbName(parsed.dbName);
    setUsername(parsed.username);
    if (parsed.password) setPassword(parsed.password);
    setSsl(parsed.ssl);
    setConnStr('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, margin: 'auto' }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', marginBottom: 20 }}>
          {initial ? 'Edit Data Source' : 'Connect Database'}
        </h2>

        {/* Paste connection string */}
        {!initial && (
          <div style={{ marginBottom: 18, padding: '12px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)' }}>
            <label style={{ ...labelStyle, color: '#93C5FD' }}>Paste Connection String (optional)</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                style={{ ...inputStyle, flex: 1, fontSize: 12 }}
                value={connStr}
                onChange={e => { setConnStr(e.target.value); setParseErr(''); }}
                placeholder="postgresql://user:pass@host:5432/dbname"
              />
              <button onClick={handleParse} style={{ padding: '8px 14px', borderRadius: 8, background: '#3B82F6', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Auto-fill
              </button>
            </div>
            {parseErr && <p style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{parseErr}</p>}
          </div>
        )}

        {/* DB Type picker */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Database Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DB_TYPES.map(({ key, label, color }) => (
              <button key={key} onClick={() => setDbType(key)} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: dbType === key ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
                background: dbType === key ? `${color}18` : 'rgba(255,255,255,0.03)',
                color: dbType === key ? color : '#64748B',
              }}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={labelStyle}>Display Name *</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Production DB" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10 }}>
            <div><label style={labelStyle}>Host</label><input style={inputStyle} value={host} onChange={e => setHost(e.target.value)} placeholder="db.company.com" /></div>
            <div><label style={labelStyle}>Port</label><input style={inputStyle} value={port} onChange={e => setPort(e.target.value)} placeholder="5432" /></div>
          </div>
          <div><label style={labelStyle}>Database Name</label><input style={inputStyle} value={dbName} onChange={e => setDbName(e.target.value)} placeholder="my_database" /></div>
          <div><label style={labelStyle}>Username</label><input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="readonly_user" /></div>
          <div>
            <label style={labelStyle}>
              Datasource Key{' '}
              <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — must match <code style={{ fontFamily: 'monospace', color: '#60A5FA' }}>requiredDatasourceKey</code> in dashboards.ts
              </span>
            </label>
            <input style={inputStyle} value={dsKey} onChange={e => setDsKey(e.target.value)} placeholder="e.g. sales_db or procurement_db" />
          </div>
          <div>
            <label style={labelStyle}>Password {initial ? '(leave blank to keep existing)' : ''}</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inputStyle, paddingRight: 36 }} type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                {showPw ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#94A3B8' }}>
              <input type="checkbox" checked={ssl} onChange={e => setSsl(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#3B82F6' }} />
              Enable SSL
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#94A3B8' }}>
              <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} style={{ width: 14, height: 14, accentColor: '#3B82F6' }} />
              Set as default
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
          <button
            disabled={!name.trim() || loading}
            onClick={() => onSave({ name, db_type: dbType, host, port: Number(port) || null, database_name: dbName, username, password: password || undefined, ssl_enabled: ssl, is_default: isDefault, datasource_key: dsKey || null })}
            style={{ ...saveBtnStyle, opacity: (!name || loading) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            {initial ? 'Save Changes' : 'Add Data Source'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const OrgDetailPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = Number(orgId);

  const [tab, setTab] = useState<'users' | 'datasources'>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddDS, setShowAddDS] = useState(false);
  const [editDS, setEditDS] = useState<DS | null>(null);
  const [resetPwUser, setResetPwUser] = useState<OrgUser | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  const { data: org } = useQuery<Org>({ queryKey: ['admin-org', id], queryFn: async () => (await apiClient.get(`/admin/organisations/${id}`)).data });
  const { data: users = [] } = useQuery<OrgUser[]>({ queryKey: ['admin-org-users', id], queryFn: async () => (await apiClient.get(`/admin/organisations/${id}/users`)).data });
  const { data: datasources = [] } = useQuery<DS[]>({ queryKey: ['admin-org-ds', id], queryFn: async () => (await apiClient.get(`/admin/organisations/${id}/datasources`)).data });

  const addUserMut = useMutation({ mutationFn: (b: object) => apiClient.post(`/admin/organisations/${id}/users`, b), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org-users', id] }); qc.invalidateQueries({ queryKey: ['admin-orgs'] }); setShowAddUser(false); } });
  const toggleUserMut = useMutation({ mutationFn: ({ uid, active }: { uid: number; active: boolean }) => apiClient.patch(`/admin/users/${uid}`, { is_active: active }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-org-users', id] }) });
  const resetPwMut = useMutation({ mutationFn: ({ uid, pw }: { uid: number; pw: string }) => apiClient.post(`/admin/users/${uid}/reset-password`, { new_password: pw }), onSuccess: () => setResetPwUser(null) });
  const deleteUserMut = useMutation({ mutationFn: (uid: number) => apiClient.delete(`/admin/users/${uid}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org-users', id] }); qc.invalidateQueries({ queryKey: ['admin-orgs'] }); } });

  const addDSMut = useMutation({ mutationFn: (b: object) => apiClient.post(`/admin/organisations/${id}/datasources`, b), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }); qc.invalidateQueries({ queryKey: ['admin-orgs'] }); setShowAddDS(false); } });
  const updateDSMut = useMutation({ mutationFn: ({ dsId, b }: { dsId: number; b: object }) => apiClient.patch(`/admin/organisations/${id}/datasources/${dsId}`, b), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }); setEditDS(null); } });
  const deleteDSMut = useMutation({ mutationFn: (dsId: number) => apiClient.delete(`/admin/organisations/${id}/datasources/${dsId}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }); qc.invalidateQueries({ queryKey: ['admin-orgs'] }); } });
  const setActiveDSMut = useMutation({
    mutationFn: (dsId: number) => apiClient.post(`/admin/organisations/${id}/datasources/${dsId}/set-active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }),
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to activate'),
  });
  const setInactiveDSMut = useMutation({
    mutationFn: (dsId: number) => apiClient.post(`/admin/organisations/${id}/datasources/${dsId}/set-inactive`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }),
    onError: (err: any) => alert(err?.response?.data?.detail ?? 'Failed to deactivate'),
  });

  const testDSMut = useMutation({
    mutationFn: (dsId: number) => apiClient.post(`/admin/organisations/${id}/datasources/${dsId}/test`),
    onMutate: (dsId) => setTestingId(dsId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-org-ds', id] }),
    onError: (err: any) => {
      const detail: string = err?.response?.data?.detail ?? 'Connection failed';
      let hint = '';
      if (detail.includes('getaddrinfo') || detail.includes('11001') || detail.includes('Name or service not known')) {
        hint = '\n\nHint: DNS lookup failed for the host.\n  • Check if your Supabase project is paused (supabase.com → restore it)\n  • Verify the Host field contains only the hostname, e.g.:\n    db.xxxxxxxxxxxx.supabase.co\n  • Do NOT paste the full connection URL into the Host field';
      } else if (detail.includes('password') || detail.includes('authentication')) {
        hint = '\n\nHint: Wrong username or password.';
      } else if (detail.includes('SSL') || detail.includes('ssl')) {
        hint = '\n\nHint: Try toggling the "Enable SSL" option.';
      }
      alert(`Connection failed:\n\n${detail}${hint}`);
      qc.invalidateQueries({ queryKey: ['admin-org-ds', id] });
    },
    onSettled: () => setTestingId(null),
  });

  const statusIcon = (status: string, testing: boolean) => {
    if (testing) return <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite', color: '#F59E0B' }} />;
    if (status === 'connected') return <CheckCircle2 style={{ width: 14, height: 14, color: '#10B981' }} />;
    if (status === 'failed') return <XCircle style={{ width: 14, height: 14, color: '#EF4444' }} />;
    return <Clock style={{ width: 14, height: 14, color: '#64748B' }} />;
  };

  return (
    <div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/admin/orgs')} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F1F5F9' }}>{org?.name ?? '…'}</h1>
          <p style={{ fontSize: 12, color: '#475569' }}>{users.length} users · {datasources.length} data sources</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['users', 'datasources'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            background: tab === t ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: tab === t ? '#60A5FA' : '#64748B',
          }}>
            {t === 'users' ? <Users style={{ width: 14, height: 14 }} /> : <Database style={{ width: 14, height: 14 }} />}
            {t === 'users' ? 'Users' : 'Data Sources'}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => setShowAddUser(true)} style={{ ...saveBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} /> Add User
            </button>
          </div>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <Users style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No users in this organisation</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {users.map(u => (
                <div key={u.id} style={{
                  background: 'rgba(14,28,48,0.9)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  opacity: u.is_active ? 1 : 0.5,
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{u.full_name || '—'}</p>
                    <p style={{ fontSize: 11, color: '#64748B' }}>{u.email}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {u.dashboards.map(d => (
                      <span key={d} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#60A5FA', fontWeight: 600 }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button title="Reset Password" onClick={() => setResetPwUser(u)} style={iconBtnStyle}><KeyRound style={{ width: 13, height: 13 }} /></button>
                    <button title={u.is_active ? 'Disable' : 'Enable'} onClick={() => toggleUserMut.mutate({ uid: u.id, active: !u.is_active })} style={{ ...iconBtnStyle, color: u.is_active ? '#64748B' : '#10B981' }}><Power style={{ width: 13, height: 13 }} /></button>
                    <button title="Delete" onClick={() => { if (confirm(`Delete ${u.email}?`)) deleteUserMut.mutate(u.id); }} style={{ ...iconBtnStyle, color: '#EF4444' }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Data Sources Tab ── */}
      {tab === 'datasources' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
            <button onClick={() => setShowAddDS(true)} style={{ ...saveBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus style={{ width: 14, height: 14 }} /> Add Data Source
            </button>
          </div>
          {datasources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#334155' }}>
              <Database style={{ width: 36, height: 36, margin: '0 auto 10px', opacity: 0.3 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No data sources connected</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Add a database connection for this organisation</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {datasources.map(ds => {
                const typeInfo = DB_TYPES.find(t => t.key === ds.db_type);
                const testing = testingId === ds.id;
                return (
                  <div key={ds.id} style={{
                    background: ds.is_active ? 'rgba(16,185,129,0.05)' : 'rgba(14,28,48,0.9)',
                    border: ds.is_active ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10, padding: '14px 16px',
                    display: 'flex', alignItems: 'center', gap: 14,
                    opacity: ds.is_active ? 1 : 0.65,
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: `${typeInfo?.color ?? '#3B82F6'}18`, border: `1px solid ${typeInfo?.color ?? '#3B82F6'}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Database style={{ width: 16, height: 16, color: typeInfo?.color ?? '#3B82F6' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{ds.name}</span>
                        {ds.is_active && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 700 }}>
                            ACTIVE
                          </span>
                        )}
                        {ds.is_default && ds.is_active && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#60A5FA', fontWeight: 700 }}>
                            DEFAULT
                          </span>
                        )}
                        {ds.datasource_key && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#A78BFA', fontWeight: 600, fontFamily: 'monospace' }}>
                            {ds.datasource_key}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{typeInfo?.label} · {ds.host}:{ds.port} / {ds.database_name}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {statusIcon(ds.status, testing)}
                      <span style={{ fontSize: 11, color: ds.status === 'connected' ? '#10B981' : ds.status === 'failed' ? '#EF4444' : '#64748B' }}>
                        {testing ? 'Testing…' : ds.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!ds.is_active ? (
                        <button
                          title="Activate this datasource"
                          onClick={() => setActiveDSMut.mutate(ds.id)}
                          disabled={setActiveDSMut.isPending}
                          style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          title="Deactivate this datasource"
                          onClick={() => setInactiveDSMut.mutate(ds.id)}
                          disabled={setInactiveDSMut.isPending}
                          style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#F87171', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Deactivate
                        </button>
                      )}
                      <button title="Test Connection" onClick={() => testDSMut.mutate(ds.id)} style={iconBtnStyle} disabled={testing}><Wifi style={{ width: 13, height: 13 }} /></button>
                      <button title="Edit" onClick={() => setEditDS(ds)} style={iconBtnStyle}><RefreshCw style={{ width: 13, height: 13 }} /></button>
                      <button title="Delete" onClick={() => { if (confirm(`Delete "${ds.name}"?`)) deleteDSMut.mutate(ds.id); }} style={{ ...iconBtnStyle, color: '#EF4444' }}><Trash2 style={{ width: 13, height: 13 }} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showAddUser && org && <AddUserModal orgId={id} orgDashboards={org.dashboards} onClose={() => setShowAddUser(false)} onSave={(d) => addUserMut.mutate(d)} loading={addUserMut.isPending} />}
      {showAddDS && <AddDSModal onClose={() => setShowAddDS(false)} onSave={(d) => addDSMut.mutate(d)} loading={addDSMut.isPending} />}
      {editDS && <AddDSModal initial={editDS} onClose={() => setEditDS(null)} onSave={(d) => updateDSMut.mutate({ dsId: editDS.id, b: d })} loading={updateDSMut.isPending} />}
      {resetPwUser && <ResetPwModal userId={resetPwUser.id} email={resetPwUser.email} onClose={() => setResetPwUser(null)} onSave={(pw) => resetPwMut.mutate({ uid: resetPwUser.id, pw })} loading={resetPwMut.isPending} />}
    </div>
  );
};

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 };
const cancelBtnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748B', cursor: 'pointer' };
const saveBtnStyle: React.CSSProperties = { padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', color: '#fff', cursor: 'pointer' };
const iconBtnStyle: React.CSSProperties = { width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default OrgDetailPage;
