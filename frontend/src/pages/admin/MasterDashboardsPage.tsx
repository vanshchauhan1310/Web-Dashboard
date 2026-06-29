import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, LayoutGrid, Layers, Loader2, AlertCircle,
  Trash2, Settings, Eye, EyeOff, Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import apiClient from '../../api/client';

interface MasterDashboard {
  id: number;
  title: string;
  description: string | null;
  template_type: string;
  datasource_id: number | null;
  icon: string | null;
  gradient: string | null;
  is_published: boolean;
}

const MasterDashboardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dashboards, isLoading, isError } = useQuery<MasterDashboard[]>({
    queryKey: ['master-dashboards'],
    queryFn: () => apiClient.get('/builder/master-dashboards').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/master-dashboards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-dashboards'] }),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTemplate, setNewTemplate] = useState('sidebar');

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/builder/master-dashboards', {
        title: newTitle,
        description: newDesc || null,
        template_type: newTemplate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-dashboards'] });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
      setNewTemplate('sidebar');
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F9]">Master Dashboards</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Create and manage dashboard collections for your organisation
          </p>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: showCreate ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
            border: `1px solid ${showCreate ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
            color: showCreate ? '#EF4444' : '#A5B4FC',
          }}
        >
          {showCreate ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showCreate ? 'Cancel' : 'New Dashboard'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div
          className="rounded-xl p-5 mb-6"
          style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}
        >
          <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Create New Master Dashboard</h3>
          <div className="flex flex-col gap-3">
            <input
              placeholder="Dashboard title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-[#E2E8F0]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-[#E2E8F0]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">Template</p>
              <div className="flex gap-3">
                {[
                  { value: 'sidebar', label: 'Sidebar Navigation', desc: 'Dashboards listed in sidebar' },
                  { value: 'selector', label: 'Dashboard Selector', desc: 'Cards on selector page' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => setNewTemplate(t.value)}
                    className={clsx(
                      'flex-1 p-3 rounded-xl text-left transition-all',
                      newTemplate === t.value ? 'ring-2' : '',
                    )}
                    style={{
                      border: `1px solid ${newTemplate === t.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: newTemplate === t.value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <p className="text-sm font-medium text-[#E2E8F0]">{t.label}</p>
                    <p className="text-xs text-[#64748B] mt-1">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle || createMutation.isPending}
              className="self-start flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: !newTitle ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: !newTitle ? '#475569' : '#fff',
                cursor: !newTitle ? 'not-allowed' : 'pointer',
              }}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Create Dashboard
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-red-400 text-sm py-10">
          <AlertCircle className="w-4 h-4" /> Failed to load dashboards
        </div>
      )}

      {dashboards && dashboards.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
        >
          <Layers className="w-10 h-10 text-[#334155] mb-3" />
          <p className="text-sm text-[#64748B]">No master dashboards yet</p>
          <p className="text-xs text-[#334155] mt-1">Click "New Dashboard" to create one</p>
        </div>
      )}

      {dashboards && dashboards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map(d => (
            <div
              key={d.id}
              className="rounded-xl overflow-hidden transition-all hover:scale-[1.01]"
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(14,28,48,0.9)',
              }}
            >
              <div
                className="h-2"
                style={{ background: d.gradient || 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {d.template_type === 'sidebar' ? (
                      <Layers className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <LayoutGrid className="w-4 h-4 text-emerald-400" />
                    )}
                    <h3 className="text-sm font-semibold text-[#F1F5F9]">{d.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {d.is_published ? (
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-[#475569]" />
                    )}
                  </div>
                </div>
                {d.description && (
                  <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{d.description}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-[#475569] mb-4">
                  <span style={{
                    padding: '2px 6px', borderRadius: 4,
                    background: d.template_type === 'sidebar'
                      ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                    color: d.template_type === 'sidebar' ? '#A5B4FC' : '#6EE7B7',
                  }}>
                    {d.template_type === 'sidebar' ? 'Sidebar' : 'Selector'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/master-dashboards/${d.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC' }}
                  >
                    <Settings className="w-3.5 h-3.5" /> Manage
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(d.id)}
                    className="p-2 rounded-lg transition-all text-[#475569] hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterDashboardsPage;