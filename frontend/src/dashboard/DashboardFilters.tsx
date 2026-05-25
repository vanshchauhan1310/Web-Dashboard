import React from 'react';
import { Package, MapPin, ChevronDown } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useFilterOptions } from '../hooks/useAnalytics';

const TIME_PERIODS = ['All Time', 'Last 7 Days', 'Last 30 Days', 'This Year'];

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#CBD5E1',
  outline: 'none',
};

const DashboardFilters: React.FC = () => {
  const {
    selectedCategory,
    selectedRegion,
    selectedTimePeriod,
    setSelectedCategory,
    setSelectedRegion,
    setSelectedTimePeriod,
  } = useDashboardStore();

  const { data: filterOptions } = useFilterOptions();

  const categories = ['All Categories', ...(filterOptions?.categories ?? [])];
  const regions = ['All Regions', ...(filterOptions?.regions ?? [])];

  const hasActiveFilters =
    selectedCategory !== 'All Categories' ||
    selectedRegion !== 'All Regions' ||
    selectedTimePeriod !== 'All Time';

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedRegion('All Regions');
    setSelectedTimePeriod('All Time');
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#0E1C30',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Time Period Pill Group */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {TIME_PERIODS.map((t) => {
            const isActive = selectedTimePeriod === t;
            return (
              <button
                key={t}
                onClick={() => setSelectedTimePeriod(t)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
                        color: '#fff',
                        boxShadow: '0 2px 10px rgba(59, 130, 246, 0.35)',
                      }
                    : { color: '#64748B' }
                }
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="w-px h-6 hidden sm:block" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Category Select */}
        <div className="relative">
          <Package
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: '#64748B' }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
            style={{
              ...SELECT_STYLE,
              color: selectedCategory !== 'All Categories' ? '#F1F5F9' : '#CBD5E1',
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c} style={{ background: '#0E1C30' }}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: '#64748B' }}
          />
        </div>

        {/* Region Select */}
        <div className="relative">
          <MapPin
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: '#64748B' }}
          />
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
            style={{
              ...SELECT_STYLE,
              color: selectedRegion !== 'All Regions' ? '#F1F5F9' : '#CBD5E1',
            }}
          >
            {regions.map((r) => (
              <option key={r} value={r} style={{ background: '#0E1C30' }}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
            style={{ color: '#64748B' }}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-[12px] font-medium transition-all hover:opacity-80"
            style={{ color: '#F43F5E' }}
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardFilters;
