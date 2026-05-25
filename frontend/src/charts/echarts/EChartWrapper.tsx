import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';

interface EChartWrapperProps {
  option: echarts.EChartsCoreOption;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
  onChartClick?: (params: any) => void;
}

const EChartWrapper: React.FC<EChartWrapperProps> = ({ option, style, className, loading = false, onChartClick }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current, 'dark', { renderer: 'canvas' });
      }
      
      chartInstance.current.setOption({
        backgroundColor: 'transparent',
        textStyle: {
          fontFamily: 'Inter, sans-serif'
        },
        ...option
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [option]);

  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading({
          text: 'Loading data...',
          color: '#3B82F6',
          textColor: '#fff',
          maskColor: 'rgba(11, 15, 25, 0.8)',
        });
      } else {
        chartInstance.current.hideLoading();
      }
    }
  }, [loading]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const chart = chartInstance.current;
    if (!chart || !onChartClick) return;

    chart.on('click', onChartClick);
    return () => {
      chart.off('click', onChartClick);
    };
  }, [onChartClick, option]);

  return <div ref={chartRef} style={{ width: '100%', height: '100%', ...style }} className={className} />;
};

export default EChartWrapper;
