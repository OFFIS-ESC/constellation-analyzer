import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useGraphWithHistory } from "../../hooks/useGraphWithHistory";
import { useDocumentHistory } from "../../hooks/useDocumentHistory";
import { useEditorStore } from "../../stores/editorStore";
import { useSearchStore } from "../../stores/searchStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useActiveDocument } from "../../stores/workspace/useActiveDocument";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useCreateDocument } from "../../hooks/useCreateDocument";
import CustomNode from "../Nodes/CustomNode";
import GroupNode from "../Nodes/GroupNode";
import CustomEdge from "../Edges/CustomEdge";
import ContextMenu from "./ContextMenu";
import EmptyState from "../Common/EmptyState";
import { createNode } from "../../utils/nodeUtils";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import UngroupIcon from "@mui/icons-material/CallSplit";
import MinimizeIcon from "@mui/icons-material/UnfoldLess";
import MaximizeIcon from "@mui/icons-material/UnfoldMore";
import { useConfirm } from "../../hooks/useConfirm";
import { useGraphExport } from "../../hooks/useGraphExport";
import type { ExportOptions } from "../../utils/graphExport";

import type { Actor, Relation, Group, GroupData } from "../../types";

interface GraphEditorProps {
  selectedNode: Actor | null;
  selectedEdge: Relation | null;
  selectedGroup: Group | null;
  onNodeSelect: (node: Actor | null) => void;
  onEdgeSelect: (edge: Relation | null) => void;
  onGroupSelect: (group: Group | null) => void;
  onMultiSelect?: (actors: Actor[], relations: Relation[], groups: Group[]) => void;
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
const GraphEditor = ({ onNodeSelect, onEdgeSelect, onGroupSelect, onMultiSelect, onAddNodeRequest, onExportRequest }: GraphEditorProps) => {
  // Sync with workspace active document
  const { activeDocumentId } = useActiveDocument();
  const { saveViewport, getViewport } = useWorkspaceStore();
  const { handleNewDocument, NewDocumentDialog } = useCreateDocument();

  // Graph export functionality
  const { exportPNG, exportSVG } = useGraphExport();

  const {
    nodes: storeNodes,
    edges: storeEdges,
    groups: storeGroups,
    nodeTypes: nodeTypeConfigs,
    edgeTypes: edgeTypeConfigs,
    setNodes,
    setEdges,
    setGroups,
    addEdge: addEdgeWithHistory,
    addNode: addNodeWithHistory,
    createGroupWithActors,
    deleteNode,
    deleteEdge,
    deleteGroup,
    toggleGroupMinimized,
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
    selectedActorTypes,
    selectedRelationTypes,
    selectedLabels,
  } = useSearchStore();

  // Settings for auto-zoom
  const { autoZoomEnabled } = useSettingsStore();

  // Track previous document ID to save viewport before switching
  const prevDocumentIdRef = useRef<string | null>(null);

  // Confirmation dialog
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // React Flow state (synchronized with store)
  // Combine regular nodes and group nodes for ReactFlow
  // IMPORTANT: Parent nodes (groups) MUST appear BEFORE child nodes for React Flow to process correctly
  const allNodes = useMemo(() => {
    // Get IDs of minimized groups
    const minimizedGroupIds = new Set(
      storeGroups.filter((group) => group.data.minimized).map((group) => group.id)
    );

    // Mark actors in minimized groups as hidden instead of filtering them out
    // This prevents React Flow from losing track of them
    const visibleNodes = storeNodes.map((node) => {
      const nodeWithParent = node as Actor & { parentId?: string };
      const shouldHide = !!(nodeWithParent.parentId && minimizedGroupIds.has(nodeWithParent.parentId));

      // Always explicitly set hidden (true or false) to ensure state is cleared when maximizing
      return {
        ...node,
        hidden: shouldHide,
      };
    });

    return [...(storeGroups as Node[]), ...(visibleNodes as Node[])];
  }, [storeNodes, storeGroups]);

  const [nodes, setNodesState, onNodesChange] = useNodesState(allNodes);

  // Track the latest selection state to avoid stale closures
  const latestNodesRef = useRef(nodes);
  useEffect(() => {
    latestNodesRef.current = nodes;
  }, [nodes]);

  // Reroute edges to minimized groups and filter internal edges
  const visibleEdges = useMemo(() => {
    // Build a map of actor -> group by examining each actor's parentId
    // This is the canonical source of truth in React Flow
    const actorToMinimizedGroup = new Map<string, string>();

    // Get set of minimized group IDs
    const minimizedGroupIds = new Set(
      storeGroups.filter((group) => group.data.minimized).map((group) => group.id)
    );

    // Map each actor to its parent group (if the group is minimized)
    storeNodes.forEach((node) => {
      const nodeWithParent = node as Actor & { parentId?: string };
      if (nodeWithParent.parentId && minimizedGroupIds.has(nodeWithParent.parentId)) {
        actorToMinimizedGroup.set(node.id, nodeWithParent.parentId);
      }
    });

    // Map to deduplicate and aggregate edges between groups
    // Key: "source_target" -> { edge, aggregatedRelations: [...] }
    const edgeMap = new Map<string, { edge: Edge; aggregatedRelations: Relation[] }>();

    // Reroute edges: if source or target is in a minimized group, redirect to the group
    // Filter out edges that are internal to a minimized group (both source and target in same group)
    (storeEdges as Edge[]).forEach((edge) => {
      const newSource = actorToMinimizedGroup.get(edge.source) || edge.source;
      const newTarget = actorToMinimizedGroup.get(edge.target) || edge.target;

      const sourceChanged = newSource !== edge.source;
      const targetChanged = newTarget !== edge.target;

      // Filter: if both source and target are rerouted to the SAME group, hide this edge
      // (it's an internal edge within a minimized group)
      if (sourceChanged && targetChanged && newSource === newTarget) {
        return; // Skip this edge
      }

      // Create edge key for deduplication
      // For edges between two minimized groups, use a normalized key (alphabetically sorted)
      // so that A->B and B->A use the same key and get aggregated together
      const bothAreGroups = sourceChanged && targetChanged;
      const edgeKey = bothAreGroups
        ? [newSource, newTarget].sort().join('_') // Normalized key for bidirectional aggregation
        : `${newSource}_${newTarget}`; // Directional key for normal edges

      // Check if this edge was rerouted (at least one endpoint changed)
      const wasRerouted = sourceChanged || targetChanged;

      // Only update if source or target changed
      if (wasRerouted) {
        // Destructure to separate handle properties from the rest
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sourceHandle, targetHandle, ...edgeWithoutHandles } = edge;

        // Create new edge object with updated source/target
        const newEdge: Edge = {
          ...edgeWithoutHandles,
          source: newSource,
          target: newTarget,
        };

        // Explicitly delete handle properties to ensure they don't exist
        // This is critical - React Flow will error if handles are present but invalid
        delete (newEdge as Record<string, unknown>).sourceHandle;
        delete (newEdge as Record<string, unknown>).targetHandle;

        // Only re-add handle IDs if the endpoint was NOT rerouted to a group
        if (!sourceChanged && sourceHandle !== undefined && sourceHandle !== null) {
          newEdge.sourceHandle = sourceHandle;
        }
        if (!targetChanged && targetHandle !== undefined && targetHandle !== null) {
          newEdge.targetHandle = targetHandle;
        }

        // If we already have an edge between these nodes, aggregate the relations
        if (edgeMap.has(edgeKey)) {
          const existing = edgeMap.get(edgeKey)!;
          existing.aggregatedRelations.push(edge as Relation);
        } else {
          // First edge between these groups - store it with aggregation data
          edgeMap.set(edgeKey, {
            edge: newEdge,
            aggregatedRelations: [edge as Relation],
          });
        }
      } else {
        // No rerouting needed, just add the edge (no aggregation for normal edges)
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            edge,
            aggregatedRelations: [],
          });
        }
      }
    });

    // Convert the map to an array of edges, attaching aggregation metadata
    return Array.from(edgeMap.values()).map(({ edge, aggregatedRelations }) => {
      if (aggregatedRelations.length > 1) {
        // Multiple relations aggregated - add metadata to edge data
        return {
          ...edge,
          data: {
            ...edge.data,
            aggregatedCount: aggregatedRelations.length,
            aggregatedRelations: aggregatedRelations,
          },
        } as Edge;
      }
      return edge;
    });
  }, [storeEdges, storeGroups, storeNodes]);

  const [edges, setEdgesState, onEdgesChange] = useEdgesState(
    visibleEdges,
  );

  // Track if a drag is in progress to capture state before drag
  const dragInProgressRef = useRef(false);

  // Track if a resize is in progress to avoid sync loops
  const resizeInProgressRef = useRef(false);

  // Track pending selection (ID of item to select after next sync)
  const pendingSelectionRef = useRef<{ type: 'node' | 'edge' | 'group', id: string } | null>(null);

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

    // IMPORTANT: Directly set the nodes array to avoid React Flow processing intermediate states
    // Using setNodesState with a callback can cause React Flow to process stale state

    // Build selection map from the latest React Flow state using ref
    const selectionMap = new Map(
      latestNodesRef.current.map((node) => [node.id, node.selected])
    );

    if (hasPendingSelection) {
      const pendingNodeId = pendingType === 'node' || pendingType === 'group' ? pendingId : null;

      setNodesState(allNodes.map((node) => ({
        ...node,
        selected: node.id === pendingNodeId,
      })));
    } else {
      // Preserve existing selection state
      // IMPORTANT: Don't spread the entire node - only copy specific properties
      // This ensures hidden state from allNodes is properly applied
      setNodesState(allNodes.map((node) => {
        const currentSelected = selectionMap.get(node.id) || false;
        return {
          ...node,
          selected: currentSelected,
        };
      }));
    }

    setEdgesState((currentEdges) => {
      // If we have a pending selection, deselect all edges (or select the new edge)
      if (hasPendingSelection) {
        const pendingEdgeId = pendingType === 'edge' ? pendingId : null;

        const newEdges = visibleEdges.map((edge) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { sourceHandle, targetHandle, ...edgeWithoutHandles } = edge;
          return {
            ...edgeWithoutHandles,
            selected: edge.id === pendingEdgeId,
            // Only include handles if they exist and are not null
            ...(sourceHandle !== undefined && sourceHandle !== null ? { sourceHandle } : {}),
            ...(targetHandle !== undefined && targetHandle !== null ? { targetHandle } : {}),
          };
        });

        // Clear pending selection after applying it to both nodes and edges
        pendingSelectionRef.current = null;

        return newEdges;
      }

      // Otherwise, preserve existing selection state
      const selectionMap = new Map(
        currentEdges.map((edge) => [edge.id, edge.selected])
      );

      return visibleEdges.map((edge) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { sourceHandle, targetHandle, ...edgeWithoutHandles } = edge;
        return {
          ...edgeWithoutHandles,
          selected: selectionMap.get(edge.id) || false,
          // Only include handles if they exist and are not null
          ...(sourceHandle !== undefined && sourceHandle !== null ? { sourceHandle } : {}),
          ...(targetHandle !== undefined && targetHandle !== null ? { targetHandle } : {}),
        };
      });
    });
  }, [allNodes, visibleEdges, setNodesState, setEdgesState]);

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
    const hasTypeFilters = selectedActorTypes.length > 0 || selectedRelationTypes.length > 0;
    const hasLabelFilters = selectedLabels.length > 0;

    // Skip if no filters are active
    if (!hasSearchText && !hasTypeFilters && !hasLabelFilters) return;

    // Debounce to avoid excessive viewport changes while typing
    const timeoutId = setTimeout(() => {
      const searchLower = searchText.toLowerCase().trim();

      // Calculate matching nodes (same logic as LeftPanel and CustomNode)
      const matchingNodeIds = nodes
        .filter((node) => {
          const actor = node as Actor;
          const actorType = actor.data?.type || '';

          // Filter by actor type (POSITIVE: if types selected, node must be one of them)
          if (selectedActorTypes.length > 0) {
            if (!selectedActorTypes.includes(actorType)) {
              return false;
            }
          }

          // Filter by label (POSITIVE: if labels selected, node must have at least one)
          if (selectedLabels.length > 0) {
            const nodeLabels = actor.data?.labels || [];
            const hasSelectedLabel = nodeLabels.some((labelId) =>
              selectedLabels.includes(labelId)
            );
            if (!hasSelectedLabel) {
              return false;
            }
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
    selectedActorTypes,
    selectedRelationTypes,
    selectedLabels,
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
      const totalSelected = selectedNodes.length + selectedEdges.length;

      // Multi-selection: 2 or more items
      if (totalSelected >= 2) {
        const actors: Actor[] = [];
        const groups: Group[] = [];

        selectedNodes.forEach((node) => {
          if (node.type === 'group') {
            groups.push(node as Group);
          } else {
            actors.push(node as Actor);
          }
        });

        const relations = selectedEdges as Relation[];

        if (onMultiSelect) {
          onMultiSelect(actors, relations, groups);
        }
      }
      // Single node selected
      else if (selectedNodes.length === 1) {
        const selectedItem = selectedNodes[0];

        // Check if it's a group (type === 'group')
        if (selectedItem.type === 'group') {
          const selectedGroup = selectedItem as Group;
          onGroupSelect(selectedGroup);
          // Don't call others - parent will handle clearing
        } else {
          // It's a regular actor node
          const selectedNode = selectedItem as Actor;
          onNodeSelect(selectedNode);
          // Don't call others - parent will handle clearing
        }
      }
      // Single edge selected
      else if (selectedEdges.length === 1) {
        const selectedEdge = selectedEdges[0] as Relation;
        onEdgeSelect(selectedEdge);
        // Don't call others - parent will handle clearing
      }
      // Nothing selected
      else {
        onNodeSelect(null);
        onEdgeSelect(null);
        onGroupSelect(null);
      }
    },
    [onNodeSelect, onEdgeSelect, onGroupSelect, onMultiSelect],
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
        pushToHistory("Move Node");
      }

      // Check if a resize operation just started (resizing: true)
      const resizeStartChanges = changes.filter(
        (change) =>
          change.type === "dimensions" &&
          "resizing" in change &&
          change.resizing === true,
      );

      // Capture state BEFORE the resize operation begins
      if (resizeStartChanges.length > 0 && !resizeInProgressRef.current) {
        resizeInProgressRef.current = true;
        pushToHistory("Resize Group");
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

      // Check if any resize operation just completed (resizing: false)
      const resizeEndChanges = changes.filter(
        (change) =>
          change.type === "dimensions" &&
          "resizing" in change &&
          change.resizing === false,
      );

      // If a drag just ended, sync to store
      if (dragEndChanges.length > 0) {
        dragInProgressRef.current = false;
        // Debounce to allow React Flow state to settle
        setTimeout(() => {
          // Sync to store - use callback to get fresh state
          setNodesState((currentNodes) => {
            // Sync both groups and actors (groups can be dragged too!)
            const groupNodes = currentNodes.filter((node) => node.type === 'group');
            const actorNodes = currentNodes.filter((node) => node.type !== 'group');

            setGroups(groupNodes as Group[]);
            setNodes(actorNodes as Actor[]);
            return currentNodes;
          });
        }, 0);
      }

      // If a resize just ended, sync to store
      if (resizeEndChanges.length > 0) {
        resizeInProgressRef.current = false;
        setTimeout(() => {
          setNodesState((currentNodes) => {
            // Sync groups (which can be resized) to store
            const groupNodes = currentNodes.filter((node) => node.type === 'group');
            const actorNodes = currentNodes.filter((node) => node.type !== 'group');

            // Update groups in store with new dimensions
            setGroups(groupNodes as Group[]);
            setNodes(actorNodes as Actor[]);

            return currentNodes;
          });
        }, 0);
      }

      // For other non-drag, non-resize changes, DON'T sync during drag/resize
      if (!dragInProgressRef.current && !resizeInProgressRef.current) {
        const hasNonSelectionChanges = changes.some(
          (change) =>
            change.type !== "select" &&
            change.type !== "remove" &&
            change.type !== "position" &&
            change.type !== "dimensions",
        );
        if (hasNonSelectionChanges) {
          setTimeout(() => {
            setNodesState((currentNodes) => {
              // Filter out groups - they're stored separately
              const actorNodes = currentNodes.filter((node) => node.type !== 'group');
              setNodes(actorNodes as Actor[]);
              return currentNodes;
            });
          }, 0);
        }
      }
    },
    [onNodesChange, setNodesState, setNodes, setGroups, pushToHistory],
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
      group: GroupNode,
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

  // Handle node double-click - maximize minimized groups
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Check if this is a minimized group
      if (node.type === 'group') {
        const groupData = node.data as Group['data'];
        if (groupData.minimized) {
          // Toggle to maximize the group
          toggleGroupMinimized(node.id);
        }
      }
    },
    [toggleGroupMinimized],
  );

  // Handle edge click - ReactFlow handles selection automatically
  const handleEdgeClick = useCallback(() => {
    setContextMenu(null); // Close context menu if open
  }, []);

  // Handle right-click on pane (empty space)
  const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
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

      // Don't show context menu for aggregated edges (synthetic edges between minimized groups)
      const isAggregated = !!(edge.data as { aggregatedCount?: number })?.aggregatedCount;
      if (isAggregated) {
        return; // No context menu for aggregated edges
      }

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

  // Store callbacks in refs and call parent callbacks only once on mount
  const handleAddNodeRef = useRef(handleAddNode);
  handleAddNodeRef.current = handleAddNode;

  useEffect(() => {
    if (onAddNodeRequest) {
      onAddNodeRequest((...args) => handleAddNodeRef.current(...args));
    }
     
  }, [onAddNodeRequest]); // Only run when onAddNodeRequest changes

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

  const handleExportRef = useRef(handleExport);
  handleExportRef.current = handleExport;

  useEffect(() => {
    if (onExportRequest) {
      onExportRequest((...args) => handleExportRef.current(...args));
    }
     
  }, [onExportRequest]); // Only run when onExportRequest changes

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

  // Create group from selected nodes
  const handleCreateGroupFromSelection = useCallback(() => {
    const selectedActorNodes = nodes.filter((node) => node.selected && node.type !== 'group') as Actor[];

    if (selectedActorNodes.length < 2) {
      return; // Need at least 2 nodes to create a group
    }

    // Calculate bounding box of selected nodes
    const minX = Math.min(...selectedActorNodes.map((n) => n.position.x));
    const minY = Math.min(...selectedActorNodes.map((n) => n.position.y));
    const maxX = Math.max(...selectedActorNodes.map((n) => n.position.x + (n.width || 150)));
    const maxY = Math.max(...selectedActorNodes.map((n) => n.position.y + (n.height || 100)));

    // Add padding
    const padding = 40;
    const groupPosition = {
      x: minX - padding,
      y: minY - padding,
    };
    const groupWidth = maxX - minX + padding * 2;
    const groupHeight = maxY - minY + padding * 2;

    // Create group ID
    const groupId = `group_${Date.now()}`;

    // Create group data
    const groupData: GroupData = {
      label: `Group ${storeGroups.length + 1}`,
      color: 'rgba(240, 242, 245, 0.5)', // Default gray - matches CSS
      actorIds: selectedActorNodes.map((n) => n.id),
    };

    // Create group node
    const newGroup: Group = {
      id: groupId,
      type: 'group',
      position: groupPosition,
      data: groupData,
      style: {
        width: groupWidth,
        height: groupHeight,
      },
    };

    // Build actor updates map (relative positions and parent relationship)
    const actorUpdates: Record<string, { position: { x: number; y: number }; parentId: string; extent: 'parent' }> = {};
    selectedActorNodes.forEach((node) => {
      actorUpdates[node.id] = {
        position: {
          x: node.position.x - groupPosition.x,
          y: node.position.y - groupPosition.y,
        },
        parentId: groupId,
        extent: 'parent' as const,
      };
    });

    // Use atomic operation to create group and update actors in a single history snapshot
    createGroupWithActors(newGroup, selectedActorNodes.map((n) => n.id), actorUpdates);

    // Select the new group
    pendingSelectionRef.current = { type: 'group', id: groupId };

    setContextMenu(null);
  }, [nodes, storeGroups, createGroupWithActors]);

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
        onNodeDoubleClick={handleNodeDoubleClick}
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
      {contextMenu && contextMenu.type === "node" && contextMenu.target && (() => {
        const targetNode = contextMenu.target as Node;
        const isGroup = targetNode.type === 'group';

        // Calculate how many actor nodes are selected (exclude groups)
        const selectedActorNodes = nodes.filter((node) => node.selected && node.type !== 'group');
        const canCreateGroup = selectedActorNodes.length >= 2;

        const sections = [];

        // If it's a group node, show "Minimize/Maximize" and "Ungroup" options
        if (isGroup) {
          const groupNode = targetNode as Group;
          const isMinimized = groupNode.data.minimized;

          sections.push({
            actions: [
              {
                label: isMinimized ? "Maximize Group" : "Minimize Group",
                icon: isMinimized ? <MaximizeIcon fontSize="small" /> : <MinimizeIcon fontSize="small" />,
                onClick: () => {
                  // Sync current React Flow dimensions before toggling
                  if (!isMinimized) {
                    // When minimizing, update the store with current dimensions first
                    const currentNode = nodes.find((n) => n.id === groupNode.id);
                    if (currentNode && currentNode.width && currentNode.height) {
                      setGroups(storeGroups.map((g) =>
                        g.id === groupNode.id
                          ? { ...g, width: currentNode.width, height: currentNode.height }
                          : g
                      ));
                    }
                  }
                  // Use setTimeout to ensure store update completes before toggle
                  setTimeout(() => {
                    toggleGroupMinimized(groupNode.id);
                  }, 0);
                  setContextMenu(null);
                },
              },
              {
                label: "Ungroup",
                icon: <UngroupIcon fontSize="small" />,
                onClick: async () => {
                  const confirmed = await confirm({
                    title: "Ungroup Actors",
                    message: `Ungroup "${groupNode.data.label}"? All ${groupNode.data.actorIds.length} actors will be moved back to the canvas.`,
                    confirmLabel: "Ungroup",
                    severity: "info",
                  });
                  if (confirmed) {
                    deleteGroup(groupNode.id, true); // true = ungroup (non-destructive)
                    setContextMenu(null);
                  }
                },
              },
            ],
          });
        } else {
          // For regular actor nodes, add "Create Group" option if multiple nodes are selected
          if (canCreateGroup) {
            sections.push({
              actions: [
                {
                  label: `Create Group (${selectedActorNodes.length} actors)`,
                  icon: <GroupWorkIcon fontSize="small" />,
                  onClick: handleCreateGroupFromSelection,
                },
              ],
            });
          }
        }

        // Add "Delete" option (for both groups and actors)
        sections.push({
          actions: [
            {
              label: isGroup ? "Delete Group & Actors" : "Delete",
              icon: <DeleteIcon fontSize="small" />,
              onClick: async () => {
                if (isGroup) {
                  const groupNode = targetNode as Group;
                  const confirmed = await confirm({
                    title: "Delete Group and Actors",
                    message: `Delete "${groupNode.data.label}" AND all ${groupNode.data.actorIds.length} actors inside? This will also delete all connected relations. This action cannot be undone.`,
                    confirmLabel: "Delete",
                    severity: "danger",
                  });
                  if (confirmed) {
                    deleteGroup(groupNode.id, false); // false = destructive delete
                    setContextMenu(null);
                  }
                } else {
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
                }
              },
            },
          ],
        });

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            sections={sections}
            onClose={() => setContextMenu(null)}
          />
        );
      })()}

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
