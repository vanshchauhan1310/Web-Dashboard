import React from 'react';
import { ChartCard, SectionLabel } from '../../dashboard/DashboardChrome';
import { useProcurementFilters } from '../../context/ProcurementFiltersContext';
import POKPIs from '../../dashboard/procurement/po/POKPIs';
import POStatusDonutChart from '../../dashboard/procurement/po/POStatusDonutChart';
import POSunburstChart from '../../dashboard/procurement/po/POSunburstChart';
import VendorComparisonRadarChart from '../../dashboard/procurement/po/VendorComparisonRadarChart';
import MonthlyPOTrendChart from '../../dashboard/procurement/po/MonthlyPOTrendChart';
import POCalendarHeatmap from '../../dashboard/procurement/po/POCalendarHeatmap';
import POAgingChart from '../../dashboard/procurement/po/POAgingChart';

const PurchaseOrdersDashboard: React.FC = () => {
  const { filters } = useProcurementFilters();

  const statusLabel =
    filters.status !== 'All Statuses'
      ? filters.status
      : filters.time_period === 'All Time'
        ? 'All orders'
        : filters.time_period;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-textMain tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-textMuted mt-1">
            PO lifecycle · status tracking, vendor comparison, aging analysis and monthly trends
          </p>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981',
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {statusLabel}
        </div>
      </div>

      {/* ── KPIs ── */}
      <POKPIs />

      {/* ── PO Status & Hierarchy ── */}
      <div>
        <SectionLabel label="PO Status & Procurement Hierarchy" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Purchase Orders by Status — Donut"
            subtitle="PO lifecycle breakdown · Pending, Approved, Rejected, Closed, Delivered"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <POStatusDonutChart />
            </div>
          </ChartCard>
          <ChartCard
            title="PO Hierarchy — Sunburst"
            subtitle="Status → Category → Vendor · click to drill down"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <POSunburstChart />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* ── Vendor Comparison & Monthly Trend ── */}
      <div>
        <SectionLabel label="Vendor Performance & Monthly Volume" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <ChartCard
              title="Vendor Comparison — Radar"
              subtitle="Cost · Delivery Speed · Quality · Low Delay % · PO Volume"
              height="h-[420px]"
            >
              <div className="p-3 h-full">
                <VendorComparisonRadarChart />
              </div>
            </ChartCard>
          </div>
          <div className="lg:col-span-3">
            <ChartCard
              title="Monthly PO Trend — Dual Axis"
              subtitle="PO count (left axis) vs total PO amount in $M (right axis)"
              height="h-[420px]"
            >
              <div className="p-3 h-full">
                <MonthlyPOTrendChart />
              </div>
            </ChartCard>
          </div>
        </div>
      </div>

      {/* ── Calendar Heatmap ── */}
      <div>
        <SectionLabel label="Daily PO Activity" />
        <ChartCard
          title="Calendar Heatmap — Daily Purchase Orders 2025"
          subtitle="Procurement spikes · heavy order days · operational load patterns"
          height="h-[220px]"
        >
          <div className="px-4 py-3 h-full">
            <POCalendarHeatmap />
          </div>
        </ChartCard>
      </div>

      {/* ── PO Aging ── */}
      <div>
        <SectionLabel label="PO Aging Analysis" />
        <ChartCard
          title="PO Aging — Stacked Column"
          subtitle="Outstanding POs grouped by age bucket · Approved + Pending + Overdue"
          height="h-[380px]"
        >
          <div className="p-3 h-full">
            <POAgingChart />
          </div>
        </ChartCard>
      </div>

    </div>
  );
};

export default PurchaseOrdersDashboard;
