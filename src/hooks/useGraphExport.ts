import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { exportGraphAsPNG, exportGraphAsSVG } from '../utils/graphExport';
import type { ExportOptions } from '../utils/graphExport';

/**
 * useGraphExport Hook
 *
 * Provides convenient methods for exporting the current React Flow graph
 * as PNG or SVG images.
 *
 * Usage:
 * ```tsx
 * const { exportPNG, exportSVG } = useGraphExport();
 *
 * // Export as PNG
 * await exportPNG({ fileName: 'my-graph', quality: 3 });
 *
 * // Export as SVG
 * await exportSVG({ fileName: 'my-graph', backgroundColor: '#f0f0f0' });
 * ```
 */
export function useGraphExport() {
  const { getNodes } = useReactFlow();

  /**
   * Export the current graph as a PNG image
   *
   * @param options - Export options (fileName, quality, backgroundColor, padding)
   * @throws Error if viewport element is not found or export fails
   */
  const exportPNG = useCallback(
    async (options?: ExportOptions) => {
      const viewportElement = document.querySelector(
        '.react-flow__viewport'
      ) as HTMLElement;

      if (!viewportElement) {
        throw new Error('React Flow viewport element not found');
      }

      const nodes = getNodes();

      await exportGraphAsPNG(viewportElement, nodes, options);
    },
    [getNodes]
  );

  /**
   * Export the current graph as an SVG image
   *
   * @param options - Export options (fileName, backgroundColor, padding)
   * @throws Error if viewport element is not found or export fails
   */
  const exportSVG = useCallback(
    async (options?: ExportOptions) => {
      const viewportElement = document.querySelector(
        '.react-flow__viewport'
      ) as HTMLElement;

      if (!viewportElement) {
        throw new Error('React Flow viewport element not found');
      }

      const nodes = getNodes();

      await exportGraphAsSVG(viewportElement, nodes, options);
    },
    [getNodes]
  );

  return { exportPNG, exportSVG };
}
