import { RefreshCw, ChevronLeft, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface TopbarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ onRefresh, isRefreshing }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  return (
    <div
      className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-3 px-5"
      style={{
        background: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(6, 13, 26, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: isLight ? '1px solid rgba(15, 23, 42, 0.1)' : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Back to selector */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-white/[0.06] active:scale-95"
        style={{ color: isLight ? '#64748B' : '#64748B' }}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <LayoutGrid className="h-3.5 w-3.5" />
        <span>All Dashboards</span>
      </button>

      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.25), 0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>Refresh</span>
      </button>
    </div>
  );
};

export default Topbar;
