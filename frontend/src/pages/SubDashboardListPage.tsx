import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Loader2, Edit3, Trash2, BarChart3,
  Layers, Sparkles, X, ChevronDown,
} from 'lucide-react';
import apiClient from '../api/client';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { buildOption, type QueryResult } from '../utils/chartBuilderUtils';
import { useLayoutStore, type CustomChartSpec, type MasterChart } from '../store/layoutStore';

// ─── types ──────────────────────────────────────────────────────────────────
interface SubDashboard {
  id: number;
  master_dashboard_id: number;
  title: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
}

interface SchemaField { field: string; label: string; }
interface AggOption   { key: string; label: string; }
interface Schema {
  dimensions:   SchemaField[];
  measures:     SchemaField[];
  aggregations: AggOption[];
  chartTypes:   string[];        // backend sends camelCase
}

// ─── ChartPreview ────────────────────────────────────────────────────────────
const ChartPreview: React.FC<{ spec: CustomChartSpec }> = ({ spec }) => {
  const { data, isLoading, isError } = useQuery<QueryResult>({
    queryKey: ['master-preview', spec.xField, spec.yField, spec.yAgg, spec.chartType, spec.limit],
    queryFn: () =>
      apiClient.post('/builder/query', {
        x_field:     spec.xField,
        y_field:     spec.yField,
        y_agg:       spec.yAgg,
        color_field: spec.colorField ?? null,
        limit:       spec.limit,
      }).then(r => r.data),
    staleTime: 60_000,
  });

  const option = useMemo(
    () => (data ? buildOption(data, spec.chartType) : null),
    [data, spec],
  );

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
    </div>
  );
  if (isError || !option) return (
    <div className="h-full flex items-center justify-center text-xs text-red-400">
      Failed to load preview
    </div>
  );
  return <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />;
};

// ─── ChartCard ───────────────────────────────────────────────────────────────
const ChartCard: React.FC<{ chart: MasterChart; masterId: string }> = ({ chart, masterId }) => {
  const removeMasterChart = useLayoutStore(s => s.removeMasterChart);
  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(14,28,48,0.95)',
        border: '1px solid rgba(255,255,255,0.07)',
        height: 260,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-[#E2E8F0] truncate">{chart.title}</span>
        </div>
        <button
          onClick={() => removeMasterChart(masterId, chart.id)}
          className="p-1 rounded hover:bg-red-500/10 text-[#475569] hover:text-red-400 shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 min-h-0 p-2">
        <ChartPreview spec={chart.spec} />
      </div>
    </div>
  );
};

// ─── AddChartModal ───────────────────────────────────────────────────────────
const CHART_TYPE_OPTIONS = [
  { key: 'bar',     label: 'Bar'     },
  { key: 'line',    label: 'Line'    },
  { key: 'area',    label: 'Area'    },
  { key: 'pie',     label: 'Pie'     },
  { key: 'scatter', label: 'Scatter' },
];

const AGG_OPTIONS = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'];

const AddChartModal: React.FC<{ masterId: string; onClose: () => void }> = ({ masterId, onClose }) => {
  const addMasterChart = useLayoutStore(s => s.addMasterChart);

  const [title,      setTitle]      = useState('');
  const [xField,     setXField]     = useState('');
  const [yField,     setYField]     = useState('');
  const [yAgg,       setYAgg]       = useState('sum');
  const [colorField, setColorField] = useState('');
  const [chartType,  setChartType]  = useState('bar');
  const [limit,      setLimit]      = useState(20);
  const [previewing, setPreviewing] = useState(false);

  // fetch field schema
  const { data: schema } = useQuery<Schema>({
    queryKey: ['builder-schema'],
    queryFn: () => apiClient.get('/builder/schema').then(r => r.data),
    staleTime: Infinity,
  });

  const dims = useMemo(() => schema?.dimensions ?? [], [schema]);
  const meas = useMemo(() => schema?.measures   ?? [], [schema]);
  // backend returns [{key, label}]; fall back to static list
  const aggs = useMemo(
    () => schema?.aggregations?.map(a => a.key.toUpperCase()) ?? AGG_OPTIONS,
    [schema],
  );

  // seed defaults once schema arrives
  useEffect(() => {
    if (dims.length > 0 && xField === '') setXField(dims[0].field);
  }, [dims, xField]);

  useEffect(() => {
    if (meas.length > 0 && yField === '') setYField(meas[0].field);
  }, [meas, yField]);

  const previewSpec: CustomChartSpec | null =
    previewing && xField && yField
      ? { xField, yField, yAgg, colorField: colorField || null, chartType, limit }
      : null;

  const handleAdd = () => {
    if (!xField || !yField) return;
    const spec: CustomChartSpec = {
      xField, yField, yAgg,
      colorField: colorField || null,
      chartType,
      limit,
    };
    addMasterChart(masterId, title || `${yAgg}(${yField}) by ${xField}`, spec);
    onClose();
  };


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(180deg,#091525 0%,#060D1A 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold text-[#F1F5F9]">Add Visualisation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748B]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* title */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
              Chart Title
            </p>
            <input
              placeholder="e.g. Monthly Revenue"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-[#E2E8F0] outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* chart type */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-2">
              Chart Type
            </p>
            <div className="flex flex-wrap gap-2">
              {CHART_TYPE_OPTIONS.map(c => (
                <button
                  key={c.key}
                  onClick={() => setChartType(c.key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: chartType === c.key ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${chartType === c.key ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: chartType === c.key ? '#A5B4FC' : '#64748B',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* x axis */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
              X Axis (Dimension)
            </p>
            <div className="relative">
              <select
                value={xField}
                onChange={e => setXField(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 rounded-lg text-sm text-[#E2E8F0] outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {dims.length === 0
                  ? <option value="">Loading fields…</option>
                  : dims.map(o => <option key={o.field} value={o.field}>{o.label}</option>)
                }
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
            </div>
          </div>

          {/* y axis + agg */}
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
                Y Axis (Measure)
              </p>
              <div className="relative">
                <select
                  value={yField}
                  onChange={e => setYField(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-7 rounded-lg text-sm text-[#E2E8F0] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {meas.length === 0
                    ? <option value="">Loading…</option>
                    : meas.map(o => <option key={o.field} value={o.field}>{o.label}</option>)
                  }
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
              </div>
            </div>
            <div className="w-28">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
                Aggregation
              </p>
              <div className="relative">
                <select
                  value={yAgg}
                  onChange={e => setYAgg(e.target.value.toLowerCase())}
                  className="w-full appearance-none px-3 py-2 pr-7 rounded-lg text-sm text-[#E2E8F0] outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {aggs.map(a => <option key={a} value={a.toLowerCase()}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* color / series */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
              Color / Series (Optional)
            </p>
            <div className="relative">
              <select
                value={colorField}
                onChange={e => setColorField(e.target.value)}
                className="w-full appearance-none px-3 py-2 pr-7 rounded-lg text-sm text-[#E2E8F0] outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <option value="">None</option>
                {dims.map(o => <option key={o.field} value={o.field}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
            </div>
          </div>

          {/* limit */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B] mb-1.5">
              Row Limit: {limit}
            </p>
            <input
              type="range" min={5} max={100} step={5} value={limit}
              onChange={e => setLimit(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          {/* preview toggle */}
          <button
            onClick={() => setPreviewing(v => !v)}
            className="w-full py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: previewing ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: previewing ? '#A5B4FC' : '#64748B',
            }}
          >
            {previewing ? 'Hide Preview' : 'Preview Chart'}
          </button>

          {/* live preview */}
          {previewSpec && (
            <div
              className="rounded-xl overflow-hidden"
              style={{ height: 220, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,28,48,0.95)' }}
            >
              <ChartPreview spec={previewSpec} />
            </div>
          )}

          {/* add button */}
          <button
            onClick={handleAdd}
            disabled={!xField || !yField}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: (!xField || !yField)
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color:  (!xField || !yField) ? '#475569' : '#fff',
              cursor: (!xField || !yField) ? 'not-allowed' : 'pointer',
            }}
          >
            <Plus className="w-4 h-4" />
            Add to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const SubDashboardListPage: React.FC = () => {
  const { masterId } = useParams<{ masterId: string }>();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [activeTab,    setActiveTab]    = useState<'pages' | 'visualizations'>('pages');
  const [showModal,    setShowModal]    = useState(false);
  const [showCreate,   setShowCreate]   = useState(false);
  const [newTitle,     setNewTitle]     = useState('');
  const [newDesc,      setNewDesc]      = useState('');

  const masterCharts = useLayoutStore(s => s.masterCharts);
  const charts       = masterId ? (masterCharts[masterId] ?? []) : [];

  const { data: subDashboards, isLoading } = useQuery<SubDashboard[]>({
    queryKey: ['sub-dashboards', masterId],
    queryFn:  () => apiClient.get(`/builder/master-dashboards/${masterId}/dashboards`).then(r => r.data),
    enabled:  !!masterId,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/builder/master-dashboards/${masterId}/dashboards`, {
        title:       newTitle,
        description: newDesc || null,
        order_index: subDashboards?.length ?? 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-dashboards', masterId] });
      setShowCreate(false);
      setNewTitle('');
      setNewDesc('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/dashboards/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['sub-dashboards', masterId] }),
  });

  const TABS = [
    { key: 'pages'          as const, label: 'Dashboard Pages', icon: Layers    },
    { key: 'visualizations' as const, label: 'Visualisations',  icon: BarChart3 },
  ];

  return (
    <div className="max-w-[1200px] mx-auto pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748B] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#F1F5F9]">
              {activeTab === 'pages' ? 'Dashboard Pages' : 'Visualisations'}
            </h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {activeTab === 'pages'
                ? 'Add and manage sub-dashboards'
                : 'Charts added directly to this dashboard'}
            </p>
          </div>
        </div>

        {activeTab === 'pages' ? (
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: showCreate ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)',
              border:     `1px solid ${showCreate ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
              color:      showCreate ? '#EF4444' : '#A5B4FC',
            }}
          >
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreate ? 'Cancel' : 'Add Dashboard'}
          </button>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <Sparkles className="w-4 h-4" />
            Add Visualisation
          </button>
        )}
      </div>

      {/* ── Tab switcher ── */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          const Icon   = tab.icon;
          const count  = tab.key === 'pages' ? (subDashboards?.length ?? 0) : charts.length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                border:     `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                color:      active ? '#A5B4FC' : '#64748B',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)',
                    color:      active ? '#C4B5FD' : '#475569',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Pages tab ── */}
      {activeTab === 'pages' && (
        <>
          {showCreate && (
            <div
              className="rounded-xl p-4 mb-6"
              style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}
            >
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
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{
                    background: !newTitle ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                    color:      !newTitle ? '#475569' : '#fff',
                    cursor:     !newTitle ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : 'Create'}
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          )}

          {!isLoading && subDashboards?.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <Layers className="w-10 h-10 text-[#334155] mb-3" />
              <p className="text-sm text-[#64748B]">No sub-dashboards yet</p>
              <p className="text-xs text-[#334155] mt-1">Click "Add Dashboard" to create a page</p>
            </div>
          )}

          {subDashboards && subDashboards.length > 0 && (
            <div className="space-y-3">
              {subDashboards.map((sub, i) => (
                <div
                  key={sub.id}
                  className="rounded-xl p-4 flex items-center justify-between"
                  style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,28,48,0.9)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#334155] font-mono">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-[#F1F5F9]">{sub.title}</p>
                      {sub.description && (
                        <p className="text-xs text-[#64748B] mt-0.5">{sub.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/custom/builder-pages/dashboards/${sub.id}/edit`)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        color: '#A5B4FC',
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
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
        </>
      )}

      {/* ── Visualisations tab ── */}
      {activeTab === 'visualizations' && (
        <>
          {charts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl"
              style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
            >
              <BarChart3 className="w-10 h-10 text-[#334155] mb-3" />
              <p className="text-sm text-[#64748B]">No visualisations yet</p>
              <p className="text-xs text-[#334155] mt-1">Click "Add Visualisation" to build a chart</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-5 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}
              >
                <Sparkles className="w-4 h-4" /> Add Visualisation
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {charts.map(chart => (
                <ChartCard key={chart.id} chart={chart} masterId={masterId!} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add chart modal ── */}
      {showModal && masterId && (
        <AddChartModal masterId={masterId} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default SubDashboardListPage;
