import React from 'react';
import { ChartCard, SectionLabel } from '../../dashboard/DashboardChrome';
import { useProcurementFilters } from '../../context/ProcurementFiltersContext';
import InventoryKPIs from '../../dashboard/procurement/inventory/InventoryKPIs';
import InventoryByCategoryChart from '../../dashboard/procurement/inventory/InventoryByCategoryChart';
import StockMovementTrendChart from '../../dashboard/procurement/inventory/StockMovementTrendChart';
import ABCInventoryChart from '../../dashboard/procurement/inventory/ABCInventoryChart';
import InventoryReplenishmentGantt from '../../dashboard/procurement/inventory/InventoryReplenishmentGantt';

const InventoryAnalysisDashboard: React.FC = () => {
  const { filters } = useProcurementFilters();

  const statusLabel =
    filters.abc_class !== 'All Classes'
      ? filters.abc_class
      : filters.category !== 'All Categories'
        ? filters.category
        : filters.time_period === 'All Time'
          ? 'All inventory'
          : filters.time_period;

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-[22px] font-bold text-textMain tracking-tight">Inventory Analysis</h1>
          <p className="text-sm text-textMuted mt-1">
            Stock levels · ABC classification, movement trends, replenishment pipeline and category breakdown
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
      <InventoryKPIs />

      {/* ── Stock Level Breakdown ── */}
      <div>
        <SectionLabel label="Stock Level by Category" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ChartCard
              title="Inventory by Category — Horizontal Bar"
              subtitle="Current stock vs safety stock vs reorder level · units on hand"
              height="h-[420px]"
            >
              <div className="p-3 h-full">
                <InventoryByCategoryChart />
              </div>
            </ChartCard>
          </div>
          <div className="lg:col-span-2">
            <ChartCard
              title="Stock Movement Trend"
              subtitle={`Inflow · Outflow · Consumption · Net — ${filters.view_by === 'Weekly' ? 'weekly' : 'monthly'} view`}
              height="h-[420px]"
            >
              <div className="p-3 h-full">
                <StockMovementTrendChart />
              </div>
            </ChartCard>
          </div>
        </div>
      </div>

      {/* ── ABC Analysis ── */}
      <div>
        <SectionLabel label="ABC Inventory Classification — Pareto Analysis" />
        <ChartCard
          title="ABC Analysis — Pareto + Bar"
          subtitle="Items ranked by annual value · A = top 80% cumulative · B = 80–95% · C = 95–100% · dashed lines mark thresholds"
          height="h-[400px]"
        >
          <div className="p-3 h-full">
            <ABCInventoryChart />
          </div>
        </ChartCard>
      </div>

      {/* ── Replenishment Gantt ── */}
      <div>
        <SectionLabel label="Inventory Replenishment Timeline" />
        <ChartCard
          title="Gantt Chart — PO → Shipment → Warehouse Arrival → Shelf Available"
          subtitle="Replenishment pipeline per SKU · track procurement lag, transit time and warehouse processing"
          height="h-[460px]"
        >
          <div className="p-3 h-full">
            <InventoryReplenishmentGantt />
          </div>
        </ChartCard>
      </div>

    </div>
  );
};

export default InventoryAnalysisDashboard;
