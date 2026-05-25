import React, { useState } from 'react';
import { ChartCard, DashboardPage, SectionLabel } from '../dashboard/DashboardChrome';
import ShippingFilters from '../dashboard/shipping/ShippingFilters';
import ShippingKPIs from '../dashboard/shipping/ShippingKPIs';
import DeliveryTrendChart from '../dashboard/shipping/DeliveryTrendChart';
import ShipModeRegionChart from '../dashboard/shipping/ShipModeRegionChart';
import ShippingRadarChart from '../dashboard/shipping/ShippingRadarChart';
import ShippingHeatmapChart from '../dashboard/shipping/ShippingHeatmapChart';
import ShipModeCostDonut from '../dashboard/shipping/ShipModeCostDonut';
import ShippingCostTrendChart from '../dashboard/shipping/ShippingCostTrendChart';
import type { ShippingFilters as ShippingFiltersType } from '../hooks/useAnalytics';

const ShippingOperationsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<ShippingFiltersType>({
    region: 'All Regions',
    ship_mode: 'All Ship Modes',
    time_period: 'All Time',
  });

  return (
    <DashboardPage
      title="Shipping & Operations"
      subtitle="Logistics performance, delivery trends, and delayed order analysis"
    >
      <ShippingFilters filters={filters} onChange={setFilters} />

      <ShippingKPIs filters={filters} />

      <div>
        <SectionLabel label="Delivery Performance" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Delivery Trend Over Time"
            subtitle="Shipment volume, avg days, and on-time rate by month"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <DeliveryTrendChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Ship Mode Mix by Region"
            subtitle="Order count per shipping class across regions"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <ShipModeRegionChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>

      <div>
        <SectionLabel label="Regional Analysis" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Region Performance Radar"
            subtitle="Multi-dimensional comparison of top 7 regions"
            height="h-[440px]"
          >
            <div className="p-3 h-full">
              <ShippingRadarChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Avg Shipping Cost Heatmap"
            subtitle="Cost intensity by region × ship mode"
            height="h-[440px]"
          >
            <div className="p-3 h-full">
              <ShippingHeatmapChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>

      <div>
        <SectionLabel label="Cost & Efficiency" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard
            title="Shipping Cost Trend"
            subtitle="Monthly logistics spend vs shipment volume"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <ShippingCostTrendChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard
            title="Shipping Cost Share by Mode"
            subtitle="Estimated cost distribution across ship modes"
            height="h-[420px]"
          >
            <div className="p-3 h-full">
              <ShipModeCostDonut filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardPage>
  );
};

export default ShippingOperationsDashboard;
