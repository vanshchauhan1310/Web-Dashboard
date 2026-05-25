import React from 'react';
import { ChartCard, SectionLabel } from '../../dashboard/DashboardChrome';
import { useProcurementFilters } from '../../context/ProcurementFiltersContext';
import SupplierKPIs from '../../dashboard/procurement/supplier/SupplierKPIs';
import SupplierSunburstChart from '../../dashboard/procurement/supplier/SupplierSunburstChart';
import SupplierCandlestickChart from '../../dashboard/procurement/supplier/SupplierCandlestickChart';
import SupplierBulletChart from '../../dashboard/procurement/supplier/SupplierBulletChart';
import SupplierRadarChart from '../../dashboard/procurement/supplier/SupplierRadarChart';
import SupplierScatterChart from '../../dashboard/procurement/supplier/SupplierScatterChart';

const SupplierPerformanceDashboard: React.FC = () => {
  const { filters } = useProcurementFilters();

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-textMain tracking-tight">Supplier Performance</h1>
          <p className="text-sm text-textMuted mt-1">
            Supplier scorecard · lead times, quality, cost efficiency and tier analysis
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {filters.supplier !== 'All Suppliers' ? filters.supplier : filters.time_period === 'All Time' ? 'All suppliers' : filters.time_period}
        </div>
      </div>

      {/* ── KPIs ── */}
      <SupplierKPIs />

      {/* ── Supplier Hierarchy & Scorecard ── */}
      <div>
        <SectionLabel label="Supplier Hierarchy & Scorecard" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Spend Flow — Sankey Diagram"
            subtitle="Tier → Category → Supplier · link width proportional to spend ($K)"
            height="h-[440px]"
          >
            <div className="p-3 h-full">
              <SupplierSunburstChart />
            </div>
          </ChartCard>
          <ChartCard
            title="Multi-Dimension Performance Radar"
            subtitle="Top 5 suppliers scored across delivery, quality, cost, responsiveness & flexibility"
            height="h-[440px]"
          >
            <div className="p-3 h-full">
              <SupplierRadarChart />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Lead Time & KPI Benchmarking ── */}
      <div>
        <SectionLabel label="Lead Time & KPI Benchmarking" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Lead Time Variability — Candlestick"
            subtitle="Min / Q1 / Q3 / Max delivery days per supplier · diamond = average"
            height="h-[400px]"
          >
            <div className="p-3 h-full">
              <SupplierCandlestickChart />
            </div>
          </ChartCard>
          <ChartCard
            title="Overall Score — Bullet Chart"
            subtitle="Supplier performance score vs target (85) with tier zones"
            height="h-[400px]"
          >
            <div className="p-3 h-full">
              <SupplierBulletChart />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Cost vs Quality ── */}
      <div>
        <SectionLabel label="Cost vs Quality Matrix" />
        <div className="grid grid-cols-1 gap-5">
          <ChartCard
            title="Cost Efficiency vs Quality Score — Scatter"
            subtitle="Bubble size = order volume · top-right quadrant = ideal suppliers · dashed lines = thresholds"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <SupplierScatterChart />
            </div>
          </ChartCard>
        </div>
      </div>

    </div>
  );
};

export default SupplierPerformanceDashboard;
