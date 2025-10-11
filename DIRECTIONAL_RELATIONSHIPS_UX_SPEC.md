# Directional Relationships - UX Design Specification

## Executive Summary

This document outlines the UX design for implementing directional relationships in Constellation Analyzer. The design focuses on providing clear visual feedback, intuitive controls, and minimal friction for users working with directed, bidirectional, and undirected relationships.

---

## 1. Visual Representation on Graph Canvas

### 1.1 Arrow Marker Styles

**Directed Relationships (A → B)**
- Single arrowhead at target end
- Standard SVG marker with solid fill matching edge color
- Marker size: 8x8px (scales with zoom but maintains readability)
- Positioned 6px from target node edge to prevent overlap

**Bidirectional Relationships (A ↔ B)**
- Arrowheads at both source and target ends
- Same styling as directed arrows
- Both markers use same color as edge

**Undirected Relationships (A — B)**
- No arrow markers
- Edge styling unchanged from current implementation
- Visual distinction through absence of markers

### 1.2 Edge Rendering Implementation

**Current State:** React Flow's BaseEdge with Bezier curves
**Enhancement:** Add markerStart and markerEnd attributes to SVG path

```typescript
// Marker definitions in SVG defs
<defs>
  <marker id="arrow-{edgeColor}" viewBox="0 0 10 10"
          refX="8" refY="5" markerWidth="8" markerHeight="8"
          orient="auto" fill="{edgeColor}">
    <path d="M 0 0 L 10 5 L 0 10 z" />
  </marker>
</defs>

// Applied to edge path
markerEnd: directionality === 'directed' || directionality === 'bidirectional'
           ? `url(#arrow-${edgeColor})` : undefined
markerStart: directionality === 'bidirectional'
           ? `url(#arrow-${edgeColor})` : undefined
```

### 1.3 Visual Feedback During Edge Creation

When user drags to create a new edge:
- Show preview with arrow based on default directionality for selected relation type
- Connection line includes appropriate markers in real-time
- Provides immediate feedback about relationship direction

---

## 2. Property Panel Controls

### 2.1 Layout Structure (Edge Properties View)

**Current Layout:**
```
[Relation Type] ← dropdown
[Custom Label]  ← text input
[Connection Info] ← From/To display
[Delete Button] ← action button
```

**Enhanced Layout:**
```
[Relation Type] ← dropdown
[Custom Label]  ← text input (optional)

--- NEW SECTION ---
[Directionality] ← segmented button group (3 options)
[Direction Controls] ← conditional: show reverse button for directed
--- END NEW ---

[Connection Info] ← From/To display with enhanced directionality info
[Delete Button] ← action button
```

### 2.2 Directionality Control Component

**Component Type:** MUI ToggleButtonGroup (segmented control)

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│ Directionality                               │
│ ┌────────┬─────────────┬──────────────┐     │
│ │   →    │     ↔       │      —       │     │
│ │Directed│Bidirectional│  Undirected  │     │
│ └────────┴─────────────┴──────────────┘     │
└──────────────────────────────────────────────┘
```

**States:**
- Active: Blue background (#2196F3), white icon/text
- Inactive: White background, gray text (#666)
- Hover: Light gray background (#F5F5F5)

**Accessibility:**
- ARIA labels: "Directed relationship", "Bidirectional relationship", "Undirected relationship"
- Keyboard navigation: Tab to focus, arrow keys to change selection
- Screen reader announces: "Directionality, {current selection}"

### 2.3 Reverse Direction Control

**Display Condition:** Only shown when directionality = "directed"

**Component Type:** IconButton with swap arrow icon

**Visual Design:**
```
┌──────────────────────────────────────────────┐
│ Direction                                    │
│ ┌──────────────────────────────────────┐    │
│ │  [Actor A]  →  [Actor B]    [⇄]     │    │
│ └──────────────────────────────────────┘    │
│ "Swap source and target"                    │
└──────────────────────────────────────────────┘
```

**Behavior:**
- Click to swap source and target
- Triggers smooth animation on canvas (optional enhancement)
- Updates connection info display immediately
- Adds to undo/redo history as "Reverse Relation Direction"

**Accessibility:**
- ARIA label: "Reverse direction, swap source and target"
- Tooltip: "Reverse Direction (R)" - includes keyboard shortcut
- Keyboard shortcut: R (when edge selected)

### 2.4 Enhanced Connection Info Display

**Current Display:**
```
Connection Info
From: actor-1
To: actor-2
```

**Enhanced Display:**
```
┌──────────────────────────────────────────────┐
│ Connection                                   │
│                                              │
│ [Actor A]  →  [Actor B]      [Reverse ⇄]   │
│                                              │
│ Source: Actor A                              │
│ Target: Actor B                              │
└──────────────────────────────────────────────┘
```

For bidirectional:
```
│ [Actor A]  ↔  [Actor B]                     │
```

For undirected:
```
│ [Actor A]  —  [Actor B]                     │
```

**Visual Enhancements:**
- Actor names are actual labels, not IDs
- Visual arrow indicator matches canvas representation
- Color-coded background for actor badges matching node type colors

---

## 3. Interaction Patterns

### 3.1 Setting Directionality

**Primary Flow:**
1. User selects an edge (click on edge)
2. Right panel opens showing edge properties
3. User clicks appropriate directionality button
4. Change applies immediately (debounced 500ms for history)
5. Canvas updates arrow markers in real-time
6. No "Save" button needed (live updates)

**Default Behavior:**
- New edges inherit default directionality from edge type config
- If not specified, default to "directed"

### 3.2 Reversing Direction

**Flow:**
1. User has directed edge selected
2. User clicks reverse button (or presses R key)
3. Source and target swap in state
4. Canvas updates immediately
5. Connection info display updates
6. Action added to undo/redo history

**Visual Feedback:**
- Brief highlight animation on edge (optional)
- Reverse button shows brief "pressed" state
- Toast notification: "Direction reversed" (optional, may be too noisy)

### 3.3 Keyboard Shortcuts

**New Shortcuts:**
- `D` - Set selected edge to Directed
- `B` - Set selected edge to Bidirectional
- `U` - Set selected edge to Undirected
- `R` - Reverse direction (directed edges only)

**Shortcut Display:**
- Add to keyboard shortcuts help dialog
- Show in tooltips for directionality buttons
- Disabled state when no edge selected

### 3.4 Bulk Operations (Future Enhancement)

When multiple edges selected:
- Directionality controls affect all selected edges
- Reverse button reverses all directed edges
- Confirmation dialog for bulk changes (>3 edges)

---

## 4. Edge Type Defaults

### 4.1 Data Model Extension

**Current EdgeTypeConfig:**
```typescript
interface EdgeTypeConfig {
  id: string;
  label: string;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  description?: string;
}
```

**Enhanced EdgeTypeConfig:**
```typescript
interface EdgeTypeConfig {
  id: string;
  label: string;
  color: string;
  style?: 'solid' | 'dashed' | 'dotted';
  description?: string;
  defaultDirectionality?: 'directed' | 'bidirectional' | 'undirected';
}
```

### 4.2 Edge Type Manager UI Enhancement

**Location:** Left Panel > Manage Edge Types dialog

**Addition to Edge Type Form:**
```
┌──────────────────────────────────────────────┐
│ Default Directionality                       │
│ ┌────────┬─────────────┬──────────────┐     │
│ │   →    │     ↔       │      —       │     │
│ │Directed│Bidirectional│  Undirected  │     │
│ └────────┴─────────────┴──────────────┘     │
│                                              │
│ New relations of this type will use this    │
│ directionality by default                    │
└──────────────────────────────────────────────┘
```

**Recommended Defaults:**
- "influences" → Directed
- "collaborates" → Bidirectional
- "related to" → Undirected
- "reports to" → Directed
- "partners with" → Bidirectional

### 4.3 Smart Defaults Based on Type Name

System can suggest defaults based on relation type label:
- Words like "leads", "manages", "influences" → Directed
- Words like "collaborates", "partners", "exchanges" → Bidirectional
- Words like "related", "associated", "connected" → Undirected

Display suggestion in UI: "Suggested: Directed (based on type name)"

---

## 5. Information Display

### 5.1 Edge Label Display on Canvas

**Current:** Shows custom label or type label in white box at edge midpoint

**Enhancement:** Add directional indicator in label (optional)

```
┌─────────────────┐
│ influences   →  │  ← directed
└─────────────────┘

┌─────────────────┐
│ collaborates ↔  │  ← bidirectional
└─────────────────┘

┌─────────────────┐
│ related to      │  ← undirected (no indicator)
└─────────────────┘
```

**Implementation Note:** This is subtle and optional - arrows on edge path may be sufficient.

### 5.2 Connection List (Actor Properties)

**Location:** Right Panel > Actor Properties > Connections section

**Current Display:**
```
Connections (3)
• influences → actor-2
• collaborates ← actor-3
• related to → actor-4
```

**Enhanced Display:**
```
┌──────────────────────────────────────────┐
│ Connections (3)                          │
│                                          │
│ → influences Developer B                │
│    Directed outgoing                     │
│                                          │
│ ↔ collaborates with Manager A           │
│    Bidirectional                         │
│                                          │
│ — related to Stakeholder C              │
│    Undirected                            │
└──────────────────────────────────────────┘
```

**Visual Elements:**
- Leading icon shows directionality type
- Text indicates direction relative to selected node
- Subtle background color per relation type
- Click to select that edge

### 5.3 Graph Metrics Panel

**Location:** Right Panel (when nothing selected)

**Addition to Metrics:**
```
┌──────────────────────────────────────────┐
│ Graph Analysis                           │
│                                          │
│ Relations                                │
│ • Total: 15                             │
│ • Directed: 8 (53%)                     │
│ • Bidirectional: 5 (33%)                │
│ • Undirected: 2 (14%)                   │
│                                          │
│ [existing metrics...]                   │
└──────────────────────────────────────────┘
```

---

## 6. User Feedback Mechanisms

### 6.1 Visual Feedback States

**Edge Selection:**
- Selected edge: Thicker stroke (3px → 4px)
- Selected edge with directionality: Arrows slightly larger
- Hover: Subtle glow effect (box-shadow)

**Property Panel:**
- Active directionality button: Blue background with animation
- Saving indicator: "Saving changes..." (existing pattern)
- Success: No notification (silent success for live updates)

### 6.2 Status Indicators

**Edge Creation:**
- As user drags from node handle, preview edge shows default directionality
- Tooltip near cursor: "Creating [EdgeType] relation →"

**Edge Modification:**
- Undo toast: "Changed to bidirectional" with undo link
- Error states: "Cannot reverse undirected relation" (if user attempts)

### 6.3 Help Text

**Property Panel Help:**
- Directionality section includes info icon (ℹ️)
- Click shows tooltip: "Set how this relationship flows between actors. Directed flows one way, bidirectional flows both ways, and undirected has no specific direction."

**First-Time User Experience:**
- When user creates first edge, show brief highlight on directionality control
- Optional: One-time tooltip "Choose relationship direction"

---

## 7. Accessibility Considerations

### 7.1 Screen Reader Support

**Edge Selection:**
```
"Relation selected: influences, directed from Actor A to Actor B"
```

**Directionality Change:**
```
"Directionality changed to bidirectional. Relation now flows both ways between Actor A and Actor B"
```

**Reverse Action:**
```
"Direction reversed. Relation now flows from Actor B to Actor A"
```

### 7.2 Keyboard Navigation

**Tab Order in Properties Panel:**
1. Relation Type dropdown
2. Custom Label input
3. Directionality toggle group (arrow keys to change)
4. Reverse button (if directed)
5. Delete button

**Focus Indicators:**
- Clear blue outline (2px) on focused elements
- Toggle buttons show focus state distinct from selection

### 7.3 Color Contrast

**Arrow Markers:**
- Maintain sufficient contrast against canvas background
- Minimum 3:1 contrast ratio for graphical objects (WCAG 2.1)
- Consider edge color when rendering markers

**Controls:**
- Active state: Blue (#2196F3) on white - 4.5:1 ratio ✓
- Inactive state: Gray (#666) on white - 5.7:1 ratio ✓

### 7.4 Visual Indicators Beyond Color

**Directionality not solely dependent on color:**
- Arrow shape conveys meaning
- Text labels supplement visual indicators
- Icon + text in toggle buttons

---

## 8. Implementation Priority

### Phase 1: Core Functionality (MVP)
1. Add directionality field to RelationData type
2. Implement arrow markers on canvas (CustomEdge component)
3. Add directionality toggle in property panel
4. Update edge creation to use default directionality

**User Value:** Basic directional relationships working end-to-end

### Phase 2: Enhanced Controls
1. Add reverse direction button
2. Implement keyboard shortcuts (D, B, U, R)
3. Add defaultDirectionality to EdgeTypeConfig
4. Update Edge Type Manager with default setting

**User Value:** Efficient editing and sensible defaults

### Phase 3: Visual Polish
1. Enhanced connection info display with visual indicators
2. Update connections list in actor properties
3. Add directionality breakdown to graph metrics
4. Improve arrow marker styling (size, positioning)

**User Value:** Better information display and understanding

### Phase 4: Advanced Features
1. Bulk directionality operations
2. Smart default suggestions based on type name
3. Visual animations for direction changes
4. Export/import with directionality data

**User Value:** Advanced workflows and refinements

---

## 9. Edge Cases & Error Handling

### 9.1 Self-Referencing Edges

**Issue:** Edge where source === target

**Solution:**
- Allow all directionality types
- Render with loop path (React Flow built-in)
- Arrow direction still meaningful (self-influence)

### 9.2 Duplicate Edges

**Issue:** Multiple edges between same two nodes

**Current:** Already supported (different edge IDs)

**Enhancement:**
- Visual offset for parallel edges (React Flow handles)
- Directionality independent per edge
- Example: A → B (influences) and A ← B (reports to) both valid

### 9.3 Migration of Existing Data

**Issue:** Existing edges have no directionality field

**Solution:**
```typescript
// Default to 'directed' for backwards compatibility
const directionality = edge.data?.directionality || 'directed';
```

**Migration Script (optional):**
- Add directionality field to all existing edges
- Set based on edge type default if available
- Otherwise, default to 'directed'

### 9.4 Invalid States

**Prevention:**
- TypeScript types enforce valid directionality values
- Toggle group only allows 3 options
- Reverse button disabled for non-directed edges

### 9.5 Performance Considerations

**Arrow Markers:**
- Create marker definitions once in SVG defs
- Reference by ID (efficient SVG pattern)
- One marker definition per color (shared across edges)

**Rendering:**
- React Flow handles efficient re-rendering
- Memo CustomEdge component (already implemented)
- No performance impact expected

---

## 10. Testing Checklist

### 10.1 Functional Tests

- [ ] Create directed edge, verify arrow at target
- [ ] Create bidirectional edge, verify arrows at both ends
- [ ] Create undirected edge, verify no arrows
- [ ] Change directionality via toggle buttons
- [ ] Reverse direction, verify source/target swap
- [ ] Edge type default directionality applies to new edges
- [ ] Keyboard shortcuts work (D, B, U, R)
- [ ] Undo/redo preserves directionality changes
- [ ] Export/import preserves directionality data

### 10.2 Visual Tests

- [ ] Arrows render at correct size and position
- [ ] Arrow color matches edge color
- [ ] Selected edge shows enhanced visual feedback
- [ ] Connection info display shows correct arrows
- [ ] Graph metrics show directionality breakdown
- [ ] Edge labels (optional arrows) display correctly

### 10.3 Accessibility Tests

- [ ] Screen reader announces directionality
- [ ] Keyboard navigation through controls works
- [ ] Focus indicators visible on all interactive elements
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Arrow markers distinguishable without color

### 10.4 Edge Cases

- [ ] Self-referencing edges render correctly
- [ ] Multiple edges between same nodes work
- [ ] Existing data without directionality field loads
- [ ] Very long edge labels don't break layout
- [ ] Rapid directionality changes don't cause issues

---

## 11. User Documentation

### 11.1 Help Dialog Addition

**Section: Editing Relations**

```
Relationship Direction

Constellation Analyzer supports three types of relationship directionality:

• Directed (→): One-way relationships that flow from source to target
  Example: "Actor A influences Actor B"

• Bidirectional (↔): Two-way relationships that flow in both directions
  Example: "Actor A collaborates with Actor B"

• Undirected (—): Relationships without a specific direction
  Example: "Actor A is related to Actor B"

To set directionality:
1. Select a relation on the canvas
2. In the properties panel, choose the directionality type
3. For directed relations, use the Reverse button to swap direction

Keyboard Shortcuts:
D - Set to Directed
B - Set to Bidirectional
U - Set to Undirected
R - Reverse direction
```

### 11.2 Tooltips

**Property Panel:**
- Directionality info icon: "Control how this relationship flows between actors"
- Reverse button: "Reverse Direction (R) - Swap source and target actors"
- Directed button: "Directed (D) - One-way relationship"
- Bidirectional button: "Bidirectional (B) - Two-way relationship"
- Undirected button: "Undirected (U) - No specific direction"

---

## 12. Design Rationale

### 12.1 Why Segmented Control for Directionality?

**Decision:** Use MUI ToggleButtonGroup instead of dropdown or radio buttons

**Rationale:**
- Visual representation of options (icons + labels)
- Common pattern for mutually exclusive choices
- Faster interaction than dropdown (no need to open/close)
- Icons provide immediate recognition (→, ↔, —)
- Fits well within panel width constraints (~320px)

### 12.2 Why Inline Reverse Button?

**Decision:** Place reverse button next to connection info, not in separate section

**Rationale:**
- Contextual to the information being reversed
- Common pattern (Gmail's "Swap" button in email composition)
- Doesn't clutter the main directionality control
- Only appears when relevant (directed edges)
- Visual proximity to source/target display reinforces what it does

### 12.3 Why Live Updates Instead of Save Button?

**Decision:** Maintain existing pattern of live property updates

**Rationale:**
- Consistency with existing edge/node property editing
- Reduces friction (fewer clicks)
- Undo/redo provides safety net for mistakes
- Modern pattern (Google Docs, Figma, etc.)
- Debounced updates prevent history spam

### 12.4 Why Default to Directed?

**Decision:** Default new edges to "directed" when no type default specified

**Rationale:**
- Most common use case in constellation analyses
- Directionality is often meaningful (influence, reports to, etc.)
- Easy to change to bidirectional or undirected if needed
- Backwards compatible with existing mental models
- Forces users to think about relationship direction

### 12.5 Why Show Arrows on Canvas?

**Decision:** Use arrow markers instead of subtle visual indicators

**Rationale:**
- Immediately clear and unambiguous
- Standard graph visualization convention
- Works at all zoom levels
- No learning curve (universal symbol)
- Screen reader compatible (can be described)

---

## 13. Future Enhancements

### 13.1 Conditional Directionality

**Concept:** Directionality that changes based on context or time

**Example:** "influences" might be bidirectional in some scenarios, directed in others

**UI Addition:** "Conditional" option with rule builder

**Priority:** Low (advanced use case)

### 13.2 Weighted Directionality

**Concept:** Different strengths for each direction in bidirectional relationships

**Example:** A → B (strong), B → A (weak) shown as thicker/thinner arrows

**UI Addition:** Slider controls for each direction strength

**Priority:** Medium (useful for advanced analysis)

### 13.3 Visual Edge Routing

**Concept:** Curved paths that better indicate directionality

**Example:** Arcing paths that visually "flow" from source to target

**Implementation:** Custom edge routing algorithm

**Priority:** Low (aesthetic improvement)

### 13.4 Directional Filtering

**Concept:** Filter graph to show only certain directionality types

**Example:** "Show only bidirectional relationships"

**UI Location:** Toolbar filter dropdown

**Priority:** Medium (useful for large graphs)

### 13.5 Directional Analytics

**Concept:** Advanced metrics based on relationship direction

**Example:**
- Actors with most incoming directed edges (influenced by many)
- Actors with most outgoing directed edges (influence many)
- Bidirectional relationship clusters

**UI Location:** Graph Metrics panel, new "Directional Analysis" section

**Priority:** Medium (valuable for analysis)

---

## Files to Modify

### TypeScript Types
- `/home/jbruhn/dev/constellation-analyzer/src/types/index.ts`
  - Add `directionality` field to `RelationData`
  - Add `defaultDirectionality` field to `EdgeTypeConfig`

### Components
- `/home/jbruhn/dev/constellation-analyzer/src/components/Edges/CustomEdge.tsx`
  - Add arrow marker rendering logic
  - Handle directionality prop

- `/home/jbruhn/dev/constellation-analyzer/src/components/Panels/RightPanel.tsx`
  - Add directionality toggle group
  - Add reverse direction button
  - Update connection info display

### Stores
- Store files (need to verify exact location)
  - Add directionality handling in edge operations

### Utilities
- Edge creation utilities
  - Apply default directionality from edge type config

---

## Conclusion

This UX specification provides a comprehensive, user-centered approach to implementing directional relationships in Constellation Analyzer. The design prioritizes:

1. **Clarity**: Visual arrows and clear controls make directionality obvious
2. **Efficiency**: Keyboard shortcuts and live updates reduce friction
3. **Consistency**: Follows existing MUI-based design patterns
4. **Accessibility**: Screen reader support and keyboard navigation throughout
5. **Flexibility**: Supports all three directionality modes with sensible defaults

The phased implementation approach allows for incremental delivery of value while maintaining code quality and user experience standards.
