import { useState, useCallback, useEffect, useRef } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/UnfoldLess';
import MaximizeIcon from '@mui/icons-material/UnfoldMore';
import { useNodes } from '@xyflow/react';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useConfirm } from '../../hooks/useConfirm';
import type { Group } from '../../types';

/**
 * GroupEditorPanel - Properties editor for selected group
 *
 * Features:
 * - Edit group name and description
 * - Change group background color
 * - View and manage group members (actors)
 * - Ungroup or delete group
 * - Live updates with debouncing
 */

interface Props {
  selectedGroup: Group;
  onClose: () => void;
}

const DEFAULT_GROUP_COLORS = [
  'rgba(59, 130, 246, 0.08)',   // Blue
  'rgba(16, 185, 129, 0.08)',   // Green
  'rgba(245, 158, 11, 0.08)',   // Orange
  'rgba(139, 92, 246, 0.08)',   // Purple
  'rgba(236, 72, 153, 0.08)',   // Pink
  'rgba(20, 184, 166, 0.08)',   // Teal
];

const GroupEditorPanel = ({ selectedGroup, onClose }: Props) => {
  const { updateGroup, deleteGroup, removeActorFromGroup, toggleGroupMinimized, nodes, nodeTypes, setGroups, groups } = useGraphWithHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const reactFlowNodes = useNodes();

  const [label, setLabel] = useState(selectedGroup.data.label);
  const [description, setDescription] = useState(selectedGroup.data.description || '');
  const [color, setColor] = useState(selectedGroup.data.color);

  // Debounce timer
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Ref to track current group ID (avoids recreating callback)
  const selectedGroupIdRef = useRef(selectedGroup.id);

  // Update ref when group changes
  useEffect(() => {
    selectedGroupIdRef.current = selectedGroup.id;
  }, [selectedGroup.id]);

  // Sync local state when selected group changes
  useEffect(() => {
    setLabel(selectedGroup.data.label);
    setDescription(selectedGroup.data.description || '');
    setColor(selectedGroup.data.color);
  }, [selectedGroup.id, selectedGroup.data]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    (updates: Partial<typeof selectedGroup.data>) => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = window.setTimeout(() => {
        updateGroup(selectedGroupIdRef.current, updates);
      }, 500);

      setDebounceTimer(timer);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateGroup, debounceTimer]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleLabelChange = (newLabel: string) => {
    setLabel(newLabel);
    if (newLabel.trim()) {
      debouncedUpdate({ label: newLabel.trim() });
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    debouncedUpdate({ description: newDescription.trim() || undefined });
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    updateGroup(selectedGroup.id, { color: newColor });
  };

  const handleRemoveActor = async (actorId: string) => {
    const actor = nodes.find((n) => n.id === actorId);

    const confirmed = await confirm({
      title: 'Remove Actor from Group',
      message: `Remove "${actor?.data.label || 'actor'}" from "${selectedGroup.data.label}"?`,
      confirmLabel: 'Remove',
      severity: 'info',
    });

    if (confirmed) {
      removeActorFromGroup(actorId, selectedGroup.id);
    }
  };

  const handleUngroup = async () => {
    const confirmed = await confirm({
      title: 'Ungroup Actors',
      message: `Ungroup "${selectedGroup.data.label}"? All ${selectedGroup.data.actorIds.length} actors will be moved back to the canvas.`,
      confirmLabel: 'Ungroup',
      severity: 'info',
    });

    if (confirmed) {
      deleteGroup(selectedGroup.id, true); // true = ungroup (non-destructive)
      onClose();
    }
  };

  const handleDeleteGroup = async () => {
    const confirmed = await confirm({
      title: 'Delete Group and Actors',
      message: `Delete "${selectedGroup.data.label}" AND all ${selectedGroup.data.actorIds.length} actors inside? This will also delete all connected relations. This action cannot be undone.`,
      confirmLabel: 'Delete',
      severity: 'danger',
    });

    if (confirmed) {
      deleteGroup(selectedGroup.id, false); // false = destructive delete
      onClose();
    }
  };

  // Get actors in this group
  const groupActors = nodes.filter((node) => selectedGroup.data.actorIds.includes(node.id));

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Group Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter group name"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="Enter description"
        />
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Background Color
        </label>
        <div className="grid grid-cols-6 gap-2">
          {DEFAULT_GROUP_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => handleColorChange(c)}
              className={`w-10 h-10 rounded border-2 transition-all ${
                color === c ? 'border-blue-500 scale-110' : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
      </div>

      {/* Members */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">
          Members ({groupActors.length} actor{groupActors.length !== 1 ? 's' : ''})
        </label>
        {groupActors.length === 0 ? (
          <p className="text-xs text-gray-500 italic">No actors in this group</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
            {groupActors.map((actor) => {
              const actorType = nodeTypes.find((nt) => nt.id === actor.data.type);
              return (
                <div
                  key={actor.id}
                  className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: actorType?.color || '#6b7280' }}
                    />
                    <span className="text-gray-700 truncate">{actor.data.label}</span>
                    <span className="text-xs text-gray-500">({actorType?.label || 'Unknown'})</span>
                  </div>
                  <Tooltip title="Remove from group">
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveActor(actor.id)}
                      sx={{ padding: '2px' }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <button
          onClick={() => {
            // Sync current React Flow dimensions before toggling
            if (!selectedGroup.data.minimized) {
              // When minimizing, update the store with current dimensions first
              const currentNode = reactFlowNodes.find((n) => n.id === selectedGroup.id);
              if (currentNode && currentNode.width && currentNode.height) {
                setGroups(groups.map((g) =>
                  g.id === selectedGroup.id
                    ? { ...g, width: currentNode.width, height: currentNode.height }
                    : g
                ));
              }
            }
            // Use setTimeout to ensure store update completes before toggle
            setTimeout(() => {
              toggleGroupMinimized(selectedGroup.id);
            }, 0);
          }}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2"
        >
          {selectedGroup.data.minimized ? (
            <>
              <MaximizeIcon fontSize="small" />
              <span>Maximize Group</span>
            </>
          ) : (
            <>
              <MinimizeIcon fontSize="small" />
              <span>Minimize Group</span>
            </>
          )}
        </button>
        <button
          onClick={handleUngroup}
          className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
        >
          Ungroup (Keep Actors)
        </button>
        <button
          onClick={handleDeleteGroup}
          className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors flex items-center justify-center space-x-2"
        >
          <DeleteIcon fontSize="small" />
          <span>Delete Group & Actors</span>
        </button>
      </div>

      {ConfirmDialogComponent}
    </div>
  );
};

export default GroupEditorPanel;
