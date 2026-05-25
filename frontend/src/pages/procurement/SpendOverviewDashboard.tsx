import React from 'react';
import { ChartCard, SectionLabel } from '../../dashboard/DashboardChrome';
import { useProcurementFilters } from '../../context/ProcurementFiltersContext';
import SpendKPIs from '../../dashboard/procurement/spend/SpendKPIs';
import ProcurementFunnelChart from '../../dashboard/procurement/spend/ProcurementFunnelChart';
import SpendByCategoryChart from '../../dashboard/procurement/spend/SpendByCategoryChart';
import MonthlySpendTrendChart from '../../dashboard/procurement/spend/MonthlySpendTrendChart';
import SpendByDepartmentChart from '../../dashboard/procurement/spend/SpendByDepartmentChart';
import TopVendorsWaterfallChart from '../../dashboard/procurement/spend/TopVendorsWaterfallChart';
import BudgetVsActualChart from '../../dashboard/procurement/spend/BudgetVsActualChart';

const SpendOverviewDashboard: React.FC = () => {
  const { filters } = useProcurementFilters();

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-textMain tracking-tight">Spend Overview</h1>
          <p className="text-sm text-textMuted mt-1">
            Procurement spend · cost breakdown across categories, vendors and departments
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {filters.time_period === 'All Time' ? 'All time data' : filters.time_period}
        </div>
      </div>

      {/* ── KPIs ── */}
      <SpendKPIs />

      {/* ── Spend Analysis ── */}
      <div>
        <SectionLabel label="Spend Analysis" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Procurement Funnel"
            subtitle="Requisition → Payment — conversion rate and spend at each stage"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <ProcurementFunnelChart />
            </div>
          </ChartCard>
          <ChartCard
            title="Spend by Category"
            subtitle="Total procurement spend ranked by category"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <SpendByCategoryChart />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Trends & Budget ── */}
      <div>
        <SectionLabel label="Trends & Budget" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Monthly Spend Trend"
            subtitle="Actual procurement spend vs budget — area chart with variance"
            height="h-[380px]"
          >
            <div className="p-3 h-full">
              <MonthlySpendTrendChart />
            </div>
          </ChartCard>
          <ChartCard
            title="Budget vs Actual by Category"
            subtitle="Spend performance vs allocated budget per category"
            height="h-[380px]"
          >
            <div className="p-3 h-full">
              <BudgetVsActualChart />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Vendor & Department ── */}
      <div>
        <SectionLabel label="Vendor & Department" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Top Vendors by Spend — Waterfall"
            subtitle="Cumulative spend contribution across top vendors"
            height="h-[380px]"
          >
            <div className="p-3 h-full">
              <TopVendorsWaterfallChart />
            </div>
          </ChartCard>
          <ChartCard
            title="Spend by Department"
            subtitle="Cost centre allocation as a share of total procurement spend"
            height="h-[380px]"
          >
            <div className="p-3 h-full">
              <SpendByDepartmentChart />
            </div>
          </ChartCard>
        </div>
      </div>

    </div>
  );
};

export default SpendOverviewDashboard;
