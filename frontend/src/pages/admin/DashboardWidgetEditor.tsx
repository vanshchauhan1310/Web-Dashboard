import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  ArrowLeft, GripVertical, Sparkles, Loader2, AlertCircle,
  Save, Trash2, Eye, EyeOff, BarChart3, Plus,
  TrendingUp, PieChart, Activity, Hash, Type,
  ChevronDown, Check, X, BarChart2, ScatterChart, LayoutGrid,
} from 'lucide-react';
import apiClient from '../../api/client';
import EChartWrapper from '../../charts/echarts/EChartWrapper';
import { buildOption, type QueryResult } from '../../utils/chartBuilderUtils';

const ResponsiveGrid = WidthProvider(Responsive);
const ROW_HEIGHT   = 90;
const COLS         = { lg: 12, md: 8, sm: 4 };
const BREAKPOINTS  = { lg: 1200, md: 996, sm: 768 };
const DEFAULT_W    = 6;
const DEFAULT_H    = 5;

// ── Types ─────────────────────────────────────────────────────────────────────
interface ChartWidget {
  id: number; sub_dashboard_id: number; title: string;
  subtitle: string | null; widget_key: string | null;
  chart_spec: any | null; grid_x: number; grid_y: number;
  grid_w: number; grid_h: number; is_published: boolean;
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

// ── Chart preview inside widget card ─────────────────────────────────────────
const ChartPreview: React.FC<{ spec: any }> = ({ spec }) => {
  const { data, isLoading, isError } = useQuery<QueryResult>({
    queryKey: ['widget-preview', spec?.xField, spec?.yField, spec?.yAgg, spec?.chartType],
    queryFn:  () => apiClient.post('/builder/query', {
      x_field: spec.xField, y_field: spec.yField, y_agg: spec.yAgg,
      color_field: spec.colorField ?? null, limit: spec.limit ?? 20,
    }).then(r => r.data),
    enabled: !!spec?.xField && !!spec?.yField,
    staleTime: 60_000,
  });
  const option = useMemo(() => data ? buildOption(data, spec?.chartType ?? 'bar') : null, [data, spec?.chartType]);

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
    </div>
  );
  if (isError || !option) return (
    <div className="h-full flex items-center justify-center gap-1.5 text-xs text-red-400">
      <AlertCircle className="w-3.5 h-3.5" /> Error loading data
    </div>
  );
  return <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />;
};

// ── Widget card ───────────────────────────────────────────────────────────────
const WidgetCard: React.FC<{
  w: ChartWidget;
  onTogglePublish: () => void;
  onDelete: () => void;
}> = ({ w, onTogglePublish, onDelete }) => (
  <div className="h-full w-full flex flex-col rounded-2xl overflow-hidden select-none"
    style={{
      background: 'linear-gradient(180deg,rgba(15,30,52,0.98) 0%,rgba(10,20,38,0.98) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>

    {/* Drag handle — top strip */}
    <div
      className="drag-handle flex items-center justify-between px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing"
      style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <GripVertical className="w-3.5 h-3.5 shrink-0 text-[#334155]" />
        {w.widget_key === 'custom_chart' && (
          <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
        )}
        <span className="text-[13px] font-semibold text-[#CBD5E1] truncate">{w.title}</span>
        {w.subtitle && (
          <span className="text-[11px] text-[#475569] truncate hidden sm:block">· {w.subtitle}</span>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onTogglePublish}
          className="p-1.5 rounded-lg transition-all hover:bg-white/[0.07]"
          title={w.is_published ? 'Visible to employees' : 'Hidden from employees'}
        >
          {w.is_published
            ? <Eye className="w-3.5 h-3.5 text-emerald-400" />
            : <EyeOff className="w-3.5 h-3.5 text-[#475569]" />}
        </button>
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={onDelete}
          className="p-1.5 rounded-lg transition-all hover:bg-red-500/10 text-[#475569] hover:text-red-400"
          title="Delete widget"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    {/* Chart body — pointer-events none to allow resize handle on edges */}
    <div className="flex-1 min-h-0 p-3" style={{ pointerEvents: 'none' }}>
      {w.chart_spec?.xField && w.chart_spec?.yField
        ? <ChartPreview spec={w.chart_spec} />
        : <div className="h-full flex items-center justify-center text-xs text-[#475569]">No chart configured</div>
      }
    </div>
  </div>
);

// ── Field pill ────────────────────────────────────────────────────────────────
const FieldPill: React.FC<{
  field: SchemaField; type: 'dimension' | 'measure';
  isSelected: boolean; axisLabel: string; onClick: () => void;
}> = ({ field, type, isSelected, axisLabel, onClick }) => (
  <button onClick={onClick}
    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-100"
    style={{
      background: isSelected
        ? (type === 'dimension' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)')
        : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isSelected
        ? (type === 'dimension' ? 'rgba(99,102,241,0.35)' : 'rgba(16,185,129,0.3)')
        : 'rgba(255,255,255,0.06)'}`,
    }}>
    <div className="w-5 h-5 rounded flex items-center justify-center shrink-0"
      style={{ background: type === 'dimension' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.12)' }}>
      {type === 'dimension'
        ? <Type className="w-2.5 h-2.5 text-indigo-400" />
        : <Hash className="w-2.5 h-2.5 text-emerald-400" />}
    </div>
    <span className="text-xs font-medium flex-1 truncate" style={{ color: isSelected ? '#F1F5F9' : '#94A3B8' }}>
      {field.label}
    </span>
    {isSelected && (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
        style={{
          background: type === 'dimension' ? 'rgba(99,102,241,0.25)' : 'rgba(16,185,129,0.2)',
          color: type === 'dimension' ? '#A5B4FC' : '#34D399',
        }}>
        {axisLabel}
      </span>
    )}
  </button>
);

// ── Live preview ──────────────────────────────────────────────────────────────
const LivePreview: React.FC<{
  xField: string; yField: string; yAgg: string;
  colorField: string; chartType: string; limit: number;
}> = ({ xField, yField, yAgg, colorField, chartType, limit }) => {
  const ready = !!(xField && yField);
  const { data, isLoading, isError } = useQuery<QueryResult>({
    queryKey: ['dwe-live', xField, yField, yAgg, colorField, chartType, limit],
    queryFn:  () => apiClient.post('/builder/query', {
      x_field: xField, y_field: yField, y_agg: yAgg,
      color_field: colorField || null, limit,
    }).then(r => r.data),
    enabled: ready, staleTime: 60_000,
  });
  const option = useMemo(() => data ? buildOption(data, chartType) : null, [data, chartType]);

  if (!ready) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.12)' }}>
        <BarChart3 className="w-7 h-7 text-indigo-400/40" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#475569]">Select dimension & measure</p>
        <p className="text-xs text-[#334155] mt-1">from the schema panel on the left</p>
      </div>
    </div>
  );
  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      <p className="text-xs text-[#475569]">Fetching data…</p>
    </div>
  );
  if (isError || !option) return (
    <div className="h-full flex items-center justify-center gap-2 text-sm text-red-400">
      <AlertCircle className="w-4 h-4" /> Error loading data
    </div>
  );
  return <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />;
};

// ── Chart builder panel ───────────────────────────────────────────────────────
const SubChartBuilder: React.FC<{
  dashboardId: string;
  onClose: () => void;
  onSaved: () => void;
}> = ({ dashboardId, onClose, onSaved }) => {
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
    queryFn:  () => apiClient.get('/builder/schema').then(r => r.data),
    staleTime: Infinity,
  });
  const dims = useMemo(() => schema?.dimensions  ?? [], [schema]);
  const meas = useMemo(() => schema?.measures    ?? [], [schema]);
  const aggs = useMemo(() => schema?.aggregations ?? [], [schema]);

  useEffect(() => { if (dims.length > 0 && !xField) setXField(dims[0].field); }, [dims, xField]);
  useEffect(() => { if (meas.length > 0 && !yField) setYField(meas[0].field); }, [meas, yField]);

  const handleSave = async () => {
    if (!xField || !yField || saving) return;
    setSaving(true);
    try {
      await apiClient.post(`/builder/dashboards/${dashboardId}/widgets`, {
        title: title.trim() || `${yAgg.toUpperCase()}(${yField}) by ${xField}`,
        widget_key: 'custom_chart',
        chart_spec: { xField, yField, yAgg, colorField: colorField || null, chartType, limit },
        grid_w: DEFAULT_W,
        grid_h: DEFAULT_H,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>

      {/* LEFT — Schema browser */}
      <div className="flex flex-col shrink-0 overflow-hidden"
        style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,13,26,0.8)' }}>

        <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold text-[#E2E8F0]">Schema Browser</p>
          <p className="text-[11px] text-[#475569] mt-0.5">Click a field to assign X / Y axis</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
          {schemaLoading
            ? <div className="flex items-center justify-center py-10"><Loader2 className="w-4 h-4 animate-spin text-indigo-400" /></div>
            : (
              <>
                <div>
                  <div className="flex items-center gap-1.5 mb-2 px-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">Dimensions</p>
                    <span className="text-[10px] text-[#334155] ml-auto">{dims.length}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {dims.map(f => (
                      <FieldPill key={f.field} field={f} type="dimension"
                        isSelected={xField === f.field || colorField === f.field}
                        axisLabel={xField === f.field ? 'X' : colorField === f.field ? 'C' : ''}
                        onClick={() => setXField(prev => prev === f.field ? '' : f.field)} />
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
                      <FieldPill key={f.field} field={f} type="measure"
                        isSelected={yField === f.field}
                        axisLabel={yField === f.field ? 'Y' : ''}
                        onClick={() => setYField(prev => prev === f.field ? '' : f.field)} />
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>
      </div>

      {/* RIGHT — Canvas */}
      <div className="flex flex-col flex-1 min-w-0" style={{ minHeight: 0 }}>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap gap-y-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.01)' }}>

          {/* Chart type */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {CHART_TYPES.map(({ key, label, Icon }) => {
              const active = chartType === key;
              return (
                <button key={key} onClick={() => setChartType(key)} title={label}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                    border: `1px solid ${active ? 'rgba(99,102,241,0.45)' : 'transparent'}`,
                    color: active ? '#A5B4FC' : '#64748B',
                  }}>
                  <Icon className="w-3 h-3" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* X badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: xField ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${xField ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <span className="text-[10px] font-bold text-[#475569]">X</span>
              <span className="text-xs font-medium" style={{ color: xField ? '#A5B4FC' : '#334155' }}>
                {xField ? (dims.find(d => d.field === xField)?.label ?? xField) : 'None'}
              </span>
              {xField && (
                <button onClick={() => setXField('')} className="text-[#475569] hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Y badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{
                background: yField ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${yField ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.07)'}`,
              }}>
              <span className="text-[10px] font-bold text-[#475569]">Y</span>
              <span className="text-xs font-medium" style={{ color: yField ? '#34D399' : '#334155' }}>
                {yField ? (meas.find(m => m.field === yField)?.label ?? yField) : 'None'}
              </span>
              {yField && (
                <button onClick={() => setYField('')} className="text-[#475569] hover:text-red-400">
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>

            {/* Aggregation */}
            <div className="relative">
              <button onClick={() => setShowAggDrop(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94A3B8' }}>
                <span className="text-[10px] font-bold text-[#475569]">AGG</span>
                {yAgg.toUpperCase()} <ChevronDown className="w-3 h-3" />
              </button>
              {showAggDrop && (
                <div className="absolute top-full left-0 mt-1 z-30 py-1 rounded-xl"
                  style={{ background: '#0D1E36', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.6)', minWidth: 110 }}
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

            {/* Color */}
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

            {/* Rows */}
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

        {/* Preview area */}
        <div className="flex-1 min-h-0 p-6">
          <div className="h-full rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <LivePreview xField={xField} yField={yField} yAgg={yAgg} colorField={colorField} chartType={chartType} limit={limit} />
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(6,13,26,0.9)' }}>
          <input
            placeholder="Chart title  (auto-generated if blank)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-[#E2E8F0] outline-none placeholder:text-[#334155]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
          />
          <button onClick={handleSave} disabled={!xField || !yField || saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0"
            style={{
              background: (!xField || !yField) ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: (!xField || !yField) ? '#334155' : '#fff',
              cursor: (!xField || !yField) ? 'not-allowed' : 'pointer',
              boxShadow: (!xField || !yField) ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
            }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Add to Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main editor ───────────────────────────────────────────────────────────────
const DashboardWidgetEditor: React.FC = () => {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const navigate        = useNavigate();
  const queryClient     = useQueryClient();

  const [showBuilder, setShowBuilder] = useState(false);
  const [draftLayout, setDraftLayout] = useState<Layout[] | null>(null);

  const { data: widgets, isLoading } = useQuery<ChartWidget[]>({
    queryKey: ['widgets', dashboardId],
    queryFn:  () => apiClient.get(`/builder/dashboards/${dashboardId}/widgets`).then(r => r.data),
    enabled: !!dashboardId,
  });

  // Build grid layouts — use draft while user is dragging/resizing
  const layouts: Layout[] = useMemo(() => {
    if (draftLayout) return draftLayout;
    if (!widgets) return [];
    return widgets.map((w, idx) => ({
      i: String(w.id),
      x: w.grid_x ?? (idx % 2) * DEFAULT_W,
      y: w.grid_y ?? Math.floor(idx / 2) * DEFAULT_H,
      w: w.grid_w ?? DEFAULT_W,
      h: w.grid_h ?? DEFAULT_H,
    }));
  }, [widgets, draftLayout]);

  const handleLayoutChange = useCallback((_current: Layout[], all: Layouts) => {
    const next = all.lg ?? _current;
    setDraftLayout(next);
  }, []);

  const savePositions = useMutation({
    mutationFn: (positions: Layout[]) =>
      apiClient.put(`/builder/dashboards/${dashboardId}/widgets/positions`, {
        positions: positions.map(p => ({
          id: parseInt(p.i), grid_x: p.x, grid_y: p.y, grid_w: p.w, grid_h: p.h,
        })),
      }),
    onSuccess: () => {
      setDraftLayout(null);
      queryClient.invalidateQueries({ queryKey: ['widgets', dashboardId] });
    },
  });

  const deleteWidget = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/builder/widgets/${id}`),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['widgets', dashboardId] }),
  });

  const togglePublish = useMutation({
    mutationFn: ({ widgetId, is_published }: { widgetId: number; is_published: boolean }) =>
      apiClient.put(`/builder/widgets/${widgetId}`, { is_published: !is_published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['widgets', dashboardId] }),
  });

  const hasChanges = draftLayout !== null;

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0, background: '#070F1D' }}>

      {/* ── Grid CSS overrides ── */}
      <style>{`
        .dwe-grid .react-grid-item {
          transition: box-shadow 0.15s ease !important;
        }
        .dwe-grid .react-grid-item.react-draggable-dragging {
          box-shadow: 0 12px 48px rgba(99,102,241,0.25) !important;
          z-index: 100;
        }
        .dwe-grid .react-grid-item.react-grid-placeholder {
          background: rgba(99,102,241,0.08) !important;
          border: 1.5px dashed rgba(99,102,241,0.4) !important;
          border-radius: 16px !important;
          opacity: 1 !important;
          box-shadow: none !important;
        }
        .dwe-grid .react-resizable-handle {
          width: 20px !important; height: 20px !important;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .dwe-grid .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
        .dwe-grid .react-resizable-handle-se {
          bottom: 4px !important; right: 4px !important;
        }
        .dwe-grid .react-resizable-handle::after {
          border-right: 2px solid rgba(99,102,241,0.7) !important;
          border-bottom: 2px solid rgba(99,102,241,0.7) !important;
          width: 8px !important; height: 8px !important;
          bottom: 3px !important; right: 3px !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{
          background: 'rgba(9,21,37,0.98)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:bg-white/[0.07] text-[#64748B] hover:text-[#94A3B8]">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-white/[0.08]" />
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-indigo-400" />
              <h1 className="text-[15px] font-bold text-[#F1F5F9]">
                {showBuilder ? 'Add Chart' : 'Page Layout Editor'}
              </h1>
              {!showBuilder && hasChanges && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.25)' }}>
                  UNSAVED
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#475569] mt-0.5">
              {showBuilder
                ? 'Configure chart → preview → Add to Page'
                : 'Drag cards to reposition  ·  Resize from the corner handle'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showBuilder ? (
            <button onClick={() => setShowBuilder(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}>
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          ) : (
            <>
              {hasChanges && (
                <button onClick={() => savePositions.mutate(layouts)} disabled={savePositions.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                  {savePositions.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Layout
                </button>
              )}
              <button onClick={() => setShowBuilder(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                <Sparkles className="w-3.5 h-3.5" /> Add Chart
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* Builder panel */}
        {showBuilder && dashboardId && (
          <SubChartBuilder
            dashboardId={dashboardId}
            onClose={() => setShowBuilder(false)}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['widgets', dashboardId] })}
          />
        )}

        {/* Widget grid */}
        {!showBuilder && (
          <div className="h-full overflow-y-auto px-6 py-6">

            {isLoading && (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
              </div>
            )}

            {!isLoading && (!widgets || widgets.length === 0) && (
              <div className="flex flex-col items-center justify-center py-28 rounded-3xl"
                style={{ border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <BarChart3 className="w-7 h-7 text-indigo-400/50" />
                </div>
                <p className="text-base font-semibold text-[#475569] mb-1">No charts yet</p>
                <p className="text-sm text-[#334155] mb-6">Click "Add Chart" to build your first visualisation</p>
                <button onClick={() => setShowBuilder(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
                  <Sparkles className="w-4 h-4" /> Add Chart
                </button>
              </div>
            )}

            {widgets && widgets.length > 0 && (
              <div className="dwe-grid">
                <ResponsiveGrid
                  layouts={{ lg: layouts, md: layouts, sm: layouts }}
                  breakpoints={BREAKPOINTS}
                  cols={COLS}
                  rowHeight={ROW_HEIGHT}
                  margin={[16, 16]}
                  containerPadding={[0, 0]}
                  isDraggable={true}
                  isResizable={true}
                  draggableHandle=".drag-handle"
                  onLayoutChange={handleLayoutChange}
                  useCSSTransforms={true}
                  resizeHandles={['se']}
                  compactType={null}
                  preventCollision={false}
                >
                  {widgets.map(w => (
                    <div key={String(w.id)}>
                      <WidgetCard
                        w={w}
                        onTogglePublish={() => togglePublish.mutate({ widgetId: w.id, is_published: w.is_published })}
                        onDelete={() => deleteWidget.mutate(w.id)}
                      />
                    </div>
                  ))}
                </ResponsiveGrid>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardWidgetEditor;
