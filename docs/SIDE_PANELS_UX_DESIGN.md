# Side Panels UI/UX Design Specification
## Constellation Analyzer - Collapsible Panels Implementation Guide

**Version:** 1.0
**Date:** 2025-10-10
**Status:** Design Specification
**Related:** UX_ANALYSIS.md Section 2.6, 4.1

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Goals](#design-goals)
3. [Layout Architecture](#layout-architecture)
4. [Left Panel: Tools Panel](#left-panel-tools-panel)
5. [Right Panel: Properties Panel](#right-panel-properties-panel)
6. [Panel Controls & Interactions](#panel-controls--interactions)
7. [Responsive Behavior](#responsive-behavior)
8. [Visual Design Specifications](#visual-design-specifications)
9. [User Workflow Improvements](#user-workflow-improvements)
10. [Implementation Guide](#implementation-guide)
11. [Accessibility Requirements](#accessibility-requirements)
12. [Migration Strategy](#migration-strategy)

---

## Executive Summary

This document specifies the design for implementing collapsible left and right side panels in Constellation Analyzer, replacing the current horizontal toolbar and modal property dialogs with a more professional, space-efficient panel-based layout.

**Key Changes:**
- **Left Panel (Tools):** Moves toolbar contents to collapsible sidebar with improved organization
- **Right Panel (Properties):** Replaces modal dialogs with persistent, context-aware panel
- **Canvas:** Gains more space when panels collapse, improving focus and usability
- **State Persistence:** Panel states (open/closed, width) saved per user in localStorage

**User Benefits:**
- 40-60% more canvas space when panels collapsed
- Non-modal property editing maintains context
- Better visual hierarchy and tool organization
- Professional appearance matching modern IDEs
- Keyboard-driven panel control

---

## Design Goals

### Primary Objectives
1. **Maximize Canvas Space:** More room for complex graphs
2. **Maintain Context:** Non-modal panels keep graph visible while editing
3. **Improve Discoverability:** Organized, always-visible tool categories
4. **Professional Appearance:** Match VS Code, Figma, Blender-style panel systems
5. **Flexible Workspace:** User controls their preferred layout

### Success Metrics
- Canvas space increases by 40-60% when both panels collapsed
- Property editing doesn't require closing panel to see results
- New users can find all tools within 30 seconds
- 80% of users keep preferred panel state across sessions

---

## Layout Architecture

### Overall Screen Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER: Constellation Analyzer Logo + Title                    [×]  │ ← 80px
├──────────────────────────────────────────────────────────────────────┤
│ MENU BAR: File  Edit  View  Layout  Help                            │ ← 40px
├──────────────────────────────────────────────────────────────────────┤
│ DOCUMENT TABS: Doc1  Doc2  [+]                                      │ ← 44px
├────┬──────────────────────────────────────────────────────────┬─────┤
│    │                                                           │     │
│ L  │                    CANVAS                                 │  R  │
│ E  │                  (ReactFlow)                              │  I  │
│ F  │                                                           │  G  │
│ T  │              Graph Editor Area                            │  H  │
│    │                                                           │  T  │
│ P  │         [Nodes, Edges, MiniMap, Controls]                │     │
│ A  │                                                           │  P  │
│ N  │                                                           │  A  │
│ E  │                                                           │  N  │
│ L  │                                                           │  E  │
│    │                                                           │  L  │
└────┴──────────────────────────────────────────────────────────┴─────┘
     ↑                                                             ↑
  280px default                                              320px default
  (collapsible to 40px icon bar)                      (collapsible to 0px)
```

### Dimension Specifications

**Left Panel (Tools Panel)**
```
Expanded:
  - Default Width: 280px
  - Min Width: 220px
  - Max Width: 400px
  - Collapsed Width: 40px (icon bar visible)
  - Height: 100% of available space (below tabs)

Collapsed Icon Bar:
  - Width: 40px
  - Shows vertical icons for quick access
  - Tooltip on hover with panel name
```

**Right Panel (Properties Panel)**
```
Expanded:
  - Default Width: 320px
  - Min Width: 280px
  - Max Width: 600px
  - Collapsed Width: 0px (completely hidden)
  - Height: 100% of available space (below tabs)

Collapsed State:
  - Completely hidden to maximize canvas space
  - Toggle button remains visible on canvas edge
```

**Canvas Area**
```
Both Panels Open:
  - Width: viewport - 280px - 320px = ~40% of 1920px screen
  - Comfortable for medium graphs (10-20 nodes)

Left Open, Right Closed:
  - Width: viewport - 280px = ~60% of 1920px screen
  - Good for active editing

Both Panels Closed:
  - Width: viewport - 40px = ~98% of 1920px screen
  - Maximum space for large graphs (50+ nodes)
  - Icon bar persists for quick tool access
```

### Responsive Breakpoints

```
≥ 1920px (Large Desktop):
  - Both panels default open
  - Canvas: ~1260px width

1440px - 1919px (Desktop):
  - Both panels default open
  - Canvas: ~840px width
  - Warning if both open and graph is large

1024px - 1439px (Small Desktop/Laptop):
  - Left panel default open
  - Right panel default closed
  - Canvas: ~744px width

768px - 1023px (Tablet):
  - Both panels default closed
  - Panels overlay canvas when opened
  - Canvas: ~728px width

< 768px (Mobile):
  - Panels not supported (show warning)
  - Recommend desktop browser
```

---

## Left Panel: Tools Panel

### Purpose
Centralized location for all graph creation and editing tools, replacing the horizontal toolbar.

### Content Organization

The left panel is divided into collapsible sections for easy scanning and organization:

```
┌─────────────────────────────┐
│ [<] TOOLS              [×]  │ ← Header with collapse/close
├─────────────────────────────┤
│                             │
│ ▼ HISTORY                   │ ← Collapsible section
│   [↶ Undo]  [↷ Redo]        │
│   Move Actor                │ ← Action description
│                             │
│ ▼ ADD ACTORS                │
│   ┌─────────────┐           │
│   │ Person      │  [●]      │ ← Color indicator
│   └─────────────┘           │
│   ┌─────────────┐           │
│   │ Organization│  [●]      │
│   └─────────────┘           │
│   ┌─────────────┐           │
│   │ System      │  [●]      │
│   └─────────────┘           │
│   ┌─────────────┐           │
│   │ Concept     │  [●]      │
│   └─────────────┘           │
│   [+ Manage Types...]       │
│                             │
│ ▼ RELATIONS                 │
│   Active Type:              │
│   ┌─────────────────────┐   │
│   │ Collaborates    [▼] │   │ ← Dropdown
│   └─────────────────────┘   │
│   ──────────────────        │ ← Visual preview
│   [+ Manage Types...]       │
│                             │
│ ▼ LAYOUT                    │
│   ┌─────────────────────┐   │
│   │ Auto Layout     [▼] │   │
│   └─────────────────────┘   │
│   • Force-Directed          │
│   • Hierarchical            │
│   • Circular                │
│   • Grid                    │
│                             │
│   [Align Selected]          │
│   [Distribute Selected]     │
│                             │
│ ▼ VIEW                      │
│   [Fit to Content]          │
│   [Reset Zoom]              │
│   ☑ Show Grid               │
│   ☑ Snap to Grid            │
│   ☑ Show MiniMap            │
│                             │
│ ▼ SEARCH                    │
│   ┌─────────────────────┐   │
│   │ 🔍 Search...        │   │
│   └─────────────────────┘   │
│   No filters active         │
│   [Advanced Filters...]     │
│                             │
└─────────────────────────────┘
```

### Section Specifications

#### 1. History Section
**Purpose:** Quick access to undo/redo with visual feedback

```typescript
interface HistorySection {
  title: "HISTORY";
  collapsible: true;
  defaultExpanded: true;

  content: {
    undoButton: {
      label: "Undo";
      icon: UndoIcon;
      disabled: !canUndo;
      tooltip: canUndo ? `Undo: ${lastAction}` : "Nothing to undo";
      shortcut: "Ctrl+Z";
    };
    redoButton: {
      label: "Redo";
      icon: RedoIcon;
      disabled: !canRedo;
      tooltip: canRedo ? `Redo: ${nextAction}` : "Nothing to redo";
      shortcut: "Ctrl+Y";
    };
    actionDescription: {
      text: lastAction;
      style: "text-xs text-gray-500";
    };
  };
}
```

**Visual Design:**
- Buttons side-by-side with icons
- Description text below shows last action
- Disabled state: 40% opacity
- Tooltips show action + keyboard shortcut

#### 2. Add Actors Section
**Purpose:** Visual palette for creating nodes

```typescript
interface AddActorsSection {
  title: "ADD ACTORS";
  collapsible: true;
  defaultExpanded: true;

  content: {
    actorButtons: NodeTypeConfig[];
    manageTypesLink: {
      label: "+ Manage Types...";
      action: openNodeTypeManager;
    };
  };

  buttonStyle: {
    width: "100%";
    height: "48px";
    display: "flex";
    justifyContent: "space-between";
    padding: "12px";
    backgroundColor: nodeType.color;
    borderRadius: "6px";
    marginBottom: "8px";
  };
}
```

**Interactions:**
- Click button: Adds node to center of viewport
- Drag button: Start drag, drop on canvas to place (FUTURE)
- Hover: Shows full type description in tooltip
- Color dot on right shows node color

**Visual Improvements over Current Toolbar:**
- Vertical layout allows more descriptive labels
- Color preview is larger and clearer
- Can show icons in future iterations
- Tooltips have more space for descriptions

#### 3. Relations Section
**Purpose:** Manage active relation type for connections

```typescript
interface RelationsSection {
  title: "RELATIONS";
  collapsible: true;
  defaultExpanded: true;

  content: {
    activeTypeLabel: "Active Type:";
    dropdown: {
      value: selectedRelationType;
      options: edgeTypes;
      onChange: setSelectedRelationType;
    };
    visualPreview: {
      // SVG line showing current type style
      strokeColor: currentEdgeType.color;
      strokeStyle: currentEdgeType.style; // solid/dashed/dotted
    };
    manageTypesLink: {
      label: "+ Manage Types...";
      action: openEdgeTypeManager;
    };
  };
}
```

**Visual Preview:**
- SVG line rendered below dropdown
- Shows actual edge color and style
- Updates live when dropdown changes
- Helps users visualize before creating

#### 4. Layout Section
**Purpose:** One-click layout algorithms

```typescript
interface LayoutSection {
  title: "LAYOUT";
  collapsible: true;
  defaultExpanded: false; // Collapsed by default

  content: {
    autoLayoutDropdown: {
      options: [
        "Force-Directed",
        "Hierarchical (Top-Down)",
        "Hierarchical (Left-Right)",
        "Circular",
        "Grid"
      ];
      onSelect: applyLayout;
    };
    alignButton: {
      label: "Align Selected";
      enabled: selectedNodes.length >= 2;
      submenu: ["Left", "Right", "Top", "Bottom", "Center H", "Center V"];
    };
    distributeButton: {
      label: "Distribute Selected";
      enabled: selectedNodes.length >= 3;
      submenu: ["Horizontally", "Vertically"];
    };
  };
}
```

**Note:** This section implements recommendation from UX_ANALYSIS.md Section 2.3

#### 5. View Section
**Purpose:** Canvas view controls and settings

```typescript
interface ViewSection {
  title: "VIEW";
  collapsible: true;
  defaultExpanded: false;

  content: {
    fitViewButton: {
      label: "Fit to Content";
      shortcut: "F";
      action: fitView;
    };
    resetZoomButton: {
      label: "Reset Zoom";
      shortcut: "Ctrl+0";
      action: () => setViewport({ zoom: 1 });
    };
    showGridToggle: {
      label: "Show Grid";
      checked: showGrid;
      onChange: toggleGrid;
    };
    snapToGridToggle: {
      label: "Snap to Grid";
      checked: snapToGrid;
      onChange: toggleSnapToGrid;
    };
    showMinimapToggle: {
      label: "Show MiniMap";
      checked: showMinimap;
      onChange: toggleMinimap;
    };
  };
}
```

**Improvement:** Consolidates view settings in one place

#### 6. Search Section
**Purpose:** Find and filter actors/relations

```typescript
interface SearchSection {
  title: "SEARCH";
  collapsible: true;
  defaultExpanded: false;

  content: {
    searchInput: {
      placeholder: "🔍 Search actors...";
      value: searchQuery;
      onChange: handleSearch;
      clearButton: true;
    };
    filterStatus: {
      text: activeFilters.length > 0
        ? `${filteredCount} of ${totalCount} actors`
        : "No filters active";
    };
    advancedFiltersButton: {
      label: "Advanced Filters...";
      action: openFilterPanel;
    };
  };
}
```

**Note:** Implements UX_ANALYSIS.md Section 1.4 (Search and Filter)

### Collapsed State: Icon Bar

When left panel collapses, it becomes a vertical icon bar:

```
┌──┐
│≡ │ ← Menu toggle (expands panel)
├──┤
│↶ │ ← Undo (with tooltip)
├──┤
│+ │ ← Add Actor (with dropdown on click)
├──┤
│⟿ │ ← Relations
├──┤
│⊞ │ ← Layout
├──┤
│👁│ ← View
├──┤
│🔍│ ← Search
├──┤
│  │
│  │
└──┘
```

**Specifications:**
- Width: 40px
- Icons: 24x24px Material Icons
- Padding: 8px vertical between icons
- Background: Same as panel (white/gray)
- Border: Right border to separate from canvas
- Tooltips: Show section name + "Click to expand"

**Interactions:**
- Click menu icon (≡): Expand full panel
- Click section icon: Expand panel and auto-scroll to that section
- Hover: Show tooltip with section name

---

## Right Panel: Properties Panel

### Purpose
Context-aware property inspector for selected graph elements, replacing modal dialogs with persistent panel.

### Selection State Management

The right panel content changes based on what's selected:

```typescript
type SelectionState =
  | { type: 'none' }
  | { type: 'single-node'; node: Actor }
  | { type: 'multiple-nodes'; nodes: Actor[] }
  | { type: 'single-edge'; edge: Relation }
  | { type: 'multiple-edges'; edges: Relation[] }
  | { type: 'mixed'; nodes: Actor[]; edges: Relation[] };
```

### State 1: Nothing Selected

```
┌─────────────────────────────┐
│ PROPERTIES             [×]  │
├─────────────────────────────┤
│                             │
│         ╭─────────╮         │
│         │   ···   │         │
│         ╰─────────╯         │
│                             │
│    No Selection             │
│                             │
│  Select a node or edge      │
│  to view properties         │
│                             │
│  Tips:                      │
│  • Double-click to edit     │
│  • Right-click for menu     │
│  • Shift+click to multi-    │
│    select                   │
│                             │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

**Purpose:**
- Guide users on how to select items
- Provide helpful tips
- Clean, uncluttered state

### State 2: Single Node Selected

```
┌─────────────────────────────┐
│ ACTOR PROPERTIES       [×]  │
├─────────────────────────────┤
│                             │
│ Label *                     │
│ ┌─────────────────────────┐ │
│ │ John Doe                │ │ ← Auto-focus, auto-select
│ └─────────────────────────┘ │
│                             │
│ Type                        │
│ ┌─────────────────────────┐ │
│ │ Person              [▼] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │   Color Preview         │ │ ← Shows node color
│ └─────────────────────────┘ │
│                             │
│ Description                 │
│ ┌─────────────────────────┐ │
│ │ Team lead for the       │ │
│ │ engineering department  │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ ▼ METADATA (0)              │ ← Collapsible
│   [+ Add Custom Field]      │
│                             │
│ ▼ CONNECTIONS (3)           │
│   → Collaborates            │
│      • Jane Smith           │
│      • Bob Johnson          │
│   → Reports To              │
│      • Alice Brown          │
│                             │
│   [View in Graph]           │ ← Highlights connections
│                             │
├─────────────────────────────┤
│ Node: actor-123             │ ← Footer with metadata
│ Position: (350, 240)        │
│                             │
│ [Delete Actor]              │
└─────────────────────────────┘
```

**Specifications:**

```typescript
interface NodePropertiesPanel {
  header: {
    title: "ACTOR PROPERTIES";
    closeButton: true;
  };

  fields: {
    label: {
      type: "text";
      required: true;
      autoFocus: true;
      autoSelect: true;
      placeholder: "Enter actor name";
      onChange: (value) => updateNodeLive(node.id, { label: value });
    };

    type: {
      type: "select";
      options: nodeTypes;
      onChange: (typeId) => updateNodeLive(node.id, { type: typeId });
    };

    colorPreview: {
      type: "visual";
      color: currentNodeType.color;
      height: "40px";
    };

    description: {
      type: "textarea";
      rows: 4;
      placeholder: "Add description...";
      onChange: debounce((value) => updateNodeLive(node.id, { description: value }), 500);
    };
  };

  sections: {
    metadata: {
      title: "METADATA";
      collapsible: true;
      defaultExpanded: false;
      badge: metadataCount;
      content: MetadataEditor;
    };

    connections: {
      title: "CONNECTIONS";
      collapsible: true;
      defaultExpanded: true;
      badge: connectionCount;
      content: ConnectionList;
    };
  };

  footer: {
    nodeInfo: {
      id: node.id;
      position: `(${Math.round(node.position.x)}, ${Math.round(node.position.y)})`;
    };
    deleteButton: {
      label: "Delete Actor";
      variant: "danger";
      confirmation: true;
    };
  };
}
```

**Key Features:**
1. **Live Updates:** Changes apply immediately (no Save button)
2. **Auto-focus:** Label field focused when panel opens
3. **Connection Preview:** Shows related edges and nodes
4. **Collapsible Sections:** Keep panel clean and scannable
5. **Non-modal:** Graph remains visible and interactive

### State 3: Multiple Nodes Selected

```
┌─────────────────────────────┐
│ BULK EDIT (3 ACTORS)   [×]  │
├─────────────────────────────┤
│                             │
│ Selected:                   │
│ • John Doe (Person)         │
│ • Acme Corp (Organization)  │
│ • API Gateway (System)      │
│                             │
│ ──────────────────────────  │
│                             │
│ Bulk Actions:               │
│                             │
│ Change Type                 │
│ ┌─────────────────────────┐ │
│ │ (Keep Individual)   [▼] │ │
│ └─────────────────────────┘ │
│ • Person                    │
│ • Organization              │
│ • System                    │
│ • Concept                   │
│                             │
│ [Apply to All]              │
│                             │
│ ──────────────────────────  │
│                             │
│ Layout:                     │
│ [Align Left]   [Align Top]  │
│ [Align Center] [Align Right]│
│ [Distribute Horizontally]   │
│ [Distribute Vertically]     │
│                             │
│ ──────────────────────────  │
│                             │
│ [Delete All Selected]       │
│                             │
└─────────────────────────────┘
```

**Purpose:** Bulk operations for efficiency (implements UX_ANALYSIS.md 1.5)

### State 4: Single Edge Selected

```
┌─────────────────────────────┐
│ RELATION PROPERTIES    [×]  │
├─────────────────────────────┤
│                             │
│ From                        │
│ ┌─────────────────────────┐ │
│ │ John Doe (Person)       │ │ ← Read-only, click to jump
│ └─────────────────────────┘ │
│         ↓                   │
│ To                          │
│ ┌─────────────────────────┐ │
│ │ Jane Smith (Person)     │ │
│ └─────────────────────────┘ │
│                             │
│ Type                        │
│ ┌─────────────────────────┐ │
│ │ Collaborates        [▼] │ │
│ └─────────────────────────┘ │
│ ──────────────────          │ ← Visual preview of style
│                             │
│ Custom Label (optional)     │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│ Leave empty to use type     │
│ label: "Collaborates"       │
│                             │
│ ▼ METADATA (0)              │
│   [+ Add Custom Field]      │
│                             │
├─────────────────────────────┤
│ Edge: edge-456              │
│                             │
│ [Delete Relation]           │
└─────────────────────────────┘
```

**Key Difference from Modal:**
- Graph stays visible
- Can see connection while editing
- Click source/target to jump to that node

### State 5: Multiple Edges Selected

```
┌─────────────────────────────┐
│ BULK EDIT (2 RELATIONS) [×] │
├─────────────────────────────┤
│                             │
│ Selected:                   │
│ • John → Jane (Collaborates)│
│ • Alice → Bob (Reports To)  │
│                             │
│ ──────────────────────────  │
│                             │
│ Change Type                 │
│ ┌─────────────────────────┐ │
│ │ (Keep Individual)   [▼] │ │
│ └─────────────────────────┘ │
│                             │
│ [Apply to All]              │
│                             │
│ ──────────────────────────  │
│                             │
│ [Delete All Selected]       │
│                             │
└─────────────────────────────┘
```

### Panel Behavior Specifications

**Opening:**
- Double-click node/edge: Auto-opens right panel (if closed)
- Panel slides in from right (200ms ease-out)
- Previous content fades out, new content fades in (150ms)

**Closing:**
- Click [×] button: Panel closes completely
- Click canvas: Selection clears, panel shows "Nothing Selected"
- Press Escape: Clears selection and closes panel

**Live Updates:**
- Text inputs: Debounced 500ms, then update graph
- Dropdowns: Immediate update on change
- Checkboxes: Immediate update
- Visual feedback: Changed field highlights briefly (blue border pulse)

**Validation:**
- Required fields: Red border if empty on blur
- Invalid values: Inline error message below field
- Block delete if it would orphan required relations (configurable)

---

## Panel Controls & Interactions

### Collapse/Expand Mechanisms

#### Left Panel Collapse Button

```
Location: Top-left of panel header
Icon (Expanded): [<] ChevronLeft
Icon (Collapsed): [>] ChevronRight
Tooltip (Expanded): "Collapse Tools Panel (Ctrl+B)"
Tooltip (Collapsed): "Expand Tools Panel (Ctrl+B)"
Size: 32x32px
```

**Behavior:**
```typescript
function toggleLeftPanel() {
  if (leftPanelExpanded) {
    // Collapse to icon bar
    animateWidth(leftPanelWidth, 40, 200, 'ease-out');
    setLeftPanelExpanded(false);
    localStorage.setItem('leftPanelExpanded', 'false');
  } else {
    // Expand to saved width or default
    const width = localStorage.getItem('leftPanelWidth') || 280;
    animateWidth(40, width, 200, 'ease-out');
    setLeftPanelExpanded(true);
    localStorage.setItem('leftPanelExpanded', 'true');
  }
}
```

#### Right Panel Toggle Button

When right panel is closed, a floating toggle button appears on the right edge of the canvas:

```
┌─────────────────────────────────────┐
│                                     ┃
│          CANVAS                     ┃←
│                                     ┃
│                                     ┃
│                                  [>]┃ ← Floating button
│                                     ┃
│                                     ┃
└─────────────────────────────────────┘
```

**Specifications:**
```typescript
interface RightPanelToggle {
  position: {
    right: 0;
    top: '50%';
    transform: 'translateY(-50%)';
  };
  size: {
    width: '32px';
    height: '120px';
  };
  style: {
    background: 'rgba(255, 255, 255, 0.9)';
    border: '1px solid #e5e7eb';
    borderRight: 'none';
    borderRadius: '8px 0 0 8px';
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)';
  };
  icon: ChevronLeftIcon; // Points left to indicate "expand"
  tooltip: "Show Properties Panel (Ctrl+I)";
}
```

**Interaction:**
- Hover: Slight width expansion (32px → 36px)
- Click: Panel slides in from right
- Auto-hide: Fades to 50% opacity when mouse not nearby
- Persists: Always visible when panel closed

### Resize Handles

Both panels can be resized by dragging the edge:

```
LEFT PANEL RESIZE:
┌──────────────────┃← Resize handle (4px width)
│                  ┃
│  TOOLS PANEL     ┃
│                  ┃
└──────────────────┃

RIGHT PANEL RESIZE:
                   ┃──────────────────┐
                   ┃→ Resize handle   │
                   ┃   PROPERTIES     │
                   ┃                  │
                   ┃──────────────────┘
```

**Specifications:**
```typescript
interface ResizeHandle {
  width: 4px;
  cursor: 'col-resize';

  visual: {
    default: 'transparent';
    hover: 'rgba(59, 130, 246, 0.5)'; // Blue highlight
    dragging: 'rgba(59, 130, 246, 0.8)';
  };

  constraints: {
    leftPanel: {
      min: 220,
      max: 400,
    };
    rightPanel: {
      min: 280,
      max: 600,
    };
  };

  behavior: {
    onDragStart: () => document.body.style.cursor = 'col-resize';
    onDrag: (delta) => updatePanelWidth(currentWidth + delta);
    onDragEnd: () => {
      document.body.style.cursor = 'default';
      localStorage.setItem('panelWidth', newWidth);
    };
  };
}
```

**Visual Feedback During Resize:**
- Handle highlights on hover (blue glow)
- Cursor changes to col-resize
- Width value tooltip appears during drag: "280px"
- Smooth animation when snapping to min/max

### Keyboard Shortcuts

```typescript
const panelShortcuts = {
  'Ctrl+B': 'Toggle Left Panel (Tools)',
  'Ctrl+I': 'Toggle Right Panel (Properties/Inspector)',
  'Ctrl+Shift+B': 'Toggle Both Panels',
  'Escape': 'Close Right Panel & Clear Selection',
};
```

**Implementation:**
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleLeftPanel();
    }
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      toggleRightPanel();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'B') {
      e.preventDefault();
      toggleBothPanels();
    }
    if (e.key === 'Escape') {
      closeRightPanel();
      clearSelection();
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

### View Menu Integration

Add panel visibility controls to View menu:

```
View
  ├─ Focus Mode (F11)
  ├─ ───────────────
  ├─ ☑ Show Tools Panel (Ctrl+B)
  ├─ ☑ Show Properties Panel (Ctrl+I)
  ├─ ───────────────
  ├─ Show Grid
  ├─ Show MiniMap
  └─ Fit View (F)
```

---

## Responsive Behavior

### Screen Size Adaptations

#### Large Desktop (≥1920px)
```
Default State:
├─ Left Panel: Open (280px)
├─ Right Panel: Closed initially, opens on selection
├─ Canvas: ~1600px
└─ Behavior: Full features, all panels comfortable
```

#### Desktop (1440px - 1919px)
```
Default State:
├─ Left Panel: Open (280px)
├─ Right Panel: Closed, opens on demand
├─ Canvas: ~1120px
└─ Behavior: Recommend closing left panel for large graphs
```

#### Small Desktop/Laptop (1024px - 1439px)
```
Default State:
├─ Left Panel: Closed (icon bar only, 40px)
├─ Right Panel: Closed
├─ Canvas: ~980px
└─ Behavior:
    • Show notification: "Panels collapsed for space. Press Ctrl+B to expand tools."
    • Panels overlay canvas when opened (position: absolute with z-index)
```

#### Tablet (768px - 1023px)
```
Default State:
├─ Left Panel: Collapsed
├─ Right Panel: Collapsed
├─ Canvas: Full width
└─ Behavior:
    • Panels overlay canvas when opened
    • Semi-transparent backdrop behind panels
    • Click outside panel to close
    • Touch-friendly panel toggle buttons (larger)
```

#### Mobile (<768px)
```
Warning State:
├─ Show fullscreen message:
│   "For the best experience, please use a desktop browser."
│   [Continue Anyway] [Learn More]
│
└─ If user continues:
    • Panels completely disabled
    • Toolbar remains but simplified
    • Property editing via modal dialogs (current behavior)
    • Limited graph editing capabilities
```

### Panel Priority Rules

When screen space is limited, follow this priority:

```
1. Canvas (CRITICAL) - minimum 600px width
2. Left Panel Collapsed (IMPORTANT) - 40px icon bar
3. Right Panel Closed (OPTIONAL) - 0px
4. Left Panel Expanded (NICE-TO-HAVE) - 280px
5. Right Panel Open (NICE-TO-HAVE) - 320px
```

**Auto-collapse Logic:**
```typescript
function handleResize(viewportWidth: number) {
  const MIN_CANVAS = 600;

  // Calculate required space
  const leftWidth = leftPanelExpanded ? 280 : 40;
  const rightWidth = rightPanelOpen ? 320 : 0;
  const canvasWidth = viewportWidth - leftWidth - rightWidth;

  // Auto-collapse if canvas too small
  if (canvasWidth < MIN_CANVAS) {
    if (rightPanelOpen) {
      closeRightPanel();
      showNotification('Properties panel auto-collapsed for space');
    } else if (leftPanelExpanded) {
      collapseLeftPanel();
      showNotification('Tools panel auto-collapsed for space');
    }
  }
}
```

### Overlay Mode

On screens <1440px, panels can overlay the canvas instead of pushing it:

```
OVERLAY MODE VISUAL:

┌─────────────────────────────────────┐
│┌──────────────┐                     │
││              │                     │
││ LEFT PANEL   │     CANVAS          │
││  (overlay)   │    (dimmed 20%)     │
││              │                     │
││              │                     │
│└──────────────┘                     │
└─────────────────────────────────────┘
         ↑
    Semi-transparent
    backdrop
```

**Specifications:**
```typescript
interface OverlayMode {
  enabled: viewportWidth < 1440;

  leftPanel: {
    position: 'absolute';
    zIndex: 100;
    boxShadow: '2px 0 16px rgba(0,0,0,0.2)';
  };

  rightPanel: {
    position: 'absolute';
    zIndex: 100;
    boxShadow: '-2px 0 16px rgba(0,0,0,0.2)';
  };

  backdrop: {
    position: 'absolute';
    background: 'rgba(0,0,0,0.2)';
    zIndex: 99;
    onClick: closePanels;
  };

  behavior: {
    clickOutside: 'close';
    escapeKey: 'close';
    animation: 'slide-in';
  };
}
```

---

## Visual Design Specifications

### Color Palette

Based on existing Tailwind CSS theme in the app:

```css
:root {
  /* Panel Backgrounds */
  --panel-bg: #ffffff;
  --panel-bg-hover: #f9fafb;
  --panel-border: #e5e7eb;

  /* Headers */
  --panel-header-bg: #f3f4f6;
  --panel-header-text: #111827;

  /* Sections */
  --section-title: #6b7280;
  --section-border: #e5e7eb;

  /* Inputs */
  --input-border: #d1d5db;
  --input-focus: #3b82f6;
  --input-bg: #ffffff;

  /* Icon Bar (collapsed left panel) */
  --iconbar-bg: #f9fafb;
  --iconbar-icon: #6b7280;
  --iconbar-icon-hover: #1f2937;

  /* Resize Handle */
  --resize-hover: rgba(59, 130, 246, 0.5);
  --resize-active: rgba(59, 130, 246, 0.8);

  /* Shadows */
  --panel-shadow: 0 1px 3px rgba(0,0,0,0.1);
  --panel-shadow-hover: 0 2px 8px rgba(0,0,0,0.15);
}
```

### Typography

```css
/* Panel Headers */
.panel-header {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--panel-header-text);
}

/* Section Titles */
.section-title {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--section-title);
}

/* Body Text */
.panel-body {
  font-size: 14px;
  line-height: 1.5;
  color: #374151;
}

/* Labels */
.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}

/* Help Text */
.help-text {
  font-size: 11px;
  color: #6b7280;
  font-style: italic;
}
```

### Spacing System

Consistent spacing using 4px base unit:

```css
--space-1: 4px;   /* Tight */
--space-2: 8px;   /* Close */
--space-3: 12px;  /* Default */
--space-4: 16px;  /* Comfortable */
--space-5: 20px;  /* Spacious */
--space-6: 24px;  /* Section gaps */
--space-8: 32px;  /* Major sections */
```

**Application:**
```
Panel Padding: var(--space-4) (16px)
Section Gaps: var(--space-6) (24px)
Field Gaps: var(--space-4) (16px)
Label-Input Gap: var(--space-2) (8px)
Button Padding: var(--space-3) var(--space-4) (12px 16px)
```

### Component Styles

#### Panel Container
```css
.panel {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: var(--panel-shadow);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.panel-left {
  border-right: 1px solid var(--panel-border);
}

.panel-right {
  border-left: 1px solid var(--panel-border);
}
```

#### Panel Header
```css
.panel-header {
  padding: 12px 16px;
  background: var(--panel-header-bg);
  border-bottom: 1px solid var(--panel-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.panel-close-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 150ms;
}

.panel-close-btn:hover {
  background: rgba(0,0,0,0.05);
}
```

#### Collapsible Section
```css
.section {
  border-bottom: 1px solid var(--section-border);
}

.section-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: background 150ms;
}

.section-header:hover {
  background: var(--panel-bg-hover);
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--section-title);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-badge {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
}

.section-content {
  padding: 16px;
  animation: slideDown 200ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Form Fields
```css
.field {
  margin-bottom: 16px;
}

.field-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 4px;
}

.field-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  transition: border-color 150ms, box-shadow 150ms;
}

.field-input:focus {
  outline: none;
  border-color: var(--input-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.field-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml...");
  background-position: right 8px center;
  background-repeat: no-repeat;
  padding-right: 32px;
}
```

#### Icon Bar (Collapsed Left Panel)
```css
.icon-bar {
  width: 40px;
  background: var(--iconbar-bg);
  border-right: 1px solid var(--panel-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 4px;
}

.icon-bar-button {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--iconbar-icon);
  cursor: pointer;
  transition: all 150ms;
}

.icon-bar-button:hover {
  background: rgba(59, 130, 246, 0.1);
  color: var(--iconbar-icon-hover);
}

.icon-bar-divider {
  width: 24px;
  height: 1px;
  background: var(--panel-border);
  margin: 4px 0;
}
```

#### Buttons
```css
.btn-primary {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 150ms;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-danger {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.btn-danger:hover {
  background: #fee2e2;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}
```

### Animation Specifications

```css
/* Panel Expand/Collapse */
.panel-transition {
  transition: width 200ms ease-out;
}

/* Content Fade */
.content-fade-enter {
  animation: fadeIn 150ms ease-in;
}

.content-fade-exit {
  animation: fadeOut 100ms ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Slide In (Right Panel) */
.panel-slide-in {
  animation: slideInRight 200ms ease-out;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Field Focus Pulse */
.field-changed {
  animation: fieldPulse 400ms ease-out;
}

@keyframes fieldPulse {
  0% {
    border-color: var(--input-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
  }
  100% {
    border-color: var(--input-border);
    box-shadow: none;
  }
}
```

---

## User Workflow Improvements

### Before (Current State) vs After (With Panels)

#### Workflow 1: Adding Multiple Actors

**BEFORE:**
```
1. Look up at toolbar
2. Click "Person" button
3. Node appears in random position
4. Drag node to desired position
5. Scroll up to toolbar again
6. Click "Person" button again
7. Repeat 20 times...
8. Eyes constantly moving between toolbar and canvas
```

**AFTER:**
```
1. Glance left at tools panel
2. Click "Person" button (larger target, always visible)
3. Node appears, position it
4. Click "Person" again (hand never leaves panel area)
5. Repeat efficiently
6. Eyes stay focused on left side and canvas
7. Alternatively: Press 'P' keyboard shortcut (even faster)
```

**Time Saved:** ~30% per actor creation
**Ergonomic Benefit:** Less eye movement, more consistent hand position

#### Workflow 2: Editing Actor Properties

**BEFORE:**
```
1. Double-click node
2. Modal dialog appears, blocking canvas view
3. Change type from Person to Organization
4. Click Save
5. Modal closes
6. Look at canvas to see result
7. Not happy with the color
8. Double-click again to reopen
9. Change back
10. Save and close again
```

**AFTER:**
```
1. Click node once (or double-click)
2. Right panel shows properties (canvas still visible)
3. Change type dropdown → see live update immediately
4. See color change on canvas in real-time
5. Adjust label while viewing context
6. See updated description on canvas
7. No Save button needed - all changes live
8. Click away when done
```

**Time Saved:** ~50% per property edit
**Context Benefit:** Always see graph while editing

#### Workflow 3: Creating a Complex Relation Network

**BEFORE:**
```
1. Add nodes via toolbar
2. Select relation type in toolbar dropdown
3. Drag from node handle to create edge
4. Realize wrong relation type was selected
5. Double-click edge
6. Modal opens
7. Change type
8. Save
9. Modal closes
10. Repeat for each edge
```

**AFTER:**
```
1. Add nodes from left panel
2. See current relation type highlighted in left panel
3. Change if needed (one click, stays visible)
4. Create edges
5. If wrong type: click edge, change in right panel (no modal)
6. See change immediately
7. Continue creating edges
8. Current type always visible in left panel
```

**Time Saved:** ~40% for multi-edge creation
**Error Reduction:** Less mistakes due to visible current type

#### Workflow 4: Organizing Graph Layout

**BEFORE:**
```
1. Manually drag each node
2. Try to align them visually
3. Zoom out to see full graph
4. Still not aligned well
5. Zoom back in
6. Drag more nodes
7. Repeat until frustrated
8. Graph still looks messy
```

**AFTER:**
```
1. Select multiple nodes (Shift+click)
2. Open left panel Layout section
3. Click "Align Left" → instant alignment
4. Click "Distribute Vertically" → even spacing
5. OR: Click "Auto Layout" → entire graph organized
6. Professional appearance in seconds
```

**Time Saved:** ~90% for layout tasks
**Quality Improvement:** Professional-looking graphs

#### Workflow 5: Finding and Editing a Specific Actor

**BEFORE:**
```
1. Scroll around canvas looking for actor
2. Zoom in and out
3. Click wrong actor
4. Keep searching
5. Finally find it
6. Double-click to edit
7. Modal blocks view of graph
8. Make changes
9. Close modal
```

**AFTER:**
```
1. Open Search section in left panel
2. Type actor name
3. Graph highlights matching actor
4. Click search result → jumps to actor
5. Right panel shows properties automatically
6. Edit while viewing full context
7. Done
```

**Time Saved:** ~70% for finding specific actors
**Frustration Reduction:** Significant

### Drag-and-Drop Enhancement (Future)

**Vision:** Drag actor buttons from left panel directly onto canvas

```
User Flow:
1. Click and hold "Person" button in left panel
2. Drag cursor onto canvas
3. Visual preview follows cursor (ghost node)
4. Release at desired position
5. Node created at exact drop location
6. Right panel auto-opens with focus on label field
7. User types name immediately
```

**Benefits:**
- More intuitive than click-then-drag
- Precise initial positioning
- Seamless creation-to-editing flow
- Familiar pattern from design tools (Figma, Sketch)

**Implementation:** Phase 2 feature (not MVP)

### Multi-Selection Property Editing

**Scenario:** User has 10 Person actors that should be Organization actors

**BEFORE:**
```
1. Double-click actor 1
2. Change type to Organization
3. Save, close modal
4. Repeat 9 more times
5. Total: ~2 minutes
```

**AFTER:**
```
1. Shift+click all 10 actors
2. Right panel shows "BULK EDIT (10 ACTORS)"
3. Change Type dropdown to "Organization"
4. Click "Apply to All"
5. All 10 change instantly
6. Total: ~10 seconds
```

**Time Saved:** ~92% for bulk changes

---

## Implementation Guide

### Phase 1: Foundation (Week 1-2)

#### Step 1.1: Create Panel Component Structure
```
/src/components/Panels/
├── PanelContainer.tsx        # Wrapper with resize logic
├── LeftPanel/
│   ├── LeftPanel.tsx          # Main left panel component
│   ├── IconBar.tsx            # Collapsed state icon bar
│   ├── sections/
│   │   ├── HistorySection.tsx
│   │   ├── AddActorsSection.tsx
│   │   ├── RelationsSection.tsx
│   │   ├── LayoutSection.tsx
│   │   ├── ViewSection.tsx
│   │   └── SearchSection.tsx
│   └── styles.css
├── RightPanel/
│   ├── RightPanel.tsx         # Main right panel component
│   ├── ToggleButton.tsx       # Floating toggle when closed
│   ├── states/
│   │   ├── EmptyState.tsx
│   │   ├── NodeProperties.tsx
│   │   ├── EdgeProperties.tsx
│   │   ├── BulkNodeEdit.tsx
│   │   └── BulkEdgeEdit.tsx
│   └── styles.css
└── hooks/
    ├── usePanelState.ts       # Manage panel open/closed/width
    ├── useResizeHandle.ts     # Resize drag logic
    └── usePanelShortcuts.ts   # Keyboard controls
```

#### Step 1.2: Create Panel State Store
```typescript
// /src/stores/panelStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelState {
  // Left panel
  leftPanelExpanded: boolean;
  leftPanelWidth: number;
  leftPanelSections: Record<string, boolean>; // section collapsed state

  // Right panel
  rightPanelOpen: boolean;
  rightPanelWidth: number;

  // Actions
  toggleLeftPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  toggleLeftSection: (sectionId: string) => void;

  toggleRightPanel: () => void;
  setRightPanelWidth: (width: number) => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      // Defaults
      leftPanelExpanded: true,
      leftPanelWidth: 280,
      leftPanelSections: {
        history: true,
        addActors: true,
        relations: true,
        layout: false,
        view: false,
        search: false,
      },

      rightPanelOpen: false,
      rightPanelWidth: 320,

      // Actions
      toggleLeftPanel: () => set((state) => ({
        leftPanelExpanded: !state.leftPanelExpanded
      })),

      setLeftPanelWidth: (width) => set({ leftPanelWidth: width }),

      toggleLeftSection: (sectionId) => set((state) => ({
        leftPanelSections: {
          ...state.leftPanelSections,
          [sectionId]: !state.leftPanelSections[sectionId],
        }
      })),

      toggleRightPanel: () => set((state) => ({
        rightPanelOpen: !state.rightPanelOpen
      })),

      setRightPanelWidth: (width) => set({ rightPanelWidth: width }),

      openRightPanel: () => set({ rightPanelOpen: true }),
      closeRightPanel: () => set({ rightPanelOpen: false }),
    }),
    {
      name: 'constellation-panels', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        leftPanelExpanded: state.leftPanelExpanded,
        leftPanelWidth: state.leftPanelWidth,
        leftPanelSections: state.leftPanelSections,
        rightPanelWidth: state.rightPanelWidth,
        // Don't persist rightPanelOpen (start closed)
      }),
    }
  )
);
```

#### Step 1.3: Implement Resize Hook
```typescript
// /src/components/Panels/hooks/useResizeHandle.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseResizeHandleOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  onResize: (width: number) => void;
  direction: 'left' | 'right'; // Which side to resize from
}

export function useResizeHandle({
  initialWidth,
  minWidth,
  maxWidth,
  onResize,
  direction,
}: UseResizeHandleOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [width, setWidth] = useState(initialWidth);
  const startXRef = useRef(0);
  const startWidthRef = useRef(initialWidth);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }, [width]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = direction === 'left'
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;

      const newWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidthRef.current + delta)
      );

      setWidth(newWidth);
      onResize(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minWidth, maxWidth, onResize]);

  return {
    width,
    isDragging,
    handleMouseDown,
  };
}
```

### Phase 2: Left Panel Implementation (Week 2-3)

#### Step 2.1: Build Collapsible Section Component
```typescript
// /src/components/Panels/LeftPanel/CollapsibleSection.tsx
import { ReactNode } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@mui/icons-material';

interface CollapsibleSectionProps {
  id: string;
  title: string;
  badge?: string | number;
  defaultExpanded?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  id,
  title,
  badge,
  children,
}: CollapsibleSectionProps) {
  const { leftPanelSections, toggleLeftSection } = usePanelStore();
  const isExpanded = leftPanelSections[id];

  return (
    <div className="section">
      <div
        className="section-header"
        onClick={() => toggleLeftSection(id)}
      >
        <div className="section-title">
          {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          <span>{title}</span>
          {badge && <span className="section-badge">{badge}</span>}
        </div>
      </div>

      {isExpanded && (
        <div className="section-content">
          {children}
        </div>
      )}
    </div>
  );
}
```

#### Step 2.2: Implement History Section
```typescript
// /src/components/Panels/LeftPanel/sections/HistorySection.tsx
import { CollapsibleSection } from '../CollapsibleSection';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import { IconButton, Tooltip } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

export function HistorySection() {
  const { undo, redo, canUndo, canRedo, undoDescription, redoDescription } =
    useDocumentHistory();

  return (
    <CollapsibleSection id="history" title="HISTORY">
      <div className="flex items-center gap-2">
        <Tooltip
          title={undoDescription ? `Undo: ${undoDescription} (Ctrl+Z)` : 'Undo (Ctrl+Z)'}
          arrow
        >
          <span>
            <IconButton
              onClick={undo}
              disabled={!canUndo}
              size="small"
            >
              <UndoIcon />
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
            >
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>

        {undoDescription && (
          <span className="text-xs text-gray-500 ml-2">
            {undoDescription}
          </span>
        )}
      </div>
    </CollapsibleSection>
  );
}
```

#### Step 2.3: Implement Add Actors Section
```typescript
// /src/components/Panels/LeftPanel/sections/AddActorsSection.tsx
import { CollapsibleSection } from '../CollapsibleSection';
import { useGraphWithHistory } from '@/hooks/useGraphWithHistory';
import { createNode } from '@/utils/nodeUtils';

export function AddActorsSection() {
  const { nodeTypes, addNode } = useGraphWithHistory();

  const handleAddNode = (nodeTypeId: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
    };

    const nodeTypeConfig = nodeTypes.find((nt) => nt.id === nodeTypeId);
    const newNode = createNode(nodeTypeId, position, nodeTypeConfig);
    addNode(newNode);
  };

  return (
    <CollapsibleSection id="addActors" title="ADD ACTORS">
      <div className="space-y-2">
        {nodeTypes.map((nodeType) => (
          <button
            key={nodeType.id}
            onClick={() => handleAddNode(nodeType.id)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-md text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: nodeType.color }}
            title={nodeType.description}
          >
            <span>{nodeType.label}</span>
            <div
              className="w-6 h-6 rounded-full border-2 border-white"
              style={{ backgroundColor: nodeType.color }}
            />
          </button>
        ))}

        <button className="w-full text-sm text-blue-600 hover:text-blue-700 py-2">
          + Manage Types...
        </button>
      </div>
    </CollapsibleSection>
  );
}
```

### Phase 3: Right Panel Implementation (Week 3-4)

#### Step 3.1: Build Right Panel Container with State Management
```typescript
// /src/components/Panels/RightPanel/RightPanel.tsx
import { useEffect } from 'react';
import { usePanelStore } from '@/stores/panelStore';
import { useGraphWithHistory } from '@/hooks/useGraphWithHistory';
import { EmptyState } from './states/EmptyState';
import { NodeProperties } from './states/NodeProperties';
import { EdgeProperties } from './states/EdgeProperties';
import { BulkNodeEdit } from './states/BulkNodeEdit';
import { BulkEdgeEdit } from './states/BulkEdgeEdit';
import { CloseIcon } from '@mui/icons-material';

export function RightPanel() {
  const { rightPanelOpen, closeRightPanel, rightPanelWidth } = usePanelStore();
  const { selectedNodes, selectedEdges } = useGraphWithHistory();

  // Determine which state to show
  const getContent = () => {
    if (selectedNodes.length === 1 && selectedEdges.length === 0) {
      return <NodeProperties node={selectedNodes[0]} />;
    }
    if (selectedEdges.length === 1 && selectedNodes.length === 0) {
      return <EdgeProperties edge={selectedEdges[0]} />;
    }
    if (selectedNodes.length > 1 && selectedEdges.length === 0) {
      return <BulkNodeEdit nodes={selectedNodes} />;
    }
    if (selectedEdges.length > 1 && selectedNodes.length === 0) {
      return <BulkEdgeEdit edges={selectedEdges} />;
    }
    return <EmptyState />;
  };

  if (!rightPanelOpen) return null;

  return (
    <div
      className="panel panel-right"
      style={{ width: `${rightPanelWidth}px` }}
    >
      <div className="panel-header">
        <h3 className="panel-title">PROPERTIES</h3>
        <button
          className="panel-close-btn"
          onClick={closeRightPanel}
          aria-label="Close properties panel"
        >
          <CloseIcon fontSize="small" />
        </button>
      </div>

      <div className="panel-content">
        {getContent()}
      </div>
    </div>
  );
}
```

#### Step 3.2: Implement Node Properties State
```typescript
// /src/components/Panels/RightPanel/states/NodeProperties.tsx
import { useState, useEffect, useRef } from 'react';
import { useGraphWithHistory } from '@/hooks/useGraphWithHistory';
import type { Actor } from '@/types';

interface NodePropertiesProps {
  node: Actor;
}

export function NodeProperties({ node }: NodePropertiesProps) {
  const { nodeTypes, updateNode, deleteNode } = useGraphWithHistory();
  const [label, setLabel] = useState(node.data?.label || '');
  const [type, setType] = useState(node.data?.type || '');
  const [description, setDescription] = useState(node.data?.description || '');
  const labelInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus label input
  useEffect(() => {
    labelInputRef.current?.focus();
    labelInputRef.current?.select();
  }, [node.id]);

  // Live update on change (debounced for description)
  const handleLabelChange = (value: string) => {
    setLabel(value);
    updateNode(node.id, { data: { ...node.data, label: value } });
  };

  const handleTypeChange = (typeId: string) => {
    setType(typeId);
    updateNode(node.id, { data: { ...node.data, type: typeId } });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    // Debounce this update
    const timeoutId = setTimeout(() => {
      updateNode(node.id, { data: { ...node.data, description: value } });
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  const currentType = nodeTypes.find(nt => nt.id === type);

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="field">
        <label className="field-label">Label *</label>
        <input
          ref={labelInputRef}
          type="text"
          className="field-input"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="Enter actor name"
        />
      </div>

      {/* Type */}
      <div className="field">
        <label className="field-label">Type</label>
        <select
          className="field-input field-select"
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          {nodeTypes.map((nt) => (
            <option key={nt.id} value={nt.id}>
              {nt.label}
            </option>
          ))}
        </select>

        {/* Color Preview */}
        {currentType && (
          <div
            className="mt-2 h-10 rounded border-2 flex items-center justify-center text-sm font-medium text-white"
            style={{
              backgroundColor: currentType.color,
              borderColor: currentType.color,
            }}
          >
            Color Preview
          </div>
        )}
      </div>

      {/* Description */}
      <div className="field">
        <label className="field-label">Description</label>
        <textarea
          className="field-input field-textarea"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="Add description..."
          rows={4}
        />
      </div>

      {/* Connections Section */}
      <CollapsibleSection id="connections" title="CONNECTIONS" badge={3}>
        {/* Show connected edges here */}
      </CollapsibleSection>

      {/* Footer */}
      <div className="pt-4 border-t">
        <p className="text-xs text-gray-500">
          Node: {node.id}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Position: ({Math.round(node.position.x)}, {Math.round(node.position.y)})
        </p>

        <button
          className="btn-danger w-full mt-4"
          onClick={() => deleteNode(node.id)}
        >
          Delete Actor
        </button>
      </div>
    </div>
  );
}
```

### Phase 4: Integration with App.tsx (Week 4)

```typescript
// /src/App.tsx - Updated layout
function AppContent() {
  const { leftPanelExpanded, leftPanelWidth, rightPanelOpen, rightPanelWidth } =
    usePanelStore();
  const { activeDocumentId } = useWorkspaceStore();

  // Calculate canvas width
  const leftWidth = leftPanelExpanded ? leftPanelWidth : 40;
  const rightWidth = rightPanelOpen ? rightPanelWidth : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        {/* ... existing header ... */}
      </header>

      {/* Menu Bar */}
      <MenuBar />

      {/* Document Tabs */}
      <DocumentTabs />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <LeftPanel />

        {/* Canvas */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            marginLeft: `${leftWidth}px`,
            marginRight: `${rightWidth}px`,
          }}
        >
          <GraphEditor />
        </div>

        {/* Right Panel */}
        <RightPanel />

        {/* Right Panel Toggle (when closed) */}
        {!rightPanelOpen && <RightPanelToggle />}
      </main>

      {/* Modals */}
      <DocumentManager />
      <KeyboardShortcutsHelp />
    </div>
  );
}
```

### Phase 5: Testing & Polish (Week 5)

**Test Cases:**
1. Panel resize within min/max bounds
2. Panel state persistence across page reloads
3. Keyboard shortcuts work correctly
4. Responsive behavior at different screen sizes
5. Live property updates don't cause performance issues
6. Overlay mode works on small screens
7. Accessibility: keyboard navigation, screen reader labels

**Performance Optimizations:**
- Debounce resize events
- Memoize panel content to prevent re-renders
- Use CSS transforms for animations (GPU-accelerated)
- Lazy load collapsed sections

---

## Accessibility Requirements

### Keyboard Navigation

```
Tab Order:
1. Menu bar items
2. Document tabs
3. Left panel sections (when expanded)
4. Canvas (ReactFlow)
5. Right panel fields (when open)

Shortcuts:
- Ctrl+B: Toggle left panel
- Ctrl+I: Toggle right panel
- Escape: Close right panel, clear selection
- Tab: Navigate through panel controls
- Enter: Expand/collapse section (when focused)
- Arrow keys: Navigate within lists
```

### Screen Reader Support

**ARIA Labels:**
```html
<!-- Left Panel -->
<aside
  role="complementary"
  aria-label="Tools panel"
  aria-expanded={leftPanelExpanded}
>
  <button
    aria-label="Collapse tools panel"
    aria-controls="tools-panel-content"
  >
    <ChevronLeftIcon aria-hidden="true" />
  </button>

  <section aria-labelledby="history-section-title">
    <h3 id="history-section-title">History</h3>
    <button aria-label="Undo: Move actor (Ctrl+Z)">
      <UndoIcon aria-hidden="true" />
    </button>
  </section>
</aside>

<!-- Right Panel -->
<aside
  role="complementary"
  aria-label="Properties panel"
  aria-expanded={rightPanelOpen}
>
  <div role="form" aria-label="Actor properties">
    <label for="actor-label">Label</label>
    <input
      id="actor-label"
      aria-required="true"
      aria-describedby="actor-label-help"
    />
    <span id="actor-label-help" class="sr-only">
      Enter a name for this actor
    </span>
  </div>
</aside>
```

**Live Regions:**
```html
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {liveMessage}
</div>

Examples:
- "Tools panel collapsed"
- "Properties panel opened"
- "Actor properties updated"
- "Panel resized to 320 pixels"
```

### Focus Management

```typescript
// When opening right panel, focus first input
useEffect(() => {
  if (rightPanelOpen && labelInputRef.current) {
    labelInputRef.current.focus();
  }
}, [rightPanelOpen]);

// When closing panel, return focus to trigger element
const handleClosePanel = () => {
  const trigger = document.querySelector('[data-panel-trigger]');
  closeRightPanel();
  (trigger as HTMLElement)?.focus();
};

// Trap focus in panel when overlay mode active
useFocusTrap(panelRef, isOverlayMode);
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  .panel {
    border: 2px solid currentColor;
  }

  .panel-header {
    border-bottom: 2px solid currentColor;
  }

  .field-input:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }

  .btn-primary {
    border: 2px solid currentColor;
  }
}
```

---

## Migration Strategy

### Step 1: Add Panels Without Removing Toolbar (Week 1)

**Goal:** Let users try panels without breaking existing workflow

```
Layout:
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Menu Bar                            │
├─────────────────────────────────────┤
│ Tabs                                │
├─────────────────────────────────────┤
│ TOOLBAR (Still Present)             │ ← Keep temporarily
├────┬────────────────────────────┬───┤
│ L  │                            │ R │
│ E  │        Canvas              │ I │
│ F  │                            │ G │
│ T  │                            │ H │
│    │                            │ T │
└────┴────────────────────────────┴───┘

Notice banner:
"New side panels available! Try Ctrl+B and Ctrl+I.
 We'll remove the toolbar in the next update."
```

### Step 2: Add Feature Flag (Week 2)

```typescript
// /src/stores/settingsStore.ts
interface Settings {
  useLegacyToolbar: boolean;
}

// Settings panel
<Checkbox
  checked={useLegacyToolbar}
  onChange={(e) => updateSettings({ useLegacyToolbar: e.target.checked })}
  label="Use legacy toolbar (deprecated)"
/>
```

### Step 3: Default to Panels, Toolbar Opt-In (Week 3)

```typescript
// Default: useLegacyToolbar = false
// Show migration notice for first-time users
if (isFirstTimeUser) {
  showNotification({
    title: "Improved Layout",
    message: "Tools moved to left panel for more canvas space. Press Ctrl+B to toggle.",
    action: {
      label: "Learn More",
      onClick: () => openHelp("side-panels"),
    },
  });
}
```

### Step 4: Remove Toolbar Completely (Week 4)

```
Final Layout:
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Menu Bar                            │
├─────────────────────────────────────┤
│ Tabs                                │
├────┬────────────────────────────┬───┤
│ L  │                            │ R │
│ E  │        Canvas              │ I │
│ F  │                            │ G │
│ T  │                            │ H │
│    │                            │ T │
└────┴────────────────────────────┴───┘

No toolbar - clean, professional layout
```

### User Communication

**Migration Email/Notification:**
```
Subject: Constellation Analyzer - New Panel Layout

Hi [User],

We've improved the layout with collapsible side panels:

✓ 40-60% more canvas space
✓ Edit properties without blocking your view
✓ Better organized tools
✓ Keyboard shortcuts: Ctrl+B (tools), Ctrl+I (properties)

The horizontal toolbar has been moved to the left panel.
Your workflows will work the same, just in a better location.

Questions? Watch our 2-minute video: [link]

- The Constellation Team
```

### Rollback Plan

If users report significant issues:

```typescript
// Emergency rollback
const FORCE_LEGACY_MODE = true;

if (FORCE_LEGACY_MODE || useLegacyToolbar) {
  return <LegacyToolbar />;
}

return (
  <>
    <LeftPanel />
    <RightPanel />
  </>
);
```

---

## Success Metrics

**Track these metrics to validate the design:**

### Quantitative Metrics

```typescript
interface PanelMetrics {
  // Adoption
  percentUsersWithPanelsOpen: number;        // Target: >80%
  averageLeftPanelExpandedTime: number;      // Target: >70% of session
  averageRightPanelOpenTime: number;         // Target: >30% of session

  // Efficiency
  timeToCreateActor: number;                 // Target: 30% faster
  timeToEditProperties: number;              // Target: 50% faster
  averagePropertyEditsPerSession: number;    // Target: +40%

  // Space Utilization
  averageCanvasArea: number;                 // Target: +50% vs old layout
  percentSessionsBothPanelsClosed: number;   // Indicates focus mode usage

  // Engagement
  resizePanelEventsPerUser: number;          // Indicates customization
  shortcutUsageRate: number;                 // Target: >40% use Ctrl+B/I
}
```

### Qualitative Metrics

```typescript
// User Surveys (after 1 week of usage)
interface UserFeedback {
  question: string;
  target: string;

  responses: [
    {
      question: "How much more productive are you with the new panels?",
      target: "70% say 'More productive' or 'Much more productive'",
    },
    {
      question: "Do you prefer the panel layout or the old toolbar?",
      target: "80% prefer panels",
    },
    {
      question: "How easy was it to learn the new layout?",
      target: "Average rating: 4+ out of 5",
    },
  ];
}
```

### A/B Testing Plan

```typescript
// Week 1-2: 50/50 split
groupA: {
  layout: 'panels',
  users: 50%,
}
groupB: {
  layout: 'toolbar (control)',
  users: 50%,
}

// Measure:
- Task completion time
- Error rate
- Feature discovery
- User satisfaction

// If panels win by >20%, roll out to 100%
```

---

## Appendix A: Component Reference

### LeftPanel Component Tree
```
<LeftPanel>
├── <PanelHeader>
│   ├── <CollapseButton />
│   └── <PanelTitle>TOOLS</PanelTitle>
├── <PanelContent>
│   ├── <HistorySection />
│   ├── <AddActorsSection />
│   ├── <RelationsSection />
│   ├── <LayoutSection />
│   ├── <ViewSection />
│   └── <SearchSection />
└── <ResizeHandle />
```

### RightPanel Component Tree
```
<RightPanel>
├── <PanelHeader>
│   ├── <PanelTitle>PROPERTIES</PanelTitle>
│   └── <CloseButton />
├── <PanelContent>
│   └── {dynamic content based on selection}
│       ├── <EmptyState />
│       ├── <NodeProperties />
│       ├── <EdgeProperties />
│       ├── <BulkNodeEdit />
│       └── <BulkEdgeEdit />
└── <ResizeHandle />
```

---

## Appendix B: Future Enhancements

### Phase 6 Features (Future Roadmap)

1. **Drag-and-Drop Actor Creation**
   - Drag actor button from left panel onto canvas
   - Ghost preview follows cursor
   - Drop to place at exact position

2. **Panel Layouts Presets**
   - "Compact" (both panels narrow)
   - "Focus" (both panels closed)
   - "Editor" (left open, right closed)
   - "Inspector" (left closed, right open)
   - Save custom presets

3. **Detachable Panels**
   - Right-click panel header → "Detach"
   - Panel becomes floating window
   - Useful for multi-monitor setups

4. **Bottom Panel**
   - Show graph metrics and analysis
   - Terminal/console for advanced users
   - Activity log

5. **Panel Tabs**
   - Multiple tools in left panel as tabs
   - Properties + Layers + Search in right panel tabs
   - More content without taking more space

6. **Smart Panel Auto-Show**
   - Select node → right panel auto-opens (configurable)
   - Start creating edge → relation panel auto-expands
   - ML-based: learn user's panel preferences

7. **Panel Templates by Document Type**
   - Org chart: Different panel configuration
   - System diagram: Different tools visible
   - Save per document type

---

## Summary

This design specification provides a complete blueprint for implementing professional, collapsible side panels in Constellation Analyzer. The key improvements are:

1. **60% more canvas space** when panels collapsed
2. **Non-modal property editing** maintains context
3. **Better tool organization** improves discoverability
4. **Keyboard-driven** workflow for power users
5. **Persistent state** remembers user preferences
6. **Responsive design** adapts to screen sizes
7. **Accessible** for all users

**Implementation Time:** 4-5 weeks for MVP
**User Impact:** High - transforms the entire editing experience
**Technical Risk:** Low - well-established patterns

**Next Steps:**
1. Review and approve this design specification
2. Create detailed UI mockups in Figma (optional but recommended)
3. Begin Phase 1 implementation
4. Conduct user testing after Phase 3
5. Iterate based on feedback

---

**Document prepared by:** Claude (UI/UX Design Specialist)
**For:** Constellation Analyzer v0.2.0
**Related Files:**
- `/home/jbruhn/dev/constellation-analyzer/docs/UX_ANALYSIS.md`
- `/home/jbruhn/dev/constellation-analyzer/src/App.tsx`
- `/home/jbruhn/dev/constellation-analyzer/src/components/Toolbar/Toolbar.tsx`
- `/home/jbruhn/dev/constellation-analyzer/src/components/Editor/GraphEditor.tsx`

**Contact:** For implementation questions or design clarifications
