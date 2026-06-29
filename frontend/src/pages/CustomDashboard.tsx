import React, { useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Pencil, Lock, Plus, X, GripHorizontal, RotateCcw, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { useLayoutStore, type WidgetConfig, type CustomChartSpec } from '../store/layoutStore';
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from '../widgets/widgetRegistry';
import { CARD_STYLE } from '../dashboard/DashboardChrome';
import ExecutiveFiltersBar from '../dashboard/executive/ExecutiveFilters';
import type { ExecutiveFilters } from '../hooks/useAnalytics';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import apiClient from '../api/client';
import { buildOption } from '../utils/chartBuilderUtils';

const ResponsiveGrid = WidthProvider(Responsive);

const ROW_HEIGHT  = 80;
const COLS        = { lg: 12, md: 8, sm: 4 };
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };

// ── Custom chart widget (fetches data from /builder/query using stored spec) ─

const CustomChartWidget: React.FC<{ spec: CustomChartSpec }> = ({ spec }) => {
  const { data: queryResult, isLoading, isError } = useQuery({
    queryKey: ['custom-chart', spec.xField, spec.yField, spec.yAgg, spec.colorField, spec.chartType, spec.limit],
    queryFn: () =>
      apiClient.post('/builder/query', {
        x_field:     spec.xField,
        y_field:     spec.yField,
        y_agg:       spec.yAgg,
        color_field: spec.colorField ?? null,
        limit:       spec.limit,
      }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const chartOption = useMemo(
    () => queryResult ? buildOption(queryResult, spec.chartType) : null,
    [queryResult, spec.chartType],
  );

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
    </div>
  );

  if (isError || !chartOption) return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-textMuted">
      <AlertCircle className="w-5 h-5 text-red-400" />
      <p className="text-xs">Failed to load chart data</p>
    </div>
  );

  return <EChartWrapper option={chartOption} style={{ width: '100%', height: '100%' }} />;
};

// ── Single widget card rendered inside a grid cell ──────────────────────────

const WidgetCard: React.FC<{
  widget:     WidgetConfig;
  filters:    ExecutiveFilters;
  isEditMode: boolean;
  onRemove:   () => void;
}> = ({ widget, filters, isEditMode, onRemove }) => {
  const isCustom = widget.widgetKey === 'custom_chart';
  const def = isCustom ? null : WIDGET_REGISTRY[widget.widgetKey];

  if (!isCustom && !def) {
    return (
      <div className="h-full flex items-center justify-center text-textMuted text-sm rounded-2xl" style={CARD_STYLE}>
        Unknown widget
      </div>
    );
  }

  const Chart = def?.component;

  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden relative" style={CARD_STYLE}>
      {/* Edit-mode dashed border overlay */}
      {isEditMode && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none z-10"
          style={{ border: '2px dashed rgba(99,102,241,0.35)' }} />
      )}

      {/* Header — drag handle in edit mode */}
      <div
        className={clsx(
          'px-4 py-3 flex items-center justify-between shrink-0 select-none',
          isEditMode && 'drag-handle cursor-grab active:cursor-grabbing',
        )}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEditMode && <GripHorizontal className="w-3.5 h-3.5 text-textMuted shrink-0" />}
          <div className="min-w-0 flex items-center gap-1.5">
            {isCustom && (
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-textMain truncate">{widget.title}</h3>
              {widget.subtitle && (
                <p className="text-[11px] text-textMuted mt-0.5 truncate">{widget.subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {isEditMode && (
          <button
            onClick={onRemove}
            className="ml-2 shrink-0 p-1 rounded-md transition-colors text-textMuted hover:text-red-400 hover:bg-red-500/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chart content */}
      <div className="flex-1 min-h-0 p-3">
        {isCustom && widget.chartSpec
          ? <CustomChartWidget spec={widget.chartSpec} />
          : Chart
            ? <Chart filters={filters} />
            : null
        }
      </div>
    </div>
  );
};

// ── Widget catalog slide-in panel ────────────────────────────────────────────

const WidgetCatalog: React.FC<{
  activeKeys: string[];
  onAdd:      (key: string) => void;
  onClose:    () => void;
}> = ({ activeKeys, onAdd, onClose }) => (
  <div
    className="fixed right-0 top-0 h-full w-72 z-50 flex flex-col"
    style={{
      background:  'linear-gradient(180deg,#091525 0%,#060D1A 100%)',
      borderLeft:  '1px solid rgba(255,255,255,0.07)',
      boxShadow:   '-8px 0 40px rgba(0,0,0,0.5)',
    }}
  >
    <div className="flex items-center justify-between px-4 py-4 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div>
        <h2 className="text-[14px] font-semibold text-textMain">Add Widget</h2>
        <p className="text-[11px] text-textMuted mt-0.5">Click to add to your canvas</p>
      </div>
      <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-textMuted transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto p-3 space-y-5">
      {WIDGET_CATEGORIES.map(cat => (
        <div key={cat}>
          <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-textMuted">{cat}</p>
          <div className="space-y-1.5">
            {Object.values(WIDGET_REGISTRY)
              .filter(w => w.category === cat)
              .map(w => {
                const added = activeKeys.includes(w.key);
                return (
                  <button
                    key={w.key}
                    onClick={() => !added && onAdd(w.key)}
                    disabled={added}
                    className={clsx(
                      'w-full text-left p-3 rounded-xl transition-all duration-150',
                      added
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-white/[0.05] cursor-pointer',
                    )}
                    style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-[13px] font-medium text-textMain">{w.label}</p>
                    <p className="text-[11px] text-textMuted mt-0.5 leading-snug">{w.description}</p>
                    {added && <p className="text-[10px] text-emerald-500 mt-1 font-medium">Already on canvas</p>}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      {/* Link to chart builder */}
      <div>
        <p className="px-1 mb-2 text-[10px] font-semibold uppercase tracking-widest text-textMuted">Custom</p>
        <Link
          to="/custom/builder"
          onClick={onClose}
          className="flex items-center gap-3 w-full p-3 rounded-xl transition-all duration-150 hover:bg-indigo-500/[0.08]"
          style={{ border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.06)' }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-indigo-300">Build a custom chart</p>
            <p className="text-[11px] text-textMuted mt-0.5">Open the drag-and-drop chart builder</p>
          </div>
        </Link>
      </div>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────

const CustomDashboard: React.FC = () => {
  const { layouts, widgets, isEditMode, setLayouts, addWidget, removeWidget, setEditMode, resetToDefault } =
    useLayoutStore();

  const [showCatalog, setShowCatalog] = useState(false);
  const [filters, setFilters] = useState<Required<ExecutiveFilters>>({
    market:  'All Markets',
    segment: 'All Segments',
    year:    'All Years',
  });

  const handleLayoutChange = useCallback((_current: Layout[], all: Layouts) => {
    const lg = all.lg ?? _current;
    setLayouts(lg);
  }, [setLayouts]);

  const activeWidgetKeys = widgets.map(w => w.widgetKey);
  const validLayouts     = layouts.filter(l => widgets.some(w => w.id === l.i));

  const handleAddWidget = (key: string) => {
    const def = WIDGET_REGISTRY[key];
    if (def) addWidget(key, def.label, def.description);
  };

  return (
    <>
      {/* Inject dark-theme overrides for RGL */}
      <style>{`
        .react-grid-item.react-grid-placeholder {
          background: rgba(99,102,241,0.12) !important;
          border: 1.5px dashed rgba(99,102,241,0.45) !important;
          border-radius: 16px !important;
          opacity: 1 !important;
        }
        .react-resizable-handle {
          opacity: 0;
          transition: opacity 0.15s;
        }
        .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
        .react-resizable-handle::after {
          border-color: rgba(99,102,241,0.6) !important;
          width: 6px !important;
          height: 6px !important;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pt-1 mb-6">
          <div>
            <h1 className="text-[22px] font-bold text-textMain tracking-tight">Custom Dashboard</h1>
            <p className="text-sm text-textMuted mt-1">
              {isEditMode
                ? 'Edit mode — drag headers to move, grab corners to resize, × to remove'
                : 'Your personalised canvas — toggle Edit Layout to rearrange widgets'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isEditMode && (
              <>
                <button
                  onClick={() => { resetToDefault(); setShowCatalog(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-textMuted hover:text-textSub transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
                <button
                  onClick={() => setShowCatalog(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
                  style={{
                    background: showCatalog ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.1)',
                    border:     '1px solid rgba(99,102,241,0.25)',
                    color:      '#A5B4FC',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Widget
                </button>
              </>
            )}

            <button
              onClick={() => { setEditMode(!isEditMode); setShowCatalog(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={isEditMode ? {
                background: 'rgba(16,185,129,0.12)',
                border:     '1px solid rgba(16,185,129,0.3)',
                color:      '#10B981',
              } : {
                background: 'rgba(255,255,255,0.06)',
                border:     '1px solid rgba(255,255,255,0.1)',
                color:      '#94A3B8',
              }}
            >
              {isEditMode
                ? <><Lock className="w-3.5 h-3.5" /> Save Layout</>
                : <><Pencil className="w-3.5 h-3.5" /> Edit Layout</>}
            </button>
          </div>
        </div>

        {/* Filters */}
        <ExecutiveFiltersBar filters={filters} onChange={setFilters} />

        {/* Edit-mode canvas hint */}
        {isEditMode && (
          <div className="mt-4 mb-2 px-4 py-2.5 rounded-xl text-[12px] text-indigo-300 font-medium flex items-center gap-2"
            style={{ background: 'rgba(99,102,241,0.07)', border: '1px dashed rgba(99,102,241,0.2)' }}>
            <GripHorizontal className="w-3.5 h-3.5" />
            Drag any chart header to reposition · Grab the bottom-right corner to resize · Click × to remove
          </div>
        )}

        {/* Responsive drag-and-drop grid */}
        <div className="mt-4">
          <ResponsiveGrid
            layouts={{ lg: validLayouts, md: validLayouts, sm: validLayouts }}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={ROW_HEIGHT}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            draggableHandle=".drag-handle"
            onLayoutChange={handleLayoutChange}
            useCSSTransforms
            resizeHandles={['se', 'sw']}
          >
            {widgets.map(widget => (
              <div key={widget.id} className="h-full w-full overflow-hidden rounded-2xl">
                <WidgetCard
                  widget={widget}
                  filters={filters}
                  isEditMode={isEditMode}
                  onRemove={() => removeWidget(widget.id)}
                />
              </div>
            ))}
          </ResponsiveGrid>
        </div>

        {widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-4 rounded-2xl mt-4"
            style={{ border: '2px dashed rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-textMuted text-sm">No widgets on canvas</p>
            <button
              onClick={() => { setEditMode(true); setShowCatalog(true); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#A5B4FC' }}
            >
              <Plus className="w-4 h-4" /> Add your first widget
            </button>
          </div>
        )}
      </div>

      {/* Catalog backdrop + panel */}
      {showCatalog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setShowCatalog(false)} />
          <WidgetCatalog
            activeKeys={activeWidgetKeys}
            onAdd={(key) => handleAddWidget(key)}
            onClose={() => setShowCatalog(false)}
          />
        </>
      )}
    </>
  );
};

export default CustomDashboard;
