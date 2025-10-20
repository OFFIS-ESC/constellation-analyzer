# Phase 4.1: Fix createGroupWithActors History Timing - Test Plan

**Date:** 2025-10-20
**Status:** ✅ IMPLEMENTED
**Risk Level:** Low
**Effort:** 1 hour

---

## Change Summary

### What Was Fixed

**File:** `src/hooks/useGraphWithHistory.ts:455-469`

**Before:**
```typescript
// Add the group first
graphStore.addGroup(group);

// Update actors to be children of the group
const updatedNodes = graphStore.nodes.map((node) => {
  const update = actorUpdates[node.id];
  return update ? { ...node, ...update } : node;
});

// Update nodes in store
graphStore.setNodes(updatedNodes as Actor[]);

// Push history AFTER all changes are complete ❌
pushToHistory(`Create Group: ${group.data.label}`);
```

**After:**
```typescript
// ✅ Push history BEFORE making changes (consistent with other operations)
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
```

### Why This Matters

**Incorrect Behavior (Before):**
- History captured the state AFTER the group was created
- Undo would restore the state that already includes the group
- Result: Undo didn't actually undo the group creation

**Correct Behavior (After):**
- History captures the state BEFORE the group is created
- Undo restores the state without the group
- Result: Undo correctly removes the group and ungroups actors

---

## Manual Testing Instructions

### Test Case 1: Basic Group Creation + Undo

**Setup:**
1. Open the application
2. Create a new document
3. Add 3 actors to the canvas (any types)

**Steps:**
1. Select all 3 actors (Shift+Click or drag selection box)
2. Right-click → "Group Selection" (or use keyboard shortcut if available)
3. Enter a group name (e.g., "Team A")
4. Verify the group is created and actors are inside it
5. Press Ctrl+Z (or Cmd+Z on Mac) to undo

**Expected Result:**
- ✅ The group should be completely removed
- ✅ The 3 actors should be ungrouped (back on canvas as independent nodes)
- ✅ The actors should be in their original positions
- ✅ No "Parent node not found" errors in the console

**Failure Indicators:**
- ❌ Group still exists after undo
- ❌ Actors still have parent references
- ❌ Console errors about missing parent nodes

---

### Test Case 2: Group Creation + Undo + Redo

**Setup:**
1. Same as Test Case 1 (document with 3 actors)
2. Create a group with all 3 actors

**Steps:**
1. Press Ctrl+Z to undo (group should be removed)
2. Press Ctrl+Shift+Z (or Cmd+Shift+Z) to redo

**Expected Result:**
- ✅ After undo: Group removed, actors ungrouped
- ✅ After redo: Group restored, actors back inside group
- ✅ Group has the same name and properties as original
- ✅ No console errors

---

### Test Case 3: Multiple Operations with Group Creation

**Setup:**
1. Create a document with 4 actors

**Steps:**
1. Add a relation between Actor 1 and Actor 2
2. Select Actor 3 and Actor 4, create a group called "Subteam"
3. Add a relation from Actor 1 to the group
4. Add another actor (Actor 5)
5. Press Ctrl+Z four times (undo all operations in reverse)

**Expected Result:**
After 1st undo:
- ✅ Actor 5 removed

After 2nd undo:
- ✅ Relation from Actor 1 to group removed

After 3rd undo:
- ✅ Group "Subteam" removed
- ✅ Actor 3 and Actor 4 ungrouped

After 4th undo:
- ✅ Relation between Actor 1 and Actor 2 removed
- ✅ Document back to original state (4 actors, no relations, no groups)

---

### Test Case 4: Group Creation Across Timeline States

**Setup:**
1. Create a document with 3 actors
2. Create a timeline state called "State A"

**Steps:**
1. In "State A", select all 3 actors and create a group called "Group A"
2. Create a new timeline state called "State B" (clone from current)
3. Switch back to "State A"
4. Press Ctrl+Z to undo the group creation
5. Switch to "State B"

**Expected Result:**
- ✅ In "State A" after undo: Group removed, actors ungrouped
- ✅ In "State B": Group still exists (timeline states are independent)
- ✅ No cross-contamination between states

---

### Test Case 5: Large Group (10+ Actors)

**Setup:**
1. Create a document with 12 actors arranged in a grid

**Steps:**
1. Select all 12 actors
2. Create a group called "Large Group"
3. Verify all actors are inside the group
4. Press Ctrl+Z to undo

**Expected Result:**
- ✅ All 12 actors ungrouped correctly
- ✅ No performance issues
- ✅ No partial ungrouping (all or nothing)

---

### Test Case 6: Nested Operations (Edge Case)

**Setup:**
1. Create a document with 5 actors

**Steps:**
1. Select Actor 1, 2, 3 and create "Group A"
2. Add Actor 4 to "Group A" manually (drag into group)
3. Press Ctrl+Z to undo the "add actor to group" operation
4. Press Ctrl+Z again to undo the "create group" operation

**Expected Result:**
After 1st undo:
- ✅ Actor 4 removed from group (but group still exists with 1, 2, 3)

After 2nd undo:
- ✅ Group removed
- ✅ Actors 1, 2, 3 ungrouped

---

## Automated Testing (Future)

### Unit Test Structure (For Reference)

```typescript
describe('useGraphWithHistory - createGroupWithActors', () => {
  test('should capture state before group creation in history', () => {
    // Given: 3 nodes without a group
    const initialNodes = [
      { id: 'n1', type: 'custom', position: { x: 0, y: 0 }, data: { type: 'person' } },
      { id: 'n2', type: 'custom', position: { x: 100, y: 0 }, data: { type: 'person' } },
      { id: 'n3', type: 'custom', position: { x: 200, y: 0 }, data: { type: 'person' } },
    ];

    // When: Create group with all nodes
    const group = {
      id: 'g1',
      type: 'group',
      position: { x: 0, y: 0 },
      data: { label: 'Team A', actorIds: ['n1', 'n2', 'n3'] },
    };

    const actorUpdates = {
      n1: { position: { x: 10, y: 10 }, parentId: 'g1', extent: 'parent' as const },
      n2: { position: { x: 110, y: 10 }, parentId: 'g1', extent: 'parent' as const },
      n3: { position: { x: 210, y: 10 }, parentId: 'g1', extent: 'parent' as const },
    };

    // Execute
    createGroupWithActors(group, ['n1', 'n2', 'n3'], actorUpdates);

    // Then: History should have captured state WITHOUT group
    const history = historyStore.histories.get(documentId);
    const lastAction = history.undoStack[history.undoStack.length - 1];

    expect(lastAction.description).toBe('Create Group: Team A');
    expect(lastAction.documentState.timeline.states.get(currentStateId).graph.groups).toHaveLength(0);
    expect(lastAction.documentState.timeline.states.get(currentStateId).graph.nodes).toHaveLength(3);
    expect(lastAction.documentState.timeline.states.get(currentStateId).graph.nodes[0].parentId).toBeUndefined();
  });

  test('should restore state without group after undo', () => {
    // Given: Group created with 3 nodes
    createGroupWithActors(group, ['n1', 'n2', 'n3'], actorUpdates);

    // When: Undo
    undo();

    // Then: Group should not exist
    const graphState = useGraphStore.getState();
    expect(graphState.groups).toHaveLength(0);
    expect(graphState.nodes).toHaveLength(3);
    expect(graphState.nodes.every(n => !n.parentId)).toBe(true);
  });
});
```

---

## Verification Checklist

Before marking this phase as complete, verify:

- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Manual Test Case 1 passed (basic undo)
- [ ] Manual Test Case 2 passed (undo + redo)
- [ ] Manual Test Case 3 passed (multiple operations)
- [ ] Manual Test Case 4 passed (timeline states)
- [ ] Manual Test Case 5 passed (large group)
- [ ] Manual Test Case 6 passed (nested operations)
- [ ] No console errors during any test
- [ ] No performance regressions
- [ ] Code review completed

---

## Rollback Plan

If issues are discovered:

1. **Immediate Rollback** (< 5 minutes):
   ```bash
   git revert <commit-hash>
   ```

2. **Change to Revert**:
   Move `pushToHistory()` back to AFTER mutations in `useGraphWithHistory.ts:455-469`

3. **No Data Loss Risk**:
   - This is a code-only change
   - Existing documents are not affected
   - History stacks remain intact

---

## Success Criteria

✅ **Phase 4.1 is complete when:**

1. All 6 manual test cases pass
2. No console errors during group creation/undo
3. Undo behavior is consistent with other operations (add/delete node, add/delete edge, etc.)
4. Code review approved
5. Documentation updated in refactoring plan

---

## Notes

### Consistency Verification

This fix makes `createGroupWithActors` consistent with all other operations:

| Operation | History Timing | Location |
|-----------|---------------|----------|
| `addNode` | **BEFORE** mutation | `useGraphWithHistory.ts:106` |
| `updateNode` | **BEFORE** mutation | `useGraphWithHistory.ts:123` |
| `deleteNode` | **BEFORE** mutation | `useGraphWithHistory.ts:138` |
| `addEdge` | **BEFORE** mutation | `useGraphWithHistory.ts:151` |
| `updateEdge` | **BEFORE** mutation | `useGraphWithHistory.ts:163` |
| `deleteEdge` | **BEFORE** mutation | `useGraphWithHistory.ts:177` |
| `addGroup` | **BEFORE** mutation | `useGraphWithHistory.ts:349` |
| `updateGroup` | **BEFORE** mutation | `useGraphWithHistory.ts:364` |
| `deleteGroup` | **BEFORE** mutation | `useGraphWithHistory.ts:382` |
| `createGroupWithActors` | **BEFORE** mutation ✅ | `useGraphWithHistory.ts:457` (FIXED) |

### Why This Bug Existed

The original implementation pushed history AFTER mutations because of a comment:
> "This ensures the timeline state snapshot includes the new group"

This was actually **backwards logic**. The snapshot should capture the state BEFORE the action, not after, so that undo can restore that previous state.

The confusion likely arose because `createGroupWithActors` is an "atomic" operation that performs multiple mutations (add group + update nodes), and there was concern about capturing an intermediate state. However, the correct approach is:

1. Capture state BEFORE any mutations (push to history)
2. Perform all mutations atomically
3. If undo is triggered, restore the captured state

This is exactly what all other operations do, and now `createGroupWithActors` does too.

---

*End of Test Plan*
