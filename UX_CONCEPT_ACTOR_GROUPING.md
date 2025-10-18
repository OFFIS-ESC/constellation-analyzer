# Actor Grouping Feature - UX Concept Document

**Version:** 1.0
**Date:** 2025-10-17
**Application:** Constellation Analyzer

---

## Executive Summary

This document defines the UX concept for a new **Actor Grouping** feature in Constellation Analyzer. The feature allows users to group multiple actors into visual containers that can be collapsed/expanded to reduce UI clutter while maintaining graph relationships.

The design follows the application's existing patterns:
- React Flow-based graph visualization
- Tailwind CSS + Material-UI design system
- Zustand state management with history tracking
- Collapsible panels and sections
- Context-sensitive interactions

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [User Stories & Use Cases](#2-user-stories--use-cases)
3. [Information Architecture](#3-information-architecture)
4. [Visual Design](#4-visual-design)
5. [Interaction Design](#5-interaction-design)
6. [State Management](#6-state-management)
7. [Edge Cases & Constraints](#7-edge-cases--constraints)
8. [Implementation Considerations](#8-implementation-considerations)
9. [Future Enhancements](#9-future-enhancements)

---

## 1. Feature Overview

### 1.1 Purpose

Allow users to organize related actors into logical groups with visual containment, improving:
- **Organization**: Cluster related actors semantically (e.g., "Engineering Team", "External Systems")
- **Clarity**: Reduce visual complexity in large graphs
- **Focus**: Collapse groups to hide details, expand to show full structure
- **Context**: Maintain visible relationships between groups and individual actors

### 1.2 Core Capabilities

1. **Create Group**: Select multiple actors and group them into a named container
2. **Visual Container**: Box with header, background color, and contained actors
3. **Expand/Collapse**: Toggle between full view and collapsed placeholder
4. **Group Editing**: Rename, recolor, add/remove actors
5. **Nested Relations**: Show relations within group and between group/external actors
6. **History Support**: Full undo/redo integration

### 1.3 Key Principles

- **Non-Destructive**: Grouping does not delete or modify actors/relations
- **Reversible**: Groups can be ungrouped, returning actors to independent state
- **Transparent**: Collapsed groups show summary info (actor count, relation count)
- **Consistent**: Follows existing design patterns (collapsible sections, context menus, panels)

---

## 2. User Stories & Use Cases

### User Story 1: Creating a Group
> **As a** constellation analyst
> **I want to** select multiple actors and group them
> **So that** I can organize related entities visually

**Acceptance Criteria:**
- User can select 2+ actors using Shift+Click or drag selection box
- Context menu shows "Create Group" option for multi-selection
- Prompted to name the group (optional, defaults to "Group 1", "Group 2", etc.)
- Group container appears with all selected actors inside
- Actors maintain their relative positions within the group

### User Story 2: Collapsing a Group
> **As a** constellation analyst
> **I want to** collapse a group to hide its contents
> **So that** I can reduce clutter when viewing the big picture

**Acceptance Criteria:**
- Group header shows expand/collapse toggle button
- Collapsed state shows:
  - Group name
  - Actor count badge (e.g., "5 actors")
  - Relation indicators (connections to external nodes)
- Relations from group actors to external nodes remain visible, attached to collapsed group boundary
- Double-click on collapsed group expands it

### User Story 3: Editing Group Properties
> **As a** constellation analyst
> **I want to** edit a group's name and appearance
> **So that** I can customize organization to my needs

**Acceptance Criteria:**
- Selecting a group shows properties in right panel
- Editable properties: name, color, description
- List of contained actors (with ability to remove from group)
- Delete group button (ungroups actors, doesn't delete them)

### User Story 4: Ungrouping
> **As a** constellation analyst
> **I want to** ungroup a set of actors
> **So that** I can reorganize my graph structure

**Acceptance Criteria:**
- Right-click group → "Ungroup" option
- Actors return to canvas at their last positions
- Relations remain intact
- Operation is undoable

---

## 3. Information Architecture

### 3.1 Data Model

```typescript
// New type for groups
export interface GroupData {
  label: string;              // Group name
  description?: string;       // Optional description
  color: string;              // Background color (semi-transparent)
  collapsed: boolean;         // Expand/collapse state
  actorIds: string[];         // IDs of actors in this group
  metadata?: Record<string, unknown>;
}

export type Group = {
  id: string;                 // Unique group ID
  type: 'group';              // Node type identifier
  position: { x: number; y: number };  // Top-left corner
  data: GroupData;
  // React Flow will calculate dimensions based on contained nodes
};

// Updated types
export interface GraphState {
  nodes: Actor[];
  edges: Relation[];
  groups: Group[];            // NEW: Array of groups
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels: LabelConfig[];
}
```

### 3.2 Hierarchical Relationships

```
Graph
├── Groups (containers)
│   ├── Group 1 (expanded)
│   │   ├── Actor A
│   │   ├── Actor B
│   │   └── Actor C
│   └── Group 2 (collapsed)
│       └── [3 actors hidden]
├── Standalone Actors
│   ├── Actor D
│   └── Actor E
└── Relations
    ├── A → B (internal to Group 1)
    ├── A → D (crosses group boundary)
    └── Group 2 → E (from collapsed group)
```

### 3.3 Information Display Hierarchy

**Expanded Group:**
```
┌─────────────────────────────────┐
│ [−] Engineering Team        [×] │ ← Header with collapse/delete
├─────────────────────────────────┤
│                                 │
│   ┌──────┐      ┌──────┐       │ ← Contained actors
│   │ Dev  │ ───→ │ Lead │       │    with relations
│   └──────┘      └──────┘       │
│                                 │
│   ┌──────┐                     │
│   │ QA   │                     │
│   └──────┘                     │
│                                 │
└─────────────────────────────────┘
```

**Collapsed Group:**
```
┌─────────────────────────┐
│ [+] Engineering Team    │ ← Compact header
│     3 actors            │ ← Summary info
└─────────────────────────┘
       │ (Relations extend from edges)
       └──────→ (External node)
```

---

## 4. Visual Design

### 4.1 Design Tokens

**Group Colors (Semi-transparent backgrounds):**
```typescript
const DEFAULT_GROUP_COLORS = [
  'rgba(59, 130, 246, 0.08)',   // Blue
  'rgba(16, 185, 129, 0.08)',   // Green
  'rgba(245, 158, 11, 0.08)',   // Orange
  'rgba(139, 92, 246, 0.08)',   // Purple
  'rgba(236, 72, 153, 0.08)',   // Pink
  'rgba(20, 184, 166, 0.08)',   // Teal
];
```

**Border Styles:**
```typescript
const GROUP_BORDER_STYLE = {
  width: '2px',
  style: 'dashed',              // Dashed to differentiate from nodes
  radius: '8px',                // Rounded corners
  opacity: 0.4,                 // Subtle
};
```

**Header Styles:**
```typescript
const GROUP_HEADER_STYLE = {
  background: 'rgba(0, 0, 0, 0.05)',  // Subtle gray overlay
  padding: '8px 12px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',             // Gray-700
  height: '40px',
};
```

**Typography:**
- Group Name: 14px, font-semibold (600), gray-700
- Actor Count: 12px, font-medium (500), gray-500
- Description: 12px, font-normal (400), gray-600

**Spacing:**
- Padding inside group: 16px (around contained actors)
- Margin between actors in group: maintain existing spacing
- Collapsed group size: 240px × 80px (fixed dimensions)

### 4.2 Component Mockups

#### Expanded Group Structure

```
┌─────────────────────────────────────────────┐
│ Header Area (bg-gray-50/50, h-40px)         │
│ ┌────────────────────────────────────────┐  │
│ │ [−] Group Name        [👁️] [✏️] [×]    │  │
│ └────────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│ Content Area (padding: 16px)                │
│                                             │
│   [Actor nodes positioned freely]          │
│   [Relations between actors]               │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
  ↑ Dashed border (2px, border-color)
```

**Header Components:**
- **Collapse Button** `[−]`: IconButton with ExpandLessIcon, left-aligned
- **Group Name**: Text label, editable on double-click or via right panel
- **Visibility Toggle** `[👁️]`: IconButton to show/hide group temporarily (fade out)
- **Edit Button** `[✏️]`: IconButton to open right panel with group properties
- **Delete Button** `[×]`: IconButton to ungroup (with confirmation)

#### Collapsed Group Structure

```
┌───────────────────────┐
│ [+] Group Name        │  ← Header only
│     5 actors          │  ← Summary badge
│     3 relations       │  ← Connection count
└───────────────────────┘
```

**Collapsed Dimensions:**
- Width: 240px (fixed)
- Height: Auto (based on content, min 80px)
- Border: Same dashed style
- Background: Darker tint of group color (0.12 opacity)

**Collapsed Summary:**
- Actor count: Shows total actors inside
- Relation count: Shows external relations (connections to/from group)
- No internal structure visible

### 4.3 Relation Rendering

**Internal Relations (within group):**
- Rendered normally when group is expanded
- Hidden when group is collapsed

**External Relations (group ↔ standalone actors):**
- **Expanded:** Edge connects from specific actor inside group to external node
- **Collapsed:** Edge connects from group boundary (closest edge point) to external node
  - Edge label shows source actor name in parentheses: "collaborates (Alice)"

**Group-to-Group Relations:**
- Treated as external relations
- Shows summary label when both groups collapsed

### 4.4 Selection & Highlighting States

**Group Selected:**
- Border becomes solid (not dashed)
- Border width: 3px
- Border color: Primary blue (#3b82f6)
- Right panel shows group properties

**Group Hovered:**
- Border opacity: 0.7 (from 0.4)
- Header background darkens slightly
- Cursor: pointer

**Actor in Group Hovered/Selected:**
- Same as current behavior
- Group border remains unchanged

---

## 5. Interaction Design

### 5.1 Creating Groups

#### Method 1: Selection + Context Menu (Primary)

1. **Multi-Select Actors:**
   - Shift+Click: Add to selection
   - Ctrl+Click (Windows) / Cmd+Click (Mac): Toggle selection
   - Drag selection box: Select multiple actors in rectangle

2. **Right-Click on Selected Actor:**
   - Context menu shows new option: **"Group Selected Actors"**
   - Positioned near "Delete" option

3. **Name Group Dialog:**
   - Modal dialog: `InputDialog`
   - Title: "Create Actor Group"
   - Message: "Enter a name for this group"
   - Placeholder: "Group 1" (auto-increment)
   - Validation: Max 50 characters
   - Buttons: "Create" (primary blue) | "Cancel"

4. **Group Created:**
   - New group node added to graph
   - Bounding box calculated from selected actors' positions
   - Selected actors moved "into" group (z-index and parent relationship)
   - Default color assigned (cycle through colors)
   - Group starts in **expanded** state

#### Method 2: Left Panel Button (Alternative)

**New Section in Left Panel: "Organization"**
- Positioned between "Relations" and "Layout"
- Contains:
  - **"Create Group"** button (disabled if < 2 actors selected)
  - Explanation text: "Select 2+ actors to create a group"

### 5.2 Expanding/Collapsing Groups

#### Toggle via Header Button

- Click `[−]` button → Collapses group
- Click `[+]` button → Expands group
- Animation: 300ms ease-in-out transition
  - Actors fade out/in
  - Group dimensions animate
  - Relations re-route smoothly

#### Keyboard Shortcut

- Select group → Press `Space` to toggle collapse state

#### Double-Click Collapsed Group

- Double-clicking collapsed group expands it
- Fast interaction for exploration

### 5.3 Editing Groups

#### Select Group → Right Panel

**Group Properties Panel** (similar to NodeEditorPanel):

```
┌─────────────────────────────────┐
│ Group Properties            [×] │
├─────────────────────────────────┤
│ Name                            │
│ ┌─────────────────────────────┐ │
│ │ Engineering Team            │ │
│ └─────────────────────────────┘ │
│                                 │
│ Description (optional)          │
│ ┌─────────────────────────────┐ │
│ │ Core development team...    │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ Background Color                │
│ [Color Picker Component]        │
│                                 │
│ Members (5 actors)              │
│ ┌─────────────────────────────┐ │
│ │ • Alice (Developer)     [×] │ │
│ │ • Bob (Lead)            [×] │ │
│ │ • Charlie (QA)          [×] │ │
│ └─────────────────────────────┘ │
│                                 │
│ State                           │
│ ○ Expanded  ● Collapsed         │
│                                 │
│ [Ungroup] [Delete Group]        │
└─────────────────────────────────┘
```

**Editable Properties:**
- **Name**: Text input, live update (500ms debounce)
- **Description**: Textarea, optional
- **Color**: Color picker (same as node type config)
- **Members**: List with remove buttons
  - Click `[×]` → Remove actor from group (moves to canvas)
  - Shows actor label and type
- **State**: Radio buttons to expand/collapse
- **Actions**:
  - **Ungroup**: Button to dissolve group, actors return to canvas
  - **Delete Group**: Button to delete group AND all actors inside (with confirmation)

#### Inline Name Editing

- Double-click group header → Enter edit mode
- Input field replaces name text
- Enter to save, Escape to cancel

### 5.4 Managing Group Membership

#### Add Actor to Existing Group (Drag & Drop)

1. Drag actor node onto group
2. Group highlights with thicker border (visual feedback)
3. Drop → Actor becomes member of group
4. Position adjusted to be inside group boundary

#### Remove Actor from Group

**Method 1:** Right panel → Click `[×]` next to actor name
**Method 2:** Drag actor out of group boundary → Auto-removed

#### Move Group

- Drag group header → Move entire group with all actors
- Actors maintain relative positions within group
- Relations update in real-time

### 5.5 Deleting & Ungrouping

#### Ungroup (Non-Destructive)

- **Action**: Right-click group → "Ungroup"
- **Result**:
  - Group node removed
  - All actors return to canvas at their absolute positions
  - Relations unchanged
  - Undo description: "Ungroup [Group Name]"

#### Delete Group (Destructive)

- **Action**: Right panel → "Delete Group" button
- **Confirmation**: Dialog warns:
  - "Delete this group AND all 5 actors inside?"
  - "This will also delete all connected relations."
  - Severity: danger (red)
- **Result**:
  - Group deleted
  - All actors inside deleted
  - All relations to/from those actors deleted
  - Undo description: "Delete Group [Group Name]"

### 5.6 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + G` | Group selected actors |
| `Space` (group selected) | Toggle expand/collapse |
| `Ctrl/Cmd + Shift + G` | Ungroup selected group |
| `Delete` | Delete selected group (with confirmation) |

---

## 6. State Management

### 6.1 Zustand Store Updates

**graphStore.ts:**

```typescript
interface GraphState {
  // ... existing properties
  groups: Group[];
}

interface GraphActions {
  // ... existing actions
  addGroup: (group: Group) => void;
  updateGroup: (id: string, updates: Partial<GroupData>) => void;
  deleteGroup: (id: string) => void;
  addActorToGroup: (actorId: string, groupId: string) => void;
  removeActorFromGroup: (actorId: string, groupId: string) => void;
  setGroups: (groups: Group[]) => void;
}
```

**Implementation Notes:**
- Groups stored separately from nodes/edges
- React Flow renders groups as custom "parent" nodes
- Actors in groups have `parentNode: groupId` property
- Use `useGraphWithHistory()` for all mutations (undo/redo support)

### 6.2 History Integration

**History Descriptions:**
- "Create Group [Name]"
- "Rename Group [Old] → [New]"
- "Collapse Group [Name]"
- "Expand Group [Name]"
- "Add Actor to Group [Name]"
- "Remove Actor from Group [Name]"
- "Ungroup [Name]"
- "Delete Group [Name]"

**Undo/Redo Behavior:**
- Creating group: Undo removes group, actors return to original positions
- Collapsing: Undo expands group
- Ungrouping: Undo re-creates group with same members
- Deleting: Undo restores group and all actors

### 6.3 React Flow Integration

**Parent-Child Nodes:**
- React Flow supports parent nodes natively
- Actors in group have `parentNode` property set to group ID
- React Flow calculates group bounds automatically
- Use `extent: 'parent'` to constrain actors within group

**Custom Node Type for Groups:**
```typescript
// src/components/Nodes/GroupNode.tsx
const GroupNode = ({ data, selected }: NodeProps<GroupData>) => {
  // Render group container
  // Header with collapse button, name, controls
  // Background with padding
  // Handle expand/collapse state
};

export default memo(GroupNode);
```

**Node Types Registration:**
```typescript
const nodeTypes: NodeTypes = useMemo(
  () => ({
    custom: CustomNode,      // Existing actor nodes
    group: GroupNode,        // NEW: Group container nodes
  }),
  [],
);
```

---

## 7. Edge Cases & Constraints

### 7.1 Constraints

1. **Minimum Group Size**: Must contain at least 2 actors
2. **No Nested Groups**: Groups cannot contain other groups (may be future enhancement)
3. **No Partial Overlap**: Actor can only belong to one group at a time
4. **Group Name Length**: Max 50 characters
5. **Selection Limit**: No limit on actors per group, but UI should warn if >20 actors

### 7.2 Edge Cases

#### Case 1: Creating Group with Single Actor
- **Behavior**: "Create Group" option disabled in context menu
- **Feedback**: Tooltip shows "Select 2 or more actors to create a group"

#### Case 2: Collapsing Group with External Relations
- **Behavior**: Relations re-route to group boundary
- **Display**: Edge label shows source actor: "collaborates (Alice)"
- **Re-expanding**: Relations return to original actor

#### Case 3: Deleting Actor Inside Group
- **Behavior**: Actor removed from group member list
- **If only 1 actor left**: Prompt user: "Only 1 actor remaining. Ungroup or add more actors?"
  - Auto-ungroup if user deletes second-to-last actor

#### Case 4: Moving Actor via Drag (Inside Group)
- **Behavior**: Actor moves within group bounds
- **Constraint**: Cannot drag outside group (use remove from group action instead)
- **Alternative**: Allow drag outside → Auto-removes from group (needs clear visual feedback)

#### Case 5: Undo After Deleting Actor in Group
- **Behavior**: Undo restores actor to group
- **Challenge**: Maintain group membership in history

#### Case 6: Group with No Name
- **Behavior**: Use default name "Group 1", "Group 2", etc.
- **Auto-increment**: Based on existing groups

#### Case 7: Searching/Filtering with Collapsed Groups
- **Behavior**: If search matches actor inside collapsed group:
  - Auto-expand group to show matching actor
  - OR: Highlight collapsed group with badge "2 matches inside"
- **Recommendation**: Auto-expand (simpler UX)

#### Case 8: Exporting Graph with Groups
- **JSON Export**: Include groups array in exported data
- **PNG/SVG Export**: Render groups visually (expanded or collapsed based on current state)

---

## 8. Implementation Considerations

### 8.1 Component Structure

**New Components:**
```
src/components/
├── Nodes/
│   ├── GroupNode.tsx              # NEW: Group container component
│   └── CustomNode.tsx             # Update: Support parentNode
├── Panels/
│   ├── GroupEditorPanel.tsx       # NEW: Group properties editor
│   ├── LeftPanel.tsx              # Update: Add "Organization" section
│   └── RightPanel.tsx             # Update: Route to GroupEditorPanel
├── Config/
│   └── GroupConfig.tsx            # NEW: (Optional) Manage group presets
└── Common/
    └── GroupBadge.tsx             # NEW: Actor count badge component
```

### 8.2 React Flow Configuration

**Parent Node Setup:**
```typescript
// When creating group
const groupNode: Group = {
  id: generateId(),
  type: 'group',
  position: { x: minX - 20, y: minY - 50 }, // Offset for padding
  data: {
    label: groupName,
    color: selectedColor,
    collapsed: false,
    actorIds: selectedActorIds,
  },
};

// Update actors to be children
const updatedActors = selectedActors.map(actor => ({
  ...actor,
  parentNode: groupNode.id,
  extent: 'parent' as const,
  // Keep relative position
  position: {
    x: actor.position.x - groupNode.position.x,
    y: actor.position.y - groupNode.position.y,
  },
}));
```

**ReactFlow Props:**
```typescript
<ReactFlow
  nodes={[...nodes, ...groups]}  // Groups are rendered as nodes
  edges={edges}
  nodeTypes={{ custom: CustomNode, group: GroupNode }}
  // ... other props
/>
```

### 8.3 Collapse/Expand Logic

**Collapse Transition:**
1. Save current actor positions (for undo)
2. Set `group.data.collapsed = true`
3. Set all actors in group to `hidden: true`
4. Calculate collapsed group dimensions (fixed 240×80)
5. Re-route external edges to group boundary
6. Animate transition (300ms)

**Expand Transition:**
1. Set `group.data.collapsed = false`
2. Calculate expanded group dimensions (bounding box + padding)
3. Set all actors in group to `hidden: false`
4. Restore actor positions (relative to group)
5. Re-route edges back to specific actors
6. Animate transition (300ms)

### 8.4 Edge Routing for Collapsed Groups

**Challenge:** When group is collapsed, edges need to connect to group boundary instead of hidden actors.

**Solution:**
- Create virtual handles on collapsed group node (top, right, bottom, left)
- Calculate closest handle to external node
- Update edge source/target to group handle when collapsed
- Restore original actor handle when expanded

**Custom Edge Logic:**
```typescript
// In CustomEdge.tsx
const sourceNode = nodes.find(n => n.id === source);
const isSourceCollapsedGroup =
  sourceNode?.type === 'group' && sourceNode.data.collapsed;

if (isSourceCollapsedGroup) {
  // Find original actor from edge metadata
  const originalActorId = edge.data?.sourceActorId;
  // Show label with actor name
  edgeLabel = `${edge.data.label} (${originalActorName})`;
}
```

### 8.5 Performance Considerations

**Optimization Strategies:**
1. **Memoization**: Memo GroupNode component
2. **Collapsed Rendering**: Don't render hidden actors in DOM (use `hidden: true`)
3. **Lazy Expansion**: Only calculate positions when expanding
4. **Debounced Updates**: Group property edits debounced to 500ms
5. **Batch Operations**: Group creation updates all actors in single transaction

**Expected Performance:**
- 100+ actors: No noticeable lag
- 10+ groups: Smooth interactions
- Collapse/Expand: <300ms animation

---

## 9. Future Enhancements

### Phase 2 Features (Out of Scope for MVP)

1. **Nested Groups**: Groups inside groups (tree hierarchy)
2. **Group Templates**: Save/load group configurations
3. **Auto-Grouping**: ML-based clustering suggestions
4. **Group Layouts**: Auto-arrange actors within group (grid, circle, tree)
5. **Group Styles**: Custom border styles, background patterns
6. **Minimap Integration**: Show groups as colored regions in minimap
7. **Swimlanes**: Horizontal/vertical lanes for process flows
8. **Group Permissions**: Lock/unlock groups to prevent edits
9. **Group Notes**: Rich text annotations for groups
10. **Import/Export Groups**: Reuse group structures across documents

### Design System Evolution

**Potential Additions:**
- Group color presets (beyond 6 default colors)
- Group icon library (similar to actor icons)
- Group shapes (rounded, rectangular, pill-shaped)
- Border style options (solid, dashed, dotted, double)

### Accessibility Improvements

- Screen reader announcements for group operations
- Keyboard navigation between groups (Tab key)
- High contrast mode support
- Reduced motion option for collapse/expand animations

---

## 10. Appendix

### 10.1 Design Alignment Checklist

**Visual Consistency:**
- ✅ Uses Tailwind CSS utility classes
- ✅ Material-UI IconButton components
- ✅ Consistent spacing (padding-3, padding-16)
- ✅ Consistent typography (text-sm, font-semibold)
- ✅ Consistent colors (gray-50, gray-200, blue-500)

**Interaction Patterns:**
- ✅ Context menus for quick actions
- ✅ Right panel for detailed editing
- ✅ Collapsible sections
- ✅ Confirmation dialogs for destructive actions
- ✅ Debounced live updates (500ms)

**State Management:**
- ✅ Zustand for global state
- ✅ `useGraphWithHistory()` for mutations
- ✅ Per-document history tracking
- ✅ LocalStorage persistence via workspace

### 10.2 Color Palette Reference

**Group Background Colors (RGBA):**
```css
--group-blue: rgba(59, 130, 246, 0.08);
--group-green: rgba(16, 185, 129, 0.08);
--group-orange: rgba(245, 158, 11, 0.08);
--group-purple: rgba(139, 92, 246, 0.08);
--group-pink: rgba(236, 72, 153, 0.08);
--group-teal: rgba(20, 184, 166, 0.08);
```

**Border Colors (Same as background, but with 0.4 opacity):**
```css
--group-border-blue: rgba(59, 130, 246, 0.4);
--group-border-green: rgba(16, 185, 129, 0.4);
/* etc. */
```

### 10.3 Component Hierarchy Diagram

```
GraphEditor
├── ReactFlow
│   ├── CustomNode (Actor)
│   │   └── NodeShapeRenderer
│   ├── GroupNode (NEW)           ← NEW COMPONENT
│   │   ├── GroupHeader
│   │   │   ├── CollapseButton
│   │   │   ├── NameLabel
│   │   │   ├── EditButton
│   │   │   └── DeleteButton
│   │   └── GroupContent (when expanded)
│   │       └── [Contained CustomNode children]
│   └── CustomEdge (Relation)
│       └── [Updated to handle group edges]
└── RightPanel
    ├── GraphAnalysisPanel
    ├── NodeEditorPanel
    ├── EdgeEditorPanel
    └── GroupEditorPanel (NEW)     ← NEW COMPONENT
```

### 10.4 User Flow Diagrams

**Creating a Group Flow:**
```
[Select Multiple Actors]
        ↓
[Right-Click Selected Actor]
        ↓
[Context Menu: "Group Selected Actors"]
        ↓
[Input Dialog: "Enter Group Name"]
        ↓
[Create Group with Default Color]
        ↓
[Group Appears (Expanded)]
        ↓
[Select Group → Edit Properties in Right Panel]
```

**Collapsing a Group Flow:**
```
[Group Visible (Expanded)]
        ↓
[Click Collapse Button in Header]
        ↓
[Animation: Actors Fade Out (300ms)]
        ↓
[Group Shows Collapsed View]
        ↓
[External Relations Re-route to Group Boundary]
        ↓
[Summary Badges Show Actor/Relation Counts]
```

---

## Conclusion

This UX concept provides a comprehensive design for Actor Grouping in Constellation Analyzer. The feature integrates seamlessly with the existing application architecture, following established patterns for visual design, interaction, and state management.

**Key Design Decisions:**
1. **Parent-Child Nodes**: Leverage React Flow's parent node feature for natural containment
2. **Collapse as Primary View**: Groups can be collapsed to reduce clutter (primary use case)
3. **Non-Destructive Operations**: Grouping and ungrouping preserve all data
4. **Consistent UI Patterns**: Reuse existing components (InputDialog, ConfirmDialog, Right Panel)
5. **History Integration**: Full undo/redo support via `useGraphWithHistory()`

**Next Steps:**
1. Review and approve UX concept
2. Create detailed technical implementation plan
3. Implement core grouping functionality (create, expand/collapse)
4. Implement group editing (right panel, properties)
5. Implement advanced features (drag-to-group, edge routing)
6. Testing and refinement

---

**Document Metadata:**
- **Author**: Claude Code
- **Version**: 1.0
- **Last Updated**: 2025-10-17
- **Status**: Draft for Review
