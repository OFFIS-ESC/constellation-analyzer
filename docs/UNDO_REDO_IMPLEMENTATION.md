# Undo/Redo System Implementation

## Overview

The Constellation Analyzer features a comprehensive **document-level** undo/redo system that allows users to safely experiment with their graphs and timeline states without fear of permanent mistakes.

**Key Features:**
- ✅ **Document-Level History**: Each document maintains a single unified undo/redo stack (max 50 actions)
- ✅ **Complete State Tracking**: Captures entire document state (timeline + all states + types)
- ✅ **Timeline Operations**: Undo/redo create state, delete state, switch state, rename state
- ✅ **Graph Operations**: Undo/redo node/edge add/delete/move operations
- ✅ **Type Configuration**: Undo/redo changes to node/edge types
- ✅ **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y or Ctrl+Shift+Z (redo)
- ✅ **Visual UI**: Undo/Redo buttons in toolbar with disabled states and tooltips
- ✅ **Action Descriptions**: Hover tooltips show what action will be undone/redone
- ✅ **Debounced Moves**: Node dragging is debounced to avoid cluttering history
- ✅ **Document Switching**: History is preserved when switching between documents

## Architecture

### 1. History Store (`src/stores/historyStore.ts`)

The central store manages history for all documents with **complete document snapshots**:

```typescript
{
  histories: Map<documentId, DocumentHistory>
  maxHistorySize: 50
}
```

Each `DocumentHistory` contains:
- `undoStack`: Array of past document states (most recent at end)
- `redoStack`: Array of undone document states that can be redone

Each `DocumentSnapshot` contains:
```typescript
{
  timeline: {
    states: Map<StateId, ConstellationState>  // ALL timeline states
    currentStateId: StateId                   // Which state is active
    rootStateId: StateId                      // Root state ID
  }
  nodeTypes: NodeTypeConfig[]                 // Global node types
  edgeTypes: EdgeTypeConfig[]                 // Global edge types
}
```

**Key Methods:**
- `pushAction(documentId, action)`: Records complete document snapshot
- `undo(documentId)`: Reverts to previous document state
- `redo(documentId)`: Restores undone document state
- `canUndo/canRedo(documentId)`: Check if actions available
- `initializeHistory(documentId)`: Setup history for new document
- `removeHistory(documentId)`: Clean up when document deleted

### 2. Document History Hook (`src/hooks/useDocumentHistory.ts`)

Provides high-level undo/redo functionality for the active document:

```typescript
const { undo, redo, canUndo, canRedo, undoDescription, redoDescription, pushToHistory } = useDocumentHistory();
```

**Responsibilities:**
- Initializes history when document is first loaded
- Provides `pushToHistory(description)` to record complete document snapshots
- Handles undo/redo by restoring:
  - Complete timeline structure (all states)
  - Current timeline state
  - Global node/edge types
  - Current state's graph (nodes and edges)
- Marks documents as dirty after undo/redo
- Triggers auto-save after changes

### 3. Graph Operations with History (`src/hooks/useGraphWithHistory.ts`)

**OPTIONAL WRAPPER**: This hook wraps all graph operations with automatic history tracking.

```typescript
const { addNode, updateNode, deleteNode, addEdge, ... } = useGraphWithHistory();
```

Features:
- Debounces node position changes (500ms) to avoid cluttering history during dragging
- Immediate history push for add/delete operations
- Smart action descriptions (e.g., "Add Person Actor", "Delete Collaborates Relation")
- Prevents recursive history pushes during undo/redo restore

**Note:** This is an alternative to manually calling `pushToHistory()` after each operation.

### 4. Keyboard Shortcuts (`src/hooks/useKeyboardShortcuts.ts`)

Extended to support undo/redo:

```typescript
useKeyboardShortcuts({
  onUndo: undo,
  onRedo: redo,
  // ... other shortcuts
});
```

Handles:
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y`: Redo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z`: Alternative redo

### 5. Toolbar UI (`src/components/Toolbar/Toolbar.tsx`)

Displays undo/redo buttons with visual feedback:

- **Undo Button**: Shows "Undo: [action description] (Ctrl+Z)" on hover
- **Redo Button**: Shows "Redo: [action description] (Ctrl+Y)" on hover
- Buttons are disabled (grayed out) when no actions available
- Uses Material-UI icons (UndoIcon, RedoIcon)

### 6. App Integration (`src/App.tsx`)

Connects keyboard shortcuts to undo/redo functionality:

```typescript
const { undo, redo } = useDocumentHistory();

useKeyboardShortcuts({
  onUndo: undo,
  onRedo: redo,
});
```

## Usage

### Option A: Manual History Tracking

Components can manually record actions:

```typescript
import { useDocumentHistory } from '../hooks/useDocumentHistory';

function MyComponent() {
  const { pushToHistory } = useDocumentHistory();
  const graphStore = useGraphStore();

  const handleAddNode = () => {
    graphStore.addNode(newNode);
    pushToHistory('Add Person Actor');
  };
}
```

### Option B: Automatic with useGraphWithHistory

Replace `useGraphStore()` with `useGraphWithHistory()`:

```typescript
import { useGraphWithHistory } from '../hooks/useGraphWithHistory';

function MyComponent() {
  const { addNode } = useGraphWithHistory();

  const handleAddNode = () => {
    addNode(newNode); // Automatically tracked!
  };
}
```

### Current Implementation

The current codebase uses **Option A** (manual tracking). Components like `GraphEditor` and `Toolbar` use `useGraphStore()` directly.

To enable automatic tracking, update components to use `useGraphWithHistory()` instead of `useGraphStore()`.

### 4. Timeline Operations with History (`src/stores/timelineStore.ts`)

**All timeline operations automatically record history:**

Tracked operations:
- `createState(label)`: Creates new timeline state → "Create State: Feature A"
- `switchToState(stateId)`: Switches to different state → "Switch to State: Initial State"
- `deleteState(stateId)`: Deletes timeline state → "Delete State: Old Design"
- `updateState(stateId, updates)`: Renames or updates state → "Rename State: Draft → Final"
- `duplicateState(stateId)`: Duplicates state → "Duplicate State: Copy"
- `duplicateStateAsChild(stateId)`: Duplicates as child → "Duplicate State as Child: Version 2"

Each operation calls `pushDocumentHistory()` helper before making changes.

## How It Works: Undo/Redo Flow

### Recording an Action

1. User performs action (e.g., "adds a node" or "creates a timeline state")
2. `pushToHistory('Add Person Actor')` or `pushDocumentHistory('Create State: Feature A')` is called
3. **Complete document state** is snapshotted:
   - Entire timeline (all states)
   - Current state ID
   - Global node/edge types
4. Snapshot is pushed to `undoStack`
5. `redoStack` is cleared (since new action invalidates redo)

### Performing Undo

1. User presses Ctrl+Z or clicks Undo button
2. Last document snapshot is popped from `undoStack`
3. Current document state is pushed to `redoStack`
4. Previous document state is restored:
   - Timeline structure loaded into timelineStore
   - Types loaded into graphStore
   - Current state's graph loaded into graphStore
5. Document marked as dirty and auto-saved

### Performing Redo

1. User presses Ctrl+Y or clicks Redo button
2. Last undone snapshot is popped from `redoStack`
3. Current document state is pushed to `undoStack`
4. Future document state is restored (same process as undo)
5. Document marked as dirty and auto-saved

## Per-Document Independence

**Critical Feature:** Each document has completely separate history.

Example workflow:
1. Document A: Add 3 nodes, create timeline state "Feature X"
2. Switch to Document B: Add 2 edges, switch to "Design 2" state
3. Switch back to Document A: Can undo timeline state creation AND node additions
4. Switch back to Document B: Can undo state switch AND edge additions

History stacks are **preserved** across document switches and **remain independent**.

## What Can Be Undone?

### Graph Operations (within current state)
- Add/delete/move nodes
- Add/delete/update edges
- Add/delete/update node types
- Add/delete/update edge types
- Clear graph

### Timeline Operations (NEW!)
- Create new timeline state
- Delete timeline state
- Switch between timeline states
- Rename timeline state
- Duplicate timeline state

### Examples

**Example 1: Undoing Timeline Creation**
1. Create state "Feature A" → switches to it
2. Add some nodes in "Feature A"
3. Press Ctrl+Z → nodes are undone
4. Press Ctrl+Z again → "Feature A" state is deleted, returns to previous state

**Example 2: Undoing State Switch**
1. Currently in "Initial State"
2. Switch to "Design 2" state
3. Press Ctrl+Z → switches back to "Initial State"

**Example 3: Mixed Operations**
1. Add node "Person 1"
2. Create state "Scenario A"
3. Add node "Person 2" in "Scenario A"
4. Press Ctrl+Z → "Person 2" is undone
5. Press Ctrl+Z → "Scenario A" state is deleted
6. Press Ctrl+Z → "Person 1" is undone

## Performance Considerations

### Memory Management

- Max 50 actions per document (configurable via `MAX_HISTORY_SIZE`)
- Old actions are automatically removed when limit exceeded
- History is removed when document is deleted
- Document states use deep cloning to prevent mutation issues

### Debouncing

- Node position updates are debounced (500ms) to group multiple moves
- Add/delete operations are immediate (0ms delay)
- Prevents hundreds of history entries when dragging nodes

## Testing Checklist

- [x] Create history store
- [x] Create useDocumentHistory hook
- [x] Add keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
- [x] Add undo/redo buttons to toolbar
- [x] Show action descriptions in tooltips
- [x] Disable buttons when no actions available
- [ ] Test: Add node → Undo → Node disappears
- [ ] Test: Delete node → Undo → Node reappears with connections
- [ ] Test: Move node → Undo → Node returns to original position
- [ ] Test: Add edge → Undo → Edge disappears
- [ ] Test: Update node properties → Undo → Properties restored
- [ ] Test: Multiple operations → Undo multiple times → Redo multiple times
- [ ] Test: Document A changes → Switch to Document B → Changes independent
- [ ] Test: 51 actions → Oldest action removed from history
- [ ] Test: Undo then new action → Redo stack cleared
- [ ] Test: Keyboard shortcuts work (Ctrl+Z, Ctrl+Y)

## Future Enhancements

1. **History Panel**: Show list of all actions with ability to jump to specific point
2. **Persistent History**: Save history to localStorage (survives page refresh)
3. **Collaborative Undo**: Undo operations in multi-user scenarios
4. **Selective Undo**: Undo specific actions, not just chronological
5. **History Branching**: Tree-based history (like Git) instead of linear
6. **Action Grouping**: Combine related actions (e.g., "Add 5 nodes" instead of 5 separate entries)
7. **Undo Metadata**: Store viewport position, selection state with each action
8. **History Analytics**: Track most common actions, undo patterns

## Implementation Notes

### Why Deep Cloning?

Document states are deep cloned using `JSON.parse(JSON.stringify())` to prevent mutation:

```typescript
const snapshot = JSON.parse(JSON.stringify(currentDoc));
```

This ensures that modifying the current state doesn't affect historical snapshots.

### Why Separate undoStack and redoStack?

Standard undo/redo pattern:
- **undoStack**: Stores past states
- **redoStack**: Stores undone states that can be restored

When a new action occurs, redoStack is cleared because the "future" is no longer valid.

### Why Per-Document History?

Users expect each document to maintain independent history, similar to:
- Text editors (each file has own undo stack)
- Image editors (each image has own history)
- IDEs (each file has own history)

This matches user mental model and prevents confusion.

## File Structure

```
src/
├── stores/
│   └── historyStore.ts              # Central history management
├── hooks/
│   ├── useDocumentHistory.ts        # Per-document undo/redo
│   ├── useGraphWithHistory.ts       # Automatic history tracking wrapper
│   └── useKeyboardShortcuts.ts      # Keyboard shortcuts (extended)
├── components/
│   └── Toolbar/
│       └── Toolbar.tsx              # UI buttons for undo/redo
└── App.tsx                          # Connects keyboard shortcuts

```

## Conclusion

The undo/redo system provides a safety net for users, encouraging experimentation without fear of permanent mistakes. Each document maintains independent history, operations are automatically tracked, and the UI provides clear feedback about available undo/redo actions.

**Status:** ✅ Implementation Complete (Ready for Testing)

---

**Implemented:** 2025-10-09
**Based on:** UX_ANALYSIS.md recommendations (Priority: CRITICAL)
