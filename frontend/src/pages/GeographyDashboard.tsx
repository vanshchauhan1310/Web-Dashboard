import React, { useState } from 'react';
import { CircleDollarSign, Globe2, Landmark, MapPinned } from 'lucide-react';
import { ChartCard, DashboardPage, MetricCard, SectionLabel } from '../dashboard/DashboardChrome';
import GeographyFiltersBar from '../dashboard/geography/GeographyFilters';
import {
  GeographyHeatmapChart,
  GeographyMarketBarChart,
  GeographyMonthlyMarketLineChart,
  GeographyRegionCategoryStackChart,
  GeographySankeyChart,
} from '../dashboard/geography/GeographyCharts';
import GeographyDrilldownChart from '../dashboard/geography/GeographyDrilldownChart';
import { useGeographyKpis, type GeographyFilters } from '../hooks/useAnalytics';

const GeographyDashboard: React.FC = () => {
  const [filters, setFilters] = useState<Required<GeographyFilters>>({
    market: 'All Markets',
    region: 'All Regions',
    category: 'All Categories',
    year: 'All Years',
  });
  const { data: kpis } = useGeographyKpis(filters);

  const metricCards = [
    {
      title: 'Countries',
      value: kpis ? Number(kpis.countries).toLocaleString() : '0',
      description: 'active selling countries',
      icon: Globe2,
      gradient: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
      accentColor: '#3B82F6',
    },
    {
      title: 'Top Country',
      value: kpis?.top_country ?? 'N/A',
      description: kpis ? `$${Number(kpis.top_country_sales).toLocaleString(undefined, { maximumFractionDigits: 0 })} sales` : 'highest revenue country',
      icon: MapPinned,
      gradient: 'linear-gradient(135deg, #10B981, #059669)',
      accentColor: '#10B981',
    },
    {
      title: 'Geo Sales',
      value: kpis ? `$${Number(kpis.sales).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0',
      description: 'filtered global revenue',
      icon: CircleDollarSign,
      gradient: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
      accentColor: '#8B5CF6',
    },
    {
      title: 'Geo Margin',
      value: kpis ? `${Number(kpis.profit_margin).toFixed(1)}%` : '0%',
      description: 'profit as share of sales',
      icon: Landmark,
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      accentColor: '#F59E0B',
    },
  ];

  return (
    <DashboardPage
      title="Geography Dashboard"
      subtitle="Country, market, region, and global flow performance"
    >
      <GeographyFiltersBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      <div>
        <SectionLabel label="Basic Views" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard title="Market Sales & Profit" subtitle="Revenue and profit by market" height="h-[430px]">
            <div className="p-3 h-full">
              <GeographyMarketBarChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard title="Market Trend" subtitle="Monthly sales trend by market" height="h-[430px]">
            <div className="p-3 h-full">
              <GeographyMonthlyMarketLineChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard title="Region Category Mix" subtitle="Stacked sales by region and category" height="h-[430px]">
            <div className="p-3 h-full">
              <GeographyRegionCategoryStackChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>

      <div>
        <SectionLabel label="Advanced Views" />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <ChartCard title="Drilldown Geo Dashboard" subtitle="Click through market, region, country, and city performance" height="h-[500px]">
            <div className="p-3 h-full">
              <GeographyDrilldownChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard title="Geographic Heatmap" subtitle="Country-level sales intensity by location" height="h-[500px]">
            <div className="p-3 h-full">
              <GeographyHeatmapChart filters={filters} />
            </div>
          </ChartCard>
          <ChartCard title="Market to Region Sankey" subtitle="Sales flow from market to region to category" height="h-[520px]">
            <div className="p-3 h-full">
              <GeographySankeyChart filters={filters} />
            </div>
          </ChartCard>
        </div>
      </div>
    </DashboardPage>
  );
};

export default GeographyDashboard;
