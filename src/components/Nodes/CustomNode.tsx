import { memo } from 'react';
import { Handle, Position, NodeProps, useStore } from 'reactflow';
import { useGraphStore } from '../../stores/graphStore';
import { getContrastColor, adjustColorBrightness } from '../../utils/colorUtils';
import { getIconComponent } from '../../utils/iconUtils';
import type { ActorData } from '../../types';

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

  // Check if any connection is being made (to show handles)
  const connectionNodeId = useStore((state) => state.connectionNodeId);
  const isConnecting = !!connectionNodeId;

  // Find the node type configuration
  const nodeTypeConfig = nodeTypes.find((nt) => nt.id === data.type);
  const nodeColor = nodeTypeConfig?.color || '#6b7280';
  const nodeLabel = nodeTypeConfig?.label || 'Unknown';
  const IconComponent = getIconComponent(nodeTypeConfig?.icon);

  // Determine text color based on background
  const textColor = getContrastColor(nodeColor);
  const borderColor = selected ? adjustColorBrightness(nodeColor, -20) : nodeColor;

  // Show handles when selected or when connecting
  const showHandles = selected || isConnecting;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md min-w-[120px]
        transition-all duration-200
        ${selected ? 'shadow-xl' : 'shadow-md'}
      `}
      style={{
        backgroundColor: nodeColor,
        borderWidth: '3px', // Keep consistent border width
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        boxShadow: selected
          ? `0 0 0 3px ${nodeColor}40` // Add outer glow when selected (40 = ~25% opacity)
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
          <div className="flex justify-center mb-1" style={{ color: textColor, fontSize: '2rem' }}>
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

        {/* Description (if available) */}
        {data.description && (
          <div
            className="text-xs text-center opacity-60 pt-2 mt-1 border-t"
            style={{
              color: textColor,
              borderColor: `${textColor}40`, // 40 is hex for ~25% opacity
            }}
          >
            {data.description}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
