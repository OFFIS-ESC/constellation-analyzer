import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import type { ConstellationState } from '../../types/timeline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface StateNodeData {
  state: ConstellationState;
  isCurrent: boolean;
}

/**
 * StateNode - Custom node for timeline visualization
 */
const StateNode: React.FC<NodeProps<StateNodeData>> = ({ data, selected }) => {
  const { state, isCurrent } = data;

  // Format date if present
  const dateStr = state.metadata?.date
    ? new Date(state.metadata.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  // Get custom color or default
  const color = state.metadata?.color || '#3b82f6';

  return (
    <div
      className={`
        px-3 py-2 rounded-lg border-2 bg-white shadow-sm
        transition-all cursor-pointer
        ${selected ? 'border-blue-500 shadow-md' : 'border-gray-300'}
        ${isCurrent ? 'ring-2 ring-green-400' : ''}
        hover:shadow-lg
      `}
      style={{
        minWidth: '120px',
        maxWidth: '200px',
        borderColor: selected ? '#3b82f6' : isCurrent ? '#10b981' : '#d1d5db',
      }}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        {isCurrent && (
          <CheckCircleIcon
            className="text-green-500 flex-shrink-0"
            style={{ fontSize: '16px' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" title={state.label}>
            {state.label}
          </div>
          {dateStr && (
            <div className="text-xs text-gray-500">{dateStr}</div>
          )}
          {state.description && (
            <div className="text-xs text-gray-600 truncate mt-1" title={state.description}>
              {state.description}
            </div>
          )}
          {state.metadata?.tags && state.metadata.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {state.metadata.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-blue-100 text-blue-700 px-1 rounded"
                >
                  {tag}
                </span>
              ))}
              {state.metadata.tags.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{state.metadata.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StateNode;
