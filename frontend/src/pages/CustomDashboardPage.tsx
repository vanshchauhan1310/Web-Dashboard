import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3, AlertCircle } from 'lucide-react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import apiClient from '../api/client';
import EChartWrapper from '../charts/echarts/EChartWrapper';
import { buildOption, type QueryResult } from '../utils/chartBuilderUtils';

const ResponsiveGrid = WidthProvider(Responsive);
const ROW_HEIGHT = 80;
const COLS = { lg: 12, md: 8, sm: 4 };
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768 };

interface SubDashboard {
  id: number; title: string; description: string | null;
}
interface MasterDashboard {
  id: number; title: string; description: string | null; gradient: string | null;
}
interface ChartWidget {
  id: number; title: string; subtitle: string | null;
  chart_spec: any | null; widget_key: string | null;
  grid_x: number; grid_y: number; grid_w: number; grid_h: number;
}

// ── Individual chart tile ─────────────────────────────────────────────────────
const ChartTile: React.FC<{ widget: ChartWidget }> = ({ widget }) => {
  const spec = widget.chart_spec;

  const { data, isLoading, isError } = useQuery<QueryResult>({
    queryKey: ['cdp-chart', widget.id, spec?.xField, spec?.yField, spec?.yAgg, spec?.chartType, spec?.limit],
    queryFn: () => apiClient.post('/builder/query', {
      x_field: spec.xField, y_field: spec.yField, y_agg: spec.yAgg,
      color_field: spec.colorField ?? null, limit: spec.limit ?? 20,
    }).then(r => r.data),
    enabled: !!spec?.xField && !!spec?.yField,
    staleTime: 5 * 60_000,
  });

  const option = useMemo(() => data ? buildOption(data, spec?.chartType ?? 'bar') : null, [data, spec]);

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl flex flex-col"
      style={{ background: 'rgba(14,28,48,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Card header */}
      <div className="px-4 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm font-semibold text-[#F1F5F9] leading-tight">{widget.title}</p>
        {widget.subtitle && (
          <p className="text-xs text-[#64748B] mt-0.5">{widget.subtitle}</p>
        )}
      </div>

      {/* Chart body */}
      <div className="flex-1 min-h-0 p-3">
        {!spec?.xField || !spec?.yField ? (
          <div className="h-full flex items-center justify-center text-xs text-[#475569]">
            No chart configured
          </div>
        ) : isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          </div>
        ) : isError || !option ? (
          <div className="h-full flex items-center justify-center gap-1.5 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> Error loading data
          </div>
        ) : (
          <EChartWrapper option={option} style={{ width: '100%', height: '100%' }} />
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const CustomDashboardPage: React.FC = () => {
  const { masterId, subDashboardId } = useParams<{ masterId: string; subDashboardId: string }>();

  const { data: masters } = useQuery<MasterDashboard[]>({
    queryKey: ['master-dashboards'],
    queryFn: () => apiClient.get('/builder/master-dashboards').then(r => r.data),
    staleTime: 5 * 60_000,
  });
  const master = masters?.find(d => d.id === Number(masterId)) ?? null;

  const { data: sub } = useQuery<SubDashboard | null>({
    queryKey: ['viewer-sub-info', subDashboardId],
    queryFn: () => apiClient.get(`/builder/master-dashboards/${masterId}/dashboards`)
      .then(r => (r.data as SubDashboard[]).find(s => s.id === Number(subDashboardId)) ?? null),
    enabled: !!masterId && !!subDashboardId,
    staleTime: 5 * 60_000,
  });

  const { data: widgets, isLoading } = useQuery<ChartWidget[]>({
    queryKey: ['cdp-widgets', subDashboardId],
    queryFn: () => apiClient.get(`/builder/dashboards/${subDashboardId}/widgets`).then(r => r.data),
    enabled: !!subDashboardId,
    staleTime: 5 * 60_000,
  });

  const layouts: Layout[] = useMemo(() => {
    if (!widgets) return [];
    return widgets.map(w => ({
      i: String(w.id), x: w.grid_x, y: w.grid_y, w: w.grid_w, h: w.grid_h,
      static: true,
    }));
  }, [widgets]);

  const gradient = master?.gradient ?? 'linear-gradient(135deg,#6366F1,#8B5CF6)';

  return (
    <div>
      <style>{`
        .cdp-grid .react-grid-item { transition: none !important; }
      `}</style>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-8 rounded-full" style={{ background: gradient }} />
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">
              {sub?.title ?? master?.title ?? '…'}
            </h1>
            {sub?.description && (
              <p className="text-sm text-[#64748B] mt-0.5">{sub.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && widgets?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ border: '2px dashed rgba(255,255,255,0.07)' }}>
          <BarChart3 className="w-12 h-12 text-[#334155] mb-3" />
          <p className="text-sm text-[#64748B]">No charts on this page yet</p>
        </div>
      )}

      {/* Chart grid — read-only, respects developer's layout */}
      {widgets && widgets.length > 0 && (
        <div className="cdp-grid">
          <ResponsiveGrid
            layouts={{ lg: layouts, md: layouts, sm: layouts }}
            breakpoints={BREAKPOINTS} cols={COLS}
            rowHeight={ROW_HEIGHT} margin={[16, 16]} containerPadding={[0, 0]}
            isDraggable={false} isResizable={false}
            useCSSTransforms={false}
          >
            {widgets.map(w => (
              <div key={w.id}>
                <ChartTile widget={w} />
              </div>
            ))}
          </ResponsiveGrid>
        </div>
      )}
    </div>
  );
};

export default CustomDashboardPage;
