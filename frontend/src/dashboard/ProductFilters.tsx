import React from 'react';
import { Package, Tag, Users, MapPin, ChevronDown, X } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useFilterOptions } from '../hooks/useAnalytics';

const TIME_PERIODS = ['All Time', 'Last 7 Days', 'Last 30 Days', 'This Year'];

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#CBD5E1',
  outline: 'none',
};

interface SelectDropdownProps {
  icon: React.ElementType;
  value: string;
  defaultLabel: string;
  options: string[];
  onChange: (v: string) => void;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({ icon: Icon, value, defaultLabel, options, onChange }) => {
  const isActive = value !== defaultLabel;
  return (
    <div className="relative">
      <Icon
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
        style={{ color: isActive ? '#60A5FA' : '#64748B' }}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
        style={{
          ...SELECT_STYLE,
          color: isActive ? '#F1F5F9' : '#CBD5E1',
          borderColor: isActive ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <option value={defaultLabel} style={{ background: '#0E1C30' }}>{defaultLabel}</option>
        {options.map((o) => (
          <option key={o} value={o} style={{ background: '#0E1C30' }}>{o}</option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
        style={{ color: '#64748B' }}
      />
    </div>
  );
};

const ProductFilters: React.FC = () => {
  const {
    selectedCategory,
    selectedRegion,
    selectedTimePeriod,
    selectedSubCategory,
    selectedSegment,
    setSelectedCategory,
    setSelectedRegion,
    setSelectedTimePeriod,
    setSelectedSubCategory,
    setSelectedSegment,
  } = useDashboardStore();

  const { data: filterOptions } = useFilterOptions();

  const categories = filterOptions?.categories ?? [];
  const regions = filterOptions?.regions ?? [];
  const subCategories = filterOptions?.sub_categories ?? [];
  const segments = filterOptions?.segments ?? [];

  const hasActiveFilters =
    selectedCategory !== 'All Categories' ||
    selectedRegion !== 'All Regions' ||
    selectedTimePeriod !== 'All Time' ||
    selectedSubCategory !== 'All Sub-Categories' ||
    selectedSegment !== 'All Segments';

  const clearFilters = () => {
    setSelectedCategory('All Categories');
    setSelectedRegion('All Regions');
    setSelectedTimePeriod('All Time');
    setSelectedSubCategory('All Sub-Categories');
    setSelectedSegment('All Segments');
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

        {/* Category */}
        <SelectDropdown
          icon={Package}
          value={selectedCategory}
          defaultLabel="All Categories"
          options={categories}
          onChange={setSelectedCategory}
        />

        {/* Sub-Category */}
        <SelectDropdown
          icon={Tag}
          value={selectedSubCategory}
          defaultLabel="All Sub-Categories"
          options={subCategories}
          onChange={setSelectedSubCategory}
        />

        {/* Segment */}
        <SelectDropdown
          icon={Users}
          value={selectedSegment}
          defaultLabel="All Segments"
          options={segments}
          onChange={setSelectedSegment}
        />

        {/* Region */}
        <SelectDropdown
          icon={MapPin}
          value={selectedRegion}
          defaultLabel="All Regions"
          options={regions}
          onChange={setSelectedRegion}
        />

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-[12px] font-medium transition-all hover:opacity-80"
            style={{ color: '#F43F5E' }}
          >
            <X className="w-3 h-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
