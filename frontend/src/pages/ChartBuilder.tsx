import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BarChart2, TrendingUp, PieChart, ScatterChart, Activity,
  ChevronDown, RotateCcw, Sparkles, Database, Loader2, AlertCircle,
  ArrowLeft, Plus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import apiClient from '../api/client';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { CARD_STYLE } from '../dashboard/DashboardChrome';
import { useLayoutStore, type CustomChartSpec } from '../store/layoutStore';
import { buildOption, type QueryResult } from '../utils/chartBuilderUtils';

// ── Types ────────────────────────────────────────────────────────────────────

interface FieldMeta { field: string; label: string }
interface AggMeta   { key: string;   label: string }

interface Schema {
  dimensions:   FieldMeta[];
  measures:     FieldMeta[];
  aggregations: AggMeta[];
  chartTypes:   string[];
}


interface Shelf {
  field: string;
  label: string;
  kind:  'dimension' | 'measure';
}

// ── Chart types config ────────────────────────────────────────────────────────

const CHART_META: { type: string; label: string; Icon: React.ElementType }[] = [
  { type: 'bar',     label: 'Bar',     Icon: BarChart2    },
  { type: 'line',    label: 'Line',    Icon: TrendingUp   },
  { type: 'area',    label: 'Area',    Icon: Activity     },
  { type: 'pie',     label: 'Pie',     Icon: PieChart     },
  { type: 'scatter', label: 'Scatter', Icon: ScatterChart },
];

// buildOption is now imported from utils/chartBuilderUtils

// ── Drop shelf zone ───────────────────────────────────────────────────────────

const ShelfZone: React.FC<{
  label:       string;
  accepts:     'dimension' | 'measure' | 'any';
  value:       Shelf | null;
  onDrop:      (s: Shelf) => void;
  onClear:     () => void;
  hint?:       string;
}> = ({ label, accepts, value, onDrop, onClear, hint }) => {
  const [dragOver, setDragOver] = useState(false);

  // We pass drag data via a module-level ref since HTML5 drag events can't carry React state
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    const { field, label: lbl, kind } = JSON.parse(raw) as { field: string; label: string; kind: 'dimension' | 'measure' };
    if (accepts !== 'any' && kind !== accepts) return;
    onDrop({ field, label: lbl, kind });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={clsx(
        'flex-1 min-w-0 rounded-xl p-3 transition-all duration-150',
        dragOver ? 'ring-2' : '',
      )}
      style={{
        border:     dragOver
          ? '1px dashed rgba(99,102,241,0.7)'
          : '1px dashed rgba(255,255,255,0.1)',
        background: dragOver ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
        ...(dragOver ? { '--tw-ring-color': 'rgba(99,102,241,0.3)' } as React.CSSProperties : {}),
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-2"
        style={{ color: dragOver ? '#A5B4FC' : '#64748B' }}>
        {label}
      </p>
      {value ? (
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: value.kind === 'dimension' ? '#3B82F6' : '#10B981' }} />
            <span className="text-[12px] font-medium text-textMain truncate">{value.label}</span>
          </div>
          <button onClick={onClear} className="p-0.5 rounded hover:bg-white/10 text-textMuted shrink-0">
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-textMuted">{hint ?? `Drop a ${accepts === 'any' ? 'field' : accepts} here`}</p>
      )}
    </div>
  );
};

// ── Main builder page ─────────────────────────────────────────────────────────

const ChartBuilder: React.FC = () => {
  const navigate = useNavigate();
  const addCustomChart = useLayoutStore(s => s.addCustomChart);

  const [xShelf, setXShelf]     = useState<Shelf | null>(null);
  const [yShelf, setYShelf]     = useState<Shelf | null>(null);
  const [colorShelf, setColorShelf] = useState<Shelf | null>(null);
  const [chartType, setChartType]   = useState('bar');
  const [yAgg, setYAgg]         = useState('sum');
  const [limit, setLimit]       = useState(20);
  const [added, setAdded]       = useState(false);

  // ── Schema ──────────────────────────────────────────────────────────────────

  const { data: schema, isLoading: schemaLoading, isError: schemaError } = useQuery<Schema>({
    queryKey: ['builder-schema'],
    queryFn:  () => apiClient.get('/builder/schema').then(r => r.data),
    staleTime: Infinity,
  });

  // ── Query (fires when X + Y are set) ────────────────────────────────────────

  const { mutate: runQuery, data: queryResult, isPending: querying, reset: resetResult } =
    useMutation<QueryResult, Error, void>({
      mutationFn: () =>
        apiClient.post('/builder/query', {
          x_field:     xShelf!.field,
          y_field:     yShelf!.field,
          y_agg:       yAgg,
          color_field: colorShelf?.field ?? null,
          limit,
        }).then(r => r.data),
    });

  const canQuery = !!xShelf && !!yShelf;

  // Auto-run when shelves or agg changes
  React.useEffect(() => {
    if (canQuery) runQuery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xShelf?.field, yShelf?.field, colorShelf?.field, yAgg, limit]);

  // ── ECharts option ───────────────────────────────────────────────────────────

  const chartOption = useMemo(() => {
    if (!queryResult) return null;
    return buildOption(queryResult, chartType);
  }, [queryResult, chartType]);

  // ── Add to dashboard ─────────────────────────────────────────────────────────

  const handleAddToDashboard = () => {
    if (!xShelf || !yShelf || !queryResult) return;
    const spec: CustomChartSpec = {
      xField:     xShelf.field,
      yField:     yShelf.field,
      yAgg,
      colorField: colorShelf?.field ?? null,
      chartType,
      limit,
    };
    addCustomChart(queryResult.y_label + ' by ' + queryResult.x_label, spec);
    setAdded(true);
    setTimeout(() => navigate('/custom/dashboard'), 800);
  };

  // ── Drag helpers ─────────────────────────────────────────────────────────────

  const startDrag = (f: FieldMeta, kind: 'dimension' | 'measure') => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ field: f.field, label: f.label, kind }));
  };

  const resetAll = () => {
    setXShelf(null); setYShelf(null); setColorShelf(null);
    setChartType('bar'); setYAgg('sum'); setLimit(20);
    resetResult();
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 pt-1 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/custom/dashboard"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-textMuted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-[22px] font-bold text-textMain tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Chart Builder
            </h1>
            <p className="text-sm text-textMuted mt-0.5">
              Drag dimensions and measures onto the shelves — your chart updates live
            </p>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-textMuted hover:text-textSub transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: 'calc(100vh - 180px)' }}>

        {/* ── Left panel: field list ─────────────────────────────────────── */}
        <div className="w-56 shrink-0 flex flex-col gap-4">
          <div className="rounded-2xl p-4 flex flex-col gap-3" style={CARD_STYLE}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-textMuted">
              Fields
            </p>

            {schemaLoading && (
              <div className="flex items-center gap-2 py-4 text-textMuted text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            )}
            {schemaError && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" /> Could not load schema
              </div>
            )}

            {schema && (
              <>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1.5">
                    Dimensions
                  </p>
                  <div className="flex flex-col gap-1">
                    {schema.dimensions.map(f => (
                      <div
                        key={f.field}
                        draggable
                        onDragStart={startDrag(f, 'dimension')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-blue-500/10"
                        style={{ border: '1px solid rgba(59,130,246,0.15)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[12px] font-medium text-textSub truncate">{f.label}</span>
                        <span className="ml-auto text-[10px] text-blue-500 shrink-0">ABC</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500 mb-1.5">
                    Measures
                  </p>
                  <div className="flex flex-col gap-1">
                    {schema.measures.map(f => (
                      <div
                        key={f.field}
                        draggable
                        onDragStart={startDrag(f, 'measure')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-emerald-500/10"
                        style={{ border: '1px solid rgba(16,185,129,0.15)' }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-[12px] font-medium text-textSub truncate">{f.label}</span>
                        <span className="ml-auto text-[10px] text-emerald-500 shrink-0">123</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Center: shelves + preview ─────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Shelf row */}
          <div className="rounded-2xl p-4" style={CARD_STYLE}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-textMuted mb-3">
              Drag fields here
            </p>
            <div className="flex gap-3">
              <ShelfZone
                label="X Axis"
                accepts="dimension"
                value={xShelf}
                onDrop={s => setXShelf(s)}
                onClear={() => setXShelf(null)}
                hint="Drop a dimension"
              />
              <ShelfZone
                label="Y Axis"
                accepts="measure"
                value={yShelf}
                onDrop={s => setYShelf(s)}
                onClear={() => setYShelf(null)}
                hint="Drop a measure"
              />
              <ShelfZone
                label="Color / Series"
                accepts="dimension"
                value={colorShelf}
                onDrop={s => setColorShelf(s)}
                onClear={() => setColorShelf(null)}
                hint="Optional split"
              />
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 rounded-2xl flex flex-col" style={{ ...CARD_STYLE, minHeight: 400 }}>
            <div className="px-5 py-3 shrink-0 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <h3 className="text-[13px] font-semibold text-textMain">
                  {queryResult
                    ? `${queryResult.y_label} by ${queryResult.x_label}`
                    : 'Live Preview'}
                </h3>
                <p className="text-[11px] text-textMuted mt-0.5">
                  {!canQuery
                    ? 'Drop at least one dimension (X) and one measure (Y) to render'
                    : querying
                    ? 'Fetching data…'
                    : queryResult
                    ? `${queryResult.categories.length} categories · ${queryResult.series.length} series`
                    : ''}
                </p>
              </div>
              {querying && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            </div>

            <div className="flex-1 min-h-0 p-4">
              {!canQuery && (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-textMuted">
                  <Database className="w-10 h-10 opacity-20" />
                  <p className="text-sm">Assign X and Y fields to generate a chart</p>
                </div>
              )}
              {canQuery && !queryResult && !querying && (
                <div className="h-full flex items-center justify-center text-textMuted text-sm">
                  Waiting…
                </div>
              )}
              {chartOption && !querying && (
                <EChartWrapper option={chartOption} style={{ width: '100%', height: '100%' }} />
              )}
            </div>
          </div>
        </div>

        {/* ── Right panel: chart type + config ─────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col gap-4">

          {/* Chart type */}
          <div className="rounded-2xl p-4 flex flex-col gap-2" style={CARD_STYLE}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-textMuted mb-1">
              Chart Type
            </p>
            {CHART_META.map(({ type, label, Icon }) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                  chartType === type
                    ? 'text-indigo-300'
                    : 'text-textMuted hover:text-textSub hover:bg-white/[0.04]',
                )}
                style={chartType === type ? {
                  background: 'rgba(99,102,241,0.12)',
                  border:     '1px solid rgba(99,102,241,0.25)',
                } : {
                  border: '1px solid transparent',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[13px] font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Aggregation */}
          <div className="rounded-2xl p-4" style={CARD_STYLE}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-textMuted mb-3">
              Aggregation
            </p>
            <div className="relative">
              <select
                value={yAgg}
                onChange={e => setYAgg(e.target.value)}
                className="w-full appearance-none rounded-lg px-3 py-2 text-[13px] font-medium text-textMain pr-8"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {schema?.aggregations.map(a => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted pointer-events-none" />
            </div>
          </div>

          {/* Row limit */}
          <div className="rounded-2xl p-4" style={CARD_STYLE}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-textMuted mb-3">
              Row Limit
            </p>
            <div className="relative">
              <select
                value={limit}
                onChange={e => setLimit(Number(e.target.value))}
                className="w-full appearance-none rounded-lg px-3 py-2 text-[13px] font-medium text-textMain pr-8"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {[10, 20, 30, 50].map(n => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textMuted pointer-events-none" />
            </div>
          </div>

          {/* Add to dashboard CTA */}
          {queryResult && (
            <>
              <button
                onClick={handleAddToDashboard}
                disabled={added}
                className={clsx(
                  'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all',
                  added ? 'cursor-default' : 'hover:brightness-110',
                )}
                style={{
                  background: added
                    ? 'linear-gradient(135deg,#10B981,#059669)'
                    : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  color: '#fff',
                  boxShadow: added
                    ? '0 4px 14px rgba(16,185,129,0.35)'
                    : '0 4px 14px rgba(99,102,241,0.35)',
                }}
              >
                {added
                  ? <>✓ Added to Dashboard</>
                  : <><Plus className="w-4 h-4" /> Add to Dashboard</>
                }
              </button>
              <Link
                to="/custom/dashboard"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium text-textMuted hover:text-indigo-300 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Go to Dashboard →
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
