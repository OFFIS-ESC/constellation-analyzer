import { Tooltip } from '@mui/material';
import { getIconComponent } from '../../utils/iconUtils';
import type { Actor, NodeTypeConfig, EdgeDirectionality } from '../../types';

/**
 * ConnectionDisplay - Reusable component for displaying actor connections
 *
 * Shows source and target actors with:
 * - Node type icon
 * - Node label
 * - Node type label
 * - Direction indicator based on directionality
 */

interface ConnectionDisplayProps {
  sourceNode: Actor | undefined;
  targetNode: Actor | undefined;
  nodeTypes: NodeTypeConfig[];
  directionality: EdgeDirectionality;
}

const ConnectionDisplay = ({
  sourceNode,
  targetNode,
  nodeTypes,
  directionality
}: ConnectionDisplayProps) => {
  const sourceType = nodeTypes.find(nt => nt.id === sourceNode?.data?.type);
  const targetType = nodeTypes.find(nt => nt.id === targetNode?.data?.type);
  const SourceIcon = sourceType ? getIconComponent(sourceType.icon) : null;
  const TargetIcon = targetType ? getIconComponent(targetType.icon) : null;

  return (
    <div className="flex items-center justify-between text-xs text-gray-600 py-2 bg-gray-50 rounded px-2 space-x-2">
      {/* Source Actor */}
      <Tooltip title={`ID: ${sourceNode?.id || 'Unknown'}`} placement="top">
        <div className="flex items-center space-x-1 flex-1">
          {SourceIcon && (
            <div className="flex-shrink-0" style={{ color: sourceType?.color, fontSize: '14px' }}>
              <SourceIcon fontSize="small" />
            </div>
          )}
          <span className="font-medium truncate">
            {sourceNode?.data?.label || sourceNode?.id || 'Unknown'}
          </span>
          <span className="text-gray-400 text-[10px] flex-shrink-0">
            ({sourceType?.label || 'Unknown'})
          </span>
        </div>
      </Tooltip>

      {/* Direction Indicator */}
      <span className="flex-shrink-0 text-gray-500">
        {directionality === 'directed' && '→'}
        {directionality === 'bidirectional' && '↔'}
        {directionality === 'undirected' && '—'}
      </span>

      {/* Target Actor */}
      <Tooltip title={`ID: ${targetNode?.id || 'Unknown'}`} placement="top">
        <div className="flex items-center space-x-1 flex-1 justify-end">
          <span className="text-gray-400 text-[10px] flex-shrink-0">
            ({targetType?.label || 'Unknown'})
          </span>
          <span className="font-medium truncate">
            {targetNode?.data?.label || targetNode?.id || 'Unknown'}
          </span>
          {TargetIcon && (
            <div className="flex-shrink-0" style={{ color: targetType?.color, fontSize: '14px' }}>
              <TargetIcon fontSize="small" />
            </div>
          )}
        </div>
      </Tooltip>
    </div>
  );
};

export default ConnectionDisplay;
