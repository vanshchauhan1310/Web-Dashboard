import React from 'react';
import ProductFilters from '../dashboard/ProductFilters';
import ProductKPIs from '../dashboard/ProductKPIs';
import ProductFunnelChart from '../dashboard/ProductFunnelChart';
import RevenueVsProfitScatterChart from '../dashboard/RevenueVsProfitScatterChart';
import CategoryContributionDonut from '../dashboard/CategoryContributionDonut';
import MonthlyProductSalesTrend from '../dashboard/MonthlyProductSalesTrend';
import TopProductsBarChart from '../dashboard/TopProductsBarChart';
import ProfitByCategoryChart from '../dashboard/ProfitByCategoryChart';
import { ChartCard, DashboardPage, SectionLabel } from '../dashboard/DashboardChrome';

const ProductPerformanceDashboard: React.FC = () => (
  <DashboardPage
    title="Product Performance Dashboard"
    subtitle="Conversion funnel, revenue vs profit, category contribution, monthly trends, and margin analysis"
  >
    <ProductFilters />
    <ProductKPIs />

    {/* Section 1: Category & Revenue Overview */}
    <div>
      <SectionLabel label="Category & Revenue Overview" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ChartCard
          title="Category Contribution"
          subtitle="Revenue share by product category"
          height="h-[380px]"
        >
          <div className="p-3 h-full">
            <CategoryContributionDonut />
          </div>
        </ChartCard>

        <ChartCard
          title="Top Products by Revenue"
          subtitle="Highest earning products ranked"
          height="h-[380px]"
        >
          <div className="p-3 h-full">
            <TopProductsBarChart />
          </div>
        </ChartCard>

        <ChartCard
          title="Profit by Category"
          subtitle="Revenue and profit comparison per category"
          height="h-[380px]"
        >
          <div className="p-3 h-full">
            <ProfitByCategoryChart />
          </div>
        </ChartCard>
      </div>
    </div>

    {/* Section 2: Trends & Funnel */}
    <div>
      <SectionLabel label="Sales Trend & Conversion Funnel" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Monthly Product Sales Trend"
          subtitle="Revenue trajectory over time"
          height="h-[400px]"
        >
          <div className="p-3 h-full">
            <MonthlyProductSalesTrend />
          </div>
        </ChartCard>

        <ChartCard
          title="Product Conversion Funnel"
          subtitle="Order quality stages from total to premium"
          height="h-[400px]"
        >
          <div className="p-3 h-full">
            <ProductFunnelChart />
          </div>
        </ChartCard>
      </div>
    </div>

    {/* Section 3: Revenue vs Profit Scatter */}
    <div>
      <SectionLabel label="Revenue vs Profit Analysis" />
      <div className="grid grid-cols-1 gap-5">
        <ChartCard
          title="Revenue vs Profit — Product Scatter"
          subtitle="Each point is a product · size = units sold · color = category"
          height="h-[480px]"
        >
          <div className="p-3 h-full">
            <RevenueVsProfitScatterChart />
          </div>
        </ChartCard>
      </div>
    </div>
  </DashboardPage>
);

export default ProductPerformanceDashboard;
