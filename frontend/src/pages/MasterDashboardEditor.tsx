import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Plus, Loader2, Trash2, BarChart3,
  Layers, Sparkles, X, EyeOff, Globe,
  Info, ChevronRight, TrendingUp, PieChart,
  Activity, Hash, Type, ChevronDown, Check,
  BarChart2, ScatterChart,
} from 'lucide-react';
import apiClient from '../api/client';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { buildOption, type QueryResult } from '../utils/chartBuilderUtils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SubDashboard {
  id: number; master_dashboard_id: number; title: string;
  description: string | null; order_index: number; is_published: boolean;
}
interface MasterDashboard {
  id: number; title: string; description: string | null;
  template_type: string; is_published: boolean; gradient: string | null;
}
interface ChartWidget {
  id: number; master_dashboard_id: number; title: string;
  subtitle: string | null; chart_spec: any | null;
  grid_x: number; grid_y: number; grid_w: number; grid_h: number; is_published: boolean;
}
interface SchemaField { field: string; label: string; }
interface AggOption   { key: string; label: string; }
interface Schema {
  dimensions: SchemaField[]; measures: SchemaField[];
  aggregations: AggOption[]; chartTypes: string[];
}

const CHART_TYPES = [
  { key: 'bar',     label: 'Bar',     Icon: BarChart2 },
  { key: 'line',    label: 'Line',    Icon: TrendingUp },
  { key: 'area',    label: 'Area',    Icon: Activity },
  { key: 'pie',     label: 'Pie',     Icon: PieChart },
  { key: 'scatter', label: 'Scatter', Icon: ScatterChart },
];

// ── Live chart preview ────────────────────────────────────────────────────────
const LivePreview: React.FC<{
  xField: string; yField: string; yAgg: string;
  colorField: string; chartType: string; limit: number;
}> = ({ xField, yField, yAgg, colorField, chartType, limit }) => {
  const ready = !!(xField && yField);
  const { data, isLoading, isError } = useQuery<QueryResult>({
    queryKey: ['mde-live', xField, yField, yAgg, colorField, chartType, limit],
    queryFn: () => apiClient.post('/builder/query', {
      x_field: xField, y_field: yField, y_agg: yAgg,
      color_field: colorField || null, limit,
    }).then(r => r.data),
    enabled: ready,
    staleTime: 60_000,
  });
  const option = useMemo(() => data ? buildOption(data, chartType) : null, [data, chartType]);

  if (!ready) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <BarChart3 className="w-7 h-7 text-indigo-400 opacity-40" />
      </div>
      <p className="text-sm text-[#475569]">Select a dimension and a measure</p>
      <p className="text-xs text-[#334155]">to see your chart preview</p>
    </div>
  );
  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
    </div>
  );
  if (isError || !option) return (
    <div className="h-full flex items-center justify-center text-xs text-red-400">
      Error loading data
    </div>
  );
  return <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />;
};

// ── Schema field pill ─────────────────────────────────────────────────────────
const FieldPill: React.FC<{
  field: SchemaField; type: 'dimension' | 'measure';
  isSelected: boolean; axisLabel: string;
  onClick: () => void;
}> = ({ field, type, isSelected, axisLabel, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all"
    title={`Click to assign as ${type === 'dimension' ? 'X Axis' : 'Y Axis'}`}
    style={{
      background: isSelected
        ? (type === 'dimension' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)')
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isSelected
        ? (type === 'dimension' ? 'rgba(99,102,241,0.35)' : 'rgba(16,185,129,0.3)')
        : 'rgba(255,255,255,0.07)'}`,
    }}
  >
    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
      style={{ background: type === 'dimension' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)' }}>
      {type === 'dimension'
        ? <Type className="w-2.5 h-2.5 text-indigo-400" />
        : <Hash className="w-2.5 h-2.5 text-emerald-400" />}
    </div>
    <span className="text-xs font-medium flex-1 truncate"
      style={{ color: isSelected ? '#F1F5F9' : '#94A3B8' }}>
      {field.label}
    </span>
    {isSelected && (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
        style={{
          background: type === 'dimension' ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.15)',
          color: type === 'dimension' ? '#A5B4FC' : '#34D399',
        }}>
        {axisLabel}
      </span>
    )}
  </button>
);

// ── Split-panel chart builder ─────────────────────────────────────────────────
const ChartBuilder: React.FC<{
  masterId: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ masterId, onClose, onSaved }) => {
  const [chartType,   setChartType]   = useState('bar');
  const [xField,      setXField]      = useState('');
  const [yField,      setYField]      = useState('');
  const [yAgg,        setYAgg]        = useState('sum');
  const [colorField,  setColorField]  = useState('');
  const [limit,       setLimit]       = useState(20);
  const [title,       setTitle]       = useState('');
  const [saving,      setSaving]      = useState(false);
  const [showAggDrop, setShowAggDrop] = useState(false);

  const { data: schema, isLoading: schemaLoading } = useQuery<Schema>({
    queryKey: ['builder-schema'],
    queryFn: () => apiClient.get('/builder/schema').then(r => r.data),
    staleTime: Infinity,
  });

  const dims = useMemo(() => schema?.dimensions ?? [], [schema]);
  const meas = useMemo(() => schema?.measures   ?? [], [schema]);
  const aggs = useMemo(() => schema?.aggregations ?? [], [schema]);

  useEffect(() => { if (dims.length > 0 && !xField) setXField(dims[0].field); }, [dims, xField]);
  useEffect(() => { if (meas.length > 0 && !yField) setYField(meas[0].field); }, [meas, yField]);

  const handleSave = async () => {
    if (!xField || !yField || saving) return;
    setSaving(true);
    try {
      await apiClient.post(`/builder/master-dashboards/${masterId}/widgets`, {
        title: title.trim() || `${yAgg.toUpperCase()}(${yField}) by ${xField}`,
        chart_spec: { xField, yField, yAgg, colorField: colorField || null, chartType, limit },
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>

      {/* ── LEFT: Schema Browser ─────────────────────── */}
      <div className="flex flex-col shrink-0 overflow-y-auto"
        style={{ width: 264, borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,13,26,0.7)' }}>

        <div className="px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold text-[#F1F5F9]">Schema Browser</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Click a field to assign it to an axis</p>
        </div>

        {schemaLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          </div>
        )}

        {!schemaLoading && (
          <div className="flex flex-col gap-5 p-3">
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Dimensions</p>
                <span className="text-[10px] text-[#334155] ml-auto">{dims.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                {dims.map(f => (
                  <FieldPill
                    key={f.field} field={f} type="dimension"
                    isSelected={xField === f.field || colorField === f.field}
                    axisLabel={xField === f.field ? 'X' : colorField === f.field ? 'C' : ''}
                    onClick={() => setXField(prev => prev === f.field ? '' : f.field)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Measures</p>
                <span className="text-[10px] text-[#334155] ml-auto">{meas.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                {meas.map(f => (
                  <FieldPill
                    key={f.field} field={f} type="measure"
                    isSelected={yField === f.field}
                    axisLabel={yField === f.field ? 'Y' : ''}
                    onClick={() => setYField(prev => prev === f.field ? '' : f.field)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Canvas ────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0" style={{ minHeight: 0 }}>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap gap-y-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}>

          {/* Chart type selector */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {CHART_TYPES.map(({ key, label, Icon }) => {
              const active = chartType === key;
              return (
                <button key={key} onClick={() => setChartType(key)} title={label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'transparent'}`,
                    color: active ? '#A5B4FC' : '#64748B',
                  }}>
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* X axis */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: xField ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${xField ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}` }}>
              <span className="text-[10px] font-bold text-[#475569]">X</span>
              <span className="text-xs font-medium" style={{ color: xField ? '#A5B4FC' : '#334155' }}>
                {xField ? (dims.find(d => d.field === xField)?.label ?? xField) : 'None'}
              </span>
              {xField && <button onClick={() => setXField('')} className="text-[#475569] hover:text-red-400"><X className="w-2.5 h-2.5" /></button>}
            </div>

            {/* Y axis */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: yField ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${yField ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
              <span className="text-[10px] font-bold text-[#475569]">Y</span>
              <span className="text-xs font-medium" style={{ color: yField ? '#34D399' : '#334155' }}>
                {yField ? (meas.find(m => m.field === yField)?.label ?? yField) : 'None'}
              </span>
              {yField && <button onClick={() => setYField('')} className="text-[#475569] hover:text-red-400"><X className="w-2.5 h-2.5" /></button>}
            </div>

            {/* Aggregation */}
            <div className="relative">
              <button onClick={() => setShowAggDrop(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                <span className="text-[10px] font-bold text-[#475569]">AGG</span>
                {yAgg.toUpperCase()}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showAggDrop && (
                <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-lg"
                  style={{ background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 100 }}
                  onMouseLeave={() => setShowAggDrop(false)}>
                  {aggs.map(a => (
                    <button key={a.key} onClick={() => { setYAgg(a.key); setShowAggDrop(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-white/[0.06]"
                      style={{ color: yAgg === a.key ? '#A5B4FC' : '#94A3B8' }}>
                      {a.label}
                      {yAgg === a.key && <Check className="w-3 h-3 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color series */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] font-bold text-[#475569]">COLOR</span>
              <select value={colorField} onChange={e => setColorField(e.target.value)}
                className="text-xs font-medium bg-transparent outline-none cursor-pointer"
                style={{ color: colorField ? '#FCD34D' : '#475569' }}>
                <option value="">None</option>
                {dims.map(d => <option key={d.field} value={d.field}>{d.label}</option>)}
              </select>
            </div>

            {/* Row limit */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-[10px] font-bold text-[#475569]">ROWS</span>
              <input type="range" min={5} max={100} step={5} value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                style={{ width: 64, accentColor: '#6366F1', cursor: 'pointer' }} />
              <span className="text-xs text-[#64748B] tabular-nums w-6 text-right">{limit}</span>
            </div>
          </div>
        </div>

        {/* Chart preview */}
        <div className="flex-1 min-h-0 p-5">
          <LivePreview
            xField={xField} yField={yField} yAgg={yAgg}
            colorField={colorField} chartType={chartType} limit={limit}
          />
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,13,26,0.8)' }}>
          <input
            placeholder="Chart title (auto-generated if left blank)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-sm text-[#E2E8F0] outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            onClick={handleSave}
            disabled={!xField || !yField || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: (!xField || !yField) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: (!xField || !yField) ? '#334155' : '#fff',
              cursor: (!xField || !yField) ? 'not-allowed' : 'pointer',
              boxShadow: (!xField || !yField) ? 'none' : '0 4px 16px rgba(99,102,241,0.35)',
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Add to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Saved visualisation card ──────────────────────────────────────────────────
const VisCard: React.FC<{ widget: ChartWidget; onDelete: () => void }> = ({ widget, onDelete }) => {
  const spec = widget.chart_spec;
  const { data, isLoading } = useQuery<QueryResult>({
    queryKey: ['vis-card', widget.id],
    queryFn: () => apiClient.post('/builder/query', {
      x_field: spec.xField, y_field: spec.yField, y_agg: spec.yAgg,
      color_field: spec.colorField ?? null, limit: spec.limit ?? 20,
    }).then(r => r.data),
    enabled: !!spec?.xField && !!spec?.yField,
    staleTime: 60_000,
  });
  const option = useMemo(() => data ? buildOption(data, spec?.chartType ?? 'bar') : null, [data, spec]);

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col"
      style={{ height: 240, background: 'rgba(14,28,48,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
          <span className="text-xs font-semibold text-[#E2E8F0] truncate">{widget.title}</span>
        </div>
        <button onClick={onDelete}
          className="p-1 rounded transition-colors hover:bg-red-500/10 text-[#475569] hover:text-red-400 shrink-0">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <div className="flex-1 min-h-0 p-2">
        {isLoading
          ? <div className="h-full flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
          : option
            ? <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />
            : <div className="h-full flex items-center justify-center text-xs text-[#475569]">No data</div>}
      </div>
    </div>
  );
};

// ── Main editor ───────────────────────────────────────────────────────────────
const MasterDashboardEditor: React.FC = () => {
  const { masterId } = useParams<{ masterId: string }>();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [activeTab,   setActiveTab]   = useState<'pages' | 'visualisations'>('pages');
  const [showBuilder, setShowBuilder] = useState(false);
  const [showCreate,  setShowCreate]  = useState(false);
  const [newTitle,    setNewTitle]    = useState('');
  const [newDesc,     setNewDesc]     = useState('');

  const { data: masters } = useQuery<MasterDashboard[]>({
    queryKey: ['master-dashboards'],
    queryFn: () => apiClient.get('/builder/master-dashboards').then(r => r.data),
    enabled: !!masterId,
  });
  const master = masters?.find(d => d.id === Number(masterId)) ?? null;

  const { data: subDashboards, isLoading: loadingPages } = useQuery<SubDashboard[]>({
    queryKey: ['sub-dashboards', masterId],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${masterId}/dashboards`).then(r => r.data),
    enabled: !!masterId,
  });

  const { data: widgets, isLoading: loadingWidgets } = useQuery<ChartWidget[]>({
    queryKey: ['master-widgets', masterId],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${masterId}/widgets`).then(r => r.data),
    enabled: !!masterId,
  });

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) =>
      apiClient.post(`/builder/master-dashboards/${masterId}/${publish ? 'publish' : 'unpublish'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-dashboards'] }),
  });

  const createPageMutation = useMutation({
    mutationFn: () => apiClient.post(`/builder/master-dashboards/${masterId}/dashboards`, {
      title: newTitle, description: newDesc || null, order_index: subDashboards?.length ?? 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-dashboards', masterId] });
      setShowCreate(false); setNewTitle(''); setNewDesc('');
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/dashboards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sub-dashboards', masterId] }),
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/widgets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-widgets', masterId] }),
  });

  const gradient    = master?.gradient ?? 'linear-gradient(135deg,#6366F1,#8B5CF6)';
  const isPublished = master?.is_published ?? false;

  const TABS = [
    { key: 'pages'          as const, label: 'Dashboard Pages',  Icon: Layers,    count: subDashboards?.length ?? 0 },
    { key: 'visualisations' as const, label: 'Visualisations',   Icon: BarChart3, count: widgets?.length ?? 0 },
  ];

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/builder')}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-[#64748B] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-1 h-10 rounded-full shrink-0" style={{ background: gradient }} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#F1F5F9]">{master?.title ?? '…'}</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: isPublished ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                  border: `1px solid ${isPublished ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.2)'}`,
                  color: isPublished ? '#10B981' : '#64748B',
                }}>
                {isPublished
                  ? <><Globe className="w-2.5 h-2.5" /> Published</>
                  : <><EyeOff className="w-2.5 h-2.5" /> Draft</>}
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              {isPublished ? 'Visible to employees' : 'Draft — not visible to employees yet'}
            </p>
          </div>
        </div>

        <button
          onClick={() => publishMutation.mutate(!isPublished)}
          disabled={publishMutation.isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={isPublished
            ? { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }
            : { background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}>
          {publishMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : isPublished
              ? <><EyeOff className="w-4 h-4" /> Unpublish</>
              : <><Globe className="w-4 h-4" /> Publish</>}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key && !showBuilder;
          return (
            <button key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowBuilder(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                color: active ? '#A5B4FC' : '#64748B',
              }}>
              <tab.Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    background: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.08)',
                    color: active ? '#C4B5FD' : '#475569',
                  }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        {showBuilder && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[#334155]">/</span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" /> Add Visualisation
            </span>
            <button onClick={() => setShowBuilder(false)}
              className="ml-1 p-1 rounded hover:bg-white/[0.06] text-[#475569]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* Split-panel chart builder */}
        {showBuilder && masterId && (
          <ChartBuilder
            masterId={masterId}
            onClose={() => setShowBuilder(false)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['master-widgets', masterId] })}
          />
        )}

        {/* Pages tab */}
        {!showBuilder && activeTab === 'pages' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-[800px] mx-auto">
              <div className="rounded-xl p-3.5 mb-5 flex items-start gap-3"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  <span className="text-indigo-300 font-medium">Dashboard Pages</span> are sub-sections employees navigate through. Each page has its own charts and widgets.
                </p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-[#94A3B8]">
                  {subDashboards?.length ?? 0} page{(subDashboards?.length ?? 0) !== 1 ? 's' : ''}
                </p>
                <button onClick={() => setShowCreate(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: showCreate ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.12)',
                    border: `1px solid ${showCreate ? 'rgba(239,68,68,0.25)' : 'rgba(99,102,241,0.25)'}`,
                    color: showCreate ? '#F87171' : '#A5B4FC',
                  }}>
                  {showCreate ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Plus className="w-3.5 h-3.5" /> Add Page</>}
                </button>
              </div>

              {showCreate && (
                <div className="rounded-xl p-4 mb-5"
                  style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
                  <div className="flex gap-3 items-end flex-wrap">
                    <input placeholder="Page title *" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm text-[#E2E8F0] outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <input placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                      className="flex-1 min-w-[160px] px-3 py-2 rounded-lg text-sm text-[#E2E8F0] outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button onClick={() => createPageMutation.mutate()} disabled={!newTitle || createPageMutation.isPending}
                      className="px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{ background: !newTitle ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: !newTitle ? '#475569' : '#fff', cursor: !newTitle ? 'not-allowed' : 'pointer' }}>
                      {createPageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Page'}
                    </button>
                  </div>
                </div>
              )}

              {loadingPages && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}

              {!loadingPages && subDashboards?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                  style={{ border: '2px dashed rgba(255,255,255,0.07)' }}>
                  <Layers className="w-10 h-10 text-[#334155] mb-3" />
                  <p className="text-sm text-[#64748B]">No pages yet</p>
                  <p className="text-xs text-[#334155] mt-1">Click "Add Page" to create a sub-page</p>
                </div>
              )}

              {subDashboards && subDashboards.length > 0 && (
                <div className="space-y-2.5">
                  {subDashboards.map((sub, i) => (
                    <div key={sub.id} className="rounded-xl p-4 flex items-center justify-between"
                      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(14,28,48,0.9)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-[#475569]"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#F1F5F9]">{sub.title}</p>
                          {sub.description && <p className="text-xs text-[#64748B] mt-0.5">{sub.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/custom/builder-pages/dashboards/${sub.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#A5B4FC' }}>
                          Edit Widgets <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deletePageMutation.mutate(sub.id)}
                          className="p-2 rounded-lg text-[#475569] hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visualisations tab */}
        {!showBuilder && activeTab === 'visualisations' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-[1100px] mx-auto">
              <div className="rounded-xl p-3.5 mb-5 flex items-start gap-3"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  <span className="text-indigo-300 font-medium">Visualisations</span> appear on the main view of this dashboard. Great for KPI overviews and summary charts shown before navigating to a page.
                </p>
              </div>

              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-semibold text-[#94A3B8]">
                  {widgets?.length ?? 0} visualisation{(widgets?.length ?? 0) !== 1 ? 's' : ''}
                </p>
                <button onClick={() => setShowBuilder(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold hover:scale-105 transition-all"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                  <Sparkles className="w-4 h-4" /> Add Visualisation
                </button>
              </div>

              {loadingWidgets && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>}

              {!loadingWidgets && widgets?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                  style={{ border: '2px dashed rgba(255,255,255,0.07)' }}>
                  <BarChart3 className="w-10 h-10 text-[#334155] mb-3" />
                  <p className="text-sm text-[#64748B]">No visualisations yet</p>
                  <p className="text-xs text-[#334155] mt-1 mb-5">Add charts that appear on the main dashboard view</p>
                  <button onClick={() => setShowBuilder(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff' }}>
                    <Sparkles className="w-4 h-4" /> Add Visualisation
                  </button>
                </div>
              )}

              {widgets && widgets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {widgets.map(w => (
                    <VisCard key={w.id} widget={w} onDelete={() => deleteWidgetMutation.mutate(w.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterDashboardEditor;
