# Edge Overlap UX Design Proposal
## Constellation Analyzer - Handling Overlapping Edges

**Date:** 2026-02-05
**Status:** Proposal
**Problem:** When multiple relations exist between the same two nodes, or when edges cross each other, they overlap and become difficult to distinguish, select, or understand.

---

## Current Implementation Analysis

### What We Have
The codebase uses **@xyflow/react** (React Flow v12) with custom edge rendering:

1. **CustomEdge component** (`src/components/Edges/CustomEdge.tsx`)
   - Renders edges as cubic Bezier curves
   - Uses `getFloatingEdgeParams()` for calculating intersection points with various node shapes
   - Supports directional arrows (directed, bidirectional, undirected)
   - Shows edge labels with type indicators and custom text
   - Implements visual filtering with opacity changes

2. **Edge Routing** (`src/utils/edgeUtils.ts`)
   - Smart shape-aware intersection calculation (circle, ellipse, pill, rounded rectangle)
   - Bezier curves with control points at 40% of inter-node distance
   - Single path between any two nodes - no multi-edge handling

3. **Edge Aggregation for Groups**
   - When groups are minimized, multiple internal edges are aggregated into a single edge
   - Shows count badge (e.g., "5 relations")
   - Uses neutral gray color for aggregated edges

### Current Gaps
- **No offset for parallel edges**: Multiple edges between same nodes overlap completely
- **No edge crossing detection**: Edges can cross over each other with no visual differentiation
- **Selection challenges**: Overlapping edges are hard to click/select
- **Visual clutter**: Dense graphs become illegible with many crossing edges

---

## Research: Best Practices for Edge Overlap

### Industry Standards

1. **Dagre/Graphviz Approach**
   - Hierarchical edge routing with splines
   - Edge bundling for crossing edges
   - Used by: Mermaid, PlantUML

2. **Force-Directed Graphs (D3, Cytoscape)**
   - Physics-based layout to minimize crossings
   - Edge bundling for hierarchical structures
   - Used by: Neo4j Browser, Gephi

3. **Network Diagram Tools (Draw.io, Lucidchart)**
   - Manual routing with waypoints
   - Orthogonal connectors (90-degree angles)
   - Automatic routing around obstacles

4. **React Flow Patterns**
   - Edge offset for parallel edges
   - Custom edge components with hover states
   - Edge label positioning to avoid overlap

### User Expectations from Similar Tools

**Graph Databases (Neo4j, ArangoDB)**
- Clear visual separation between parallel edges
- Interactive hover to highlight connection paths
- Edge bundling for many-to-many relationships

**Diagramming Tools (Miro, FigJam)**
- Smooth bezier curves with collision avoidance
- Hover states that bring edges to front
- Smart label positioning

**Network Analysis (Gephi, Cytoscape)**
- Edge bundling for dense areas
- Opacity/width to show edge importance
- Interactive filtering to reduce visual noise

---

## Design Solution 1: Parallel Edge Offset (Recommended)

### Visual Approach
**Offset parallel edges** with curved paths that arc away from the center line between nodes.

#### Implementation Details
- When multiple edges exist between same source/target, calculate offset curves
- Use consistent offset distance (e.g., 30px) that scales with zoom
- Maximum of 3 parallel edges visible; beyond that, show aggregation badge
- Bidirectional edges use center position (no offset)

#### Visual Example (ASCII)
```
    A ─────────────→ B    (Single edge: straight bezier)

    A ═══════════⟩  B    (Multiple edges: curved offsets)
      ⟨─────────────
```

#### Interaction Patterns

**Selection**
- Click tolerance increases for offset edges (larger hit area)
- Selected edge highlighted with thicker stroke (3px -> 4px)
- Non-selected parallel edges dim to 50% opacity
- Hover shows all parallel edges with tooltip

**Hover States**
- Individual edge highlight on hover
- Show edge type and label in tooltip
- Dim other edges to 30% opacity
- Bring hovered edge to top layer (z-index manipulation)

**Multi-Edge Badge**
- Show count when 4+ edges between same nodes: "4 relations"
- Click badge to expand into offset view
- Badge position: midpoint of straight line between nodes
- Color: use neutral gray (matches aggregation pattern)

#### Accessibility Considerations

**Keyboard Navigation**
- Tab through edges in document order (source node ID order)
- Arrow keys to navigate between parallel edges
- Space/Enter to select edge
- Screen reader announces: "Relation 2 of 4 from Person A to Organization B, Collaborates type"

**Screen Readers**
- Edge count announced: "4 relations between nodes"
- Each edge individually focusable and describable
- Alternative text includes source, target, type, and label

**Color Contrast**
- Maintain WCAG AA standards (4.5:1 for text, 3:1 for UI components)
- Don't rely solely on color - use patterns (dashed/dotted) and labels
- High contrast mode: increase stroke width and use distinct patterns

**Motor Impairments**
- Larger click targets (minimum 44x44px according to WCAG 2.1 AAA)
- Increase hover tolerance for parallel edges
- Longer hover delay before tooltip appears (300ms)

#### Implementation Complexity

**Effort: Medium (3-5 days)**

**Changes Required:**
1. Modify `getFloatingEdgeParams()` to accept edge index parameter
2. Add offset calculation to bezier control points
3. Update `GraphEditor` to detect parallel edges and pass index
4. Create edge grouping utility function
5. Update CustomEdge to handle offset rendering
6. Add hover state management for edge groups

**Benefits:**
- Clear visual distinction between parallel edges
- Minimal performance impact (mathematical calculation only)
- Consistent with user expectations from diagramming tools
- Works at all zoom levels
- Preserves existing edge aggregation for groups

**Trade-offs:**
- Visual complexity increases with many parallel edges
- Requires recalculation when edges added/removed
- May need edge limit policy (e.g., max 5 visible, then aggregate)

---

## Design Solution 2: Edge Bundling with Interaction

### Visual Approach
**Bundle overlapping edges** into a single visual path that expands on interaction.

#### Implementation Details
- Detect edge clusters (edges that cross within 20px threshold)
- Render as single thick edge with width indicating count
- On hover, "explode" bundle into individual edges with labels
- Use color gradient to show multiple edge types in bundle

#### Visual Example (ASCII)
```
Default State:
    A ══════════════⟩ B    (Thick bundle: 5 edges)

Hover/Expanded State:
    A ═══════════⟩  B
      ───────────→
      ─ ─ ─ ─ ─→
      · · · · · →
      ⟨─────────
```

#### Interaction Patterns

**Default State**
- Show edge count badge on bundle
- Use widest stroke width to indicate bundle (4-8px)
- Color: blend of constituent edge types (or neutral gray)

**Hover State**
- Animate expansion into individual offset edges (300ms transition)
- Show all edge labels
- Individual edges selectable in expanded state
- Background blur/dim for focus

**Selection**
- Click bundle to expand permanently until deselected
- Click individual edge when expanded to select it
- Selected edge shows properties panel
- Double-click bundle to "pin" expansion

**Touch Devices**
- Tap bundle to expand
- Tap again to collapse
- Long-press for context menu
- Pinch to zoom focuses on bundle

#### Accessibility Considerations

**Keyboard Navigation**
- Tab to bundle
- Enter/Space to expand bundle
- Arrow keys to navigate within expanded bundle
- Escape to collapse bundle
- Screen reader: "Edge bundle containing 5 relations. Press Enter to expand."

**Visual Indicators**
- Animated expansion provides visual feedback
- Count badge always visible
- Edge labels appear only when expanded
- High contrast mode: use distinct patterns for bundle indicator

**Cognitive Load**
- Progressive disclosure reduces initial complexity
- Expansion animation helps user track state change
- Consistent interaction pattern across all bundles
- Visual hierarchy: bundles stand out in dense graphs

#### Implementation Complexity

**Effort: High (7-10 days)**

**Changes Required:**
1. Create edge clustering algorithm (detect overlapping edges)
2. Build BundledEdge component with expansion animation
3. Add state management for expanded/collapsed bundles
4. Implement hover detection and animation system
5. Create bundle label component with count badge
6. Update selection logic to handle bundle vs individual edge
7. Performance optimization for large graphs (edge clustering can be expensive)

**Benefits:**
- Dramatically reduces visual clutter in dense graphs
- Progressive disclosure matches user intent
- Scalable to very large graphs
- Innovative UX that stands out
- Reduces cognitive load in default state

**Trade-offs:**
- Higher implementation complexity
- Requires state management for bundle expansion
- Animation performance concerns on large graphs
- May confuse users unfamiliar with the pattern
- Edge clustering algorithm is computationally expensive

---

## Design Solution 3: Smart Edge Routing with Collision Avoidance

### Visual Approach
**Automatically route edges** around nodes and other edges to minimize crossings.

#### Implementation Details
- Use A* pathfinding or similar algorithm to route edges
- Create orthogonal or curved paths that avoid node boundaries
- Calculate collision-free paths on layout change
- Option to manually add waypoints for fine-tuning

#### Visual Example (ASCII)
```
Default:
    A → B → C
    ↓       ↓
    D → E → F

With Smart Routing:
    A → B → C
    ↓   ↓   ↓
    D ←─╯   ↓
    ↓       ↓
    └─→ E → F
```

#### Interaction Patterns

**Automatic Routing**
- Edges automatically reroute when nodes move
- Smooth animation (300ms) when path changes
- Maintain edge label positions at path midpoints
- Option to disable auto-routing (manual mode)

**Manual Waypoints**
- Double-click edge to add waypoint
- Drag waypoint to adjust path
- Right-click waypoint to remove
- Waypoints persist across sessions

**Path Highlighting**
- Hover edge to highlight entire path
- Show direction arrows along path
- Dim other edges when hovering
- Show path length in tooltip (optional)

**Configuration**
- Toggle between "curved" and "orthogonal" routing
- Adjust routing algorithm sensitivity
- Set collision avoidance distance
- Enable/disable automatic rerouting

#### Accessibility Considerations

**Keyboard Navigation**
- Tab to select edge
- Arrow keys to navigate waypoints
- Delete key to remove waypoint
- Screen reader: "Edge with 3 waypoints. From Person A to Organization B."

**Visual Clarity**
- Orthogonal paths easier to follow than curves
- Clear directional indicators
- Path highlighting on focus
- High contrast mode: thicker paths with distinct patterns

**Cognitive Load**
- Auto-routing reduces manual work
- Can be confusing when paths change automatically
- Manual waypoints give user control
- Learning curve for waypoint editing

#### Implementation Complexity

**Effort: Very High (15-20 days)**

**Changes Required:**
1. Implement edge routing algorithm (A*, Dijkstra, or orthogonal routing)
2. Create waypoint system for manual editing
3. Add collision detection for nodes and edges
4. Implement path smoothing and bezier curve generation
5. Add animation system for path updates
6. Create configuration panel for routing options
7. Performance optimization (routing is CPU-intensive)
8. Handle edge cases (loops, self-edges, complex layouts)

**Benefits:**
- Eliminates edge crossings in most cases
- Professional appearance (like diagramming tools)
- User control through manual waypoints
- Scales to complex graphs
- Industry-standard approach

**Trade-offs:**
- Very high implementation complexity
- Significant performance impact on large graphs
- May produce unexpected routing in complex scenarios
- Requires substantial testing and edge case handling
- Can feel "overengineered" for simple graphs
- Breaking change from existing bezier curve UX

---

## Recommendation: Solution 1 (Parallel Edge Offset)

### Rationale

After analyzing the three solutions against project requirements, I recommend **Solution 1: Parallel Edge Offset** for the following reasons:

#### 1. **Best Effort/Value Ratio**
- **Medium complexity** (3-5 days) vs High (7-10 days) or Very High (15-20 days)
- Solves the primary problem: parallel edges between same nodes
- Incremental improvement that doesn't require architectural changes

#### 2. **Preserves Existing UX Patterns**
- Maintains current bezier curve style
- Consistent with existing group aggregation behavior
- No breaking changes to user workflows
- Works within React Flow's existing architecture

#### 3. **User-Centered Design**
- Immediate visual clarity for parallel edges
- Familiar pattern from other diagramming tools (Draw.io, Miro)
- Low learning curve
- Accessible with keyboard and screen readers

#### 4. **Performance**
- Pure mathematical calculation (no expensive algorithms)
- Scales well to large graphs (O(n) complexity)
- No animation/state management overhead
- Works at all zoom levels without recalculation

#### 5. **Accessibility**
- WCAG AA compliant
- Screen reader support straightforward
- Keyboard navigation well-defined
- High contrast mode compatible

#### 6. **Extensibility**
- Foundation for future enhancements
- Can add edge bundling later if needed
- Compatible with future smart routing
- Doesn't preclude other solutions

### Implementation Plan

#### Phase 1: Core Offset Logic (Day 1-2)
1. Create `calculateEdgeOffset()` utility function
2. Detect parallel edges in `GraphEditor`
3. Pass offset index to `CustomEdge` component
4. Modify `getFloatingEdgeParams()` to accept offset parameter
5. Calculate perpendicular offset for bezier control points

#### Phase 2: Visual Refinement (Day 2-3)
1. Implement hover states for parallel edge groups
2. Add selection highlighting
3. Create edge count badge component (for 4+ edges)
4. Test at different zoom levels
5. Ensure labels don't overlap

#### Phase 3: Interaction & Accessibility (Day 3-4)
1. Keyboard navigation for parallel edges
2. Screen reader announcements
3. Click tolerance adjustment
4. Tooltip improvements
5. High contrast mode testing

#### Phase 4: Testing & Documentation (Day 4-5)
1. Unit tests for offset calculation
2. Integration tests for edge groups
3. Visual regression tests
4. User documentation
5. Code review and refinement

### Success Metrics

**Visual Clarity**
- Parallel edges clearly distinguishable at all zoom levels
- No overlap between offset curves
- Labels remain readable

**Interaction Quality**
- Click target accuracy > 95% for offset edges
- Hover states respond within 100ms
- Keyboard navigation covers all edges

**Performance**
- No frame rate impact on graphs up to 500 edges
- Edge offset calculation < 5ms per edge
- Zoom/pan remains smooth

**Accessibility**
- WCAG AA compliance verified
- Screen reader testing with NVDA/JAWS
- Keyboard-only navigation successful
- High contrast mode functional

---

## Future Enhancements

After implementing Solution 1, consider these incremental improvements:

### Short-term (1-3 months)
1. **Edge hover tooltips**: Show full edge information on hover
2. **Edge filtering**: Hide edges by type/label to reduce clutter
3. **Edge path highlighting**: Show full path on selection
4. **Curved edge labels**: Orient labels along curve path

### Medium-term (3-6 months)
1. **Edge bundling** (Solution 2): For dense graphs with many crossings
2. **Edge strength visualization**: Vary width/opacity by strength property
3. **Edge animation**: Flowing particles to show direction/activity
4. **Edge grouping controls**: Manual grouping/ungrouping

### Long-term (6-12 months)
1. **Smart routing** (Solution 3): Optional for complex layouts
2. **Layout algorithms**: Auto-arrange to minimize crossings
3. **Edge styles library**: More edge type options (elbow, stepped, etc.)
4. **3D graph view**: For very complex networks

---

## Appendix: Technical Specifications

### Edge Offset Calculation Algorithm

```typescript
/**
 * Calculate perpendicular offset for parallel edges
 * @param sourcePos Source node position
 * @param targetPos Target node position
 * @param edgeIndex Index in parallel edge group (0 = center, 1 = first offset, 2 = second offset)
 * @param offsetDistance Base offset distance in pixels (default 30)
 * @returns Offset vector { x, y }
 */
function calculateEdgeOffset(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  edgeIndex: number,
  offsetDistance: number = 30
): { x: number; y: number } {
  // Calculate edge direction vector
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return { x: 0, y: 0 };

  // Normalize
  const nx = dx / length;
  const ny = dy / length;

  // Perpendicular vector (rotate 90 degrees)
  const perpX = -ny;
  const perpY = nx;

  // Alternate sides for even/odd indices
  // 0: center (no offset)
  // 1: +offset (top/right side)
  // 2: -offset (bottom/left side)
  // 3: +offset * 2 (further top/right)
  // 4: -offset * 2 (further bottom/left)
  const side = edgeIndex % 2 === 0 ? -1 : 1;
  const magnitude = Math.ceil(edgeIndex / 2);
  const offset = side * magnitude * offsetDistance;

  return {
    x: perpX * offset,
    y: perpY * offset
  };
}
```

### Edge Grouping Detection

```typescript
/**
 * Group edges by source-target pair
 * @param edges Array of all edges
 * @returns Map of edge groups, keyed by "sourceId_targetId"
 */
function groupParallelEdges(edges: Relation[]): Map<string, Relation[]> {
  const groups = new Map<string, Relation[]>();

  edges.forEach(edge => {
    // Normalize key: always alphabetically sorted for bidirectional grouping
    const key = [edge.source, edge.target].sort().join('_');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(edge);
  });

  return groups;
}
```

### Performance Considerations

**Memory:**
- Edge offset calculation: O(1) per edge
- Edge grouping: O(n) space for n edges
- Total memory impact: ~50 bytes per edge

**CPU:**
- Offset calculation: ~0.1ms per edge (pure math)
- Grouping detection: O(n) time for n edges
- Total impact: < 100ms for 1000 edges

**Rendering:**
- No additional DOM nodes
- Same SVG path rendering as current implementation
- Z-index manipulation on hover (no re-render)

---

## Conclusion

Implementing **Parallel Edge Offset** (Solution 1) provides the best balance of:
- User experience improvement
- Implementation complexity
- Performance impact
- Accessibility compliance
- Future extensibility

This solution directly addresses the stated problem of overlapping edges between the same two nodes, while maintaining compatibility with the existing codebase architecture and user expectations.

The implementation can be completed in 3-5 days and provides a solid foundation for future enhancements like edge bundling or smart routing if needed.

---

**Next Steps:**
1. Review this proposal with the team
2. Approve implementation plan and timeline
3. Create implementation tickets
4. Begin Phase 1 development
5. Iterate based on user feedback

**Questions or feedback?** Open an issue or discussion on the repository.
