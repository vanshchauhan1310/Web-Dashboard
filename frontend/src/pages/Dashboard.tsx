import React, { useState } from 'react';
import { ChartCard, DashboardPage, SectionLabel } from '../dashboard/DashboardChrome';
import ExecutiveFiltersBar from '../dashboard/executive/ExecutiveFilters';
import ExecutiveKPIs from '../dashboard/executive/ExecutiveKPIs';
import {
  ExecutiveCategoryBarChart,
  ExecutiveMonthlySalesProfitChart,
  ExecutiveParetoCountryChart,
  ExecutiveProfitWaterfallChart,
  ExecutiveSegmentDonutChart,
} from '../dashboard/executive/ExecutiveCharts';
import type { ExecutiveFilters } from '../hooks/useAnalytics';

const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<Required<ExecutiveFilters>>({
    market: 'All Markets',
    segment: 'All Segments',
    year: 'All Years',
  });

  return (
    <DashboardPage
      title="Executive Sales Dashboard"
      subtitle="Sales, profit, market contribution, and executive-level performance signals"
    >
      <ExecutiveFiltersBar filters={filters} onChange={setFilters} />
      <ExecutiveKPIs filters={filters} />

      <div>
        <SectionLabel label="Basic Views" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard
            title="Monthly Sales & Profit"
            subtitle="Trend line for sales with profit bars"
            height="h-[430px]"
          >
            <div className="p-3 h-full">
              <ExecutiveMonthlySalesProfitChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Category Performance"
            subtitle="Sales and profit by product category"
            height="h-[430px]"
          >
            <div className="p-3 h-full">
              <ExecutiveCategoryBarChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Segment Revenue Share"
            subtitle="Consumer, Corporate, and Home Office mix"
            height="h-[430px]"
          >
            <div className="p-3 h-full">
              <ExecutiveSegmentDonutChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>

      <div>
        <SectionLabel label="Advanced Views" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <ChartCard
            title="Country Revenue Pareto"
            subtitle="Top countries with cumulative revenue contribution"
            height="h-[500px]"
          >
            <div className="p-3 h-full">
              <ExecutiveParetoCountryChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Profit Waterfall"
            subtitle="Gross sales bridge through discounts, shipping, and cost base"
            height="h-[500px]"
          >
            <div className="p-3 h-full">
              <ExecutiveProfitWaterfallChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardPage>
  );
};

export default Dashboard;
