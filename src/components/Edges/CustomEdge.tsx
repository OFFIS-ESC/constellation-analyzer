import { memo, useMemo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  useNodes,
} from '@xyflow/react';
import { useGraphStore } from '../../stores/graphStore';
import { useSearchStore } from '../../stores/searchStore';
import type { Relation } from '../../types';
import type { Group } from '../../types';
import LabelBadge from '../Common/LabelBadge';
import { getFloatingEdgeParams } from '../../utils/edgeUtils';

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
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<Relation>) => {
  const edgeTypes = useGraphStore((state) => state.edgeTypes);
  const labels = useGraphStore((state) => state.labels);
  const { searchText, selectedRelationTypes, selectedLabels } = useSearchStore();

  // Get all nodes to check if source/target are minimized groups
  const nodes = useNodes();
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  // Check if either endpoint is a minimized group
  const sourceIsMinimizedGroup = sourceNode?.type === 'group' && (sourceNode.data as Group['data']).minimized;
  const targetIsMinimizedGroup = targetNode?.type === 'group' && (targetNode.data as Group['data']).minimized;

  // Calculate floating edge parameters if needed
  // Only float the side(s) that connect to minimized groups
  let finalSourceX = sourceX;
  let finalSourceY = sourceY;
  let finalTargetX = targetX;
  let finalTargetY = targetY;
  let finalSourcePosition = sourcePosition;
  let finalTargetPosition = targetPosition;

  if ((sourceIsMinimizedGroup || targetIsMinimizedGroup) && sourceNode && targetNode) {
    const floatingParams = getFloatingEdgeParams(sourceNode, targetNode);

    // Only use floating position for the minimized group side(s)
    if (sourceIsMinimizedGroup) {
      finalSourceX = floatingParams.sx;
      finalSourceY = floatingParams.sy;
      finalSourcePosition = floatingParams.sourcePos;
    }

    if (targetIsMinimizedGroup) {
      finalTargetX = floatingParams.tx;
      finalTargetY = floatingParams.ty;
      finalTargetPosition = floatingParams.targetPos;
    }
  }

  // Calculate the bezier path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: finalSourceX,
    sourceY: finalSourceY,
    sourcePosition: finalSourcePosition,
    targetX: finalTargetX,
    targetY: finalTargetY,
    targetPosition: finalTargetPosition,
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
    // Check relation type filter (POSITIVE: if types selected, edge must be one of them)
    const edgeType = data?.type || '';
    if (selectedRelationTypes.length > 0) {
      if (!selectedRelationTypes.includes(edgeType)) {
        return false;
      }
    }

    // Check label filter (POSITIVE: if labels selected, edge must have at least one)
    if (selectedLabels.length > 0) {
      const edgeLabels = data?.labels || [];
      const hasSelectedLabel = edgeLabels.some((labelId) =>
        selectedLabels.includes(labelId)
      );
      if (!hasSelectedLabel) {
        return false;
      }
    }

    // Check search text match
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const label = data?.label?.toLowerCase() || '';
      const typeName = edgeTypeConfig?.label?.toLowerCase() || '';

      return label.includes(searchLower) || typeName.includes(searchLower);
    }

    return true;
  }, [searchText, selectedRelationTypes, selectedLabels, data?.type, data?.label, data?.labels, edgeTypeConfig?.label]);

  // Determine if filters are active
  const hasActiveFilters =
    searchText.trim() !== '' ||
    selectedRelationTypes.length > 0 ||
    selectedLabels.length > 0;

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

      {/* Edge label - show custom or type default, plus labels */}
      {(displayLabel || (data?.labels && data.labels.length > 0)) && (
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
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge);
