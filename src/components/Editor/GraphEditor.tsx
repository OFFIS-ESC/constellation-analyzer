import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Connection,
  NodeTypes,
  EdgeTypes,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  ConnectionMode,
  useReactFlow,
  Viewport,
  useOnSelectionChange,
} from "reactflow";
import "reactflow/dist/style.css";

import { useGraphWithHistory } from "../../hooks/useGraphWithHistory";
import { useDocumentHistory } from "../../hooks/useDocumentHistory";
import { useEditorStore } from "../../stores/editorStore";
import { useActiveDocument } from "../../stores/workspace/useActiveDocument";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import CustomNode from "../Nodes/CustomNode";
import CustomEdge from "../Edges/CustomEdge";
import ContextMenu from "./ContextMenu";
import EmptyState from "../Common/EmptyState";
import { createNode } from "../../utils/nodeUtils";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useConfirm } from "../../hooks/useConfirm";

import type { Actor, Relation } from "../../types";

interface GraphEditorProps {
  selectedNode: Actor | null;
  selectedEdge: Relation | null;
  onNodeSelect: (node: Actor | null) => void;
  onEdgeSelect: (edge: Relation | null) => void;
}

/**
 * GraphEditor - Main interactive graph visualization component
 *
 * Features:
 * - Interactive node dragging and positioning
 * - Edge creation by dragging from node handles
 * - Background grid
 * - MiniMap for navigation
 * - Zoom and pan controls
 * - Synchronized with workspace active document
 *
 * Usage: Core component that wraps React Flow with custom nodes and edges
 */
const GraphEditor = ({ onNodeSelect, onEdgeSelect }: GraphEditorProps) => {
  // Sync with workspace active document
  const { activeDocumentId } = useActiveDocument();
  const { saveViewport, getViewport, createDocument } = useWorkspaceStore();

  const {
    nodes: storeNodes,
    edges: storeEdges,
    nodeTypes: nodeTypeConfigs,
    edgeTypes: edgeTypeConfigs,
    setNodes,
    setEdges,
    addEdge: addEdgeWithHistory,
    addNode: addNodeWithHistory,
    deleteNode,
    deleteEdge,
  } = useGraphWithHistory();

  const { pushToHistory } = useDocumentHistory();

  const {
    showGrid,
    snapToGrid,
    gridSize,
    panOnDrag,
    zoomOnScroll,
    selectedRelationType,
  } = useEditorStore();

  // React Flow instance for screen-to-flow coordinates and viewport control
  const {
    screenToFlowPosition,
    setViewport,
    getViewport: getCurrentViewport,
  } = useReactFlow();

  // Track previous document ID to save viewport before switching
  const prevDocumentIdRef = useRef<string | null>(null);

  // Confirmation dialog
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // React Flow state (synchronized with store)
  const [nodes, setNodesState, onNodesChange] = useNodesState(
    storeNodes as Node[],
  );
  const [edges, setEdgesState, onEdgesChange] = useEdgesState(
    storeEdges as Edge[],
  );

  // Track if a drag is in progress to capture state before drag
  const dragInProgressRef = useRef(false);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "pane" | "node" | "edge";
    target?: Node | Edge;
  } | null>(null);

  // Sync store changes to React Flow state
  useEffect(() => {
    setNodesState(storeNodes as Node[]);
  }, [storeNodes, setNodesState]);

  useEffect(() => {
    setEdgesState(storeEdges as Edge[]);
  }, [storeEdges, setEdgesState]);

  // Save viewport when switching documents and restore viewport for new document
  useEffect(() => {
    if (!activeDocumentId) return;

    // Save viewport for the previous document
    if (
      prevDocumentIdRef.current &&
      prevDocumentIdRef.current !== activeDocumentId
    ) {
      const currentViewport = getCurrentViewport();
      saveViewport(prevDocumentIdRef.current, currentViewport);
      console.log(
        `Saved viewport for document: ${prevDocumentIdRef.current}`,
        currentViewport,
      );
    }

    // Restore viewport for the new document
    const savedViewport = getViewport(activeDocumentId);
    if (savedViewport) {
      console.log(
        `Restoring viewport for document: ${activeDocumentId}`,
        savedViewport,
      );
      setViewport(savedViewport, { duration: 0 });
    }

    // Update the ref to current document
    prevDocumentIdRef.current = activeDocumentId;
  }, [
    activeDocumentId,
    saveViewport,
    getViewport,
    setViewport,
    getCurrentViewport,
  ]);

  // Save viewport periodically (debounced)
  const handleViewportChange = useCallback(
    (_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      if (!activeDocumentId) return;

      // Debounce viewport saves
      const timeoutId = setTimeout(() => {
        saveViewport(activeDocumentId, viewport);
      }, 500);

      return () => clearTimeout(timeoutId);
    },
    [activeDocumentId, saveViewport],
  );

  // Handle selection changes using ReactFlow's dedicated hook
  const handleSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: {
      nodes: Node[];
      edges: Edge[];
    }) => {
      // If a node is selected, notify parent
      if (selectedNodes.length > 0) {
        const selectedNode = selectedNodes[0] as Actor;
        onNodeSelect(selectedNode);
        // Don't call onEdgeSelect - parent will handle clearing edge selection
      }
      // If an edge is selected, notify parent
      else if (selectedEdges.length > 0) {
        const selectedEdge = selectedEdges[0] as Relation;
        onEdgeSelect(selectedEdge);
        // Don't call onNodeSelect - parent will handle clearing node selection
      }
      // Nothing selected
      else {
        onNodeSelect(null);
        onEdgeSelect(null);
      }
    },
    [onNodeSelect, onEdgeSelect],
  );

  // Register the selection change handler with ReactFlow
  useOnSelectionChange({
    onChange: handleSelectionChange,
  });

  // Sync React Flow state back to store when nodes/edges change
  // IMPORTANT: This handler tracks drag operations for undo/redo
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Check if a drag operation just started (dragging: true)
      const dragStartChanges = changes.filter(
        (change) =>
          change.type === "position" &&
          "dragging" in change &&
          change.dragging === true,
      );

      // Capture state BEFORE the drag operation begins (for undo/redo)
      // This ensures we can restore to the position before dragging
      if (dragStartChanges.length > 0 && !dragInProgressRef.current) {
        dragInProgressRef.current = true;
        // Capture the state before any changes are applied
        pushToHistory("Move Actor");
      }

      // Apply the changes
      onNodesChange(changes);

      // Check if any drag operation just completed (dragging: false)
      const dragEndChanges = changes.filter(
        (change) =>
          change.type === "position" &&
          "dragging" in change &&
          change.dragging === false,
      );

      // If a drag just ended, sync to store
      if (dragEndChanges.length > 0) {
        dragInProgressRef.current = false;
        // Debounce to allow React Flow state to settle
        setTimeout(() => {
          // Sync to store - use callback to get fresh state
          setNodesState((currentNodes) => {
            setNodes(currentNodes as Actor[]);
            return currentNodes;
          });
        }, 0);
      } else {
        // For non-drag changes (dimension, etc), just sync to store
        const hasNonSelectionChanges = changes.some(
          (change) =>
            change.type !== "select" &&
            change.type !== "remove" &&
            change.type !== "position",
        );
        if (hasNonSelectionChanges) {
          setTimeout(() => {
            setNodesState((currentNodes) => {
              setNodes(currentNodes as Actor[]);
              return currentNodes;
            });
          }, 0);
        }
      }
    },
    [onNodesChange, setNodesState, setNodes, pushToHistory],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      // Only sync to store for non-selection changes
      const hasNonSelectionChanges = changes.some(
        (change) => change.type !== "select" && change.type !== "remove",
      );
      if (hasNonSelectionChanges) {
        // Debounce store updates to avoid loops
        setTimeout(() => {
          setEdgesState((currentEdges) => {
            setEdges(currentEdges as Relation[]);
            return currentEdges;
          });
        }, 0);
      }
    },
    [onEdgesChange, setEdgesState, setEdges],
  );

  // Handle new edge connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      // Use selected relation type or fall back to first available
      const edgeType =
        selectedRelationType || edgeTypeConfigs[0]?.id || "default";

      // Create edge with custom data (no label - will use type default)
      const edgeWithData = {
        ...connection,
        type: "custom",
        data: {
          type: edgeType,
          // Don't set label - will use type's label as default
        },
        selected: true, // Auto-select the new edge in ReactFlow
      };

      // Use React Flow's addEdge helper to properly format the edge
      const updatedEdges = addEdge(edgeWithData, storeEdges as Edge[]);

      // Deselect all nodes
      const updatedNodes = nodes.map((node) => ({ ...node, selected: false }));
      setNodesState(updatedNodes as Node[]);

      // Find the newly added edge (it will be the last one)
      const newEdge = updatedEdges[updatedEdges.length - 1] as Relation;

      // Use the history-tracked addEdge function
      addEdgeWithHistory(newEdge);
    },
    [
      storeEdges,
      edgeTypeConfigs,
      addEdgeWithHistory,
      selectedRelationType,
      nodes,
      setNodesState,
    ],
  );

  // Handle node deletion
  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      nodesToDelete.forEach((node) => {
        deleteNode(node.id);
      });
    },
    [deleteNode],
  );

  // Handle edge deletion
  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((edge) => {
        deleteEdge(edge.id);
      });
    },
    [deleteEdge],
  );

  // Register custom node types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      custom: CustomNode,
    }),
    [],
  );

  // Register custom edge types
  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
    }),
    [],
  );

  // Handle node click - ReactFlow handles selection automatically
  const handleNodeClick = useCallback(() => {
    setContextMenu(null); // Close context menu if open
  }, []);

  // Handle edge click - ReactFlow handles selection automatically
  const handleEdgeClick = useCallback(() => {
    setContextMenu(null); // Close context menu if open
  }, []);

  // Handle right-click on pane (empty space)
  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: "pane",
    });
  }, []);

  // Handle right-click on node
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "node",
        target: node,
      });
    },
    [],
  );

  // Handle right-click on edge
  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault();
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        type: "edge",
        target: edge,
      });
    },
    [],
  );

  // Handle left-click on pane to close context menu
  const handlePaneClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [contextMenu]);

  // Add new actor at context menu position
  const handleAddActorFromContextMenu = useCallback(
    (nodeTypeId: string) => {
      if (!contextMenu) return;

      const position = screenToFlowPosition({
        x: contextMenu.x,
        y: contextMenu.y,
      });

      const nodeTypeConfig = nodeTypeConfigs.find((nt) => nt.id === nodeTypeId);
      const newNode = createNode(nodeTypeId, position, nodeTypeConfig);
      newNode.selected = true; // Auto-select the new node in ReactFlow

      // Deselect all existing nodes and edges BEFORE adding the new one
      const updatedNodes = nodes.map((node) => ({ ...node, selected: false }));
      const updatedEdges = edges.map((edge) => ({ ...edge, selected: false }));
      setNodesState(updatedNodes as Node[]);
      setEdgesState(updatedEdges as Edge[]);

      // Use history-tracked addNode instead of setNodes
      addNodeWithHistory(newNode);
      setContextMenu(null);
    },
    [
      contextMenu,
      screenToFlowPosition,
      nodeTypeConfigs,
      addNodeWithHistory,
      nodes,
      edges,
      setNodesState,
      setEdgesState,
    ],
  );

  // Show empty state when no document is active
  if (!activeDocumentId) {
    return (
      <EmptyState
        onNewDocument={() => createDocument()}
        onOpenDocumentManager={() => {
          // This will be handled by the parent component
          // We'll trigger it via a custom event
          window.dispatchEvent(new CustomEvent("openDocumentManager"));
        }}
      />
    );
  }

  return (
    <div className="w-full h-full bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneContextMenu={handlePaneContextMenu}
        onPaneClick={handlePaneClick}
        onMove={handleViewportChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectOnClick={true}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        panOnDrag={panOnDrag}
        zoomOnScroll={zoomOnScroll}
        connectionRadius={0}
        fitView
        attributionPosition="bottom-left"
      >
        {/* Background grid */}
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={gridSize}
            size={1}
            color="#d1d5db"
          />
        )}

        {/* Zoom and pan controls */}
        <Controls />

        {/* MiniMap for navigation */}
        <MiniMap
          nodeColor={(node) => {
            const actor = node as Actor;
            const nodeType = nodeTypeConfigs.find(
              (nt) => nt.id === actor.data?.type,
            );
            return nodeType?.color || "#6b7280";
          }}
          pannable
          zoomable
        />
      </ReactFlow>

      {/* Context Menu - Pane */}
      {contextMenu && contextMenu.type === "pane" && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sections={[
            {
              title: "Add Actor",
              actions: nodeTypeConfigs.map((nodeType) => ({
                label: nodeType.label,
                color: nodeType.color,
                onClick: () => handleAddActorFromContextMenu(nodeType.id),
              })),
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Context Menu - Node */}
      {contextMenu && contextMenu.type === "node" && contextMenu.target && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sections={[
            {
              actions: [
                {
                  label: "Edit Properties",
                  icon: <EditIcon fontSize="small" />,
                  onClick: () => {
                    // Select the node in ReactFlow (which will trigger the right panel)
                    const nodeId = contextMenu.target!.id;
                    const updatedNodes = nodes.map((n) => ({
                      ...n,
                      selected: n.id === nodeId,
                    }));
                    const updatedEdges = edges.map((e) => ({
                      ...e,
                      selected: false,
                    }));
                    setNodesState(updatedNodes as Node[]);
                    setEdgesState(updatedEdges as Edge[]);
                    setContextMenu(null);
                  },
                },
                {
                  label: "Delete",
                  icon: <DeleteIcon fontSize="small" />,
                  onClick: async () => {
                    const confirmed = await confirm({
                      title: "Delete Actor",
                      message:
                        "Are you sure you want to delete this actor? All connected relations will also be deleted.",
                      confirmLabel: "Delete",
                      severity: "danger",
                    });
                    if (confirmed) {
                      deleteNode(contextMenu.target!.id);
                      setContextMenu(null);
                    }
                  },
                },
              ],
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Context Menu - Edge */}
      {contextMenu && contextMenu.type === "edge" && contextMenu.target && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          sections={[
            {
              actions: [
                {
                  label: "Edit Properties",
                  icon: <EditIcon fontSize="small" />,
                  onClick: () => {
                    // Select the edge in ReactFlow (which will trigger the right panel)
                    const edgeId = contextMenu.target!.id;
                    const updatedEdges = edges.map((e) => ({
                      ...e,
                      selected: e.id === edgeId,
                    }));
                    const updatedNodes = nodes.map((n) => ({
                      ...n,
                      selected: false,
                    }));
                    setEdgesState(updatedEdges as Edge[]);
                    setNodesState(updatedNodes as Node[]);
                    setContextMenu(null);
                  },
                },
                {
                  label: "Delete",
                  icon: <DeleteIcon fontSize="small" />,
                  onClick: async () => {
                    const confirmed = await confirm({
                      title: "Delete Relation",
                      message: "Are you sure you want to delete this relation?",
                      confirmLabel: "Delete",
                      severity: "danger",
                    });
                    if (confirmed) {
                      deleteEdge(contextMenu.target!.id);
                      setContextMenu(null);
                    }
                  },
                },
              ],
            },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
};

export default GraphEditor;
