import { useState, useMemo } from 'react';
import { Chip, ToggleButton, ToggleButtonGroup, Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import UngroupIcon from '@mui/icons-material/CallSplit';
import MinimizeIcon from '@mui/icons-material/Minimize';
import MaximizeIcon from '@mui/icons-material/Maximize';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import RemoveIcon from '@mui/icons-material/Remove';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useDocumentHistory } from '../../hooks/useDocumentHistory';
import { useConfirm } from '../../hooks/useConfirm';
import type { Actor, Relation, Group } from '../../types';

/**
 * MultiSelectProperties - Panel shown when multiple elements are selected
 *
 * Features:
 * - Selection statistics and summary
 * - Bulk operations contextual to selection type
 * - Reuses logic from context menu operations
 * - Confirmation for destructive actions
 */

interface Props {
  selectedActors: Actor[];
  selectedRelations: Relation[];
  selectedGroups: Group[];
  onClose: () => void;
}

interface SelectionStats {
  actorCount: number;
  relationCount: number;
  groupCount: number;
  actorTypeBreakdown: Map<string, number>;
  relationTypeBreakdown: Map<string, number>;
  totalElements: number;
}

const MultiSelectProperties = ({
  selectedActors,
  selectedRelations,
  selectedGroups,
  onClose,
}: Props) => {
  const {
    deleteNode,
    deleteEdge,
    deleteGroup,
    createGroupWithActors,
    addActorToGroup,
    updateGroup,
    updateEdge,
    setEdges,
    edges,
    nodeTypes,
    edgeTypes,
  } = useGraphWithHistory();

  const { pushToHistory } = useDocumentHistory();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const [processing, setProcessing] = useState(false);

  // Local state for directionality to enable immediate UI updates
  const [currentDirectionality, setCurrentDirectionality] = useState<
    'directed' | 'bidirectional' | 'undirected' | null
  >(null);

  // Calculate selection statistics
  const stats: SelectionStats = useMemo(() => {
    const actorTypeBreakdown = new Map<string, number>();
    selectedActors.forEach((actor) => {
      const count = actorTypeBreakdown.get(actor.data.type) || 0;
      actorTypeBreakdown.set(actor.data.type, count + 1);
    });

    const relationTypeBreakdown = new Map<string, number>();
    selectedRelations.forEach((relation) => {
      if (relation.data) {
        const count = relationTypeBreakdown.get(relation.data.type) || 0;
        relationTypeBreakdown.set(relation.data.type, count + 1);
      }
    });

    return {
      actorCount: selectedActors.length,
      relationCount: selectedRelations.length,
      groupCount: selectedGroups.length,
      actorTypeBreakdown,
      relationTypeBreakdown,
      totalElements:
        selectedActors.length + selectedRelations.length + selectedGroups.length,
    };
  }, [selectedActors, selectedRelations, selectedGroups]);

  // Determine what operations are available
  const canGroupActors = selectedActors.length >= 2;
  const canDeleteSelection = stats.totalElements > 0;
  const canUngroupAll = selectedGroups.length > 0;
  const canMinimizeAll =
    selectedGroups.length > 0 &&
    selectedGroups.some((g) => !g.data.minimized);
  const canMaximizeAll =
    selectedGroups.length > 0 &&
    selectedGroups.some((g) => g.data.minimized);

  // Check if we can add actors to a group (1 group + 1+ actors selected)
  const canAddToGroup = selectedGroups.length === 1 && selectedActors.length >= 1;
  const targetGroup = selectedGroups.length === 1 ? selectedGroups[0] : null;

  // Check if all selected relations have the same directionality
  const allSameDirectionality = useMemo(() => {
    if (selectedRelations.length === 0) return null;
    const first = selectedRelations[0].data?.directionality;
    if (!first) return null;
    const sameDirectionality = selectedRelations.every((r) => r.data?.directionality === first)
      ? first
      : null;

    // Initialize local state when selection changes
    setCurrentDirectionality(sameDirectionality);

    return sameDirectionality;
  }, [selectedRelations]);

  // Handlers
  const handleAddToGroup = () => {
    if (!targetGroup) return;

    setProcessing(true);
    try {
      selectedActors.forEach((actor) => {
        addActorToGroup(actor.id, targetGroup.id);
      });
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleGroupActors = () => {
    setProcessing(true);
    try {
      // Calculate bounding box for selected actors
      const positions = selectedActors.map((a) => a.position);
      const minX = Math.min(...positions.map((p) => p.x));
      const minY = Math.min(...positions.map((p) => p.y));
      const maxX = Math.max(...positions.map((p) => p.x + 150)); // Assume node width ~150
      const maxY = Math.max(...positions.map((p) => p.y + 80)); // Assume node height ~80

      const groupId = `group-${Date.now()}`;
      const groupPosition = { x: minX - 20, y: minY - 40 };
      const groupWidth = maxX - minX + 40;
      const groupHeight = maxY - minY + 60;

      // Create group node
      const newGroup: Group = {
        id: groupId,
        type: 'group',
        position: groupPosition,
        data: {
          label: 'New Group',
          description: '',
          color: 'rgba(240, 242, 245, 0.5)',
          actorIds: selectedActors.map((a) => a.id),
        },
        style: {
          width: groupWidth,
          height: groupHeight,
        },
      };

      // Build actor updates map (relative positions and parent relationship)
      const actorUpdates: Record<
        string,
        { position: { x: number; y: number }; parentId: string; extent: 'parent' }
      > = {};
      selectedActors.forEach((actor) => {
        actorUpdates[actor.id] = {
          position: {
            x: actor.position.x - groupPosition.x,
            y: actor.position.y - groupPosition.y,
          },
          parentId: groupId,
          extent: 'parent' as const,
        };
      });

      createGroupWithActors(newGroup, selectedActors.map((a) => a.id), actorUpdates);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteSelection = async () => {
    const confirmed = await confirm({
      title: 'Delete Selection',
      message: `Delete ${stats.totalElements} selected item(s)? This action cannot be undone.`,
      confirmLabel: 'Delete',
      severity: 'danger',
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      // Delete in order: edges, nodes, groups (keep group actors - they may not be selected)
      selectedRelations.forEach((rel) => deleteEdge(rel.id));
      selectedActors.forEach((actor) => deleteNode(actor.id));
      selectedGroups.forEach((group) => deleteGroup(group.id, true)); // true = ungroup (keep actors)
    } finally {
      setProcessing(false);
      onClose();
    }
  };

  const handleUngroupAll = async () => {
    const confirmed = await confirm({
      title: 'Ungroup All',
      message: `Ungroup ${selectedGroups.length} group(s)? Actors will be preserved.`,
      confirmLabel: 'Ungroup',
      severity: 'warning',
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      // ungroupActors=true means keep actors (ungroup)
      selectedGroups.forEach((group) => deleteGroup(group.id, true));
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteGroupsAndActors = async () => {
    const totalActors = selectedGroups.reduce(
      (sum, g) => sum + g.data.actorIds.length,
      0,
    );

    const confirmed = await confirm({
      title: 'Delete Groups & Actors',
      message: `Delete ${selectedGroups.length} group(s) and ${totalActors} actor(s)? This action cannot be undone.`,
      confirmLabel: 'Delete All',
      severity: 'danger',
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      // ungroupActors=false means delete actors with group
      selectedGroups.forEach((group) => deleteGroup(group.id, false));
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleMinimizeAll = () => {
    setProcessing(true);
    try {
      selectedGroups.forEach((group) => {
        if (!group.data.minimized) {
          updateGroup(group.id, { minimized: true });
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleMaximizeAll = () => {
    setProcessing(true);
    try {
      selectedGroups.forEach((group) => {
        if (group.data.minimized) {
          updateGroup(group.id, { minimized: false });
        }
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleDirectionality = (
    newDirectionality: 'directed' | 'bidirectional' | 'undirected',
  ) => {
    // Update local state immediately for instant UI feedback
    setCurrentDirectionality(newDirectionality);

    setProcessing(true);
    try {
      selectedRelations.forEach((rel) => {
        updateEdge(rel.id, {
          ...rel.data,
          directionality: newDirectionality,
        });
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReverseDirections = () => {
    setProcessing(true);
    try {
      // Push to history BEFORE mutation
      pushToHistory(
        `Reverse Direction: ${selectedRelations.length} relation${selectedRelations.length > 1 ? 's' : ''}`,
      );

      // Create a Set of IDs to reverse for efficient lookup
      const idsToReverse = new Set(selectedRelations.map((r) => r.id));

      // Update the edges array with reversed edges
      const updatedEdges = edges.map((edge) => {
        if (idsToReverse.has(edge.id)) {
          return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceHandle: edge.targetHandle,
            targetHandle: edge.sourceHandle,
          };
        }
        return edge;
      });

      // Apply the update (setEdges is a pass-through without history tracking)
      setEdges(updatedEdges);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-4">
        {/* Selection Summary */}
        <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Selection Summary
        </h3>
        <div className="flex flex-wrap gap-2">
          {stats.actorCount > 0 && (
            <Chip
              label={`${stats.actorCount} Actor${stats.actorCount > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {stats.relationCount > 0 && (
            <Chip
              label={`${stats.relationCount} Relation${stats.relationCount > 1 ? 's' : ''}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          {stats.groupCount > 0 && (
            <Chip
              label={`${stats.groupCount} Group${stats.groupCount > 1 ? 's' : ''}`}
              size="small"
              color="info"
              variant="outlined"
            />
          )}
        </div>

        {/* Type breakdown for actors */}
        {stats.actorTypeBreakdown.size > 0 && (
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-medium">Actor Types:</div>
            {Array.from(stats.actorTypeBreakdown.entries()).map(([typeId, count]) => {
              const nodeType = nodeTypes.find((t) => t.id === typeId);
              return (
                <div key={typeId} className="flex items-center gap-2 ml-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: nodeType?.color || '#999' }}
                  />
                  <span>
                    {nodeType?.label || typeId}: {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Type breakdown for relations */}
        {stats.relationTypeBreakdown.size > 0 && (
          <div className="text-xs text-gray-600 space-y-1">
            <div className="font-medium">Relation Types:</div>
            {Array.from(stats.relationTypeBreakdown.entries()).map(
              ([typeId, count]) => {
                const edgeType = edgeTypes.find((t) => t.id === typeId);
                return (
                  <div key={typeId} className="flex items-center gap-2 ml-2">
                    <div
                      className="w-8 h-0.5"
                      style={{
                        backgroundColor: edgeType?.color || '#999',
                        borderStyle: edgeType?.style || 'solid',
                      }}
                    />
                    <span>
                      {edgeType?.label || typeId}: {count}
                    </span>
                  </div>
                );
              },
            )}
          </div>
        )}
      </div>
      </div>

      {/* Footer with actions */}
      <div className="px-3 py-3 border-t border-gray-200 bg-gray-50 space-y-2">
        {/* Actor-specific actions */}
        {canAddToGroup && targetGroup && (
          <button
            onClick={handleAddToGroup}
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GroupAddIcon fontSize="small" />
            <span>
              Add {selectedActors.length} Actor{selectedActors.length > 1 ? 's' : ''} to &quot;
              {targetGroup.data.label}&quot;
            </span>
          </button>
        )}

        {canGroupActors && (
          <button
            onClick={handleGroupActors}
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GroupWorkIcon fontSize="small" />
            <span>Group Selected Actors</span>
          </button>
        )}

        {/* Group-specific actions */}
        {selectedGroups.length > 0 && (
          <>
            {canMinimizeAll && (
              <button
                onClick={handleMinimizeAll}
                disabled={processing}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MinimizeIcon fontSize="small" />
                <span>Minimize All Groups</span>
              </button>
            )}

            {canMaximizeAll && (
              <button
                onClick={handleMaximizeAll}
                disabled={processing}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MaximizeIcon fontSize="small" />
                <span>Maximize All Groups</span>
              </button>
            )}

            {canUngroupAll && (
              <button
                onClick={handleUngroupAll}
                disabled={processing}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-orange-700 bg-white border border-orange-300 hover:bg-orange-50 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UngroupIcon fontSize="small" />
                <span>Ungroup All (Keep Actors)</span>
              </button>
            )}

            <button
              onClick={handleDeleteGroupsAndActors}
              disabled={processing}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DeleteIcon fontSize="small" />
              <span>Delete Groups & Actors</span>
            </button>
          </>
        )}

        {/* Relation-specific actions */}
        {selectedRelations.length > 0 && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-gray-700">
                  Directionality
                </label>
                <Tooltip title="Reverse Direction (swap source/target)">
                  <IconButton
                    size="small"
                    onClick={handleReverseDirections}
                    disabled={processing}
                  >
                    <SwapHorizIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
              <ToggleButtonGroup
                value={currentDirectionality}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    handleToggleDirectionality(newValue);
                  }
                }}
                fullWidth
                size="small"
                disabled={processing}
                aria-label="relationship directionality"
              >
                <ToggleButton value="directed" aria-label="directed relationship">
                  <Tooltip title="Directed (one-way)">
                    <div className="flex items-center space-x-1">
                      <ArrowForwardIcon fontSize="small" />
                      <span className="text-xs">Directed</span>
                    </div>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="bidirectional" aria-label="bidirectional relationship">
                  <Tooltip title="Bidirectional (two-way)">
                    <div className="flex items-center space-x-1">
                      <SyncAltIcon fontSize="small" />
                      <span className="text-xs">Bi</span>
                    </div>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="undirected" aria-label="undirected relationship">
                  <Tooltip title="Undirected (no direction)">
                    <div className="flex items-center space-x-1">
                      <RemoveIcon fontSize="small" />
                      <span className="text-xs">None</span>
                    </div>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              {!allSameDirectionality && (
                <p className="text-xs text-gray-500 mt-1 italic">
                  Selected relations have different directionalities
                </p>
              )}
            </div>
          </div>
        )}

        {/* General delete action */}
        {canDeleteSelection && (
          <button
            onClick={handleDeleteSelection}
            disabled={processing}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DeleteIcon fontSize="small" />
            <span>Delete Selection ({stats.totalElements})</span>
          </button>
        )}
      </div>

      {ConfirmDialogComponent}
    </>
  );
};

export default MultiSelectProperties;
