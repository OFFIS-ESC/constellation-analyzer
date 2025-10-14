import { memo, useMemo } from "react";
import { Handle, Position, NodeProps, useStore } from "reactflow";
import { useGraphStore } from "../../stores/graphStore";
import { useSearchStore } from "../../stores/searchStore";
import {
  getContrastColor,
  adjustColorBrightness,
} from "../../utils/colorUtils";
import { getIconComponent } from "../../utils/iconUtils";
import type { ActorData } from "../../types";

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
const CustomNode = ({ data, selected }: NodeProps<ActorData>) => {
  const nodeTypes = useGraphStore((state) => state.nodeTypes);
  const { searchText, visibleActorTypes } = useSearchStore();

  // Check if any connection is being made (to show handles)
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  const isConnecting = !!connectionNodeId;

  // Find the node type configuration
  const nodeTypeConfig = nodeTypes.find((nt) => nt.id === data.type);
  const nodeColor = nodeTypeConfig?.color || "#6b7280";
  const nodeLabel = nodeTypeConfig?.label || "Unknown";
  const IconComponent = getIconComponent(nodeTypeConfig?.icon);

  // Determine text color based on background
  const textColor = getContrastColor(nodeColor);
  const borderColor = selected
    ? adjustColorBrightness(nodeColor, -20)
    : nodeColor;

  // Show handles when selected or when connecting
  const showHandles = selected || isConnecting;

  // Check if this node matches the search and filter criteria
  const isMatch = useMemo(() => {
    // Check type visibility
    const isTypeVisible = visibleActorTypes[data.type] !== false;
    if (!isTypeVisible) {
      return false;
    }

    // Check search text match
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      const label = data.label?.toLowerCase() || "";
      const description = data.description?.toLowerCase() || "";
      const typeName = nodeLabel.toLowerCase();

      return (
        label.includes(searchLower) ||
        description.includes(searchLower) ||
        typeName.includes(searchLower)
      );
    }

    return true;
  }, [
    searchText,
    visibleActorTypes,
    data.type,
    data.label,
    data.description,
    nodeLabel,
  ]);

  // Determine if filters are active
  const hasActiveFilters =
    searchText.trim() !== "" ||
    Object.values(visibleActorTypes).some((v) => v === false);

  // Calculate opacity based on match status
  const nodeOpacity = hasActiveFilters && !isMatch ? 0.2 : 1.0;
  const isHighlighted = hasActiveFilters && isMatch;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md min-w-[120px]
        transition-all duration-200
        ${selected ? "shadow-xl" : "shadow-md"}
      `}
      style={{
        backgroundColor: nodeColor,
        borderWidth: "3px", // Keep consistent border width
        borderStyle: "solid",
        borderColor: borderColor,
        color: textColor,
        opacity: nodeOpacity,
        boxShadow: selected
          ? `0 0 0 3px ${nodeColor}40` // Add outer glow when selected (40 = ~25% opacity)
          : isHighlighted
            ? `0 0 0 3px ${nodeColor}80, 0 0 12px ${nodeColor}60` // Highlight glow for search matches
            : undefined,
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

      {/* Node content */}
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
      </div>
    </div>
  );
};

export default memo(CustomNode);
