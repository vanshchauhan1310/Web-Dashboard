import React from 'react';
import { MapPin, Truck, ChevronDown, X } from 'lucide-react';
import { useShippingFilterOptions, type ShippingFilters as ShippingFiltersData } from '../../hooks/useAnalytics';

const TIME_PERIODS = ['All Time', 'Last 7 Days', 'Last 30 Days', 'This Year'];

const SELECT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#CBD5E1',
  outline: 'none',
};

interface Props {
  filters: ShippingFiltersData;
  onChange: (f: ShippingFiltersData) => void;
}

const ShippingFilters: React.FC<Props> = ({ filters, onChange }) => {
  const { data } = useShippingFilterOptions();
  const regions = data?.regions ?? [];
  const shipModes = data?.ship_modes ?? [];

  const set = (patch: Partial<ShippingFiltersData>) => onChange({ ...filters, ...patch });

  const hasActive =
    filters.region !== 'All Regions' ||
    filters.ship_mode !== 'All Ship Modes' ||
    filters.time_period !== 'All Time';

  const clear = () =>
    onChange({ region: 'All Regions', ship_mode: 'All Ship Modes', time_period: 'All Time' });

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
        {/* Time Period pills */}
        <div
          className="flex items-center gap-0.5 p-1 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {TIME_PERIODS.map((t) => {
            const active = filters.time_period === t;
            return (
              <button
                key={t}
                onClick={() => set({ time_period: t })}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
                style={
                  active
                    ? { background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: '#fff', boxShadow: '0 2px 10px rgba(245,158,11,0.35)' }
                    : { color: '#64748B' }
                }
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="w-px h-6 hidden sm:block" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Region */}
        <div className="relative">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: filters.region !== 'All Regions' ? '#F59E0B' : '#64748B' }} />
          <select
            value={filters.region}
            onChange={(e) => set({ region: e.target.value })}
            className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer"
            style={{ ...SELECT_STYLE, color: filters.region !== 'All Regions' ? '#F1F5F9' : '#CBD5E1', borderColor: filters.region !== 'All Regions' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)' }}
          >
            <option value="All Regions" style={{ background: '#0E1C30' }}>All Regions</option>
            {regions.map((r: string) => <option key={r} value={r} style={{ background: '#0E1C30' }}>{r}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: '#64748B' }} />
        </div>

        {/* Ship Mode */}
        <div className="relative">
          <Truck className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: filters.ship_mode !== 'All Ship Modes' ? '#F59E0B' : '#64748B' }} />
          <select
            value={filters.ship_mode}
            onChange={(e) => set({ ship_mode: e.target.value })}
            className="appearance-none pl-8 pr-7 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer"
            style={{ ...SELECT_STYLE, color: filters.ship_mode !== 'All Ship Modes' ? '#F1F5F9' : '#CBD5E1', borderColor: filters.ship_mode !== 'All Ship Modes' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)' }}
          >
            <option value="All Ship Modes" style={{ background: '#0E1C30' }}>All Ship Modes</option>
            {shipModes.map((m: string) => <option key={m} value={m} style={{ background: '#0E1C30' }}>{m}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: '#64748B' }} />
        </div>

        {hasActive && (
          <button onClick={clear} className="ml-auto flex items-center gap-1 text-[12px] font-medium hover:opacity-80" style={{ color: '#F43F5E' }}>
            <X className="w-3 h-3" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
};

export default ShippingFilters;
