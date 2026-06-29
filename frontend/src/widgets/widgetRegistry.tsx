import type { ExecutiveFilters } from '../hooks/useAnalytics';
import {
  ExecutiveMonthlySalesProfitChart,
  ExecutiveCategoryBarChart,
  ExecutiveSegmentDonutChart,
  ExecutiveParetoCountryChart,
  ExecutiveProfitWaterfallChart,
} from '../dashboard/executive/ExecutiveCharts';

export interface WidgetDef {
  key:         string;
  label:       string;
  description: string;
  category:    string;
  defaultSize: { w: number; h: number };
  component:   React.ComponentType<{ filters: ExecutiveFilters }>;
}

export const WIDGET_REGISTRY: Record<string, WidgetDef> = {
  exec_monthly_sales: {
    key:         'exec_monthly_sales',
    label:       'Monthly Sales & Profit',
    description: 'Trend line for monthly sales with profit overlay bars',
    category:    'Sales',
    defaultSize: { w: 4, h: 5 },
    component:   ExecutiveMonthlySalesProfitChart,
  },
  exec_category: {
    key:         'exec_category',
    label:       'Category Performance',
    description: 'Grouped bar chart — sales and profit by product category',
    category:    'Sales',
    defaultSize: { w: 4, h: 5 },
    component:   ExecutiveCategoryBarChart,
  },
  exec_segment: {
    key:         'exec_segment',
    label:       'Segment Revenue Share',
    description: 'Donut showing Consumer, Corporate, Home Office revenue split',
    category:    'Sales',
    defaultSize: { w: 4, h: 5 },
    component:   ExecutiveSegmentDonutChart,
  },
  exec_pareto: {
    key:         'exec_pareto',
    label:       'Country Revenue Pareto',
    description: 'Bar + cumulative line for top countries by revenue',
    category:    'Sales',
    defaultSize: { w: 6, h: 6 },
    component:   ExecutiveParetoCountryChart,
  },
  exec_waterfall: {
    key:         'exec_waterfall',
    label:       'Profit Waterfall',
    description: 'Bridge chart from gross sales to net profit',
    category:    'Sales',
    defaultSize: { w: 6, h: 6 },
    component:   ExecutiveProfitWaterfallChart,
  },
};

export const WIDGET_CATEGORIES = Array.from(
  new Set(Object.values(WIDGET_REGISTRY).map(w => w.category)),
);
