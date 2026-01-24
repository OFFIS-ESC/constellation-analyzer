import { memo, useMemo } from 'react';
import {
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  useInternalNode,
} from '@xyflow/react';
import { useGraphStore } from '../../stores/graphStore';
import type { Relation } from '../../types';
import LabelBadge from '../Common/LabelBadge';
import { getFloatingEdgeParams } from '../../utils/edgeUtils';
import { useActiveFilters, edgeMatchesFilters } from '../../hooks/useActiveFilters';

/**
 * CustomEdge - Represents a relation between actors in the constellation graph
 *
 * Features:
 * - Bezier curve path
 * - Type-based coloring and styling
 * - Optional label display
 * - Edge type badge
 * - Directional arrow markers (directed, bidirectional, undirected)
 * - Floating edges for minimized groups
 *
 * Usage: Automatically rendered by React Flow for edges with type='custom'
 */
const CustomEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps<Relation>) => {
  const edgeTypes = useGraphStore((state) => state.edgeTypes);
  const labels = useGraphStore((state) => state.labels);
  const nodeTypes = useGraphStore((state) => state.nodeTypes);

  // Get active filters based on mode (editing vs presentation)
  const filters = useActiveFilters();

  // Get internal nodes for floating edge calculations with correct absolute positioning
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Determine node shapes from node type configuration
  const sourceShape = useMemo(() => {
    if (!sourceNode) return 'rectangle';
    // Groups always use rectangle shape
    if (sourceNode.type === 'group') return 'rectangle';
    const nodeData = sourceNode.data as { type?: string };
    const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeData?.type);
    return nodeTypeConfig?.shape || 'rectangle';
  }, [sourceNode, nodeTypes]);

  const targetShape = useMemo(() => {
    if (!targetNode) return 'rectangle';
    // Groups always use rectangle shape
    if (targetNode.type === 'group') return 'rectangle';
    const nodeData = targetNode.data as { type?: string };
    const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeData?.type);
    return nodeTypeConfig?.shape || 'rectangle';
  }, [targetNode, nodeTypes]);

  // Calculate floating edge parameters with custom bezier control points
  const edgeParams = useMemo(() => {
    if (!sourceNode || !targetNode) {
      // Fallback to default React Flow positioning
      return {
        edgePath: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2,
      };
    }

    const params = getFloatingEdgeParams(sourceNode, targetNode, sourceShape, targetShape);

    // Create cubic bezier path using custom control points
    const edgePath = `M ${params.sx},${params.sy} C ${params.sourceControlX},${params.sourceControlY} ${params.targetControlX},${params.targetControlY} ${params.tx},${params.ty}`;

    // Calculate label position at midpoint of the bezier curve (t=0.5)
    const t = 0.5;
    const labelX =
      Math.pow(1 - t, 3) * params.sx +
      3 * Math.pow(1 - t, 2) * t * params.sourceControlX +
      3 * (1 - t) * Math.pow(t, 2) * params.targetControlX +
      Math.pow(t, 3) * params.tx;
    const labelY =
      Math.pow(1 - t, 3) * params.sy +
      3 * Math.pow(1 - t, 2) * t * params.sourceControlY +
      3 * (1 - t) * Math.pow(t, 2) * params.targetControlY +
      Math.pow(t, 3) * params.ty;

    return { edgePath, labelX, labelY };
  }, [sourceNode, targetNode, sourceShape, targetShape, sourceX, sourceY, targetX, targetY]);

  const { edgePath, labelX, labelY } = edgeParams;

  // Check if this is an aggregated edge
  const isAggregated = !!(data as { aggregatedCount?: number })?.aggregatedCount;

  // Find the edge type configuration
  const edgeTypeConfig = edgeTypes.find((et) => et.id === data?.type);

  // For aggregated edges, use neutral styling (dark gray, solid, no arrows)
  const edgeColor = isAggregated ? '#4b5563' : (edgeTypeConfig?.color || '#6b7280'); // dark gray for aggregated
  const edgeStyle = isAggregated ? 'solid' : (edgeTypeConfig?.style || 'solid');

  // Use custom label if provided, otherwise use type's default label
  // For aggregated edges, show "Multiple types" instead
  const displayLabel = isAggregated
    ? undefined // Don't show individual type label for aggregated edges
    : (data?.label || edgeTypeConfig?.label);

  // Convert style to stroke-dasharray
  const strokeDasharray = {
    solid: '0',
    dashed: '5,5',
    dotted: '1,5',
  }[edgeStyle];

  // Get directionality (default to 'directed' for backwards compatibility)
  // For aggregated edges, use 'undirected' (no arrows)
  const directionality = isAggregated
    ? 'undirected'
    : (data?.directionality || edgeTypeConfig?.defaultDirectionality || 'directed');

  // Check if this edge matches the filter criteria
  const isMatch = useMemo(() => {
    return edgeMatchesFilters(
      data?.type || '',
      data?.labels || [],
      data?.label || '',
      edgeTypeConfig?.label || '',
      filters
    );
  }, [data?.type, data?.labels, data?.label, edgeTypeConfig?.label, filters]);

  // Determine if filters are active
  const hasActiveFilters =
    filters.searchText.trim() !== '' ||
    filters.selectedRelationTypes.length > 0 ||
    filters.selectedLabels.length > 0;

  // Calculate opacity based on visibility
  const edgeOpacity = hasActiveFilters && !isMatch ? 0.2 : 1.0;

  // Create unique marker IDs based on color (for reusability)
  const safeColor = edgeColor.replace('#', '');
  const markerEndId = `arrow-end-${safeColor}`;
  const markerStartId = `arrow-start-${safeColor}`;

  // Determine marker start/end based on directionality
  const markerEnd = (directionality === 'directed' || directionality === 'bidirectional')
    ? `url(#${markerEndId})`
    : undefined;
  const markerStart = directionality === 'bidirectional'
    ? `url(#${markerStartId})`
    : undefined;

  return (
    <>
      {/* Arrow marker definitions */}
      <defs>
        {/* Arrow pointing right (for marker-end) */}
        <marker
          id={markerEndId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          fill={edgeColor}
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>

        {/* Arrow pointing left (for marker-start) */}
        <marker
          id={markerStartId}
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="8"
          markerHeight="8"
          orient="auto"
          fill={edgeColor}
        >
          <path d="M 10 0 L 0 5 L 10 10 z" />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray,
          opacity: edgeOpacity,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />

      {/* Edge label - show custom or type default, plus labels, plus aggregation count */}
      {(displayLabel || (data?.labels && data.labels.length > 0) || (data as { aggregatedCount?: number })?.aggregatedCount) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              opacity: edgeOpacity,
              zIndex: 1100, // Higher than selected groups (which get ~1000) to stay on top
            }}
            className="bg-white px-2 py-1 rounded border border-gray-300 text-xs font-medium shadow-sm"
          >
            {displayLabel && (
              <div style={{ color: edgeColor }} className="mb-1">
                {displayLabel}
              </div>
            )}
            {data?.labels && data.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center">
                {data.labels.map((labelId) => {
                  const labelConfig = labels.find((l) => l.id === labelId);
                  if (!labelConfig) return null;
                  return (
                    <LabelBadge
                      key={labelId}
                      name={labelConfig.name}
                      color={labelConfig.color}
                      maxWidth="80px"
                      size="sm"
                    />
                  );
                })}
              </div>
            )}
            {/* Aggregation counter for multiple relations between minimized groups */}
            {(data as { aggregatedCount?: number })?.aggregatedCount && (
              <div
                className="mt-1 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: edgeColor }}
              >
                {(data as { aggregatedCount?: number }).aggregatedCount} relations
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
