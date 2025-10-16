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
import { useSearchStore } from "../../stores/searchStore";
import { useActiveDocument } from "../../stores/workspace/useActiveDocument";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useCreateDocument } from "../../hooks/useCreateDocument";
import CustomNode from "../Nodes/CustomNode";
import CustomEdge from "../Edges/CustomEdge";
import ContextMenu from "./ContextMenu";
import EmptyState from "../Common/EmptyState";
import { createNode } from "../../utils/nodeUtils";
import DeleteIcon from "@mui/icons-material/Delete";
import { useConfirm } from "../../hooks/useConfirm";
import { useGraphExport } from "../../hooks/useGraphExport";
import type { ExportOptions } from "../../utils/graphExport";

import type { Actor, Relation } from "../../types";

interface GraphEditorProps {
  selectedNode: Actor | null;
  selectedEdge: Relation | null;
  onNodeSelect: (node: Actor | null) => void;
  onEdgeSelect: (edge: Relation | null) => void;
  onAddNodeRequest?: (callback: (nodeTypeId: string, position?: { x: number; y: number }) => void) => void;
  onExportRequest?: (callback: (format: 'png' | 'svg', options?: ExportOptions) => Promise<void>) => void;
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
const GraphEditor = ({ onNodeSelect, onEdgeSelect, onAddNodeRequest, onExportRequest }: GraphEditorProps) => {
  // Sync with workspace active document
  const { activeDocumentId } = useActiveDocument();
  const { saveViewport, getViewport } = useWorkspaceStore();
  const { handleNewDocument, NewDocumentDialog } = useCreateDocument();

  // Graph export functionality
  const { exportPNG, exportSVG } = useGraphExport();

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
    fitView,
  } = useReactFlow();

  // Search and filter state for auto-zoom
  const {
    searchText,
    visibleActorTypes,
    visibleRelationTypes,
    autoZoomEnabled,
  } = useSearchStore();

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

  // Track pending selection (ID of item to select after next sync)
  const pendingSelectionRef = useRef<{ type: 'node' | 'edge', id: string } | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "pane" | "node" | "edge";
    target?: Node | Edge;
  } | null>(null);

  // Sync store changes to React Flow state
  // IMPORTANT: Preserve selection state, unless we have a pending selection (new item added)
  useEffect(() => {
    const hasPendingSelection = pendingSelectionRef.current !== null;
    const pendingType = pendingSelectionRef.current?.type;
    const pendingId = pendingSelectionRef.current?.id;

    setNodesState((currentNodes) => {
      // If we have a pending selection, deselect all nodes (or select the new node)
      if (hasPendingSelection) {
        const pendingNodeId = pendingType === 'node' ? pendingId : null;

        return (storeNodes as Node[]).map((node) => ({
          ...node,
          selected: node.id === pendingNodeId,
        }));
      }

      // Otherwise, preserve existing selection state
      const selectionMap = new Map(
        currentNodes.map((node) => [node.id, node.selected])
      );

      return (storeNodes as Node[]).map((node) => ({
        ...node,
        selected: selectionMap.get(node.id) || false,
      }));
    });

    setEdgesState((currentEdges) => {
      // If we have a pending selection, deselect all edges (or select the new edge)
      if (hasPendingSelection) {
        const pendingEdgeId = pendingType === 'edge' ? pendingId : null;

        const newEdges = (storeEdges as Edge[]).map((edge) => ({
          ...edge,
          selected: edge.id === pendingEdgeId,
        }));

        // Clear pending selection after applying it to both nodes and edges
        pendingSelectionRef.current = null;

        return newEdges;
      }

      // Otherwise, preserve existing selection state
      const selectionMap = new Map(
        currentEdges.map((edge) => [edge.id, edge.selected])
      );

      return (storeEdges as Edge[]).map((edge) => ({
        ...edge,
        selected: selectionMap.get(edge.id) || false,
      }));
    });
  }, [storeNodes, storeEdges, setNodesState, setEdgesState]);

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

  // Listen for custom event to close all menus (including context menus)
  useEffect(() => {
    const handleCloseAllMenus = (event: Event) => {
      const customEvent = event as CustomEvent;
      // Don't close if the event came from context menu itself (source: 'contextmenu')
      if (customEvent.detail?.source !== 'contextmenu') {
        setContextMenu(null);
      }
    };

    window.addEventListener('closeAllMenus', handleCloseAllMenus);
    return () => window.removeEventListener('closeAllMenus', handleCloseAllMenus);
  }, []);

  // Auto-zoom to filtered results when search/filter changes
  useEffect(() => {
    // Skip if auto-zoom is disabled
    if (!autoZoomEnabled) return;

    // Skip if there are no nodes
    if (nodes.length === 0) return;

    // Check if any filters are active
    const hasSearchText = searchText.trim() !== '';
    const hasTypeFilters =
      Object.values(visibleActorTypes).some(v => v === false) ||
      Object.values(visibleRelationTypes).some(v => v === false);

    // Skip if no filters are active
    if (!hasSearchText && !hasTypeFilters) return;

    // Debounce to avoid excessive viewport changes while typing
    const timeoutId = setTimeout(() => {
      const searchLower = searchText.toLowerCase().trim();

      // Calculate matching nodes (same logic as LeftPanel and CustomNode)
      const matchingNodeIds = nodes
        .filter((node) => {
          const actor = node as Actor;
          const actorType = actor.data?.type || '';

          // Filter by actor type visibility
          const isTypeVisible = visibleActorTypes[actorType] !== false;
          if (!isTypeVisible) {
            return false;
          }

          // Filter by search text
          if (searchLower) {
            const label = actor.data?.label?.toLowerCase() || '';
            const description = actor.data?.description?.toLowerCase() || '';
            const nodeTypeConfig = nodeTypeConfigs.find((nt) => nt.id === actorType);
            const typeName = nodeTypeConfig?.label?.toLowerCase() || '';

            const matches =
              label.includes(searchLower) ||
              description.includes(searchLower) ||
              typeName.includes(searchLower);

            if (!matches) {
              return false;
            }
          }

          return true;
        })
        .map((node) => node.id);

      // Only zoom if there are matching nodes and not all nodes match
      if (matchingNodeIds.length > 0 && matchingNodeIds.length < nodes.length) {
        fitView({
          nodes: matchingNodeIds.map((id) => ({ id })),
          padding: 0.2,      // 20% padding around selection
          duration: 300,     // 300ms smooth animation
          maxZoom: 2.5,      // Allow more zoom in
          minZoom: 0.5,      // Don't zoom out too much
        });
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timeoutId);
  }, [
    searchText,
    visibleActorTypes,
    visibleRelationTypes,
    autoZoomEnabled,
    nodes,
    nodeTypeConfigs,
    fitView,
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
      if (selectedNodes.length == 1) {
        const selectedNode = selectedNodes[0] as Actor;
        onNodeSelect(selectedNode);
        // Don't call onEdgeSelect - parent will handle clearing edge selection
      }
      // If an edge is selected, notify parent
      else if (selectedEdges.length == 1) {
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

      // Get the edge type config to determine default directionality
      const edgeTypeConfig = edgeTypeConfigs.find((et) => et.id === edgeType);
      const defaultDirectionality = edgeTypeConfig?.defaultDirectionality || 'directed';

      // Create edge with custom data (no label - will use type default)
      const edgeWithData = {
        ...connection,
        type: "custom",
        data: {
          type: edgeType,
          directionality: defaultDirectionality,
          // Don't set label - will use type's label as default
        },
      };

      // Use React Flow's addEdge helper to properly format the edge
      const updatedEdges = addEdge(edgeWithData, storeEdges as Edge[]);

      // Find the newly added edge (it will be the last one)
      const newEdge = updatedEdges[updatedEdges.length - 1] as Relation;

      // Set pending selection - will be applied after Zustand sync
      pendingSelectionRef.current = { type: 'edge', id: newEdge.id };

      // Use the history-tracked addEdge function (triggers sync which will apply selection)
      addEdgeWithHistory(newEdge);
    },
    [
      storeEdges,
      edgeTypeConfigs,
      addEdgeWithHistory,
      selectedRelationType,
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
    // Close other menus when opening context menu (after state update)
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('closeAllMenus', { detail: { source: 'contextmenu' } }));
    }, 0);
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
      // Close other menus when opening context menu (after state update)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('closeAllMenus', { detail: { source: 'contextmenu' } }));
      }, 0);
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
      // Close other menus when opening context menu (after state update)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('closeAllMenus', { detail: { source: 'contextmenu' } }));
      }, 0);
    },
    [],
  );

  // Handle left-click on pane to close context menu
  const handlePaneClick = useCallback(() => {
    if (contextMenu) {
      setContextMenu(null);
    }
    // Close all menus (menu bar dropdowns and context menus) when clicking on the graph canvas
    window.dispatchEvent(new Event('closeAllMenus'));
  }, [contextMenu]);

  // Shared node creation logic (used by context menu and left panel)
  const handleAddNode = useCallback(
    (nodeTypeId: string, position?: { x: number; y: number }) => {
      // Use provided position or random position for toolbar/panel
      const nodePosition = position || {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
      };

      const nodeTypeConfig = nodeTypeConfigs.find((nt) => nt.id === nodeTypeId);
      const newNode = createNode(nodeTypeId, nodePosition, nodeTypeConfig);

      // Set pending selection - will be applied after Zustand sync
      pendingSelectionRef.current = { type: 'node', id: newNode.id };

      // Use history-tracked addNode (triggers sync which will apply selection)
      addNodeWithHistory(newNode);
    },
    [nodeTypeConfigs, addNodeWithHistory],
  );

  // Call the onAddNodeRequest callback if provided
  useEffect(() => {
    if (onAddNodeRequest) {
      onAddNodeRequest(handleAddNode);
    }
  }, [onAddNodeRequest, handleAddNode]);

  // Provide export callback to parent
  const handleExport = useCallback(
    async (format: 'png' | 'svg', options?: ExportOptions) => {
      if (format === 'png') {
        await exportPNG(options);
      } else {
        await exportSVG(options);
      }
    },
    [exportPNG, exportSVG]
  );

  useEffect(() => {
    if (onExportRequest) {
      onExportRequest(handleExport);
    }
  }, [onExportRequest, handleExport]);

  // Add new actor at context menu position
  const handleAddActorFromContextMenu = useCallback(
    (nodeTypeId: string) => {
      if (!contextMenu) return;

      const position = screenToFlowPosition({
        x: contextMenu.x,
        y: contextMenu.y,
      });

      handleAddNode(nodeTypeId, position);
      setContextMenu(null);
    },
    [contextMenu, screenToFlowPosition, handleAddNode],
  );

  // Show empty state when no document is active
  if (!activeDocumentId) {
    return (
      <>
        <EmptyState
          onNewDocument={handleNewDocument}
          onOpenDocumentManager={() => {
            // This will be handled by the parent component
            // We'll trigger it via a custom event
            window.dispatchEvent(new CustomEvent("openDocumentManager"));
          }}
        />
        {NewDocumentDialog}
      </>
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
