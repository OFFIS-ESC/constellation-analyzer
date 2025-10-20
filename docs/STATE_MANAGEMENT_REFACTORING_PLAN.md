# State Management & Persistence Refactoring Plan

**Document Version:** 1.0
**Date:** 2025-10-20
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive analysis of the Constellation Analyzer's state management and persistence layer, identifying key issues and providing a detailed, phased refactoring plan.

**Overall Assessment:** B+ (Good, with room for improvement)

The system has a solid architectural foundation with sophisticated multi-document workspace management, per-document undo/redo, and timeline branching. However, there are opportunities to reduce technical debt, eliminate code duplication, improve atomicity, and fix minor bugs.

---

## Table of Contents

1. [Strengths](#strengths)
2. [Critical Issues](#critical-issues)
3. [Duplication Analysis](#duplication-analysis)
4. [Atomicity Review](#atomicity-review)
5. [Refactoring Plan](#refactoring-plan)
6. [Testing Strategy](#testing-strategy)
7. [Execution Order](#execution-order)
8. [Metrics & Success Criteria](#metrics--success-criteria)
9. [Risks & Mitigation](#risks--mitigation)

---

## Strengths

### 1. Solid Architecture Patterns

- **Per-document isolation**: Each document has independent history, timeline, and types
- **Atomic updates**: Uses `loadGraphState()` and `flushSync()` to prevent React Flow race conditions
- **Memory optimization**: Unloads inactive documents after 5 minutes
- **Security**: Implements `safeStringify()` to filter dangerous properties like `__proto__`

### 2. Correct Undo/Redo Implementation

- **Document snapshots**: Captures complete timeline + types + labels in `historyStore.ts:112-164`
- **Bidirectional stacks**: Properly manages undo/redo stacks with max size (50)
- **Deep cloning**: Uses JSON serialization with Map reconstruction
- **Cross-contamination prevention**: `useActiveDocument.ts:148-159` prevents stale data issues

### 3. History Tracking Pattern

- **Hook-based abstraction**: `useGraphWithHistory` wraps all mutations
- **Debouncing**: Position updates debounced 500ms to reduce history clutter
- **Descriptive actions**: Good human-readable descriptions (e.g., "Add Person Actor")

---

## Critical Issues

### Issue #1: Legacy Persistence Files (MOSTLY UNUSED)

**Location:** `src/stores/persistence/loader.ts`, `src/stores/persistence/saver.ts`

#### Problem

These files are legacy code from the old single-document system. They're only used for:

1. **Migration**: `migration.ts:23` calls `loadDocument()`
2. **Initial graphStore load**: `graphStore.ts:57` calls `loadGraphState()`
3. **Document extraction**: `useActiveDocument.ts:73` calls `getCurrentGraphFromDocument()`

The actual document persistence now happens in **`workspace/persistence.ts`**, making most of loader/saver redundant.

#### Impact

- Code duplication between old and new persistence layers
- Confusion about which functions to use
- Technical debt accumulation (~350 lines)

#### Evidence

```typescript
// loader.ts:95-123 - loadDocument() only used in migration
// saver.ts:106-120 - saveDocument() marked as "legacy for migration only"
// workspaceStore.ts uses saveDocumentToStorage() from workspace/persistence.ts instead
```

---

### Issue #2: Document State Synchronization Complexity

#### Problem

Document state exists in **3 places** with complex sync logic:

1. **`ConstellationDocument`** (persistent) - source of truth
2. **`graphStore`** (transient) - working copy for React Flow
3. **`timelineStore`** (transient) - timeline states

#### Sync Points

| Sync Point | Location | Purpose |
|------------|----------|---------|
| Document load → graphStore | `useActiveDocument.ts:68-135` | Load graph for editing |
| graphStore → timeline | `useActiveDocument.ts:185-189` | Save changes to current state |
| graphStore → document types | `workspaceStore.ts:1000-1002` | Sync type changes |
| timeline → document | `workspaceStore.ts:810-825` | Save timeline on document save |
| timeline → graphStore | `timelineStore.ts:216-223` | Load state on switch |

#### Impact

- **Potential race conditions** if sync order is wrong
- **Hard to reason about** which store has current truth
- **Easy to miss sync points** when adding features

#### Evidence

```typescript
// useDocumentHistory.ts:65-75 - Must sync timeline BEFORE capturing snapshot
// useActiveDocument.ts:148-159 - Complex guards to prevent cross-doc contamination
// workspaceStore.ts:806 - Comments warn: "document is source of truth"
```

---

### Issue #3: Duplicate History Pushing in timelineStore

**Location:** `timelineStore.ts:37-64`

#### Problem

`timelineStore.ts` has a helper function `pushDocumentHistory()` that **duplicates logic** from `useDocumentHistory.pushToHistory()`:

```typescript
// timelineStore.ts:37-64
function pushDocumentHistory(documentId: string, description: string) {
  // Duplicates snapshot creation from useDocumentHistory.ts:79-88
  const snapshot: DocumentSnapshot = {
    timeline: { states: new Map(timeline.states), ... },
    nodeTypes: graphStore.nodeTypes,  // ⚠️ Should read from document!
    edgeTypes: graphStore.edgeTypes,  // ⚠️ Should read from document!
    labels: graphStore.labels,        // ⚠️ Should read from document!
  };
}
```

**Timeline operations** call this helper 8 times (`createState`, `switchToState`, `updateState`, `deleteState`, `duplicateState`, `duplicateStateAsChild`).

#### Impact

- **Inconsistent snapshot capture**: `useDocumentHistory` reads types from `activeDoc`, but `pushDocumentHistory` reads from `graphStore`
- **Maintenance burden**: Changes to snapshot logic must be applied in 2 places
- **Potential bugs**: If graphStore and document types are out of sync

---

### Issue #4: Missing Atomicity in Type Management

**Location:** `workspaceStore.ts:981-1257`

#### Problem

Type management operations (add/update/delete types) have **4 separate operations**:

```typescript
addNodeTypeToDocument: (documentId, nodeType) => {
  doc.nodeTypes = [...doc.nodeTypes, nodeType];  // 1. Update document
  saveDocumentToStorage(documentId, doc);         // 2. Save to localStorage
  get().markDocumentDirty(documentId);            // 3. Mark dirty
  if (documentId === state.activeDocumentId) {
    useGraphStore.getState().setNodeTypes(doc.nodeTypes);  // 4. Sync to graphStore
  }
}
```

If any step fails, state becomes inconsistent.

#### Impact

- **Potential for partial updates** if localStorage quota is exceeded
- **No rollback mechanism** on failure
- **Race conditions** if multiple type operations happen rapidly

---

### Issue #5: createGroupWithActors History Timing Issue

**Location:** `useGraphWithHistory.ts:439-472`

#### Problem

`createGroupWithActors()` pushes history **AFTER** mutations:

```typescript
createGroupWithActors: (...) => {
  graphStore.addGroup(group);           // Mutation 1
  graphStore.setNodes(updatedNodes);    // Mutation 2
  pushToHistory(`Create Group: ${group.data.label}`);  // ❌ History pushed AFTER
}
```

This violates the pattern used everywhere else (push BEFORE mutation).

#### Impact

- **Incorrect undo behavior**: Undo will restore the state that *includes* the group, not the state before it
- **Inconsistent with other operations**: All other operations push before mutation
- **Hard to debug**: Undo behavior differs from expectations

---

## Duplication Analysis

### Code Duplication Summary

| Duplication Type | Locations | Lines | Impact |
|------------------|-----------|-------|---------|
| **Document snapshot creation** | `useDocumentHistory.ts:79-88`, `timelineStore.ts:48-57` | 20 | High - inconsistent logic |
| **Type sync to graphStore** | `workspaceStore.ts:1000-1002`, `1026-1028`, `1050-1052`, `1074-1076`, `1100-1102`, `1124-1126` | 30 | Medium - repetitive |
| **Label sync to graphStore** | `workspaceStore.ts:1154-1156`, `1185-1187`, `1255-1256` | 15 | Medium - repetitive |
| **Graph loading pattern** | `useDocumentHistory.ts:169-177`, `timelineStore.ts:216-223`, `288-296` | 30 | Medium - similar logic |
| **Serialization helpers** | `saver.ts:11-48`, `workspace/persistence.ts` (embedded) | 40 | Low - kept separate intentionally |

### Legacy Code Summary

| File | Purpose | Current Usage | Recommendation |
|------|---------|---------------|----------------|
| **persistence/loader.ts** | Load from old single-doc format | Migration only (`migration.ts:23`) | ⚠️ Mark as deprecated, extract `getCurrentGraphFromDocument` |
| **persistence/saver.ts** | Save to old single-doc format | Migration only (`saver.ts:106`) | ⚠️ Mark as deprecated, extract `createDocument` |
| **persistence/constants.ts** | Storage keys | Mixed (legacy + migration) | ⚠️ Split legacy vs. workspace keys |
| **persistence/types.ts** | Type definitions | Active (used by workspace too) | ✅ Keep - types still used |
| **persistence/fileIO.ts** | Import/export JSON files | Active | ✅ Keep - still needed |

---

## Atomicity Review

### ✅ Operations with Good Atomicity

1. **`graphStore.loadGraphState()`** (`graphStore.ts:470-496`)
   - Single `set()` call updates all state atomically
   - Prevents React Flow "Parent node not found" errors

2. **Undo/Redo restoration** (`useDocumentHistory.ts:165-178`, `256-268`)
   - Uses `flushSync()` to force immediate React processing
   - Atomic `loadGraphState()` prevents intermediate states

3. **Document save** (`workspaceStore.ts:799-849`)
   - Timeline serialization happens before storage write
   - Bibliography sync happens before storage write

### ⚠️ Operations Lacking Atomicity

1. **Type management** (`workspaceStore.ts:981-1257`)
   - **Issue**: 4 separate operations (update doc, save, mark dirty, sync)
   - **Solution**: Wrap in transaction pattern or rollback on failure

2. **Label deletion from timeline states** (`workspaceStore.ts:1208-1245`)
   - **Issue**: Iterates through all states, modifying in-place
   - **Issue**: If error occurs mid-iteration, some states cleaned, others not
   - **Solution**: Build new timeline structure first, then swap atomically

3. **Document import** (`workspaceStore.ts:613-689`)
   - **Issue**: Multiple storage writes (document, metadata, workspace state)
   - **Issue**: If browser crashes mid-import, partial state
   - **Solution**: Validate all data first, then batch writes

---

## Refactoring Plan

### Phase 1: Reduce Legacy Code (Low Risk)

#### Step 1.1: Extract Active Functions from loader.ts

**Goal**: Move still-used functions to workspace layer

**Actions**:

```typescript
// Create: src/stores/workspace/documentUtils.ts
export { getCurrentGraphFromDocument } from '../persistence/loader';
export { deserializeGraphState } from '../persistence/loader';

// Mark deprecated in loader.ts:
/** @deprecated Only used for migration. Use workspace/documentUtils.ts instead */
export function loadDocument() { ... }
```

**Impact**: ✅ Safe - no behavior change
**Files Changed**: 3 (new file + loader.ts + imports)
**Effort**: 2 hours

---

#### Step 1.2: Extract Active Functions from saver.ts

**Goal**: Move `createDocument()` helper to workspace layer

**Actions**:

```typescript
// Create: src/stores/workspace/documentFactory.ts
export function createDocument(...) { ... }  // Moved from saver.ts:57-101

// Mark deprecated in saver.ts:
/** @deprecated Only used for migration. Use workspace/documentFactory.ts instead */
export function saveDocument() { ... }
```

**Impact**: ✅ Safe - no behavior change
**Files Changed**: 3 (new file + saver.ts + workspaceStore.ts import)
**Effort**: 2 hours

---

#### Step 1.3: Consolidate Storage Keys

**Goal**: Separate legacy migration keys from active workspace keys

**Actions**:

```typescript
// In persistence/constants.ts - mark legacy section:
/** @deprecated Legacy single-document keys - only for migration */
export const LEGACY_KEYS = {
  GRAPH_STATE: 'constellation:graph-state:v1',
  LAST_SAVED: 'constellation:lastSaved',
} as const;

// Move workspace keys to workspace/persistence.ts (already there)
```

**Impact**: ✅ Safe - improves code organization
**Files Changed**: 2 (constants.ts + migration.ts import)
**Effort**: 1 hour

---

### Phase 2: Eliminate Duplicate History Logic (Medium Risk)

#### Step 2.1: Centralize Snapshot Creation

**Goal**: Single source of truth for DocumentSnapshot creation

**Actions**:

```typescript
// In useDocumentHistory.ts - extract to helper:
function createDocumentSnapshot(documentId: string): DocumentSnapshot | null {
  const workspaceStore = useWorkspaceStore.getState();
  const timelineStore = useTimelineStore.getState();
  const activeDoc = workspaceStore.getActiveDocument();
  const timeline = timelineStore.timelines.get(documentId);

  if (!timeline || !activeDoc) return null;

  // Sync timeline's current state with graphStore FIRST
  const currentState = timeline.states.get(timeline.currentStateId);
  if (currentState) {
    const graphStore = useGraphStore.getState();
    currentState.graph = {
      nodes: graphStore.nodes as unknown as typeof currentState.graph.nodes,
      edges: graphStore.edges as unknown as typeof currentState.graph.edges,
      groups: graphStore.groups as unknown as typeof currentState.graph.groups,
    };
  }

  return {
    timeline: {
      states: new Map(timeline.states),
      currentStateId: timeline.currentStateId,
      rootStateId: timeline.rootStateId,
    },
    nodeTypes: activeDoc.nodeTypes,  // ✅ Read from document (source of truth)
    edgeTypes: activeDoc.edgeTypes,
    labels: activeDoc.labels || [],
  };
}

// Update pushToHistory() to use this:
const pushToHistory = useCallback(
  (description: string) => {
    if (!activeDocumentId) {
      console.warn('No active document to record action');
      return;
    }

    const snapshot = createDocumentSnapshot(activeDocumentId);
    if (!snapshot) {
      console.warn('Failed to create snapshot');
      return;
    }

    historyStore.pushAction(activeDocumentId, {
      description,
      timestamp: Date.now(),
      documentState: snapshot,
    });
  },
  [activeDocumentId, historyStore]
);

// Update timelineStore.ts:37-64 to use this:
function pushDocumentHistory(documentId: string, description: string) {
  const snapshot = createDocumentSnapshot(documentId);
  if (!snapshot) {
    console.warn('Failed to create snapshot');
    return;
  }

  useHistoryStore.getState().pushAction(documentId, {
    description,
    timestamp: Date.now(),
    documentState: snapshot,
  });
}
```

**Impact**: ⚠️ **Requires testing** - changes snapshot logic
**Files Changed**: 2 (`useDocumentHistory.ts` + `timelineStore.ts`)
**Testing**: Verify undo/redo works for both graph and timeline operations
**Effort**: 4 hours

---

### Phase 3: Add Type Management Atomicity (Medium Risk)

#### Step 3.1: Create Transaction Pattern for Type Operations

**Goal**: Ensure type operations are atomic or rollback on failure

**Actions**:

```typescript
// In workspaceStore.ts - add transaction helper:
function executeTypeTransaction<T>(
  operation: () => T,
  rollback: () => void,
  operationName: string
): T | null {
  try {
    const result = operation();
    return result;
  } catch (error) {
    console.error(`${operationName} failed:`, error);
    rollback();
    useToastStore.getState().showToast(
      `Failed to ${operationName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'error'
    );
    return null;
  }
}

// Refactor addNodeTypeToDocument:
addNodeTypeToDocument: (documentId, nodeType) => {
  const state = get();
  const doc = state.documents.get(documentId);
  if (!doc) return;

  // Capture rollback state
  const originalNodeTypes = [...doc.nodeTypes];
  const originalIsDirty = state.documentMetadata.get(documentId)?.isDirty;

  executeTypeTransaction(
    () => {
      // 1. Update document
      doc.nodeTypes = [...doc.nodeTypes, nodeType];

      // 2. Save to storage (can throw QuotaExceededError)
      saveDocumentToStorage(documentId, doc);

      // 3. Mark dirty
      get().markDocumentDirty(documentId);

      // 4. Sync to graphStore if active
      if (documentId === state.activeDocumentId) {
        useGraphStore.getState().setNodeTypes(doc.nodeTypes);
      }
    },
    () => {
      // Rollback on failure
      doc.nodeTypes = originalNodeTypes;
      const metadata = state.documentMetadata.get(documentId);
      if (metadata) metadata.isDirty = originalIsDirty ?? false;
    },
    'add node type'
  );
}

// Apply same pattern to:
// - updateNodeTypeInDocument
// - deleteNodeTypeFromDocument
// - addEdgeTypeToDocument
// - updateEdgeTypeInDocument
// - deleteEdgeTypeFromDocument
// - addLabelToDocument
// - updateLabelInDocument
// - deleteLabelFromDocument
```

**Impact**: ⚠️ **Requires testing** - changes error handling
**Files Changed**: 1 (`workspaceStore.ts` - 9 type operations)
**Testing**: Test with quota exceeded, verify rollback works
**Effort**: 6 hours

---

### Phase 4: Fix createGroupWithActors Timing (Low Risk)

#### Step 4.1: Move History Push Before Mutation

**Goal**: Make timing consistent with other operations

**Actions**:

```typescript
// In useGraphWithHistory.ts:439-472 - reorder operations:
const createGroupWithActors = useCallback(
  (
    group: Group,
    _actorIds: string[],
    actorUpdates: Record<string, { position: { x: number; y: number }; parentId: string; extent: 'parent' }>
  ) => {
    if (isRestoringRef.current) {
      graphStore.addGroup(group);
      const updatedNodes = graphStore.nodes.map((node) => {
        const update = actorUpdates[node.id];
        return update ? { ...node, ...update } : node;
      });
      graphStore.setNodes(updatedNodes as Actor[]);
      return;
    }

    // ✅ Push history BEFORE making changes (consistent with other ops)
    pushToHistory(`Create Group: ${group.data.label}`);

    // Add the group first
    graphStore.addGroup(group);

    // Update actors to be children of the group
    const updatedNodes = graphStore.nodes.map((node) => {
      const update = actorUpdates[node.id];
      return update ? { ...node, ...update } : node;
    });

    // Update nodes in store
    graphStore.setNodes(updatedNodes as Actor[]);
  },
  [graphStore, pushToHistory]
);
```

**Impact**: ✅ Safe - improves consistency
**Files Changed**: 1 (`useGraphWithHistory.ts`)
**Testing**: Test group creation + undo to verify correct state restoration
**Effort**: 1 hour

---

### Phase 5: Improve Label Deletion Atomicity (Medium Risk)

#### Step 5.1: Use Immutable Update for Timeline Cleanup

**Goal**: Prevent partial state if error occurs

**Actions**:

```typescript
// In workspaceStore.ts:1208-1245 - refactor to immutable update:
deleteLabelFromDocument: (documentId, labelId) => {
  const state = get();
  const doc = state.documents.get(documentId);
  if (!doc) return;

  // Remove from document's labels
  doc.labels = doc.labels.filter((label) => label.id !== labelId);

  // Clean up timeline - build new timeline structure
  const timelineStore = useTimelineStore.getState();
  const timeline = timelineStore.timelines.get(documentId);

  if (timeline) {
    // ✅ Build new states Map with cleaned labels
    const newStates = new Map();
    let hasChanges = false;

    timeline.states.forEach((constellationState, stateId) => {
      const cleanedState = {
        ...constellationState,
        graph: {
          ...constellationState.graph,
          nodes: constellationState.graph.nodes.map((node) => {
            const nodeData = node.data as { labels?: string[] };
            if (nodeData?.labels?.includes(labelId)) {
              hasChanges = true;
              return {
                ...node,
                data: {
                  ...nodeData,
                  labels: nodeData.labels.filter(id => id !== labelId),
                },
              };
            }
            return node;
          }),
          edges: constellationState.graph.edges.map((edge) => {
            const edgeData = edge.data as { labels?: string[] };
            if (edgeData?.labels?.includes(labelId)) {
              hasChanges = true;
              return {
                ...edge,
                data: {
                  ...edgeData,
                  labels: edgeData.labels.filter(id => id !== labelId),
                },
              };
            }
            return edge;
          }),
        },
      };
      newStates.set(stateId, cleanedState);
    });

    // ✅ Atomic swap - replace entire timeline at once
    if (hasChanges) {
      const newTimeline = {
        ...timeline,
        states: newStates,
      };
      timelineStore.timelines.set(documentId, newTimeline);

      // Sync to graphStore if active
      if (documentId === state.activeDocumentId) {
        const currentState = newStates.get(timeline.currentStateId);
        if (currentState) {
          useGraphStore.setState({
            nodes: currentState.graph.nodes as Actor[],
            edges: currentState.graph.edges as Relation[],
          });
        }
      }
    }
  }

  // Save and mark dirty
  saveDocumentToStorage(documentId, doc);
  get().markDocumentDirty(documentId);

  // Sync labels to graphStore
  if (documentId === state.activeDocumentId) {
    useGraphStore.getState().setLabels(doc.labels);
  }
}
```

**Impact**: ⚠️ **Requires testing** - major refactor of deletion logic
**Files Changed**: 1 (`workspaceStore.ts`)
**Testing**: Test label deletion across multiple timeline states
**Effort**: 4 hours

---

### Phase 6: Documentation & Type Safety (Low Risk)

#### Step 6.1: Add JSDoc for State Sync Points

**Goal**: Make sync relationships explicit

**Actions**:

Add clear documentation comments at each sync point:

```typescript
/**
 * SYNC POINT 1: Document → graphStore
 * When: Document switches (useActiveDocument.ts:68)
 * What: Loads nodes, edges, groups, types, labels
 * Source of Truth: ConstellationDocument
 */

/**
 * SYNC POINT 2: graphStore → timeline current state
 * When: Graph changes (useActiveDocument.ts:185)
 * What: Updates timeline.states[currentStateId].graph
 * Source of Truth: graphStore (working copy)
 */

/**
 * SYNC POINT 3: timeline → document
 * When: Document save (workspaceStore.ts:810)
 * What: Serializes entire timeline to document.timeline
 * Source of Truth: timelineStore
 */

/**
 * SYNC POINT 4: graphStore → document types
 * When: Type operations (workspaceStore.ts:1000-1126)
 * What: Updates document types and syncs to graphStore if active
 * Source of Truth: ConstellationDocument
 */

/**
 * SYNC POINT 5: timeline → graphStore
 * When: State switch (timelineStore.ts:216)
 * What: Loads state's graph into graphStore
 * Source of Truth: timelineStore (specific state)
 */
```

**Impact**: ✅ Safe - documentation only
**Files Changed**: 3 (`useActiveDocument.ts`, `workspaceStore.ts`, `timelineStore.ts`)
**Effort**: 2 hours

---

#### Step 6.2: Add TypeScript Strict Nullchecks

**Goal**: Catch potential null/undefined errors at compile time

**Actions**:

```typescript
// In tsconfig.json:
{
  "compilerOptions": {
    "strictNullChecks": true,  // Enable
  }
}

// Fix revealed issues (estimate 20-30 locations):
// - Add null checks before accessing timeline.states.get()
// - Add undefined checks before accessing document properties
// - Use optional chaining where appropriate
```

**Impact**: ⚠️ **Requires code changes** - but catches real bugs
**Files Changed**: Estimate 8-10 files
**Testing**: Full regression test suite
**Effort**: 8 hours

---

## Testing Strategy

### Critical Test Cases

#### 1. Undo/Redo Correctness

```typescript
describe('Undo/Redo', () => {
  test('undo after group creation restores state without group', () => {
    // Given: Document with 3 nodes
    // When: Create group with nodes, then undo
    // Then: Nodes should not have parentId, group should not exist
  });

  test('undo after type addition removes type', () => {
    // Given: Document with 4 node types
    // When: Add new node type, then undo
    // Then: Document should have 4 node types (not 5)
  });

  test('redo after undo restores changes', () => {
    // Given: Document with changes, then undo
    // When: Redo
    // Then: Changes should be restored
  });
});
```

---

#### 2. Cross-Document Contamination

```typescript
describe('Document Isolation', () => {
  test('switching documents does not leak state', () => {
    // Given: Doc A with 5 nodes, Doc B with 3 nodes
    // When: Switch from A to B to A
    // Then: Doc A should still have 5 nodes (not 3)
  });

  test('type changes in one document do not affect others', () => {
    // Given: Doc A and Doc B with different types
    // When: Add type to Doc A
    // Then: Doc B types should be unchanged
  });
});
```

---

#### 3. Type Operation Rollback

```typescript
describe('Type Operation Atomicity', () => {
  test('type addition rolls back on storage quota exceeded', () => {
    // Given: localStorage near quota
    // When: Add node type that exceeds quota
    // Then: Document should not have new type, error toast shown
  });

  test('type deletion rolls back on error', () => {
    // Given: Document with type used by nodes
    // When: Delete type, error occurs during save
    // Then: Type should still exist, nodes unchanged
  });
});
```

---

#### 4. Label Deletion Atomicity

```typescript
describe('Label Deletion', () => {
  test('label deletion cleans all timeline states atomically', () => {
    // Given: 5 timeline states with label "urgent" on various nodes
    // When: Delete "urgent" label
    // Then: All states should have label removed, no partial cleanup
  });

  test('label deletion handles errors gracefully', () => {
    // Given: Timeline with label references
    // When: Delete label, error occurs mid-cleanup
    // Then: Operation should fail cleanly, state should be consistent
  });
});
```

---

#### 5. Timeline Operations

```typescript
describe('Timeline Operations', () => {
  test('creating state captures current graph correctly', () => {
    // Given: Document with specific graph state
    // When: Create new timeline state
    // Then: New state should have exact copy of current graph
  });

  test('switching states loads correct graph', () => {
    // Given: Two timeline states with different graphs
    // When: Switch between states
    // Then: graphStore should reflect each state's graph
  });
});
```

---

## Execution Order

### Sprint 1: Low-Hanging Fruit (1 week, 5 hours)

**Goals**: Reduce technical debt, improve code organization

- Phase 1.1: Extract active functions from loader.ts (2 hours)
- Phase 1.2: Extract active functions from saver.ts (2 hours)
- Phase 1.3: Consolidate storage keys (1 hour)
- Phase 6.1: Add sync point documentation (2 hours)

**Value**: ✅ Reduces technical debt, improves code organization
**Risk**: Very low - mostly moving/documenting code
**Success Criteria**: All imports work, no behavior changes

---

### Sprint 2: Critical Bug Fixes (1 week, 5 hours)

**Goals**: Fix undo/redo inconsistencies

- Phase 4.1: Fix createGroupWithActors timing (1 hour)
- Phase 2.1: Centralize snapshot creation (4 hours)

**Value**: ✅ Fixes undo/redo inconsistencies
**Risk**: Medium - requires thorough testing
**Success Criteria**: All undo/redo tests pass, manual testing confirms correct behavior

---

### Sprint 3: Atomicity Improvements (2 weeks, 10 hours)

**Goals**: Prevent data corruption on errors

- Phase 3.1: Add type management transactions (6 hours)
- Phase 5.1: Improve label deletion atomicity (4 hours)

**Value**: ✅ Prevents data corruption on errors
**Risk**: Medium - changes error handling paths
**Success Criteria**: Error injection tests pass, rollback behavior verified

---

### Sprint 4: Type Safety (1 week, 8 hours)

**Goals**: Catch bugs at compile time

- Phase 6.2: Add strict null checks (8 hours)
- Fix revealed type errors

**Value**: ✅ Catches bugs at compile time
**Risk**: Low - TypeScript will guide fixes
**Success Criteria**: Zero TypeScript errors, all tests pass

---

## Metrics & Success Criteria

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Legacy code lines** | ~350 | <100 | Count deprecated functions |
| **Code duplication** | ~135 lines | <50 | Detect with jscpd |
| **Sync points** | 5 undocumented | 5 documented | Manual review |
| **Type safety errors** | Unknown | 0 | Enable strictNullChecks |
| **Undo/redo bugs** | 1 known (createGroupWithActors) | 0 | Regression tests |
| **Transaction rollback coverage** | 0% | 100% of type ops | Code review |

---

## Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Undo/redo breaks after Phase 2** | Medium | High | Extensive manual testing + automated tests before merge |
| **localStorage quota issues after Phase 3** | Low | Medium | Test with quota simulation, add user warnings |
| **Timeline corruption after Phase 5** | Medium | High | Backup/restore testing, feature flag rollout |
| **Performance regression** | Low | Medium | Benchmark before/after with large documents |
| **User workflow disruption** | Low | Low | No UI changes, all backend refactoring |

---

## Priority Recommendations

### Immediate (This Week)

1. **Fix createGroupWithActors history timing** (Phase 4.1)
   - Only takes 1 hour
   - Fixes known undo/redo bug
   - Very low risk

### Short-Term (Next 2 Weeks)

2. **Eliminate duplicate snapshot logic** (Phase 2.1)
   - Reduces maintenance burden
   - Fixes inconsistency between graph and timeline snapshots
   - Medium risk, requires testing

3. **Document state sync points** (Phase 6.1)
   - Helps future developers understand architecture
   - Very low risk
   - Quick win (2 hours)

### Medium-Term (Next Month)

4. **Add type operation transactions** (Phase 3.1)
   - Prevents data corruption
   - Medium risk, good test coverage needed

5. **Improve label deletion atomicity** (Phase 5.1)
   - Prevents partial timeline corruption
   - Medium risk, requires careful testing

### Long-Term (Next Quarter)

6. **Extract and deprecate legacy persistence code** (Phase 1)
   - Reduces technical debt
   - Very low risk

7. **Add strict TypeScript null checks** (Phase 6.2)
   - Catches potential bugs
   - Low risk, takes time to fix all issues

---

## Conclusion

This refactoring plan addresses the key issues in the state management and persistence layer while maintaining the system's excellent architectural foundation. By executing the phases in the recommended order, we can incrementally improve the codebase with minimal risk.

The plan is designed to be:

- **Incremental**: Each phase can be completed independently
- **Low-Risk**: Most changes have clear rollback strategies
- **Testable**: Each phase has specific test criteria
- **Valuable**: Each phase delivers concrete improvements

**Estimated Total Effort**: ~28 hours across 4 sprints (5 weeks with testing and review)

**Overall Risk Level**: Medium (with proper testing and phased rollout)

**Expected Outcome**: B+ → A- code quality rating

---

## Appendix: File Reference

### Key Files by Category

**Stores:**
- `src/stores/graphStore.ts` - Low-level graph state
- `src/stores/workspaceStore.ts` - Multi-document workspace
- `src/stores/timelineStore.ts` - Timeline state management
- `src/stores/historyStore.ts` - Undo/redo per document
- `src/stores/bibliographyStore.ts` - Citation management

**Hooks:**
- `src/hooks/useGraphWithHistory.ts` - Wraps graph mutations with history
- `src/hooks/useDocumentHistory.ts` - Undo/redo orchestration
- `src/hooks/useActiveDocument.ts` - Document loading and sync

**Persistence (Legacy):**
- `src/stores/persistence/loader.ts` - Legacy load functions
- `src/stores/persistence/saver.ts` - Legacy save functions
- `src/stores/persistence/constants.ts` - Storage keys
- `src/stores/persistence/types.ts` - Type definitions
- `src/stores/persistence/fileIO.ts` - Import/export

**Persistence (Active):**
- `src/stores/workspace/persistence.ts` - Multi-document storage
- `src/stores/workspace/migration.ts` - Legacy migration
- `src/stores/workspace/useActiveDocument.ts` - Document sync
- `src/stores/workspace/types.ts` - Workspace types

---

*End of Document*
