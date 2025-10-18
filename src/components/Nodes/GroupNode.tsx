import { memo, useState, useMemo } from 'react';
import { NodeProps, NodeResizer, useStore } from 'reactflow';
import type { GroupData } from '../../types';
import type { Actor } from '../../types';

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
const GroupNode = ({ id, data, selected }: NodeProps<GroupData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);

  // Get child nodes from React Flow store to calculate minimum dimensions
  const childNodes = useStore((state) => {
    return state.nodeInternals
      ? Array.from(state.nodeInternals.values()).filter(
          (node) => (node as Actor & { parentId?: string }).parentId === id
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

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
      }}
    >
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
