import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Loader2, Trash2, Eye, EyeOff, Wrench,
  Layers, LayoutGrid, AlertCircle, Sparkles,
  ChevronRight, Globe,
} from 'lucide-react';
import apiClient from '../api/client';
import CreateDashboardWizard from './CreateDashboardWizard';

interface MasterDashboard {
  id: number;
  title: string;
  description: string | null;
  template_type: string;
  is_published: boolean;
  gradient: string | null;
}

const BuilderStudio: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);

  const { data: dashboards, isLoading, isError } = useQuery<MasterDashboard[]>({
    queryKey: ['master-dashboards'],
    queryFn: () => apiClient.get('/builder/master-dashboards').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/master-dashboards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-dashboards'] }),
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, publish }: { id: number; publish: boolean }) =>
      apiClient.post(`/builder/master-dashboards/${id}/${publish ? 'publish' : 'unpublish'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-dashboards'] }),
  });

  return (
    <div className="max-w-[1100px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold text-[#F1F5F9]">Builder Studio</h1>
          </div>
          <p className="text-sm text-[#64748B]">
            Create and publish dashboards for your organisation
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}
        >
          <Plus className="w-4 h-4" /> New Dashboard
        </button>
      </div>

      {/* How it works */}
      <div className="rounded-xl p-4 mb-8 flex items-start gap-4"
        style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(245,158,11,0.15)' }}>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-300 mb-1">Developer Workflow</p>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            <span className="text-white font-medium">1. Create</span> a master dashboard →{' '}
            <span className="text-white font-medium">2. Add Pages</span> (sub-dashboards) and{' '}
            <span className="text-white font-medium">Visualisations</span> →{' '}
            <span className="text-white font-medium">3. Publish</span> to make it visible to employees.
            Employees can only see <span className="text-emerald-400 font-medium">Published</span> dashboards.
          </p>
        </div>
      </div>

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
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <LayoutGrid className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="text-base font-semibold text-[#64748B] mb-1">No dashboards yet</p>
          <p className="text-sm text-[#334155] mb-6">Create your first dashboard to get started</p>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}
          >
            <Plus className="w-4 h-4" /> Create Dashboard
          </button>
        </div>
      )}

      {dashboards && dashboards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboards.map(d => {
            const gradient = d.gradient ?? 'linear-gradient(135deg,#6366F1,#8B5CF6)';
            return (
              <div key={d.id} className="rounded-2xl overflow-hidden transition-all hover:scale-[1.01]"
                style={{ background: 'rgba(14,28,48,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* colour strip */}
                <div className="h-1.5" style={{ background: gradient }} />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {d.template_type === 'sidebar'
                        ? <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                        : <LayoutGrid className="w-4 h-4 text-emerald-400 shrink-0" />}
                      <h3 className="text-sm font-bold text-[#F1F5F9] truncate">{d.title}</h3>
                    </div>
                    {/* publish badge */}
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        background: d.is_published ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                        border: `1px solid ${d.is_published ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                        color: d.is_published ? '#10B981' : '#64748B',
                      }}>
                      {d.is_published ? <><Globe className="w-2.5 h-2.5" /> Published</> : <><EyeOff className="w-2.5 h-2.5" /> Draft</>}
                    </span>
                  </div>

                  {d.description && (
                    <p className="text-xs text-[#64748B] mb-4 line-clamp-2">{d.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-4">
                    {/* Open editor */}
                    <button
                      onClick={() => navigate(`/builder/${d.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC' }}
                    >
                      <Wrench className="w-3.5 h-3.5" /> Open Editor
                      <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                    </button>

                    {/* Publish / Unpublish */}
                    <button
                      onClick={() => publishMutation.mutate({ id: d.id, publish: !d.is_published })}
                      disabled={publishMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={d.is_published
                        ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }
                        : { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34D399' }}
                    >
                      {publishMutation.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : d.is_published ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => { if (confirm('Delete this dashboard?')) deleteMutation.mutate(d.id); }}
                      className="p-2 rounded-lg transition-all text-[#475569] hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showWizard && <CreateDashboardWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
};

export default BuilderStudio;
