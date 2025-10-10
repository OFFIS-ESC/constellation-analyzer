import { toPng, toSvg } from 'html-to-image';
import { getNodesBounds } from 'reactflow';
import type { Node } from 'reactflow';

/**
 * Graph Export Utilities
 *
 * Based on React Flow's official download-image example:
 * https://reactflow.dev/examples/misc/download-image
 *
 * Uses html-to-image@1.11.11 (newer versions have export issues)
 */

export interface ExportOptions {
  /** Background color for the exported image */
  backgroundColor?: string;
  /** Padding around the graph content (in pixels) */
  padding?: number;
  /** Image quality/scale multiplier (1-4) */
  quality?: number;
  /** File name (without extension) */
  fileName?: string;
}

const DEFAULT_OPTIONS: Required<Omit<ExportOptions, 'fileName'>> = {
  backgroundColor: '#ffffff',
  padding: 10,
  quality: 4, // ~300 DPI for standard screen-to-print conversion
};

/**
 * Downloads a file from a data URL
 */
function downloadImage(dataUrl: string, fileName: string, extension: string) {
  const a = document.createElement('a');
  a.setAttribute('download', `${fileName}.${extension}`);
  a.setAttribute('href', dataUrl);
  a.click();
}

/**
 * Calculate the viewport bounds for capturing the entire graph
 *
 * This creates a tight crop around all nodes with minimal padding.
 *
 * @param nodes - Array of nodes in the graph
 * @param padding - Padding around the content
 * @returns Dimensions and transform for the export
 */
function calculateImageBounds(nodes: Node[], padding: number) {
  // Get the bounding box that contains all nodes
  const nodesBounds = getNodesBounds(nodes);

  console.log('Node bounds:', nodesBounds);
  console.log('Number of nodes:', nodes.length);
  console.log('Nodes:', nodes.map(n => ({ id: n.id, position: n.position, width: n.width, height: n.height })));

  // Calculate image dimensions with padding
  const imageWidth = nodesBounds.width + padding * 2;
  const imageHeight = nodesBounds.height + padding * 2;

  // Calculate transform to position the content
  // We want to translate the viewport so that the top-left of nodesBounds
  // is at position (padding, padding) in the export
  const transform = {
    x: -nodesBounds.x + padding,
    y: -nodesBounds.y + padding,
    zoom: 1,
  };

  console.log('Calculated dimensions:', { width: imageWidth, height: imageHeight });
  console.log('Transform:', transform);

  return {
    width: imageWidth,
    height: imageHeight,
    transform,
  };
}

/**
 * Export React Flow graph as PNG
 *
 * @param viewportElement - The .react-flow__viewport DOM element
 * @param nodes - Array of nodes in the graph
 * @param options - Export options
 */
export async function exportGraphAsPNG(
  viewportElement: HTMLElement,
  nodes: Node[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    backgroundColor,
    padding,
    quality,
    fileName = 'constellation-graph',
  } = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) {
    throw new Error('Cannot export empty graph');
  }

  const { width, height, transform } = calculateImageBounds(nodes, padding);

  try {
    const dataUrl = await toPng(viewportElement, {
      backgroundColor,
      width: width,
      height: height,
      pixelRatio: quality,
      cacheBust: true,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    });

    downloadImage(dataUrl, fileName, 'png');
  } catch (error) {
    console.error('PNG export failed:', error);
    throw new Error('Failed to export graph as PNG');
  }
}

/**
 * Export React Flow graph as SVG
 *
 * @param viewportElement - The .react-flow__viewport DOM element
 * @param nodes - Array of nodes in the graph
 * @param options - Export options
 */
export async function exportGraphAsSVG(
  viewportElement: HTMLElement,
  nodes: Node[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    backgroundColor,
    padding,
    fileName = 'constellation-graph',
  } = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) {
    throw new Error('Cannot export empty graph');
  }

  const { width, height, transform } = calculateImageBounds(nodes, padding);

  try {
    const dataUrl = await toSvg(viewportElement, {
      backgroundColor,
      width,
      height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    });

    downloadImage(dataUrl, fileName, 'svg');
  } catch (error) {
    console.error('SVG export failed:', error);
    throw new Error('Failed to export graph as SVG');
  }
}
