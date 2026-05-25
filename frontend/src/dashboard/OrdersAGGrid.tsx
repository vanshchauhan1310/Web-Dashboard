import { useOrdersByCategory } from '../hooks/useAnalytics';

const OrdersAGGrid: React.FC = () => {
  const { data, isLoading, isError } = useOrdersByCategory();

  return (
    <div className="h-full w-full min-h-0 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-400">
          Loading orders by category...
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-full text-red-300">
          Failed to load order categories.
        </div>
      ) : (
        <div className="h-full min-h-[220px] overflow-y-auto rounded-xl border border-white/10 bg-[#0E1C30] shadow-inner shadow-black/10">
          <table className="min-w-full border-separate border-spacing-0">
            <thead className="bg-[#081424]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Orders
                </th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((row: { category: string; value: number }) => (
                  <tr
                    key={row.category}
                    className="odd:bg-[#0E1C30] even:bg-[#111f33] hover:bg-[#122340] transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-slate-100">{row.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-100">{row.value}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-sm text-slate-500">
                    No category data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrdersAGGrid;
