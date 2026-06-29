import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layout } from 'react-grid-layout';

export interface CustomChartSpec {
  xField:     string;
  yField:     string;
  yAgg:       string;
  colorField: string | null;
  chartType:  string;
  limit:      number;
}

export interface WidgetConfig {
  id:         string;
  widgetKey:  string;        // 'custom_chart' for builder-created charts
  title:      string;
  subtitle?:  string;
  chartSpec?: CustomChartSpec; // only set when widgetKey === 'custom_chart'
}

export interface MasterChart {
  id:    string;
  title: string;
  spec:  CustomChartSpec;
}

interface LayoutStore {
  layouts:          Layout[];
  widgets:          WidgetConfig[];
  isEditMode:       boolean;
  masterCharts:     Record<string, MasterChart[]>;
  setLayouts:       (layouts: Layout[]) => void;
  addWidget:        (widgetKey: string, title: string, subtitle?: string) => void;
  addCustomChart:   (title: string, spec: CustomChartSpec) => void;
  removeWidget:     (id: string) => void;
  setEditMode:      (val: boolean) => void;
  resetToDefault:   () => void;
  addMasterChart:   (masterId: string, title: string, spec: CustomChartSpec) => void;
  removeMasterChart:(masterId: string, chartId: string) => void;
}

export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'w1', widgetKey: 'exec_monthly_sales', title: 'Monthly Sales & Profit',   subtitle: 'Trend with profit bars'              },
  { id: 'w2', widgetKey: 'exec_category',      title: 'Category Performance',      subtitle: 'Sales and profit by category'         },
  { id: 'w3', widgetKey: 'exec_segment',       title: 'Segment Revenue Share',     subtitle: 'Consumer / Corporate / Home Office'   },
  { id: 'w4', widgetKey: 'exec_pareto',        title: 'Country Revenue Pareto',    subtitle: 'Cumulative revenue contribution'      },
  { id: 'w5', widgetKey: 'exec_waterfall',     title: 'Profit Waterfall',          subtitle: 'Gross sales to net profit bridge'     },
];

export const DEFAULT_LAYOUTS: Layout[] = [
  { i: 'w1', x: 0, y: 0,  w: 4, h: 5 },
  { i: 'w2', x: 4, y: 0,  w: 4, h: 5 },
  { i: 'w3', x: 8, y: 0,  w: 4, h: 5 },
  { i: 'w4', x: 0, y: 5,  w: 6, h: 6 },
  { i: 'w5', x: 6, y: 5,  w: 6, h: 6 },
];

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set, get) => ({
      layouts:      DEFAULT_LAYOUTS,
      widgets:      DEFAULT_WIDGETS,
      isEditMode:   false,
      masterCharts: {},

      setLayouts: (layouts) => set({ layouts }),

      addWidget: (widgetKey, title, subtitle) => {
        const id = `w_${Date.now()}`;
        const { layouts, widgets } = get();
        const maxY = layouts.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        set({
          widgets: [...widgets, { id, widgetKey, title, subtitle }],
          layouts: [...layouts, { i: id, x: 0, y: maxY, w: 4, h: 5 }],
        });
      },

      addCustomChart: (title, spec) => {
        const id = `custom_${Date.now()}`;
        const { layouts, widgets } = get();
        const maxY = layouts.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        set({
          widgets: [
            ...widgets,
            {
              id,
              widgetKey: 'custom_chart',
              title,
              subtitle: `${spec.yAgg}(${spec.yField}) by ${spec.xField}`,
              chartSpec: spec,
            },
          ],
          layouts: [...layouts, { i: id, x: 0, y: maxY, w: 6, h: 6 }],
        });
      },

      removeWidget: (id) => {
        const { layouts, widgets } = get();
        set({
          widgets: widgets.filter(w => w.id !== id),
          layouts: layouts.filter(l => l.i !== id),
        });
      },

      setEditMode: (val) => set({ isEditMode: val }),

      resetToDefault: () => set({ layouts: DEFAULT_LAYOUTS, widgets: DEFAULT_WIDGETS }),

      addMasterChart: (masterId, title, spec) => {
        const id = `mc_${Date.now()}`;
        const { masterCharts } = get();
        const existing = masterCharts[masterId] ?? [];
        set({ masterCharts: { ...masterCharts, [masterId]: [...existing, { id, title, spec }] } });
      },

      removeMasterChart: (masterId, chartId) => {
        const { masterCharts } = get();
        const existing = masterCharts[masterId] ?? [];
        set({ masterCharts: { ...masterCharts, [masterId]: existing.filter(c => c.id !== chartId) } });
      },
    }),
    { name: 'nexus-custom-layout' },
  ),
);
