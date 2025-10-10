import { useCallback, useEffect } from 'react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useEditorStore } from '../../stores/editorStore';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { createNode } from '../../utils/nodeUtils';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { Tooltip, IconButton } from '@mui/material';

/**
 * Toolbar - Graph editing tools
 *
 * Features:
 * - Undo/Redo buttons with keyboard shortcuts
 * - Add Actor buttons (by type)
 * - Relation type selector
 * - Visual node type palette
 *
 * Usage: Placed below tabs, provides quick access to graph editing tools
 */
const Toolbar = () => {
  const { nodeTypes, edgeTypes, addNode } = useGraphWithHistory();
  const { selectedRelationType, setSelectedRelationType } = useEditorStore();
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useDocumentHistory();

  // Set default relation type on mount or when edge types change
  useEffect(() => {
    if (!selectedRelationType && edgeTypes.length > 0) {
      setSelectedRelationType(edgeTypes[0].id);
    }
  }, [edgeTypes, selectedRelationType, setSelectedRelationType]);

  const handleAddNode = useCallback(
    (nodeTypeId: string) => {
      // Create node at center of viewport (approximate)
      const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };

      const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeTypeId);
      const newNode = createNode(nodeTypeId, position, nodeTypeConfig);
      addNode(newNode);
    },
    [addNode, nodeTypes]
  );

  const selectedEdgeTypeConfig = edgeTypes.find(et => et.id === selectedRelationType);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center space-x-6">
          {/* Undo/Redo */}
          <div className="flex items-center space-x-1">
            <Tooltip
              title={undoDescription ? `Undo: ${undoDescription} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
              arrow
            >
              <span>
                <IconButton
                  onClick={undo}
                  disabled={!canUndo}
                  size="small"
                  sx={{
                    '&:disabled': {
                      opacity: 0.4,
                    }
                  }}
                >
                  <UndoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={redoDescription ? `Redo: ${redoDescription} (Ctrl+Y)` : 'Redo (Ctrl+Y)'}
              arrow
            >
              <span>
                <IconButton
                  onClick={redo}
                  disabled={!canRedo}
                  size="small"
                  sx={{
                    '&:disabled': {
                      opacity: 0.4,
                    }
                  }}
                >
                  <RedoIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </div>

          {/* Add Actor */}
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <h2 className="text-sm font-semibold text-gray-700">Add Actor:</h2>
            <div className="flex space-x-2">
              {nodeTypes.map((nodeType) => (
                <button
                  key={nodeType.id}
                  onClick={() => handleAddNode(nodeType.id)}
                  className="px-3 py-2 text-sm font-medium text-white rounded-md hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ backgroundColor: nodeType.color }}
                  title={nodeType.description}
                >
                  {nodeType.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relation Type Selector */}
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <h2 className="text-sm font-semibold text-gray-700">Relation Type:</h2>
            <select
              value={selectedRelationType || ''}
              onChange={(e) => setSelectedRelationType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: selectedEdgeTypeConfig?.color || '#6b7280'
              }}
            >
              {edgeTypes.map((edgeType) => (
                <option key={edgeType.id} value={edgeType.id}>
                  {edgeType.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-3 text-xs text-gray-500">
          <p>
            Click a button to add an actor. Drag actors to position them. Select a relation type above, then click
            and drag from a handle to create a relation between actors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
