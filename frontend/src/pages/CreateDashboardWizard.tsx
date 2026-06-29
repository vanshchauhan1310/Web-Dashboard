import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Layers, LayoutGrid, Database, Loader2, Sparkles,
  ArrowLeft, Check,
} from 'lucide-react';
import clsx from 'clsx';
import apiClient from '../api/client';
import { useDataSourceStore } from '../store/dataSourceStore';

interface Props {
  onClose: () => void;
}

const TEMPLATES = [
  { value: 'sidebar', label: 'Sidebar Navigation', icon: Layers, desc: 'Sub-dashboards listed in sidebar' },
  { value: 'selector', label: 'Dashboard Selector', icon: LayoutGrid, desc: 'Cards on a selector page' },
];

const CreateDashboardWizard: React.FC<Props> = ({ onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sources } = useDataSourceStore();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('sidebar');
  const [datasourceId, setDatasourceId] = useState<number | null>(
    sources.find(s => s.is_default)?.id ?? sources[0]?.id ?? null
  );

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/builder/master-dashboards', {
        title,
        template_type: template,
        datasource_id: datasourceId,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['master-dashboards'] });
      navigate(`/builder/${res.data.id}`);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg,#091525 0%,#060D1A 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="p-1 rounded-lg hover:bg-white/[0.06] text-[#64748B]">
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06] text-[#64748B]">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-semibold text-[#F1F5F9]">
                {step === 1 ? 'Create Dashboard' : step === 2 ? 'Select Data Source' : 'Review'}
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">Step {step} of 3</p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1 px-6 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: s <= step ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>

        {/* Step 1: Title + Template */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-2">Dashboard Name</p>
              <input
                autoFocus
                placeholder="e.g. Marketing Analytics"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-[#E2E8F0] outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-3">Template</p>
              <div className="flex flex-col gap-2">
                {TEMPLATES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTemplate(t.value)}
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl text-left transition-all',
                      template === t.value ? 'ring-2' : '',
                    )}
                    style={{
                      border: `1px solid ${template === t.value ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: template === t.value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: template === t.value ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
                      <t.icon className="w-5 h-5" style={{ color: template === t.value ? '#A5B4FC' : '#475569' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#E2E8F0]">{t.label}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{t.desc}</p>
                    </div>
                    {template === t.value && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!title}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{
                background: !title ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: !title ? '#475569' : '#fff',
                cursor: !title ? 'not-allowed' : 'pointer',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Select Data Source */}
        {step === 2 && (
          <div className="p-6 flex flex-col gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#64748B] mb-1">
              Choose which database this dashboard will query
            </p>
            
            {sources.length === 0 ? (
              <div className="py-10 text-center text-sm text-[#64748B]">
                <Database className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>No data sources available</p>
                <p className="text-xs text-[#334155] mt-1">Contact your admin to add one</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {sources.map(src => (
                  <button
                    key={src.id}
                    onClick={() => setDatasourceId(src.id)}
                    className={clsx(
                      'flex items-center justify-between p-4 rounded-xl text-left transition-all',
                      datasourceId === src.id ? 'ring-2' : '',
                    )}
                    style={{
                      border: `1px solid ${datasourceId === src.id ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                      background: datasourceId === src.id ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full"
                        style={{ background: src.status === 'connected' ? '#10B981' : src.status === 'failed' ? '#EF4444' : '#64748B' }} />
                      <div>
                        <p className="text-sm font-medium text-[#E2E8F0]">{src.name}</p>
                        <p className="text-xs text-[#64748B]">{src.db_type}</p>
                      </div>
                    </div>
                    <div className="text-[10px] px-2 py-1 rounded"
                      style={{ background: src.status === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: src.status === 'connected' ? '#6EE7B7' : '#64748B' }}>
                      {src.status}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setStep(3)}
              disabled={!datasourceId}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all mt-2"
              style={{
                background: !datasourceId ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: !datasourceId ? '#475569' : '#fff',
                cursor: !datasourceId ? 'not-allowed' : 'pointer',
              }}
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <div className="p-6 flex flex-col gap-5">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#64748B]">Dashboard</span>
                <span className="text-sm font-semibold text-[#F1F5F9]">{title}</span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#64748B]">Template</span>
                <span className="text-xs font-medium" style={{ color: template === 'sidebar' ? '#A5B4FC' : '#6EE7B7' }}>
                  {template === 'sidebar' ? 'Sidebar Navigation' : 'Dashboard Selector'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748B]">Data Source</span>
                <span className="text-xs font-medium text-[#E2E8F0]">
                  {sources.find(s => s.id === datasourceId)?.name ?? 'None'}
                </span>
              </div>
            </div>

            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {createMutation.isPending ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateDashboardWizard;