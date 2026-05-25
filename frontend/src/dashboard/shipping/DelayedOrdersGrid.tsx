import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, type ColDef, type ValueFormatterParams } from 'ag-grid-community';
import { useDelayedOrders, type ShippingFilters } from '../../hooks/useAnalytics';

ModuleRegistry.registerModules([AllCommunityModule]);

interface DelayedOrder {
  order_id: string;
  customer: string;
  region: string;
  ship_mode: string;
  order_date: string;
  ship_date: string;
  actual_days: number;
  expected_days: number;
  delay_days: number;
  sales: number;
  priority: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Medium: '#3B82F6',
  Low: '#64748B',
};

const fmtMoney = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props { filters: ShippingFilters }

const DelayedOrdersGrid: React.FC<Props> = ({ filters }) => {
  const { data, isLoading, isError } = useDelayedOrders(filters);

  const colDefs = useMemo<ColDef<DelayedOrder>[]>(() => [
    {
      field: 'order_id',
      headerName: 'Order ID',
      width: 130,
      pinned: 'left',
      cellStyle: { color: '#60A5FA', fontWeight: 600 },
    },
    {
      field: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      cellStyle: { color: '#F1F5F9' },
    },
    {
      field: 'region',
      headerName: 'Region',
      width: 160,
      cellStyle: { color: '#94A3B8' },
    },
    {
      field: 'ship_mode',
      headerName: 'Ship Mode',
      width: 140,
      cellStyle: { color: '#94A3B8' },
    },
    {
      field: 'order_date',
      headerName: 'Order Date',
      width: 115,
      cellStyle: { color: '#64748B', fontSize: '12px' },
    },
    {
      field: 'ship_date',
      headerName: 'Ship Date',
      width: 115,
      cellStyle: { color: '#64748B', fontSize: '12px' },
    },
    {
      field: 'actual_days',
      headerName: 'Actual Days',
      width: 115,
      type: 'numericColumn',
      cellStyle: { color: '#F1F5F9' },
      valueFormatter: (p: ValueFormatterParams) => `${p.value}d`,
    },
    {
      field: 'expected_days',
      headerName: 'SLA Days',
      width: 105,
      type: 'numericColumn',
      cellStyle: { color: '#64748B' },
      valueFormatter: (p: ValueFormatterParams) => `${p.value}d`,
    },
    {
      field: 'delay_days',
      headerName: 'Delay',
      width: 90,
      type: 'numericColumn',
      cellStyle: (p) => ({
        color: p.value >= 7 ? '#EF4444' : p.value >= 3 ? '#F59E0B' : '#FB923C',
        fontWeight: 700,
      }),
      valueFormatter: (p: ValueFormatterParams) => `+${p.value}d`,
    },
    {
      field: 'sales',
      headerName: 'Sales',
      width: 110,
      type: 'numericColumn',
      cellStyle: { color: '#34D399', fontWeight: 600 },
      valueFormatter: (p: ValueFormatterParams) => fmtMoney(p.value),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      cellRenderer: (p: { value: string }) => (
        <span
          style={{
            color: PRIORITY_COLORS[p.value] ?? '#94A3B8',
            background: `${PRIORITY_COLORS[p.value] ?? '#94A3B8'}18`,
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {p.value}
        </span>
      ),
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    resizable: true,
    suppressMovable: false,
  }), []);

  if (isError) return (
    <div className="flex items-center justify-center h-full text-rose-400 text-sm">
      Failed to load delayed orders
    </div>
  );

  return (
    <div className="w-full">
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm animate-pulse">
          Loading delayed orders…
        </div>
      ) : (
        <div className="ag-theme-custom-dark w-full">
          <AgGridReact<DelayedOrder>
            rowData={data ?? []}
            columnDefs={colDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            rowHeight={40}
            headerHeight={38}
            suppressCellFocus
            animateRows
            pagination
            paginationPageSize={10}
            paginationPageSizeSelector={[10, 25, 50]}
            overlayNoRowsTemplate='<span style="color:#64748B;font-size:13px">No delayed orders found for the selected filters</span>'
          />
        </div>
      )}
    </div>
  );
};

export default DelayedOrdersGrid;
