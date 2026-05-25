import { useMemo } from 'react';
import EChartWrapper from '../../../charts/echarts/EChartWrapper';
import { useProcurementFilters } from '../../../context/ProcurementFiltersContext';
import type { EChartsCoreOption } from 'echarts';

const TIER_COLOR: Record<string, string> = {
  A: '#10B981',
  B: '#3B82F6',
  C: '#F59E0B',
};

// All links: tier → category → supplier
const ALL_LINKS = [
  // Tier A → categories
  { source: 'Tier A', target: 'Raw Materials',   value: 650, tier: 'A' },
  { source: 'Tier A', target: 'IT & Software',   value: 365, tier: 'A' },
  { source: 'Tier A', target: 'Prof. Services',  value: 215, tier: 'A' },
  // Tier B → categories
  { source: 'Tier B', target: 'Logistics',       value: 280, tier: 'B' },
  { source: 'Tier B', target: 'Utilities',       value: 95,  tier: 'B' },
  { source: 'Tier B', target: 'Office Supplies', value: 95,  tier: 'B' },
  // Tier C → categories
  { source: 'Tier C', target: 'Marketing',       value: 115, tier: 'C' },
  // Categories → suppliers
  { source: 'Raw Materials',   target: 'SupplyCo Ltd',  value: 320, tier: 'A' },
  { source: 'Raw Materials',   target: 'GlobalMat',     value: 180, tier: 'A' },
  { source: 'Raw Materials',   target: 'OreGroup',      value: 150, tier: 'A' },
  { source: 'IT & Software',   target: 'TechVend Inc',  value: 245, tier: 'A' },
  { source: 'IT & Software',   target: 'CloudSys',      value: 120, tier: 'A' },
  { source: 'Prof. Services',  target: 'ConsultPro',    value: 140, tier: 'A' },
  { source: 'Prof. Services',  target: 'AdviseCo',      value: 75,  tier: 'A' },
  { source: 'Logistics',       target: 'LogiPro',       value: 185, tier: 'B' },
  { source: 'Logistics',       target: 'SwiftCargo',    value: 95,  tier: 'B' },
  { source: 'Utilities',       target: 'PowerGrid Co',  value: 95,  tier: 'B' },
  { source: 'Office Supplies', target: 'OfficeBase',    value: 95,  tier: 'B' },
  { source: 'Marketing',       target: 'MarkMedia',     value: 75,  tier: 'C' },
  { source: 'Marketing',       target: 'AdCraft',       value: 40,  tier: 'C' },
];

const ALL_NODES = [
  // Tiers
  { name: 'Tier A',         tier: 'A', depth: 0 },
  { name: 'Tier B',         tier: 'B', depth: 0 },
  { name: 'Tier C',         tier: 'C', depth: 0 },
  // Categories
  { name: 'Raw Materials',   tier: 'A', depth: 1 },
  { name: 'IT & Software',   tier: 'A', depth: 1 },
  { name: 'Prof. Services',  tier: 'A', depth: 1 },
  { name: 'Logistics',       tier: 'B', depth: 1 },
  { name: 'Utilities',       tier: 'B', depth: 1 },
  { name: 'Office Supplies', tier: 'B', depth: 1 },
  { name: 'Marketing',       tier: 'C', depth: 1 },
  // Suppliers
  { name: 'SupplyCo Ltd',   tier: 'A', depth: 2 },
  { name: 'GlobalMat',      tier: 'A', depth: 2 },
  { name: 'OreGroup',       tier: 'A', depth: 2 },
  { name: 'TechVend Inc',   tier: 'A', depth: 2 },
  { name: 'CloudSys',       tier: 'A', depth: 2 },
  { name: 'ConsultPro',     tier: 'A', depth: 2 },
  { name: 'AdviseCo',       tier: 'A', depth: 2 },
  { name: 'LogiPro',        tier: 'B', depth: 2 },
  { name: 'SwiftCargo',     tier: 'B', depth: 2 },
  { name: 'PowerGrid Co',   tier: 'B', depth: 2 },
  { name: 'OfficeBase',     tier: 'B', depth: 2 },
  { name: 'MarkMedia',      tier: 'C', depth: 2 },
  { name: 'AdCraft',        tier: 'C', depth: 2 },
];

const SupplierSankeyChart: React.FC = () => {
  const { filters } = useProcurementFilters();

  const { nodes, links } = useMemo(() => {
    let filteredLinks = ALL_LINKS;

    if (filters.tier !== 'All Tiers') {
      const letter = filters.tier.split(' ')[1];
      filteredLinks = filteredLinks.filter(l => l.tier === letter);
    }
    if (filters.category !== 'All Categories') {
      filteredLinks = filteredLinks.filter(l =>
        l.source === filters.category ||
        l.target === filters.category ||
        (ALL_LINKS.find(ll => ll.target === filters.category && ll.source === l.source)) ||
        (ALL_LINKS.find(ll => ll.source === filters.category && ll.target === l.target))
      );
    }

    const usedNames = new Set<string>();
    filteredLinks.forEach(l => { usedNames.add(l.source); usedNames.add(l.target); });

    const nodes = ALL_NODES
      .filter(n => usedNames.has(n.name))
      .map(n => ({
        name: n.name,
        itemStyle: {
          color: n.depth === 0
            ? TIER_COLOR[n.tier]
            : n.depth === 1
              ? TIER_COLOR[n.tier] + 'bb'
              : TIER_COLOR[n.tier] + '88',
          borderColor: TIER_COLOR[n.tier],
          borderWidth: n.depth === 0 ? 2 : 1,
        },
        label: {
          color: '#E2E8F0',
          fontWeight: n.depth === 0 ? 700 : 500,
          fontSize: n.depth === 2 ? 10 : 11,
        },
      }));

    const links = filteredLinks.map(l => ({
      source: l.source,
      target: l.target,
      value:  l.value,
      lineStyle: {
        color: TIER_COLOR[l.tier],
        opacity: 0.25,
      },
    }));

    return { nodes, links };
  }, [filters.tier, filters.category]);

  const option = useMemo<EChartsCoreOption>(() => ({
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0A1525',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: [10, 14] as [number, number],
      textStyle: { color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif' },
      extraCssText: 'box-shadow:0 8px 32px rgba(0,0,0,0.6);border-radius:10px;',
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `<div style="font-weight:600;margin-bottom:4px">${params.data.source} → ${params.data.target}</div>
            Spend: <span style="color:#10B981;font-weight:700">$${params.data.value}K</span>`;
        }
        return `<div style="font-weight:600">${params.name}</div>`;
      },
    },
    series: [{
      type: 'sankey',
      data: nodes,
      links,
      orient: 'horizontal',
      nodeWidth: 16,
      nodeGap: 12,
      left: '2%',
      right: '18%',
      top: '6%',
      bottom: '6%',
      emphasis: {
        focus: 'adjacency',
        lineStyle: { opacity: 0.7 },
      },
      label: {
        position: 'right',
        fontSize: 10,
        color: '#94A3B8',
        fontFamily: 'Inter, sans-serif',
      },
      lineStyle: {
        curveness: 0.5,
      },
      levels: [
        { depth: 0, label: { fontSize: 12, fontWeight: 700, color: '#fff' }, itemStyle: { borderWidth: 2 } },
        { depth: 1, label: { fontSize: 11, color: '#CBD5E1' } },
        { depth: 2, label: { fontSize: 10, color: '#94A3B8' } },
      ],
    }],
  }), [nodes, links]);

  return (
    <div className="h-full w-full">
      <EChartWrapper option={option} />
    </div>
  );
};

export default SupplierSankeyChart;
