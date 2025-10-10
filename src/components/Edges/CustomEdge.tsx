import { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
} from 'reactflow';
import { useGraphStore } from '../../stores/graphStore';
import type { RelationData } from '../../types';

/**
 * CustomEdge - Represents a relation between actors in the constellation graph
 *
 * Features:
 * - Bezier curve path
 * - Type-based coloring and styling
 * - Optional label display
 * - Edge type badge
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

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray,
        }}
      />

      {/* Edge label - show custom or type default */}
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
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
