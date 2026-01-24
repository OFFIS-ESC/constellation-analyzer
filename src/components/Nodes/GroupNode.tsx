import { memo, useState, useMemo } from 'react';
import { NodeProps, NodeResizer, useStore, Handle, Position } from '@xyflow/react';
import type { Group } from '../../types';
import type { Actor } from '../../types';
import { getContrastColor } from '../../utils/colorUtils';

/**
 * Helper function to convert rgb/rgba color string to hex
 */
const rgbToHex = (rgb: string): string => {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (!match) return '#000000';

  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
};

/**
 * GroupNode - Simple label overlay for React Flow's native group nodes
 *
 * This component provides a minimal UI on top of React Flow's built-in group styling.
 * The group itself (border, background) is styled via CSS in index.css.
 *
 * Features:
 * - Editable label (double-click to edit, Enter to save, Escape to cancel)
 * - Resizable via drag handles with smart minimum size based on children
 * - Simple, unobtrusive design that doesn't interfere with React Flow's layout
 *
 * Usage: Automatically rendered by React Flow for nodes with type='group'
 */
const GroupNode = ({ id, data, selected }: NodeProps<Group>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);

  // Get child nodes from React Flow store to calculate minimum dimensions
  const childNodes = useStore((state) => {
    return state.nodeLookup
      ? Array.from(state.nodeLookup.values()).filter(
          (node) => (node as unknown as Actor & { parentId?: string }).parentId === id
        )
      : [];
  });

  // Calculate minimum dimensions based on child nodes
  const { minWidth, minHeight } = useMemo(() => {
    if (childNodes.length === 0) {
      return { minWidth: 150, minHeight: 100 };
    }

    // Find the bounding box of all child nodes (in relative coordinates)
    const padding = 20; // Minimum padding around children

    let maxX = 0;
    let maxY = 0;

    childNodes.forEach((node) => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 100;
      const rightEdge = node.position.x + nodeWidth;
      const bottomEdge = node.position.y + nodeHeight;

      maxX = Math.max(maxX, rightEdge);
      maxY = Math.max(maxY, bottomEdge);
    });

    return {
      minWidth: Math.max(150, maxX + padding),
      minHeight: Math.max(100, maxY + padding),
    };
  }, [childNodes]);

  const handleStartEdit = () => {
    setEditLabel(data.label);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editLabel.trim() && editLabel !== data.label) {
      // Update via the group store
      // For now, we'll just close editing - actual update will be handled by GroupEditorPanel
      // TODO: Implement direct label update
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditLabel(data.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Minimized state - render as compact rectangle
  if (data.minimized) {
    // Convert color to solid (remove alpha) for minimized state
    const solidColor = data.color
      ? data.color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/, 'rgb($1, $2, $3)')
      : '#f0f2f5';

    // Calculate contrast color for text based on background
    const hexColor = rgbToHex(solidColor);
    const textColor = getContrastColor(hexColor);

    return (
      <div
        className="group-minimized"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: solidColor,
          borderRadius: '8px',
          // Use separate border properties to override .react-flow__node-group dashed border
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: selected ? '#3b82f6' : 'rgba(0, 0, 0, 0.2)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Connection handles for minimized groups - hidden but necessary for edge routing */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          isConnectable={false}
          style={{ opacity: 0 }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          isConnectable={false}
          style={{ opacity: 0 }}
        />

        <div
          style={{
            padding: '12px 20px',
            textAlign: 'center',
          }}
        >
          <div
            className="text-base font-bold leading-tight"
            style={{ color: textColor }}
          >
            {data.label}
          </div>
          <div
            className="text-xs font-medium leading-tight mt-1.5"
            style={{ color: textColor, opacity: 0.7 }}
          >
            {data.actorIds.length} actor{data.actorIds.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    );
  }

  // Normal (maximized) state
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Invisible handles positioned around edges - center remains free for dragging */}
      {/* Bidirectional handles (source + target overlapping at each edge) */}

      {/* Top edge handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        isConnectable={true}
        style={{
          width: '100%',
          height: '30px',
          top: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        isConnectable={true}
        style={{
          width: '100%',
          height: '30px',
          top: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Right edge handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        isConnectable={true}
        style={{
          width: '30px',
          height: '100%',
          top: 0,
          right: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        isConnectable={true}
        style={{
          width: '30px',
          height: '100%',
          top: 0,
          right: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Bottom edge handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        isConnectable={true}
        style={{
          width: '100%',
          height: '30px',
          bottom: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        isConnectable={true}
        style={{
          width: '100%',
          height: '30px',
          bottom: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Left edge handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        isConnectable={true}
        style={{
          width: '30px',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        isConnectable={true}
        style={{
          width: '30px',
          height: '100%',
          top: 0,
          left: 0,
          opacity: 0,
          border: 'none',
          background: 'transparent',
          transform: 'none',
          cursor: 'crosshair',
        }}
      />

      {/* Background color overlay - uses group's custom color */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: data.color || 'rgba(240, 242, 245, 0.5)',
          borderRadius: '8px',
          pointerEvents: 'none', // Let clicks pass through to children
        }}
      />

      {/* Resize handles - only visible when selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#3b82f6',
          border: '2px solid white',
        }}
        lineStyle={{
          borderWidth: 2,
          borderColor: '#3b82f6',
        }}
      />

      {/* Label overlay - positioned at top-left corner */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          padding: '4px 8px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
        }}
      >
        {isEditing ? (
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none"
            autoFocus
            style={{ minWidth: '80px', maxWidth: '200px' }}
          />
        ) : (
          <span
            className="text-sm font-medium text-gray-700 cursor-text select-none"
            onDoubleClick={handleStartEdit}
            title="Double-click to edit"
          >
            {data.label}
          </span>
        )}
      </div>

      {/* Content area - React Flow renders child nodes here automatically */}
    </div>
  );
};

export default memo(GroupNode);
