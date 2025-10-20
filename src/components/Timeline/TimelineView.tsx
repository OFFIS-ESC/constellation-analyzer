import React, { useMemo, useCallback, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  NodeTypes,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTimelineStore } from "../../stores/timelineStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import StateNode from "./StateNode";
import ContextMenu from "../Editor/ContextMenu";
import RenameStateDialog from "./RenameStateDialog";
import EditIcon from "@mui/icons-material/Edit";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ConstellationState, StateId } from "../../types/timeline";

/**
 * Layout states in a horizontal timeline with branches
 */
function layoutStates(
  states: ConstellationState[],
  currentStateId: StateId,
  rootStateId: StateId,
): { nodes: Node[]; edges: Edge[] } {
  const horizontalSpacing = 200;
  const verticalSpacing = 100;

  // Build parent-child relationships
  const children = new Map<StateId, StateId[]>();
  states.forEach((state) => {
    if (state.parentStateId) {
      if (!children.has(state.parentStateId)) {
        children.set(state.parentStateId, []);
      }
      children.get(state.parentStateId)!.push(state.id);
    }
  });

  // BFS to assign horizontal positions (level in tree)
  const levels = new Map<StateId, number>();
  const queue: StateId[] = [rootStateId];
  levels.set(rootStateId, 0);

  while (queue.length > 0) {
    const stateId = queue.shift()!;
    const level = levels.get(stateId)!;

    const childStates = children.get(stateId) || [];
    childStates.forEach((childId) => {
      if (!levels.has(childId)) {
        levels.set(childId, level + 1);
        queue.push(childId);
      }
    });
  }

  // Assign vertical lanes for branches
  const lanes = new Map<StateId, number>();
  let currentLane = 0;

  function assignLanes(stateId: StateId, lane: number) {
    lanes.set(stateId, lane);

    const childStates = children.get(stateId) || [];
    if (childStates.length === 0) return;

    // First child continues in same lane
    assignLanes(childStates[0], lane);

    // Additional children get new lanes
    for (let i = 1; i < childStates.length; i++) {
      currentLane++;
      assignLanes(childStates[i], currentLane);
    }
  }

  assignLanes(rootStateId, 0);

  // Create nodes
  const nodes: Node[] = states.map((state) => {
    const level = levels.get(state.id) || 0;
    const lane = lanes.get(state.id) || 0;

    return {
      id: state.id,
      type: "stateNode",
      position: {
        x: level * horizontalSpacing,
        y: lane * verticalSpacing,
      },
      data: {
        state,
        isCurrent: state.id === currentStateId,
      },
    };
  });

  // Create edges
  const edges: Edge[] = [];
  states.forEach((state) => {
    if (state.parentStateId) {
      edges.push({
        id: `${state.parentStateId}-${state.id}`,
        source: state.parentStateId,
        target: state.id,
        type: "smoothstep",
        animated: state.id === currentStateId,
        style: {
          strokeWidth: state.id === currentStateId ? 3 : 2,
          stroke: state.id === currentStateId ? "#10b981" : "#9ca3af",
        },
      });
    }
  });

  return { nodes, edges };
}

/**
 * TimelineViewInner - Inner component with React Flow
 */
const TimelineViewInner: React.FC = () => {
  const activeDocumentId = useWorkspaceStore((state) => state.activeDocumentId);
  const {
    timelines,
    switchToState,
    updateState,
    duplicateState,
    duplicateStateAsChild,
    deleteState,
  } = useTimelineStore();

  const timeline = activeDocumentId ? timelines.get(activeDocumentId) : null;

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    stateId: string;
  } | null>(null);

  // Rename dialog state
  const [renameDialog, setRenameDialog] = useState<{
    stateId: string;
    currentLabel: string;
  } | null>(null);

  // Get all states
  const states = useMemo(() => {
    if (!timeline) return [];
    return Array.from(timeline.states.values());
  }, [timeline]);

  // Handle rename request from node
  const handleRenameRequest = useCallback(
    (stateId: string) => {
      console.log("Rename requested for state:", stateId);
      const state = timeline?.states.get(stateId);
      if (state) {
        setRenameDialog({
          stateId: stateId,
          currentLabel: state.label,
        });
      }
    },
    [timeline],
  );

  // Layout nodes and edges
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(() => {
    if (!timeline || states.length === 0) {
      return { nodes: [], edges: [] };
    }

    const { nodes, edges } = layoutStates(
      states,
      timeline.currentStateId,
      timeline.rootStateId,
    );

    // Add rename handler to each node's data
    const nodesWithRename = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onRename: handleRenameRequest,
      },
    }));

    return { nodes: nodesWithRename, edges };
  }, [states, timeline, handleRenameRequest]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);

  // Update when layout changes
  React.useEffect(() => {
    setNodes(layoutNodes);
    setEdges(layoutEdges);
  }, [layoutNodes, layoutEdges, setNodes, setEdges]);

  // Listen for custom event to close all menus (including context menus)
  React.useEffect(() => {
    const handleCloseAllMenus = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Don't close if the event came from context menu itself (source: 'contextmenu')
      if (customEvent.detail?.source !== "contextmenu") {
        setContextMenu(null);
      }
    };

    window.addEventListener("closeAllMenus", handleCloseAllMenus);
    return () =>
      window.removeEventListener("closeAllMenus", handleCloseAllMenus);
  }, []);

  // Handle node click - switch to state
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      console.log("Single click on node:", node.id);
      switchToState(node.id);
      setContextMenu(null); // Close context menu if open
    },
    [switchToState],
  );

  // Handle node click - switch to state
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      console.log("Double click on node:", node.id);
      handleRenameRequest(node.id);
      setContextMenu(null); // Close context menu if open
    },
    [handleRenameRequest],
  );

  // Handle pane click - close context menu
  const handlePaneClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
    // Close all menus (menu bar dropdowns and context menus) when clicking on the timeline canvas
    window.dispatchEvent(new Event("closeAllMenus"));
  }, [contextMenu]);

  // Handle node context menu
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        stateId: node.id,
      });
      // Close other menus when opening context menu (after state update)
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("closeAllMenus", {
            detail: { source: "contextmenu" },
          }),
        );
      }, 0);
    },
    [],
  );

  // Context menu actions
  const handleRenameFromMenu = useCallback(() => {
    if (!contextMenu) return;
    const state = timeline?.states.get(contextMenu.stateId);
    if (state) {
      setRenameDialog({
        stateId: contextMenu.stateId,
        currentLabel: state.label,
      });
    }
    setContextMenu(null);
  }, [contextMenu, timeline]);

  // Duplicate (Parallel): Creates sibling state with same parent
  const handleDuplicateParallelFromMenu = useCallback(() => {
    if (!contextMenu) return;
    duplicateState(contextMenu.stateId);
    setContextMenu(null);
  }, [contextMenu, duplicateState]);

  // Duplicate (Series): Creates child state with original as parent
  const handleDuplicateSeriesFromMenu = useCallback(() => {
    if (!contextMenu) return;
    duplicateStateAsChild(contextMenu.stateId);
    setContextMenu(null);
  }, [contextMenu, duplicateStateAsChild]);

  const handleDeleteFromMenu = useCallback(() => {
    if (!contextMenu) return;
    deleteState(contextMenu.stateId);
    setContextMenu(null);
  }, [contextMenu, deleteState]);

  // Rename dialog actions
  const handleRename = useCallback(
    (newLabel: string) => {
      if (renameDialog) {
        updateState(renameDialog.stateId, { label: newLabel });
      }
    },
    [renameDialog, updateState],
  );

  // Custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      stateNode: StateNode,
    }),
    [],
  );

  if (!timeline) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p>No timeline for this document.</p>
          <p className="text-sm mt-1">
            Create a timeline to manage multiple states.
          </p>
        </div>
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No states in timeline
      </div>
    );
  }

  return (
    <div className="w-full h-full" onClick={(e) => e.stopPropagation()}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeContextMenu={handleNodeContextMenu}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        panOnScroll={false}
        selectionOnDrag={false}
        selectNodesOnDrag={false}
        nodesFocusable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sections={[
            {
              actions: [
                {
                  label: "Rename",
                  icon: <EditIcon fontSize="small" />,
                  onClick: handleRenameFromMenu,
                },
              ],
            },
            {
              title: "Duplicate",
              actions: [
                {
                  label: "Duplicate (Parallel)",
                  icon: <FileCopyIcon fontSize="small" />,
                  onClick: handleDuplicateParallelFromMenu,
                },
                {
                  label: "Duplicate (Series)",
                  icon: <CallSplitIcon fontSize="small" />,
                  onClick: handleDuplicateSeriesFromMenu,
                },
              ],
            },
            {
              actions: [
                {
                  label: "Delete",
                  icon: <DeleteIcon fontSize="small" />,
                  onClick: handleDeleteFromMenu,
                },
              ],
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Rename Dialog */}
      {renameDialog && (
        <RenameStateDialog
          open={true}
          currentLabel={renameDialog.currentLabel}
          onClose={() => setRenameDialog(null)}
          onRename={handleRename}
        />
      )}
    </div>
  );
};

/**
 * TimelineView - Wrapped with its own ReactFlowProvider to avoid conflicts
 */
const TimelineView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <TimelineViewInner />
    </ReactFlowProvider>
  );
};

export default TimelineView;
