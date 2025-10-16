import { memo, useMemo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { useGraphStore } from '../../stores/graphStore';
import { useSearchStore } from '../../stores/searchStore';
import type { RelationData } from '../../types';

/**
 * CustomEdge - Represents a relation between actors in the constellation graph
 *
 * Features:
 * - Bezier curve path
 * - Type-based coloring and styling
 * - Optional label display
 * - Edge type badge
 * - Directional arrow markers (directed, bidirectional, undirected)
 *
 * Usage: Automatically rendered by React Flow for edges with type='custom'
 */
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationData>) => {
  const edgeTypes = useGraphStore((state) => state.edgeTypes);
  const { searchText, visibleRelationTypes } = useSearchStore();

  // Calculate the bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Find the edge type configuration
  const edgeTypeConfig = edgeTypes.find((et) => et.id === data?.type);
  const edgeColor = edgeTypeConfig?.color || '#6b7280';
  const edgeStyle = edgeTypeConfig?.style || 'solid';

  // Use custom label if provided, otherwise use type's default label
  const displayLabel = data?.label || edgeTypeConfig?.label;

  // Convert style to stroke-dasharray
  const strokeDasharray = {
    solid: '0',
    dashed: '5,5',
    dotted: '1,5',
  }[edgeStyle];

  // Get directionality (default to 'directed' for backwards compatibility)
  const directionality = data?.directionality || edgeTypeConfig?.defaultDirectionality || 'directed';

  // Check if this edge matches the filter criteria
  const isMatch = useMemo(() => {
    // Check type visibility
    const edgeType = data?.type || '';
    const isTypeVisible = visibleRelationTypes[edgeType] !== false;
    if (!isTypeVisible) {
      return false;
    }

    // Check search text match
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const label = data?.label?.toLowerCase() || '';
      const typeName = edgeTypeConfig?.label?.toLowerCase() || '';

      return label.includes(searchLower) || typeName.includes(searchLower);
    }

    return true;
  }, [searchText, visibleRelationTypes, data?.type, data?.label, edgeTypeConfig?.label]);

  // Determine if filters are active
  const hasActiveFilters =
    searchText.trim() !== '' ||
    Object.values(visibleRelationTypes).some(v => v === false);

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

      {/* Edge label - show custom or type default */}
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              opacity: edgeOpacity,
            }}
            className="bg-white px-2 py-1 rounded border border-gray-300 text-xs font-medium shadow-sm"
          >
            <div style={{ color: edgeColor }}>{displayLabel}</div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
