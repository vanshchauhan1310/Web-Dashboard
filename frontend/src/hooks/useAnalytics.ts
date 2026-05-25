import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useDashboardStore } from '../store/dashboardStore';

const useFilters = () => {
  const { selectedCategory, selectedRegion, selectedTimePeriod, selectedSubCategory, selectedSegment } = useDashboardStore();

  return {
    category: selectedCategory === 'All Categories' ? undefined : selectedCategory,
    region: selectedRegion === 'All Regions' ? undefined : selectedRegion,
    time_period: selectedTimePeriod === 'All Time' ? undefined : selectedTimePeriod,
    sub_category: selectedSubCategory === 'All Sub-Categories' ? undefined : selectedSubCategory,
    segment: selectedSegment === 'All Segments' ? undefined : selectedSegment,
  };
};

export const useRevenueByCountry = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['revenue-country', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/revenue-country', { params: filters });
      return response.data;
    },
  });
};

export const useSalesTrend = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['sales-trend', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales-trend', { params: filters });
      return response.data;
    },
  });
};

export const useTopProducts = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['top-products', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/top-products', { params: filters });
      return response.data;
    },
  });
};

export const useMonthlyRevenue = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['monthly-revenue', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/monthly-revenue', { params: filters });
      return response.data;
    },
  });
};

export const useProfitByCategory = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['profit-by-category', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/profit-by-category', { params: filters });
      return response.data;
    },
  });
};

export const useDiscountProfitScatter = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['discount-profit-scatter', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/discount-profit-scatter', { params: filters });
      return response.data;
    },
  });
};

export const useShippingCostByRegion = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['shipping-cost-region', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/shipping-cost-region', { params: filters });
      return response.data;
    },
  });
};

export const useOrderPriorityDistribution = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['order-priority', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/order-priority', { params: filters });
      return response.data;
    },
  });
};

export const useSegmentSales = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['segment-sales', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/segment-sales', { params: filters });
      return response.data;
    },
  });
};

export const useFilterOptions = () => {
  return useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/filters');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useDashboardKpis = () => {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/kpis');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductKPIs = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['product-kpis', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/product-kpis', { params: filters });
      return response.data;
    },
  });
};

export const useProductConversionFunnel = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['product-conversion-funnel', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/product-conversion-funnel', { params: filters });
      return response.data;
    },
  });
};

export const useProductRevenueProfitScatter = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['product-revenue-profit-scatter', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/product-revenue-profit-scatter', { params: filters });
      return response.data;
    },
  });
};

export const useOrdersByCategory = () => {
  const filters = useFilters();
  return useQuery({
    queryKey: ['orders-category', filters],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/orders-category', { params: filters });
      return response.data;
    },
  });
};

export interface ExecutiveFilters {
  market?: string;
  segment?: string;
  year?: string;
}

const cleanExecutiveFilters = (filters: ExecutiveFilters) => ({
  market: filters.market === 'All Markets' ? undefined : filters.market,
  segment: filters.segment === 'All Segments' ? undefined : filters.segment,
  year: filters.year === 'All Years' ? undefined : filters.year,
});

export const useExecutiveKPIs = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-kpis', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/kpis', { params });
      return response.data;
    },
  });
};

export const useExecutiveFilterOptions = () => {
  return useQuery({
    queryKey: ['executive-filter-options'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/filters');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useExecutiveMonthlySalesProfit = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-monthly-sales-profit', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/monthly-sales-profit', { params });
      return response.data;
    },
  });
};

export const useExecutiveCategoryPerformance = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-category-performance', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/category-performance', { params });
      return response.data;
    },
  });
};

export const useExecutiveSegmentShare = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-segment-share', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/segment-share', { params });
      return response.data;
    },
  });
};

export const useExecutiveParetoCountries = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-pareto-countries', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/pareto-countries', { params });
      return response.data;
    },
  });
};

export const useExecutiveProfitWaterfall = (filters: ExecutiveFilters) => {
  const params = cleanExecutiveFilters(filters);
  return useQuery({
    queryKey: ['executive-profit-waterfall', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/executive/profit-waterfall', { params });
      return response.data;
    },
  });
};

// ─── Shipping Hooks ──────────────────────────────────────────────────────────

export interface ShippingFilters {
  region: string;
  ship_mode: string;
  time_period: string;
}

const cleanShipping = (f: ShippingFilters) => ({
  region: f.region === 'All Regions' ? undefined : f.region,
  ship_mode: f.ship_mode === 'All Ship Modes' ? undefined : f.ship_mode,
  time_period: f.time_period === 'All Time' ? undefined : f.time_period,
});

export const useShippingFilterOptions = () =>
  useQuery({
    queryKey: ['shipping-filters'],
    queryFn: async () => (await apiClient.get('/analytics/shipping/filters')).data,
    staleTime: 1000 * 60 * 5,
  });

export const useShippingKPIs = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-kpis', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/kpis', { params: cleanShipping(f) })).data,
  });

export const useShippingRegionPerformance = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-region-performance', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/region-performance', { params: cleanShipping(f) })).data,
  });

export const useShippingHeatmap = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-heatmap', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/heatmap', { params: cleanShipping(f) })).data,
  });

export const useDelayedOrders = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-delayed-orders', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/delayed-orders', { params: cleanShipping(f) })).data,
  });

export const useDeliveryTrend = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-delivery-trend', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/delivery-trend', { params: cleanShipping(f) })).data,
  });

export const useShipModeMix = (f: ShippingFilters) =>
  useQuery({
    queryKey: ['shipping-shipmode-mix', cleanShipping(f)],
    queryFn: async () => (await apiClient.get('/analytics/shipping/shipmode-mix', { params: cleanShipping(f) })).data,
  });

export interface GeographyFilters {
  market?: string;
  region?: string;
  category?: string;
  year?: string;
}

const cleanGeographyFilters = (filters: GeographyFilters) => ({
  market: filters.market === 'All Markets' ? undefined : filters.market,
  region: filters.region === 'All Regions' ? undefined : filters.region,
  category: filters.category === 'All Categories' ? undefined : filters.category,
  year: filters.year === 'All Years' ? undefined : filters.year,
});

export const useGeographyFilterOptions = () => {
  return useQuery({
    queryKey: ['geography-filter-options'],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/filters');
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useGeographyKpis = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-kpis', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/kpis', { params });
      return response.data;
    },
  });
};

export const useGeographyCountryPerformance = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-country-performance', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/country-performance', { params });
      return response.data;
    },
  });
};

export const useGeographyMarketSales = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-market-sales', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/market-sales', { params });
      return response.data;
    },
  });
};

export const useGeographyMonthlyMarketTrend = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-monthly-market-trend', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/monthly-market-trend', { params });
      return response.data;
    },
  });
};

export const useGeographyRegionCategory = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-region-category', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/region-category', { params });
      return response.data;
    },
  });
};

export const useGeographySankey = (filters: GeographyFilters) => {
  const params = cleanGeographyFilters(filters);
  return useQuery({
    queryKey: ['geography-sankey', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/sankey', { params });
      return response.data;
    },
  });
};

export interface GeographyDrilldownParams {
  level: 'market' | 'region' | 'country' | 'city';
  market_value?: string;
  region_value?: string;
  country_value?: string;
}

export const useGeographyDrilldown = (
  filters: GeographyFilters,
  drilldown: GeographyDrilldownParams
) => {
  const params = { ...cleanGeographyFilters(filters), ...drilldown };
  return useQuery({
    queryKey: ['geography-drilldown', params],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/geography/drilldown', { params });
      return response.data;
    },
  });
};
