import { useCallback, useState, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { IconButton, Tooltip, Checkbox } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import { usePanelStore } from '../../stores/panelStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import { useEditorStore } from '../../stores/editorStore';
import { useSearchStore } from '../../stores/searchStore';
import { createNode } from '../../utils/nodeUtils';
import { getIconComponent } from '../../utils/iconUtils';
import { getContrastColor } from '../../utils/colorUtils';
import NodeTypeConfigModal from '../Config/NodeTypeConfig';
import EdgeTypeConfigModal from '../Config/EdgeTypeConfig';
import type { Actor } from '../../types';

/**
 * LeftPanel - Collapsible tools panel on the left side
 *
 * Features:
 * - Collapsible sections (History, Add Actors, Relations, Layout, View, Search)
 * - Drag-and-drop actor creation
 * - Undo/Redo with descriptions
 * - Relation type selector
 * - Collapse to icon bar (40px)
 * - Resizable width
 */

interface LeftPanelProps {
  onDeselectAll: () => void;
  onAddNode?: (nodeTypeId: string, position?: { x: number; y: number }) => void;
}

export interface LeftPanelRef {
  focusSearch: () => void;
}

const LeftPanel = forwardRef<LeftPanelRef, LeftPanelProps>(({ onDeselectAll, onAddNode }, ref) => {
  const {
    leftPanelCollapsed,
    leftPanelWidth,
    leftPanelSections,
    toggleLeftPanelSection,
    collapseLeftPanel,
    expandLeftPanel,
  } = usePanelStore();

  const { nodeTypes, edgeTypes, addNode, nodes, edges } = useGraphWithHistory();
  const { selectedRelationType, setSelectedRelationType } = useEditorStore();
  const [showNodeConfig, setShowNodeConfig] = useState(false);
  const [showEdgeConfig, setShowEdgeConfig] = useState(false);

  // Ref for the search input
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Expose focusSearch method to parent via ref
  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      // Expand left panel if collapsed
      if (leftPanelCollapsed) {
        expandLeftPanel();
      }

      // Expand search section if collapsed
      if (!leftPanelSections.search) {
        toggleLeftPanelSection('search');
      }

      // Focus the search input after a small delay to ensure DOM updates
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    },
  }), [leftPanelCollapsed, leftPanelSections.search, expandLeftPanel, toggleLeftPanelSection]);

  // Search and filter state
  const {
    searchText,
    setSearchText,
    visibleActorTypes,
    setActorTypeVisible,
    visibleRelationTypes,
    setRelationTypeVisible,
    autoZoomEnabled,
    setAutoZoomEnabled,
    clearFilters,
    hasActiveFilters,
  } = useSearchStore();

  // Initialize filter state when node/edge types change
  useEffect(() => {
    nodeTypes.forEach((nodeType) => {
      if (!(nodeType.id in visibleActorTypes)) {
        setActorTypeVisible(nodeType.id, true);
      }
    });
  }, [nodeTypes, visibleActorTypes, setActorTypeVisible]);

  useEffect(() => {
    edgeTypes.forEach((edgeType) => {
      if (!(edgeType.id in visibleRelationTypes)) {
        setRelationTypeVisible(edgeType.id, true);
      }
    });
  }, [edgeTypes, visibleRelationTypes, setRelationTypeVisible]);

  // Calculate matching nodes based on search and filters
  const matchingNodes = useMemo(() => {
    const searchLower = searchText.toLowerCase().trim();

    return nodes.filter((node) => {
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
        const nodeTypeConfig = nodeTypes.find((nt) => nt.id === actorType);
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
    });
  }, [nodes, searchText, visibleActorTypes, nodeTypes]);

  // Calculate matching edges based on search and filters
  const matchingEdges = useMemo(() => {
    const searchLower = searchText.toLowerCase().trim();

    return edges.filter((edge) => {
      const edgeType = edge.data?.type || '';

      // Filter by edge type visibility
      const isTypeVisible = visibleRelationTypes[edgeType] !== false;
      if (!isTypeVisible) {
        return false;
      }

      // Filter by search text
      if (searchLower) {
        const label = edge.data?.label?.toLowerCase() || '';
        const edgeTypeConfig = edgeTypes.find((et) => et.id === edgeType);
        const typeName = edgeTypeConfig?.label?.toLowerCase() || '';

        const matches =
          label.includes(searchLower) ||
          typeName.includes(searchLower);

        if (!matches) {
          return false;
        }
      }

      return true;
    });
  }, [edges, searchText, visibleRelationTypes, edgeTypes]);


  const handleAddNode = useCallback(
    (nodeTypeId: string) => {
      // Use the shared callback from GraphEditor if available
      if (onAddNode) {
        onAddNode(nodeTypeId);
      } else {
        // Fallback to old behavior (for backwards compatibility)
        onDeselectAll();

        const position = {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        };

        const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeTypeId);
        const newNode = createNode(nodeTypeId, position, nodeTypeConfig);
        newNode.selected = true;

        addNode(newNode);
      }
    },
    [onAddNode, onDeselectAll, addNode, nodeTypes]
  );

  const selectedEdgeTypeConfig = edgeTypes.find(et => et.id === selectedRelationType);

  // Collapsed icon bar view
  if (leftPanelCollapsed) {
    return (
      <div className="h-full bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 space-y-2" style={{ width: '40px' }}>
        <Tooltip title="Expand Tools Panel" placement="right">
          <IconButton size="small" onClick={expandLeftPanel}>
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  // Expanded panel view
  return (
    <div
      className="h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden"
      style={{ width: `${leftPanelWidth}px` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Tools</h2>
        <Tooltip title="Collapse Panel">
          <IconButton size="small" onClick={collapseLeftPanel}>
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Add Actors Section */}
        <div className="border-b border-gray-200">
          <div className="w-full px-3 py-2 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => toggleLeftPanelSection('addActors')}
              className="flex-1 flex items-center hover:bg-gray-100 transition-colors -mx-3 px-3 py-2"
            >
              <span className="text-xs font-semibold text-gray-700">Add Actors</span>
            </button>
            <Tooltip title="Configure Actor Types">
              <IconButton
                size="small"
                onClick={() => setShowNodeConfig(true)}
              >
                <SettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => toggleLeftPanelSection('addActors')}
            >
              {leftPanelSections.addActors ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </div>
          {leftPanelSections.addActors && (
            <div className="px-3 py-3 space-y-2">
              {nodeTypes.map((nodeType) => {
                const IconComponent = getIconComponent(nodeType.icon);
                const textColor = getContrastColor(nodeType.color);

                return (
                  <button
                    key={nodeType.id}
                    onClick={() => handleAddNode(nodeType.id)}
                    className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium rounded hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm"
                    style={{
                      backgroundColor: nodeType.color,
                      color: textColor
                    }}
                    title={nodeType.description}
                  >
                    {IconComponent ? (
                      <div className="w-5 h-5 flex items-center justify-center" style={{ color: textColor, fontSize: '1.25rem' }}>
                        <IconComponent />
                      </div>
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: nodeType.color,
                          borderColor: textColor
                        }}
                      />
                    )}
                    <span className="flex-1 text-left">{nodeType.label}</span>
                  </button>
                );
              })}
              <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Click a button to add an actor to the canvas
              </p>
            </div>
          )}
        </div>

        {/* Relations Section */}
        <div className="border-b border-gray-200">
          <div className="w-full px-3 py-2 flex items-center justify-between bg-gray-50">
            <button
              onClick={() => toggleLeftPanelSection('relations')}
              className="flex-1 flex items-center hover:bg-gray-100 transition-colors -mx-3 px-3 py-2"
            >
              <span className="text-xs font-semibold text-gray-700">Relations</span>
            </button>
            <Tooltip title="Configure Relation Types">
              <IconButton
                size="small"
                onClick={() => setShowEdgeConfig(true)}
              >
                <SettingsIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
            <IconButton
              size="small"
              onClick={() => toggleLeftPanelSection('relations')}
            >
              {leftPanelSections.relations ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </div>
          {leftPanelSections.relations && (
            <div className="px-3 py-3 space-y-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Active Type
              </label>
              <select
                value={selectedRelationType || ''}
                onChange={(e) => setSelectedRelationType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p className="text-xs text-gray-500 pt-1">
                Drag from actor handles to create relations
              </p>
            </div>
          )}
        </div>

        {/* Layout Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('layout')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Layout</span>
            {leftPanelSections.layout ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.layout && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 italic">
                Auto-layout features coming soon
              </p>
            </div>
          )}
        </div>

        {/* View Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('view')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">View</span>
            {leftPanelSections.view ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.view && (
            <div className="px-3 py-3">
              <p className="text-xs text-gray-500 italic">
                View options coming soon
              </p>
            </div>
          )}
        </div>

        {/* Search Section */}
        <div className="border-b border-gray-200">
          <button
            onClick={() => toggleLeftPanelSection('search')}
            className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs font-semibold text-gray-700">Search & Filter</span>
            {leftPanelSections.search ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </button>
          {leftPanelSections.search && (
            <div className="px-3 py-3 space-y-4">
              {/* Search Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Search
                  </label>
                  <div className="flex items-center space-x-1">
                    {/* Reset Filters Link */}
                    {hasActiveFilters() && (
                      <button
                        onClick={clearFilters}
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <FilterAltOffIcon sx={{ fontSize: 14 }} />
                        <span>Reset filters</span>
                      </button>
                    )}
                    {/* Auto-zoom toggle icon */}
                    <Tooltip title={autoZoomEnabled ? "Auto-zoom enabled" : "Auto-zoom disabled"} placement="top">
                      <IconButton
                        size="small"
                        onClick={() => setAutoZoomEnabled(!autoZoomEnabled)}
                        sx={{ padding: '4px' }}
                      >
                        <CenterFocusStrongIcon
                          sx={{
                            fontSize: 16,
                            color: autoZoomEnabled ? '#3b82f6' : '#9ca3af'
                          }}
                        />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <SearchIcon className="text-gray-400" sx={{ fontSize: 18 }} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search actors and relations..."
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchText && (
                    <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                      <IconButton
                        size="small"
                        onClick={() => setSearchText('')}
                        sx={{ padding: '4px' }}
                      >
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter by Actor Type */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Filter by Actor Type
                </label>
                <div className="space-y-1.5">
                  {nodeTypes.map((nodeType) => {
                    const isVisible = visibleActorTypes[nodeType.id] !== false;
                    const IconComponent = getIconComponent(nodeType.icon);

                    return (
                      <label
                        key={nodeType.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      >
                        <Checkbox
                          checked={isVisible}
                          onChange={() => setActorTypeVisible(nodeType.id, !isVisible)}
                          size="small"
                          sx={{ padding: '2px' }}
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          {IconComponent ? (
                            <div
                              className="w-4 h-4 flex items-center justify-center"
                              style={{ color: nodeType.color, fontSize: '1rem' }}
                            >
                              <IconComponent />
                            </div>
                          ) : (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: nodeType.color }}
                            />
                          )}
                          <span className="text-sm text-gray-700">{nodeType.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Filter by Relation */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Filter by Relation
                </label>
                <div className="space-y-1.5">
                  {edgeTypes.map((edgeType) => {
                    const isVisible = visibleRelationTypes[edgeType.id] !== false;

                    return (
                      <label
                        key={edgeType.id}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors"
                      >
                        <Checkbox
                          checked={isVisible}
                          onChange={() => setRelationTypeVisible(edgeType.id, !isVisible)}
                          size="small"
                          sx={{ padding: '2px' }}
                        />
                        <div className="flex items-center space-x-2 flex-1">
                          <div
                            className="w-6 h-0.5"
                            style={{
                              backgroundColor: edgeType.color,
                              borderStyle: edgeType.style === 'dashed' ? 'dashed' : edgeType.style === 'dotted' ? 'dotted' : 'solid',
                              borderWidth: edgeType.style !== 'solid' ? '1px' : '0',
                              borderColor: edgeType.style !== 'solid' ? edgeType.color : 'transparent',
                              height: edgeType.style !== 'solid' ? '0' : '2px',
                            }}
                          />
                          <span className="text-sm text-gray-700">{edgeType.label}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Results Summary */}
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Actors:</span>{' '}
                    {matchingNodes.length}
                    {searchText || hasActiveFilters() ? ` of ${nodes.length}` : ''}
                  </div>
                  <div>
                    <span className="font-medium">Relations:</span>{' '}
                    {matchingEdges.length}
                    {searchText || hasActiveFilters() ? ` of ${edges.length}` : ''}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modals */}
      <NodeTypeConfigModal
        isOpen={showNodeConfig}
        onClose={() => setShowNodeConfig(false)}
      />
      <EdgeTypeConfigModal
        isOpen={showEdgeConfig}
        onClose={() => setShowEdgeConfig(false)}
      />
    </div>
  );
});

LeftPanel.displayName = 'LeftPanel';

export default LeftPanel;
