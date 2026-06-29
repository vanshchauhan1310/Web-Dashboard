import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Layers, Loader2, ArrowLeft,
  Trash2, Eye, EyeOff, Edit3,
} from 'lucide-react';
import apiClient from '../../api/client';

interface MasterDashboard {
  id: number; title: string; description: string | null;
  template_type: string; datasource_id: number | null;
  is_published: boolean;
}

interface SubDashboard {
  id: number; master_dashboard_id: number;
  title: string; description: string | null;
  icon: string | null; order_index: number; is_published: boolean;
}

const MasterDashboardDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: master, isLoading: loadingMaster } = useQuery<MasterDashboard>({
    queryKey: ['master-dashboard', id],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const { data: subDashboards, isLoading: loadingSubs } = useQuery<SubDashboard[]>({
    queryKey: ['sub-dashboards', id],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${id}/dashboards`).then(r => r.data),
    enabled: !!id,
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/builder/master-dashboards/${id}/dashboards`, {
        title: newTitle,
        description: newDesc || null,
        order_index: subDashboards?.length ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-dashboards', id] });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subId: number) => apiClient.delete(`/builder/dashboards/${subId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-dashboards', id] }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: ({ subId, is_published }: { subId: number; is_published: boolean }) =>
      apiClient.put(`/builder/dashboards/${subId}`, { is_published: !is_published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-dashboards', id] }),
  });

  if (loadingMaster || loadingSubs) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/admin/master-dashboards')}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Master Dashboards
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F9] flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            {master?.title || 'Dashboard'}
          </h1>
          {master?.description && (
            <p className="text-sm text-[#64748B] mt-1">{master.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-2 py-0.5 rounded"
              style={{
                background: master?.template_type === 'sidebar' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                color: master?.template_type === 'sidebar' ? '#A5B4FC' : '#6EE7B7',
              }}>
              {master?.template_type === 'sidebar' ? 'Sidebar Template' : 'Selector Template'}
            </span>
            {master?.is_published ? (
              <span className="text-[10px] px-2 py-0.5 rounded text-emerald-500" style={{ background: 'rgba(16,185,129,0.1)' }}>
                Published
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded text-[#475569]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                Draft
              </span>
            )}
          </div>
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
          {showCreate ? 'Cancel' : 'Add Dashboard'}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl p-4 mb-6" style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                placeholder="Dashboard title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-[#E2E8F0]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="flex-1">
              <input
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-[#E2E8F0]"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle || createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: !newTitle ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: !newTitle ? '#475569' : '#fff',
                cursor: !newTitle ? 'not-allowed' : 'pointer',
              }}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </div>
        </div>
      )}

      {subDashboards && subDashboards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
          <p className="text-sm text-[#64748B]">No sub-dashboards yet</p>
          <p className="text-xs text-[#334155] mt-1">Click "Add Dashboard" to create one</p>
        </div>
      )}

      {subDashboards && subDashboards.length > 0 && (
        <div className="space-y-3">
          {subDashboards.map((sub, i) => (
            <div
              key={sub.id}
              className="rounded-xl p-4 flex items-center justify-between transition-all hover:scale-[1.002]"
              style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,28,48,0.9)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#334155] font-mono w-5">#{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">{sub.title}</p>
                  {sub.description && (
                    <p className="text-xs text-[#64748B] mt-0.5">{sub.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublishMutation.mutate({ subId: sub.id, is_published: sub.is_published })}
                  className="p-2 rounded-lg transition-all text-[#475569] hover:text-emerald-400"
                  title={sub.is_published ? 'Unpublish' : 'Publish'}
                >
                  {sub.is_published ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => navigate(`/admin/dashboards/${sub.id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC' }}
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Widgets
                </button>
                <button
                  onClick={() => deleteMutation.mutate(sub.id)}
                  className="p-2 rounded-lg transition-all text-[#475569] hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterDashboardDetail;