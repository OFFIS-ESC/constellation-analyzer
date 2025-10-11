# Multi-Version Graph Feature - UX Concept Document

## Executive Summary

This document outlines a comprehensive UX design for adding multi-version graph support to Constellation Analyzer. The feature enables users to maintain multiple versions of a constellation graph within a single document, with a branching model similar to version control systems but adapted for visual graph editing.

**Design Philosophy**: Balance power-user capabilities with approachable, intuitive interactions for users unfamiliar with traditional version control.

---

## 1. User Mental Model

### Core Metaphor: "Snapshots with Branches"

**Primary Terminology** (domain-specific, not git-like):
- **Snapshot** - A saved state of the graph at a specific point in time
- **Branch** - A diverging path of development from a snapshot
- **Timeline** - The visual representation of snapshot history
- **Active Snapshot** - The currently displayed and editable version

**Why Not Git Terminology?**
While the underlying model resembles git, using terms like "commit," "branch," and "merge" may intimidate users unfamiliar with version control. Our target users are analysts and researchers, not developers.

**User Mental Model Narrative**:
> "I'm working on a constellation analysis. As I explore different scenarios, I can create snapshots of my work. Each snapshot preserves the exact state of actors and relations at that moment. Later, I can branch off from any snapshot to explore alternative arrangements without losing my original work. The timeline shows me the evolution of my analysis."

### Key Mental Model Principles:

1. **Non-destructive editing** - Creating a new snapshot never destroys previous work
2. **Exploration-friendly** - Easy to try alternative configurations
3. **Clear lineage** - Visual representation shows how snapshots relate
4. **Lightweight snapshots** - Creating a snapshot is quick and low-friction
5. **Safety first** - Difficult to accidentally delete work

---

## 2. Bottom Panel Design

### 2.1 Layout & Positioning

**Position**: Bottom edge of the graph editor (below the ReactFlow canvas)

**Dimensions**:
- Default height: 200px
- Minimum height: 120px (collapsed state showing only controls)
- Maximum height: 50% of viewport height
- Resizable via drag handle at top edge

**States**:
1. **Fully Visible** (200px) - Timeline graph fully visible with snapshot details
2. **Collapsed** (120px) - Timeline visible but compressed, minimal details
3. **Hidden** (0px, optional) - Panel completely hidden, toggle via View menu or keyboard

**Behavior**:
- Panel remains visible by default when document has multiple snapshots
- For documents with single snapshot, panel auto-hides but can be shown
- Resize handle appears on hover at top edge (3px hit area, visual indicator)
- Double-click resize handle to toggle between default and collapsed heights

### 2.2 Visual Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─┐ Snapshot Timeline        [Search] [?]  [Filter▾] [−] [×]   │ ← Header (32px)
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ◯───◯───◯───┬───◯                                         │
│     │   │   │   │   │                                         │ ← Timeline Graph
│     S1  S2  S3  │   S5 (Active)                               │   (Variable height)
│                 │                                              │
│                 └───◯                                          │
│                     S4                                          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Snapshot S5: "Exploring team structure" • Modified 2 min ago   │ ← Details Footer (36px)
│ [Create Snapshot] [Branch from S3▾] [⋮ More Actions]          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Header Controls

**Left side**:
- **Timeline icon** + "Snapshot Timeline" title
- Subtle visual indicator of total snapshot count (e.g., "(7 snapshots)")

**Right side controls**:
- **Search field** - Filter snapshots by name/description
- **Help icon (?)** - Opens tooltip explaining snapshot concepts
- **Filter dropdown** - Show/hide specific branches, date ranges
- **Collapse button (−)** - Collapses panel to minimal height
- **Hide button (×)** - Hides panel completely

### 2.4 Timeline Visualization

**Layout**: Horizontal flow, left to right (earliest to newest)

**Visual Elements**:

**Snapshot Node**:
```
     ◯  ← Hollow circle (16px) for inactive snapshots
     ●  ← Filled circle (20px) for active snapshot

   Colors:
   - Default: Gray (#94a3b8)
   - Active: Blue (#3b82f6)
   - Hover: Darker shade
   - Selected: Ring around node
```

**Connection Lines**:
- Solid lines (2px) connecting parent to child
- Bezier curves for branching paths
- Color matches the branch (subtle color coding)

**Labels**:
- Snapshot name appears below node (truncated to 20 chars)
- Timestamp on secondary line (relative: "2h ago", "3 days ago")
- Custom label text wraps to 2 lines max

**Interactive States**:
1. **Default** - Snapshot visible, clickable
2. **Hover** - Node enlarges slightly (scale 1.1), shows preview tooltip
3. **Active** - Larger node, blue color, subtle glow effect
4. **Selected** - Blue ring around node, details shown in footer
5. **Dimmed** - Snapshots filtered out (opacity 0.3)

### 2.5 Snapshot Preview Tooltip (on hover)

```
┌────────────────────────────────┐
│ Snapshot: Feature Analysis     │
│ Created: Oct 11, 2025 2:30 PM │
│ Branch: main                   │
│ ─────────────────────────────  │
│ [Thumbnail preview]            │ ← 200x120px graph preview
│ 12 actors • 18 relations       │
│ ─────────────────────────────  │
│ Click to view                  │
│ Double-click to switch         │
└────────────────────────────────┘
```

**Preview generation**:
- Cached thumbnail of graph state (rendered on snapshot creation)
- Shows miniature view of node layout
- Updates only when snapshot is modified (if editable)

### 2.6 Details Footer

Displays information about selected/active snapshot:

**Content**:
- Snapshot name (editable inline on click)
- Description text (if set)
- Last modified timestamp
- Statistics: actor count, relation count
- Branch indicator (if multiple branches exist)

**Action Buttons**:
1. **"Create Snapshot"** - Create new snapshot from current active state
2. **"Branch from..."** - Dropdown to select any snapshot to branch from
3. **"More Actions" (⋮)** - Overflow menu for:
   - Rename snapshot
   - Edit description
   - Delete snapshot
   - Compare with another snapshot
   - Export snapshot
   - View snapshot history

### 2.7 Handling Large Version Graphs

**Performance Optimizations** (for 100+ snapshots):

1. **Virtual Scrolling**:
   - Render only visible snapshot nodes (viewport + buffer)
   - Smooth horizontal scrolling with momentum

2. **Timeline Zoom Levels**:
   - **Zoomed out** - Dots only, no labels (fit more on screen)
   - **Default** - Nodes with names, condensed timestamps
   - **Zoomed in** - Full details, larger nodes, preview thumbnails
   - Zoom controls: +/− buttons or Ctrl+Scroll

3. **Minimap** (appears when >20 snapshots):
   ```
   ┌─────────────────────────────────────┐
   │ Timeline Minimap:   [====····]      │ ← Shows full timeline
   │                      ^current view^  │
   └─────────────────────────────────────┘
   ```

4. **Branch Folding**:
   - Collapse inactive branches to single node
   - "Show 5 hidden snapshots" expandable indicator
   - Focus mode: Show only active branch + ancestors

5. **Search & Filter**:
   - Filter by date range slider
   - Filter by branch name
   - Search by snapshot name/description
   - Tag-based filtering (if tags implemented)

6. **Lazy Loading**:
   - Load snapshot metadata only
   - Graph data loaded on-demand when switching
   - Thumbnail previews loaded progressively

---

## 3. Version Navigation

### 3.1 Switching Between Snapshots

**Primary Interaction**: **Double-click** on snapshot node in timeline

**Rationale**:
- Single-click selects/previews (low commitment)
- Double-click activates (deliberate action)
- Familiar pattern from file explorers

**Alternative Methods**:
1. Select snapshot → Press Enter
2. Select snapshot → Click "Switch to This Snapshot" button
3. Keyboard shortcuts: Ctrl+[ / Ctrl+] to navigate chronologically
4. Right-click context menu → "Switch to Snapshot"

### 3.2 Unsaved Changes Handling

**When attempting to switch with unsaved changes**:

**Modal Dialog**:
```
┌──────────────────────────────────────────────┐
│  ⚠ Unsaved Changes                           │
│                                              │
│  You have unsaved changes in this snapshot.  │
│  What would you like to do?                  │
│                                              │
│  ○ Create new snapshot with changes          │
│  ○ Discard changes and switch                │
│  ○ Cancel (stay on current snapshot)         │
│                                              │
│           [Cancel]  [Proceed →]              │
└──────────────────────────────────────────────┘
```

**Auto-snapshot Option** (in Settings):
- "Automatically create snapshot when switching versions"
- Prompts for name if enabled, or uses auto-generated name
- Default: OFF (to avoid clutter)

### 3.3 Visual Feedback During Switch

**Loading State**:
1. Timeline panel: Active node animates to new position
2. Graph editor: Fade out → Brief loading indicator → Fade in new graph
3. Duration: 200-400ms for smooth transition
4. Preserve viewport position if possible (or fit view)

**Confirmation**:
- Toast notification: "Switched to snapshot: [Name]"
- Active snapshot highlighted in timeline
- Document title updates with snapshot indicator

### 3.4 Keyboard Navigation

**Shortcuts**:
- `Ctrl+[` - Previous snapshot (chronologically)
- `Ctrl+]` - Next snapshot
- `Ctrl+Shift+S` - Create new snapshot
- `Ctrl+B` - Toggle timeline panel visibility
- `Ctrl+/` - Focus timeline search
- `Arrow keys` - Navigate between snapshots in timeline (when focused)
- `Enter` - Switch to selected snapshot
- `Escape` - Deselect snapshot, return to active view

---

## 4. Version Creation

### 4.1 Creating New Snapshots

**Trigger Methods**:

1. **Manual Creation**:
   - Click "Create Snapshot" button in timeline footer
   - Menu: Edit → Create Snapshot
   - Keyboard: Ctrl+Shift+S
   - Toolbar: Snapshot icon button (camera icon)

2. **Quick Snapshot Dialog**:
```
┌──────────────────────────────────────────┐
│  Create Snapshot                         │
│                                          │
│  Name: [Exploring team dynamics______]  │
│                                          │
│  Description (optional):                 │
│  [Added marketing team actors and___]   │
│  [their relations to product team___]   │
│                                          │
│  ☐ Create as new branch                 │
│                                          │
│        [Cancel]  [Create Snapshot]       │
└──────────────────────────────────────────┘
```

**Auto-naming**:
- If name left empty, generate: "Snapshot [number]" or "Untitled [timestamp]"
- Show placeholder: "e.g., After adding finance team"
- Timestamp automatically attached to metadata

**Description field**:
- Optional but encouraged
- Multi-line textarea (3 rows)
- Character limit: 500 chars
- Used in search and timeline tooltips

### 4.2 Auto-save vs Manual Snapshots

**Recommended Approach**: **Manual Only** (initially)

**Rationale**:
- Users maintain control over what constitutes a meaningful version
- Prevents timeline clutter from every minor edit
- More intentional version management

**Future Enhancement**: Auto-snapshot options (in Settings):
- "Auto-snapshot every N minutes" (disabled by default)
- "Auto-snapshot on significant changes" (e.g., >10 actors added/removed)
- Auto-snapshots marked visually different (hollow squares instead of circles)
- Can be cleaned up via "Compress Timeline" action

### 4.3 Branching UX

**Creating a Branch**:

**Scenario**: User wants to explore alternative from Snapshot 3 while keeping current work

**Method 1 - Context Menu**:
1. Right-click snapshot in timeline
2. Select "Create Branch from Here"
3. Name branch dialog appears

**Method 2 - Branch Button**:
1. Select snapshot (single-click)
2. Click "Branch from..." dropdown in footer
3. Shows list of all snapshots with thumbnails
4. Select source snapshot
5. Name dialog appears

**Branch Naming Dialog**:
```
┌──────────────────────────────────────────┐
│  Create Branch from Snapshot 3           │
│                                          │
│  New snapshot will be created from:      │
│  "Initial actor layout" (Oct 11, 2:15pm) │
│                                          │
│  Branch name: [Alternative structure_]   │
│                                          │
│  Start with:                             │
│  ● Exact copy of source snapshot         │
│  ○ Empty graph (keep only types)         │
│                                          │
│        [Cancel]  [Create Branch]         │
└──────────────────────────────────────────┘
```

**Visual Branching Indicator**:
- Branch lines diverge with bezier curve from parent
- Different subtle background colors for different branches
- Branch labels in timeline (collapsible)

**Branch Management**:
- Branches are implicit (no explicit branch objects)
- Branches identified by diverging paths in snapshot graph
- "Main" branch is simply the linear path from first snapshot
- Can rename branches by editing the divergence point snapshot

---

## 5. Version Graph Editing

### 5.1 Deletion Operations

**Delete Snapshot**:

**Trigger**:
- Select snapshot → More Actions (⋮) → Delete Snapshot
- Right-click → Delete
- Select + Delete key

**Safety Rules**:
1. **Cannot delete active snapshot** - Must switch to another first
2. **Orphan prevention** - If snapshot has children, show warning
3. **Confirmation required** - Always prompt before deletion

**Confirmation Dialog**:
```
┌──────────────────────────────────────────┐
│  ⚠ Delete Snapshot?                      │
│                                          │
│  This will permanently delete:           │
│  "Feature Analysis v2"                   │
│                                          │
│  ⚠ Warning: This snapshot has 3 children │
│  What should happen to child snapshots?  │
│                                          │
│  ● Re-parent to previous snapshot        │
│  ○ Delete entire branch (4 snapshots)    │
│                                          │
│  ☑ Don't ask again for simple deletions  │
│                                          │
│        [Cancel]  [Delete Snapshot]       │
└──────────────────────────────────────────┘
```

**Re-parenting**:
- Children automatically connect to deleted snapshot's parent
- Visual animation shows line reconnecting
- Toast: "Snapshot deleted, 3 children re-parented"

### 5.2 Re-parenting Operations

**Use Case**: Change the parent of a snapshot (move it to different branch point)

**Interaction**:
1. Right-click snapshot → "Change Parent..."
2. Timeline enters "re-parent mode"
3. All valid parent snapshots highlight (must be chronologically earlier)
4. Click new parent snapshot
5. Confirmation dialog shows before/after visualization

**Constraints**:
- New parent must be chronologically before the snapshot being moved
- Cannot create cycles
- Moving a snapshot moves all its descendants

**Visual Feedback**:
- Dotted line from snapshot to cursor during selection
- Valid drop targets pulse gently
- Invalid targets dimmed with "not allowed" cursor

### 5.3 Merge Operations (Advanced)

**Note**: Merging is complex and should be a **later phase** feature

**If implemented, merge UX**:

**Trigger**:
1. Select two snapshots (Ctrl+Click)
2. Right-click → "Merge Snapshots..."
3. Merge wizard opens

**Merge Wizard**:
```
Step 1: Select merge strategy
  ● Manual conflict resolution
  ○ Keep all actors from both (auto-merge)
  ○ Prefer snapshot A
  ○ Prefer snapshot B

Step 2: Resolve conflicts (if manual)
  [Side-by-side diff view]
  - Actors only in A (5) → [Keep] [Discard]
  - Actors only in B (3) → [Keep] [Discard]
  - Modified actors (2) → [Use A] [Use B] [Edit]

Step 3: Name merged snapshot
  Name: [Merged: A + B_________]

Step 4: Review & Create
  [Preview merged graph]
  [Create Merged Snapshot]
```

**Complexity Warning**:
- Merging graphs is semantically ambiguous
- Better to support "Compare" feature first
- Allow manual recreation by viewing two snapshots side-by-side

### 5.4 Reordering & Reorganization

**Timeline Reorganization**:
- Drag-and-drop to reorder snapshots within a linear branch (no re-parenting)
- Useful for organizing exploration snapshots
- Does not change parent-child relationships
- Visual-only reorganization for cleaner timeline

**Compact View**:
- "Compress Timeline" action in More menu
- Automatically removes auto-snapshots older than X days
- Consolidates linear sequences with no branching
- Shows "Compressed 15 snapshots" indicator

---

## 6. Integration with Existing UI

### 6.1 Top-Level Current Snapshot Indicator

**Location**: Document tab bar OR below menu bar

**Option A - In Document Tab** (Recommended):
```
┌────────────────────────────────────────────┐
│ [Document 1 ▾] [Document 2] [+]            │
│  └─ Snapshot: Feature Analysis v2          │
└────────────────────────────────────────────┘
```

**Option B - Breadcrumb Header**:
```
┌────────────────────────────────────────────┐
│ Home > Team Analysis > Snapshot: v2.3      │
└────────────────────────────────────────────┘
```

**Option C - Status Bar** (below tabs, above toolbar):
```
┌────────────────────────────────────────────┐
│ [Document 1 ▾] [Document 2] [+]            │
├────────────────────────────────────────────┤
│ 📸 Active: Feature Analysis v2 • Oct 11... │
└────────────────────────────────────────────┘
```

**Interaction**:
- Click indicator → Opens snapshot selector dropdown
- Dropdown shows recent snapshots with quick-switch
- "Manage Snapshots..." option at bottom opens timeline panel

### 6.2 Left Panel Integration

**New Section: "Snapshots"** (collapsible, like "Add Actors"):

```
┌─────────────────────────┐
│ ▼ Snapshots             │
├─────────────────────────┤
│ Current:                │
│ Feature Analysis v2     │
│ Modified 5 min ago      │
│                         │
│ [Create Snapshot]       │
│ [View Timeline]         │
│                         │
│ Recent:                 │
│ • Initial layout        │
│ • Team structure v1     │
│ • Alternative view      │
└─────────────────────────┘
```

**Benefits**:
- Quick access without opening timeline panel
- Shows current state at a glance
- Recent list for fast switching
- Minimal space when collapsed

### 6.3 Right Panel Integration

**When Snapshot Selected** (in timeline, not graph element):

Right panel shows snapshot metadata:
```
┌─────────────────────────┐
│ Snapshot Properties     │
├─────────────────────────┤
│ Name:                   │
│ [Feature Analysis v2__] │
│                         │
│ Description:            │
│ [Added finance team...] │
│                         │
│ Created:                │
│ Oct 11, 2025 2:30 PM    │
│                         │
│ Statistics:             │
│ • 12 actors             │
│ • 18 relations          │
│ • Branch: main          │
│                         │
│ Actions:                │
│ [Switch to Snapshot]    │
│ [Branch from Here]      │
│ [Compare with Current]  │
│ [Export Snapshot]       │
│ [Delete Snapshot]       │
└─────────────────────────┘
```

### 6.4 Document-Level Operations

**Save Behavior**:
- **Ctrl+S** saves changes to **active snapshot** (creates new state)
- Snapshots are immutable after creation (for history integrity)
- "Save" updates the active snapshot's graph data
- Dirty indicator shows unsaved changes in current snapshot

**Export Behavior**:

**Export Active Snapshot**:
- File → Export → Current Snapshot
- Exports only active snapshot's graph

**Export All Snapshots**:
- File → Export → All Snapshots (with timeline)
- Creates .constellation-multi file or ZIP
- Includes full snapshot history and lineage

**Export Snapshot Range**:
- File → Export → Selected Snapshots...
- Choose snapshots in timeline (multi-select)
- Exports selected portion of timeline

**Import Behavior**:
- Importing a multi-version file creates new document
- Preserves all snapshot history and relationships
- Can import into existing document as new branch (advanced)

### 6.5 Menu Bar Updates

**New Menu Items**:

**File Menu**:
```
File
├─ New Document
├─ Open Document...
├─ Save Document             Ctrl+S
├─ ───────────────
├─ Import...
├─ Export ►
│  ├─ Current Snapshot...
│  ├─ All Snapshots...
│  └─ Selected Snapshots...
├─ ───────────────
├─ Document Manager...
```

**Edit Menu**:
```
Edit
├─ Undo                      Ctrl+Z
├─ Redo                      Ctrl+Shift+Z
├─ ───────────────
├─ Create Snapshot           Ctrl+Shift+S
├─ Switch Snapshot ►
│  ├─ Feature Analysis v2    ✓
│  ├─ Initial layout
│  ├─ Team structure v1
│  └─ ───────────────
│     └─ Show All...
├─ ───────────────
├─ Select All                Ctrl+A
```

**View Menu**:
```
View
├─ Zoom In                   Ctrl++
├─ Zoom Out                  Ctrl+-
├─ Fit View                  Ctrl+0
├─ ───────────────
├─ Show Left Panel           Ctrl+1
├─ Show Right Panel          Ctrl+2
├─ Show Timeline Panel       Ctrl+B
├─ ───────────────
├─ Toggle Snapshot Minimap
```

---

## 7. Edge Cases & Considerations

### 7.1 Very Large Version Graphs (100+ snapshots)

**Addressed by**:
1. Virtual scrolling in timeline (Section 2.7)
2. Zoom levels for timeline density
3. Branch folding to hide inactive development
4. Search and filtering capabilities
5. Minimap for navigation
6. "Focus mode" showing only active branch

**Additional Mitigations**:
- Lazy-load snapshot data (metadata only until needed)
- Paginated snapshot list in dropdown menus
- Archive old branches to separate storage
- "Compact timeline" action to consolidate

### 7.2 Performance Considerations

**Switching Between Snapshots**:

**Challenge**: Loading large graphs (500+ nodes) is slow

**Solutions**:
1. **Incremental Loading**:
   - Load nodes first, edges second
   - Render in viewport first, off-screen later
   - Progress indicator for large graphs

2. **Snapshot Diff Loading**:
   - Store deltas between snapshots
   - Apply changes incrementally when switching similar snapshots
   - Full load only when necessary

3. **Caching Strategy**:
   - Keep previous 3 snapshots in memory
   - LRU cache for frequently accessed snapshots
   - Clear cache on memory pressure

4. **Background Pre-loading**:
   - Pre-load adjacent snapshots in background
   - Predict likely next navigation (temporal, branching)

**Timeline Rendering**:
- Canvas-based rendering for large timelines (>50 snapshots)
- SVG for smaller timelines (better quality, easier interaction)
- Virtual scrolling for snapshot list views

### 7.3 Snapshot Comparison (Diff View)

**Feature**: Compare two snapshots side-by-side

**Trigger**:
- Select snapshot → More Actions → Compare with...
- Select second snapshot from dropdown

**Comparison View**:
```
┌─────────────────────────────────────────────────────┐
│ Compare Snapshots                              [×]  │
├─────────────────────────────────────────────────────┤
│ [Snapshot A: v1 ▾]          [Snapshot B: v2 ▾]     │
├──────────────────────────┬──────────────────────────┤
│                          │                          │
│    [Graph View A]        │     [Graph View B]       │
│                          │                          │
├──────────────────────────┴──────────────────────────┤
│ Differences:                                        │
│ ✓ Actors: +3 new, -1 removed, 2 modified          │
│ ✓ Relations: +5 new, -2 removed, 1 modified       │
│                                                     │
│ [Show only differences] [Highlight changes]         │
└─────────────────────────────────────────────────────┘
```

**Diff Highlighting**:
- Added actors: Green border
- Removed actors: Red border with strikethrough
- Modified actors: Yellow border
- Similar visual treatment for relations

**Diff Summary Panel**:
- List of all changes with drill-down
- Export diff as report
- "Apply changes to active snapshot" action

### 7.4 Conflict Handling (if merging implemented)

**Types of Conflicts**:

1. **Actor Conflicts**:
   - Same actor ID with different properties
   - Different actors at same position
   - Actor type changes

2. **Relation Conflicts**:
   - Same relation with different types
   - Relations to deleted actors
   - Conflicting directionality

**Resolution UI**:
- Side-by-side conflict view
- "Keep mine" / "Keep theirs" / "Keep both" / "Manually edit"
- Preview of resolution before applying
- Save resolution as new snapshot

**Recommendation**: Defer merge functionality to v2, focus on:
- Clear separation of branches
- Easy comparison tools
- Manual integration workflows

### 7.5 Collaborative Editing (Future)

**Consideration**: If multiple users edit same document

**Challenges**:
- Snapshot creation conflicts
- Active snapshot synchronization
- Real-time collaboration on same snapshot

**Potential Solutions**:
1. **Snapshot-level Locking**:
   - Only one user can edit a snapshot at a time
   - Others can view or create branches

2. **Per-User Branches**:
   - Each user works on their own branch
   - Manual merging when ready

3. **Operational Transform**:
   - Real-time collaborative editing
   - Automatic conflict resolution
   - Very complex, future consideration

**Initial Approach**:
- Single-user focus
- Export/import for sharing
- Cloud sync preserves all snapshots

### 7.6 Undo/Redo Interaction

**Question**: How does undo/redo interact with snapshots?

**Recommended Behavior**:

1. **Undo/Redo operates within active snapshot**:
   - Each snapshot has its own undo history
   - Switching snapshots preserves undo stack
   - Undo stack cleared when switching snapshots (configurable)

2. **Snapshot Creation in Undo Stack**:
   - Creating a snapshot is an undoable action
   - Undo after snapshot creation deletes the snapshot
   - Redo recreates the snapshot

3. **Switching Snapshots**:
   - Not in undo stack (separate navigation)
   - Use snapshot history for navigation
   - Prevents undo/redo confusion

**Settings Option**:
- "Preserve undo history when switching snapshots" (default: OFF)
- When ON, each snapshot maintains separate undo stack
- Increases memory usage

### 7.7 Data Model Implications

**Snapshot Storage Structure**:

```typescript
interface Snapshot {
  id: string;
  parentId: string | null;          // null for root snapshot
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;

  // Graph state
  graphState: {
    nodes: Actor[];
    edges: Relation[];
    viewport?: { x: number; y: number; zoom: number };
  };

  // Metadata
  metadata: {
    actorCount: number;
    relationCount: number;
    thumbnail?: string;             // Base64 encoded preview
    tags?: string[];
    branch?: string;                // Optional branch label
  };

  // For delta storage (optimization)
  isDelta?: boolean;
  deltaFrom?: string;               // Parent snapshot ID
  deltaOperations?: DeltaOp[];      // Add/remove/modify operations
}

interface SnapshotGraph {
  snapshots: Map<string, Snapshot>;
  rootSnapshotId: string;
  activeSnapshotId: string;

  // Computed properties
  branches?: SnapshotBranch[];
  timeline?: SnapshotNode[];
}
```

**Storage Strategy**:
1. **Full Storage** (simple, initial approach):
   - Each snapshot stores complete graph state
   - Larger file size, but simpler logic
   - Good for <50 snapshots

2. **Delta Storage** (optimization):
   - Store only differences from parent
   - Reduces storage for large histories
   - Reconstruction required when loading
   - Good for >50 snapshots

3. **Hybrid Approach**:
   - Store full state every N snapshots (keyframes)
   - Deltas in between
   - Balance speed and size

---

## 8. User Workflows & Task Flows

### 8.1 Common Task: Exploring Alternative Scenarios

**Scenario**: User wants to try different team structures without losing original

**Workflow**:
1. User creates initial constellation with 20 actors
2. Clicks "Create Snapshot" → Names it "Initial team structure"
3. Makes modifications (adds 5 actors, removes 2)
4. Realizes this doesn't work well
5. In timeline, double-clicks "Initial team structure"
6. System prompts about unsaved changes → User discards
7. User is back at initial state
8. Right-clicks "Initial team structure" → "Create Branch from Here"
9. Names new branch "Alternative hierarchy"
10. Makes different changes
11. Now has two parallel versions to compare

**Success Metrics**:
- No confusion about current state
- Easy navigation between versions
- Clear visual representation of branches
- No accidental data loss

### 8.2 Common Task: Reviewing Evolution Over Time

**Scenario**: User wants to see how analysis evolved over a week

**Workflow**:
1. User opens document with 30 snapshots
2. Clicks timeline panel to expand
3. Uses timeline zoom to see all snapshots at once
4. Identifies key milestones visually
5. Clicks through snapshots to see changes
6. Uses comparison view to see specific differences
7. Exports progression as presentation

**Enhancements**:
- "Playback" mode: Auto-advance through snapshots
- Export as animated GIF or video
- Slide show mode for presentations

### 8.3 Common Task: Cleaning Up Old Work

**Scenario**: User has 100+ snapshots, wants to consolidate

**Workflow**:
1. Opens timeline panel
2. Clicks More Actions → "Compact Timeline"
3. System shows preview of compaction:
   - "Will remove 40 auto-snapshots older than 30 days"
   - "Will consolidate 15 sequential snapshots with no branches"
4. User confirms
5. Timeline now shows 45 snapshots (much cleaner)
6. Important milestones preserved

**Safety**:
- Preview before compaction
- Undo compaction (keep deleted snapshots in "trash" for 30 days)
- Never auto-compact without user action

### 8.4 Common Task: Collaborating with Team Member

**Scenario**: User wants to share work-in-progress with colleague

**Workflow**:
1. User exports document with all snapshots
2. Colleague imports document
3. Colleague creates branch "Sarah's suggestions"
4. Makes changes in new branch
5. Exports back to user
6. User imports, sees new branch in timeline
7. User reviews changes, manually integrates good ideas

**Future Enhancement**:
- Cloud sync with branch visibility
- Comments on snapshots
- Suggested changes workflow

---

## 9. Visual Design Recommendations

### 9.1 Color Palette

**Timeline Panel**:
- Background: `#ffffff` (white)
- Panel border: `#e5e7eb` (gray-200)
- Header background: `#f9fafb` (gray-50)

**Snapshot Nodes**:
- Inactive: `#94a3b8` (slate-400)
- Active: `#3b82f6` (blue-500)
- Hover: `#64748b` (slate-500)
- Selected: `#2563eb` (blue-600)

**Connection Lines**:
- Default: `#cbd5e1` (slate-300)
- Active path: `#3b82f6` (blue-500)
- Hover: `#94a3b8` (slate-400)

**Branch Color Coding** (subtle):
- Branch 1: `#3b82f6` (blue) - main branch
- Branch 2: `#10b981` (green)
- Branch 3: `#f59e0b` (amber)
- Branch 4: `#8b5cf6` (purple)
- Branch 5+: Rotate through palette

### 9.2 Typography

**Timeline Panel**:
- Panel title: 12px, font-weight: 600, color: `#374151`
- Snapshot names: 11px, font-weight: 500, color: `#1f2937`
- Timestamps: 10px, font-weight: 400, color: `#6b7280`
- Details footer: 11px, font-weight: 400

**Snapshot Tooltips**:
- Title: 13px, font-weight: 600
- Body text: 11px, font-weight: 400
- Metadata: 10px, font-weight: 400, color: `#6b7280`

### 9.3 Iconography

**Timeline Controls**:
- Create snapshot: Camera icon (📸)
- Branch: Git branch icon (🔀)
- Compare: Side-by-side icon (⚖️)
- Delete: Trash icon (🗑️)
- More actions: Vertical ellipsis (⋮)

**Snapshot States**:
- Active: Filled circle with subtle glow
- Inactive: Hollow circle
- Auto-snapshot: Small square
- Milestone: Star or flag icon overlay

### 9.4 Animation & Transitions

**Snapshot Switching**:
- Fade out current graph (150ms)
- Show loading indicator (if >200ms load time)
- Fade in new graph (200ms)
- Timeline node moves with ease-in-out (300ms)

**Timeline Interactions**:
- Node hover: Scale 1.1, duration 100ms
- Connection line hover: Opacity 1.0, width +1px, duration 150ms
- Branch expand/collapse: Height transition 250ms

**Panel Resize**:
- Smooth height transition (200ms)
- Snap to collapsed/expanded states

### 9.5 Accessibility

**Keyboard Navigation**:
- All timeline controls accessible via keyboard
- Focus indicators clearly visible
- Logical tab order through controls

**Screen Reader Support**:
- Snapshot nodes: "Snapshot: [name], created [timestamp], [active/inactive]"
- Timeline: "Snapshot timeline with [N] snapshots"
- Actions: Clear button labels and ARIA descriptions

**Visual Accessibility**:
- Color not sole indicator (use shapes, labels, icons)
- High contrast mode support
- Sufficient text size (minimum 11px)
- Focus indicators: 2px blue outline

---

## 10. Implementation Phases

### Phase 1: Core Foundation (MVP)
**Goal**: Basic multi-version support with linear timeline

**Features**:
- Create snapshots manually
- Switch between snapshots
- Linear timeline visualization (no branching)
- Basic snapshot metadata (name, timestamp)
- Unsaved changes handling
- Timeline panel (bottom, resizable)

**Scope**: Single linear sequence of snapshots, no branching yet

### Phase 2: Branching Support
**Goal**: Enable parallel exploration paths

**Features**:
- Create branches from any snapshot
- Branching timeline visualization
- Branch labels and organization
- Re-parenting operations
- Branch color coding

### Phase 3: Enhanced Navigation
**Goal**: Improve large timeline handling

**Features**:
- Virtual scrolling for 100+ snapshots
- Timeline zoom levels
- Minimap navigation
- Search and filtering
- Branch folding
- Quick switcher dropdown

### Phase 4: Comparison & Analysis
**Goal**: Tools for analyzing snapshot differences

**Features**:
- Side-by-side comparison view
- Diff highlighting
- Export comparison reports
- Snapshot playback mode
- Evolution animations

### Phase 5: Advanced Features
**Goal**: Power-user capabilities

**Features**:
- Merge operations (if feasible)
- Timeline compaction
- Snapshot tagging
- Advanced filtering
- Collaborative features (cloud sync)

---

## 11. Success Metrics

**Usability Metrics**:
- Time to create first snapshot: <30 seconds
- Time to switch between snapshots: <3 seconds (perceived)
- Error rate when branching: <5%
- User comprehension score: >80% understand snapshot concept after 5 minutes

**Adoption Metrics**:
- % of users creating >1 snapshot: Target 60%
- Average snapshots per document: Target 5-10
- % of users using branching: Target 30%

**Performance Metrics**:
- Timeline rendering for 50 snapshots: <500ms
- Snapshot switch time: <1 second for 200-node graph
- Memory usage: <50MB additional for snapshot metadata

**Quality Metrics**:
- Accidental data loss reports: 0
- Confusion-related support tickets: <5% of total
- User satisfaction with feature: >4.0/5.0

---

## 12. Open Questions & Future Considerations

### Open Questions:

1. **Should snapshots be immutable after creation?**
   - Pro: Preserves history integrity
   - Con: Can't fix mistakes in past snapshots
   - Recommendation: Immutable, but allow "amend" for last snapshot

2. **How to handle node type / edge type changes across snapshots?**
   - If types are modified, do old snapshots update?
   - Recommendation: Types versioned with snapshots (each snapshot has its own type definitions)

3. **Should viewport position be saved per snapshot?**
   - Pro: Contextual viewing
   - Con: Can be disorienting
   - Recommendation: Configurable, default to "fit view" on switch

4. **Maximum snapshots per document?**
   - Technical limit to prevent performance issues
   - Recommendation: 500 snapshots hard limit, warning at 100

### Future Enhancements:

1. **Snapshot Templates**:
   - Save snapshot as reusable template
   - Apply template structure to new snapshot

2. **Conditional Snapshots**:
   - Auto-create snapshot when specific conditions met
   - E.g., "snapshot when >50 actors"

3. **Snapshot Metadata**:
   - Add tags, categories, colors
   - Custom metadata fields
   - Link to external documentation

4. **Timeline Views**:
   - Calendar view (snapshots by date)
   - Tree view (hierarchical)
   - Graph view (current visualization)
   - List view (table with metadata)

5. **Export Formats**:
   - Export timeline as image
   - Export snapshot progression as slides
   - Export as git repository (for version control enthusiasts)

6. **AI-Assisted Features**:
   - Auto-suggest snapshot names based on changes
   - Detect significant changes warranting snapshot
   - Recommend consolidation opportunities

---

## Appendix A: Terminology Glossary

| Term | Definition | User-Facing? |
|------|------------|--------------|
| Snapshot | A saved state of the graph at a specific moment | Yes |
| Timeline | Visual representation of snapshot history | Yes |
| Branch | A diverging path from a snapshot | Yes |
| Active Snapshot | The currently displayed and editable version | Yes |
| Parent Snapshot | The snapshot from which another was created | Partially (internal) |
| Re-parenting | Changing the parent of a snapshot | No (action-based) |
| Keyframe | Full snapshot stored for performance (not delta) | No (internal) |
| Delta | Incremental changes from parent snapshot | No (internal) |
| Lineage | The ancestral path of a snapshot | Partially (visual only) |

---

## Appendix B: Sample User Scenarios

### Scenario 1: Academic Researcher
**User**: Dr. Emily, analyzing organizational networks

**Goal**: Track evolution of team dynamics over semester

**Usage Pattern**:
- Creates snapshot at start of each week (16 total)
- Reviews progression at end of semester
- Exports timeline as part of research paper
- Branches at week 8 to explore "what if" reorganization

**Key Features Used**:
- Manual snapshot creation
- Timeline playback
- Comparison view
- Export functionality

### Scenario 2: Business Analyst
**User**: Marcus, mapping stakeholder relationships

**Goal**: Present multiple strategic options to leadership

**Usage Pattern**:
- Creates initial stakeholder map
- Branches into 3 scenarios: "Status Quo", "Reorganization", "External Partnership"
- Develops each branch independently
- Uses comparison to highlight differences
- Exports each branch as separate presentation

**Key Features Used**:
- Branching
- Branch management
- Comparison
- Export per branch

### Scenario 3: Software Architect
**User**: Priya, designing system architecture

**Goal**: Document architectural evolution and decision points

**Usage Pattern**:
- Creates snapshot for each major design iteration
- Adds detailed descriptions explaining rationale
- Uses tags: "approved", "prototype", "rejected"
- Keeps rejected options for future reference
- Shares with team via exported timeline

**Key Features Used**:
- Snapshots with descriptions
- Tagging (future feature)
- Historical preservation
- Team sharing

---

## Conclusion

This UX concept provides a comprehensive foundation for implementing multi-version graph support in Constellation Analyzer. The design balances:

- **Simplicity** for casual users who want basic versioning
- **Power** for advanced users exploring complex scenarios
- **Clarity** through visual timeline representation
- **Safety** via non-destructive editing and confirmations
- **Performance** through optimizations for large version graphs

The phased implementation approach allows for iterative development and user feedback integration. Starting with a simple linear timeline (Phase 1) establishes the foundation, while later phases add sophisticated branching and comparison capabilities.

**Next Steps**:
1. Review and validate concept with stakeholders
2. Create high-fidelity mockups for Phase 1
3. Develop data model and storage strategy
4. Build Phase 1 prototype
5. Conduct usability testing
6. Iterate based on feedback

---

**Document Version**: 1.0
**Date**: October 11, 2025
**Author**: UX Design Team
**Status**: Proposal for Review
