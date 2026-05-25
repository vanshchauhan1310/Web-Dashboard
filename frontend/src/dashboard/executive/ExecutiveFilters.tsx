import React from 'react';
import { BriefcaseBusiness, ChevronDown, RotateCcw, Users, CalendarDays } from 'lucide-react';
import { useExecutiveFilterOptions, type ExecutiveFilters } from '../../hooks/useAnalytics';

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#CBD5E1',
  outline: 'none',
};

interface ExecutiveFiltersProps {
  filters: Required<ExecutiveFilters>;
  onChange: (filters: Required<ExecutiveFilters>) => void;
}

const SelectControl: React.FC<{
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}> = ({ icon: Icon, value, options, onChange }) => (
  <div className="relative">
    <Icon
      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
      style={{ color: '#64748B' }}
    />
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-all"
      style={{
        ...SELECT_STYLE,
        color: value.startsWith('All ') ? '#CBD5E1' : '#F1F5F9',
      }}
    >
      {options.map((option) => (
        <option key={option} value={option} style={{ background: '#0E1C30' }}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown
      className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none"
      style={{ color: '#64748B' }}
    />
  </div>
);

const ExecutiveFiltersBar: React.FC<ExecutiveFiltersProps> = ({ filters, onChange }) => {
  const { data } = useExecutiveFilterOptions();
  const markets = ['All Markets', ...(data?.markets ?? [])];
  const segments = ['All Segments', ...(data?.segments ?? [])];
  const years = ['All Years', ...(data?.years ?? [])];
  const hasActiveFilters =
    filters.market !== 'All Markets' ||
    filters.segment !== 'All Segments' ||
    filters.year !== 'All Years';

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
        <SelectControl
          icon={BriefcaseBusiness}
          value={filters.market}
          options={markets}
          onChange={(market) => onChange({ ...filters, market })}
        />
        <SelectControl
          icon={Users}
          value={filters.segment}
          options={segments}
          onChange={(segment) => onChange({ ...filters, segment })}
        />
        <SelectControl
          icon={CalendarDays}
          value={filters.year}
          options={years}
          onChange={(year) => onChange({ ...filters, year })}
        />
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange({ market: 'All Markets', segment: 'All Segments', year: 'All Years' })}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all hover:opacity-80"
            style={{
              color: '#F43F5E',
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.16)',
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default ExecutiveFiltersBar;
