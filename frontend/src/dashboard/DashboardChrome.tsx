import React from 'react';
import { MoreHorizontal } from 'lucide-react';

export const CARD_STYLE = {
  background: '#0E1C30',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

interface DashboardPageProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ title, subtitle, children }) => (
  <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
      <div>
        <h1 className="text-[22px] font-bold text-textMain tracking-tight">{title}</h1>
        <p className="text-sm text-textMuted mt-1">{subtitle}</p>
      </div>
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-auto"
        style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10B981',
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live data
      </div>
    </div>
    {children}
  </div>
);

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  height = 'h-[400px]',
}) => (
  <div className={`rounded-2xl flex flex-col ${height} group transition-all duration-200`} style={CARD_STYLE}>
    <div
      className="px-5 py-4 flex justify-between items-start shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div>
        <h2 className="text-[14px] font-semibold text-textMain">{title}</h2>
        {subtitle && <p className="text-[12px] text-textMuted mt-0.5">{subtitle}</p>}
      </div>
      <button
        type="button"
        aria-label={`${title} options`}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <MoreHorizontal className="w-3.5 h-3.5 text-textMuted" />
      </button>
    </div>
    <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
  </div>
);

export const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-textMuted">{label}</span>
    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
  </div>
);

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  accentColor: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  accentColor,
}) => (
  <div className="rounded-2xl p-5 relative overflow-hidden cursor-default" style={CARD_STYLE}>
    <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: gradient }} />
    <div className="flex items-start justify-between mb-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: gradient, boxShadow: `0 4px 14px ${accentColor}30` }}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    <p className="text-[28px] font-bold text-textMain leading-none tracking-tight mb-1">{value}</p>
    <p className="text-[13px] font-semibold text-textSub mt-3">{title}</p>
    <p className="text-[11px] text-textMuted mt-0.5">{description}</p>
  </div>
);
