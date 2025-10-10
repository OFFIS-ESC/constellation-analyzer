import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { Tooltip, IconButton } from '@mui/material';

/**
 * Toolbar - Undo/Redo controls
 *
 * Features:
 * - Undo/Redo buttons with keyboard shortcuts
 * - Shows operation descriptions
 *
 * Usage: Placed below tabs, provides quick access to history controls
 */
const Toolbar = () => {
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } = useDocumentHistory();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-2">
        <div className="flex items-center space-x-2">
          {/* Undo/Redo */}
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

          {/* Description text */}
          {undoDescription && (
            <span className="text-xs text-gray-500 ml-2">
              Next: {undoDescription}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
