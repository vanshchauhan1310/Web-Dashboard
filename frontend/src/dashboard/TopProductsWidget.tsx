import React from 'react';
import { useTopProducts } from '../hooks/useAnalytics';
import { TrendingUp } from 'lucide-react';

const RANK_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

const SkeletonRow = () => (
  <div
    className="h-[68px] rounded-xl animate-pulse"
    style={{ background: 'rgba(255,255,255,0.04)' }}
  />
);

const TopProductsWidget: React.FC = () => {
  const { data, isLoading, isError } = useTopProducts();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full text-[13px]" style={{ color: '#F43F5E' }}>
        Failed to load top products
      </div>
    );
  }

  const maxRevenue: number = data?.[0]?.revenue ?? 1;

  return (
    <div className="flex flex-col gap-2 p-4">
      {data?.map((item: any, index: number) => {
        const pct = Math.round((item.revenue / maxRevenue) * 100);
        const color = RANK_COLORS[index] ?? '#64748B';

        return (
          <div
            key={index}
            className="p-3 rounded-xl cursor-default transition-all duration-150 hover:translate-y-[-1px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            {/* Top row: rank + name + revenue */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: `${color}18`,
                  color,
                  border: `1px solid ${color}35`,
                }}
              >
                {index + 1}
              </div>
              <span className="text-[13px] font-medium text-textMain truncate flex-1">
                {item.product}
              </span>
              <div
                className="flex items-center gap-1 text-[12px] font-semibold shrink-0"
                style={{ color }}
              >
                <TrendingUp className="w-3 h-3" />
                ${item.revenue.toLocaleString()}
              </div>
            </div>

            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}88)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopProductsWidget;
