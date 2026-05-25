import { useRef, useEffect, type DependencyList } from 'react';
import * as d3 from 'd3';

export const useD3 = (
  renderChartFn: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void,
  dependencies: DependencyList
) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      // Clear previous chart before re-rendering
      svg.selectAll('*').remove();
      renderChartFn(svg);
    }
  }, dependencies);

  return ref;
};
