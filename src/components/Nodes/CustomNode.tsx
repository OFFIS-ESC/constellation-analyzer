import { memo, useMemo } from "react";
import { Handle, Position, NodeProps, useConnection } from "@xyflow/react";
import { useGraphStore } from "../../stores/graphStore";
import {
  getContrastColor,
  adjustColorBrightness,
} from "../../utils/colorUtils";
import { getIconComponent } from "../../utils/iconUtils";
import type { Actor } from "../../types";
import NodeShapeRenderer from "./Shapes/NodeShapeRenderer";
import LabelBadge from "../Common/LabelBadge";
import { useActiveFilters, nodeMatchesFilters } from "../../hooks/useActiveFilters";

/**
 * CustomNode - Represents an actor in the constellation graph
 *
 * Features:
 * - Visual representation with type-based coloring
 * - Connection handles (top, right, bottom, left)
 * - Label display
 * - Type badge
 *
 * Usage: Automatically rendered by React Flow for nodes with type='custom'
 */
const CustomNode = ({ data, selected }: NodeProps<Actor>) => {
  const nodeTypes = useGraphStore((state) => state.nodeTypes);
  const labels = useGraphStore((state) => state.labels);

  // Get active filters based on mode (editing vs presentation)
  const filters = useActiveFilters();

  // Check if any connection is being made (to show handles)
  const connection = useConnection();
  const isConnecting = !!connection.inProgress;

  // Find the node type configuration
  const nodeTypeConfig = nodeTypes.find((nt) => nt.id === data.type);
  const nodeColor = nodeTypeConfig?.color || "#6b7280";
  const nodeLabel = nodeTypeConfig?.label || "Unknown";
  const nodeShape = nodeTypeConfig?.shape || "rectangle";
  const IconComponent = getIconComponent(nodeTypeConfig?.icon);

  // Determine text color based on background
  const textColor = getContrastColor(nodeColor);
  const borderColor = selected
    ? adjustColorBrightness(nodeColor, -20)
    : nodeColor;

  // Show handles when selected or when connecting
  const showHandles = selected || isConnecting;

  // Check if this node matches the filter criteria
  const isMatch = useMemo(() => {
    return nodeMatchesFilters(
      data.type,
      data.labels || [],
      data.label || "",
      data.description || "",
      nodeLabel,
      filters
    );
  }, [
    data.type,
    data.labels,
    data.label,
    data.description,
    nodeLabel,
    filters,
  ]);

  // Determine if filters are active
  const hasActiveFilters =
    filters.searchText.trim() !== "" ||
    filters.selectedActorTypes.length > 0 ||
    filters.selectedLabels.length > 0;

  // Calculate opacity based on match status
  const nodeOpacity = hasActiveFilters && !isMatch ? 0.2 : 1.0;
  const isHighlighted = hasActiveFilters && isMatch;

  return (
    <div
      className="relative"
      style={{
        opacity: nodeOpacity,
      }}
    >
      {/* Connection handles - shown only when selected or connecting */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-2 h-2 transition-opacity"
        style={{
          background: adjustColorBrightness(nodeColor, -30),
          opacity: showHandles ? 1 : 0,
          border: `1px solid ${textColor}`,
        }}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-2 h-2 transition-opacity"
        style={{
          background: adjustColorBrightness(nodeColor, -30),
          opacity: showHandles ? 1 : 0,
          border: `1px solid ${textColor}`,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-2 h-2 transition-opacity"
        style={{
          background: adjustColorBrightness(nodeColor, -30),
          opacity: showHandles ? 1 : 0,
          border: `1px solid ${textColor}`,
        }}
      />

      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={true}
        className="w-2 h-2 transition-opacity"
        style={{
          background: adjustColorBrightness(nodeColor, -30),
          opacity: showHandles ? 1 : 0,
          border: `1px solid ${textColor}`,
        }}
      />

      {/* Node content with shape renderer */}
      <NodeShapeRenderer
        shape={nodeShape}
        color={nodeColor}
        borderColor={borderColor}
        textColor={textColor}
        selected={selected}
        isHighlighted={isHighlighted}
      >
        <div className="space-y-1">
          {/* Icon (if available) */}
          {IconComponent && (
            <div
              className="flex justify-center mb-1"
              style={{ color: textColor, fontSize: "2rem" }}
            >
              <IconComponent />
            </div>
          )}

          {/* Main label */}
          <div
            className="text-base font-bold text-center break-words leading-tight"
            style={{ color: textColor }}
          >
            {data.label}
          </div>

          {/* Type as subtle subtitle */}
          <div
            className="text-xs text-center opacity-70 font-medium leading-tight"
            style={{ color: textColor }}
          >
            {nodeLabel}
          </div>

          {/* Labels */}
          {data.labels && data.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center mt-2">
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
      </NodeShapeRenderer>
    </div>
  );
};

export default memo(CustomNode);
