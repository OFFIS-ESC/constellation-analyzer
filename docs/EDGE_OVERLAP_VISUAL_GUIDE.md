# Edge Overlap Visual Design Guide
## Constellation Analyzer - Visual Specifications for Parallel Edge Offset

**Companion Document to:** EDGE_OVERLAP_UX_PROPOSAL.md
**Date:** 2026-02-05

---

## Visual Design Patterns

### 1. Single Edge (Current State)

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │                  │      │
    │  A   │ ─────────────→   │  B   │
    │      │                  │      │
    └──────┘                  └──────┘

    Stroke: 2px
    Color: Based on edge type
    Curve: Cubic Bezier with 40% control point distance
```

**Current Behavior:**
- Clean, simple bezier curve
- Works well for single connections
- Professional appearance

---

### 2. Parallel Edges (Proposed Design)

#### Two Edges Between Same Nodes

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │
    │  A   │                  │  B   │
    │      │  ╰───────────→   │      │
    └──────┘                  └──────┘

    Upper edge: +30px offset
    Lower edge: -30px offset
    Both: 2px stroke
    Curves: Smooth, symmetrical arcs
```

**Visual Properties:**
- Offset: 30px perpendicular to center line
- Arc depth: Proportional to edge length
- Spacing: Consistent at all zoom levels
- Labels: Positioned at curve midpoint

#### Three Edges Between Same Nodes

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭──────────────→│      │
    │  A   │  ────────────────│  B   │ (center, no offset)
    │      │  ╰──────────────→│      │
    └──────┘                  └──────┘

    Top edge: +30px offset
    Center edge: 0px offset (straight bezier)
    Bottom edge: -30px offset
```

**Visual Hierarchy:**
- Center edge is most prominent (straight)
- Offset edges curve away from center
- Equal visual weight for all edges

#### Four+ Edges (Aggregation Badge)

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭──────────────→│      │
    │  A   │  ─────┌───┐─────│  B   │
    │      │  │  4  │  │      │      │
    │      │  ╰────└───┘─────→│      │
    └──────┘                  └──────┘

    Top 3 edges: Visible with offsets
    Badge: "4 relations" at center
    Badge style: Gray pill, white text
    Hover: Expand to show all 4 edges
```

**Badge Design:**
- Background: #6b7280 (gray-500)
- Text: White, 12px, medium weight
- Border radius: 12px (pill shape)
- Padding: 4px 8px
- Shadow: 0 2px 4px rgba(0,0,0,0.1)

---

### 3. Hover States

#### Default State
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │
    │  A   │  ────────────→   │  B   │
    │      │  ╰───────────→   │      │
    └──────┘                  └──────┘

    All edges: 100% opacity
    No highlights
```

#### Hover Single Edge
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │ (30% opacity, dimmed)
    │  A   │  ━━━━━━━━━━━━→   │  B   │ (100% opacity, 3px stroke, highlighted)
    │      │  ╰───────────→   │      │ (30% opacity, dimmed)
    └──────┘                  └──────┘
              ┌─────────────┐
              │ Collaborates│ (Tooltip)
              │  Type: Work │
              └─────────────┘
```

**Hover Behavior:**
- Hovered edge: 3px stroke (from 2px)
- Hovered edge: 100% opacity
- Other parallel edges: 30% opacity
- Tooltip appears after 200ms
- Z-index: Bring hovered edge to top layer

#### Selection State
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │ (50% opacity, dimmed)
    │  A   │  ━━━━━━━━━━━━→   │  B   │ (4px stroke, blue outline, selected)
    │      │  ╰───────────→   │      │ (50% opacity, dimmed)
    └──────┘                  └──────┘

    Selected edge: 4px stroke
    Selected edge: Blue glow (#3b82f6)
    Other parallel edges: 50% opacity
    Selection persists until deselected
```

---

### 4. Bidirectional Edges

#### Bidirectional vs Two Directed Edges

**Bidirectional (Single Edge):**
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │                  │      │
    │  A   │ ⟨────────────⟩   │  B   │
    │      │                  │      │
    └──────┘                  └──────┘

    Single edge with arrows at both ends
    No offset (uses center line)
    Marker-start and marker-end
```

**Two Directed Edges:**
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │
    │  A   │                  │  B   │
    │      │  ╰←──────────╯   │      │
    └──────┘                  └──────┘

    Two separate edges with offsets
    Offset: ±30px
    Each has single arrow
```

**Design Decision:**
- Bidirectional edges: No offset, use center line
- Two separate directed edges: Apply offset
- Visual distinction clear to users
- Preserves semantic meaning

---

### 5. Edge Label Positioning

#### Label on Curved Edge

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭──┌─────────┐→ │      │
    │  A   │    │Collabora.│  │  B   │
    │      │    └─────────┘   │      │
    └──────┘                  └──────┘

    Label positioned at bezier t=0.5 (midpoint)
    Background: White with border
    Padding: 8px 12px
    Font: 12px, medium weight
    Max-width: 200px (wrap text)
```

**Label Collision Avoidance:**
- Labels offset 5px above curve for top edge
- Labels offset 5px below curve for bottom edge
- Center edge: label on curve (existing behavior)
- Labels never overlap edge paths

#### Multiple Labels on Parallel Edges

```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭─┌────────┐──→ │      │
    │  A   │   │Reports To│    │  B   │
    │      │  ─┌──────────┐──→│      │
    │      │   │Collabora.│    │      │
    │      │  ╰┌─────────┐───→│      │
    │      │   │Depends On│    │      │
    └──────┘   └─────────┘    └──────┘

    Labels staggered to prevent overlap
    Each label aligned with its edge curve
    Smart positioning algorithm
```

---

### 6. Zoom Level Behavior

#### Zoom Out (0.5x)
```
  Node A        Node B
   ┌─┐           ┌─┐
   │A│  ╭─────→  │B│
   │ │  ───────→ │ │
   │ │  ╰─────→  │ │
   └─┘           └─┘

   Offset: 30px (constant, not scaled)
   Stroke: 1px (minimum)
   Labels: Hidden or summarized
   Badge: Visible
```

**Design Note:** Offset distance remains constant in screen pixels, creating proportionally larger curves when zoomed out. This maintains visual separation.

#### Zoom In (2.0x)
```
        Node A                                  Node B
    ┌──────────┐                          ┌──────────┐
    │          │  ╭────────────────────→  │          │
    │    A     │                           │    B     │
    │          │  ──────────────────────→  │          │
    │          │                           │          │
    │          │  ╰────────────────────→  │          │
    └──────────┘                          └──────────┘

   Offset: 30px (constant)
   Stroke: 3px (scaled up)
   Labels: Fully visible with more detail
   Curves: More pronounced
```

**Design Note:** At higher zoom, offset appears smaller relative to nodes, but remains visually distinct.

---

### 7. Color and Styling

#### Edge Type Colors (Existing)
```
Collaborates: #3b82f6 (blue)
Reports To:   #10b981 (green)
Depends On:   #f59e0b (orange)
Influences:   #8b5cf6 (purple)
```

#### Edge Styles (Existing)
```
Solid:  ────────────
Dashed: ─ ─ ─ ─ ─ ─
Dotted: · · · · · ·
```

#### New States
```
Default:    stroke-width: 2px, opacity: 1.0
Hover:      stroke-width: 3px, opacity: 1.0
Dimmed:     stroke-width: 2px, opacity: 0.3
Selected:   stroke-width: 4px, opacity: 1.0, glow: #3b82f6
```

#### Aggregation Badge
```
Background: #6b7280
Text:       #ffffff
Border:     None
Shadow:     0 2px 4px rgba(0,0,0,0.1)
```

---

### 8. Accessibility Visual Indicators

#### High Contrast Mode
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╔═══════════⟩   │      │ (4px stroke, solid)
    │  A   │  ═════════════⟩  │  B   │ (4px stroke, dashed)
    │      │  ╚═══════════⟩   │      │ (4px stroke, dotted)
    └──────┘                  └──────┘

    All strokes: 4px (increased from 2px)
    Distinct patterns for each edge type
    Colors: High contrast (black/white basis)
```

#### Focus Indicator (Keyboard Navigation)
```
     Node A                    Node B
    ┌──────┐                  ┌──────┐
    │      │  ╭───────────→   │      │
    │  A   │  ┏━━━━━━━━━━━┓→  │  B   │ (Focus ring: 2px offset)
    │      │  ╰───────────→   │      │
    └──────┘                  └──────┘

    Focus ring: 2px blue outline (#3b82f6)
    Offset: 4px from edge path
    Visible only when focused via keyboard
```

---

### 9. Animation Specifications

#### Edge Creation Animation
```
Frame 0:   Node A ·              Node B
                   ·
                   ·
Frame 1:   Node A ··········     Node B

Frame 2:   Node A ─────────────→ Node B

Duration: 300ms
Easing: ease-out
Effect: Draw from source to target
```

#### Hover Transition
```
Frame 0:   Normal state (2px, 100% opacity)
Frame 1:   Transitioning (2.5px, 100% opacity)
Frame 2:   Hover state (3px, 100% opacity)

Duration: 150ms
Easing: ease-in-out
Effect: Smooth width increase
```

#### Selection Transition
```
Frame 0:   Normal state
Frame 1:   Glow appears (opacity: 0 → 0.5)
Frame 2:   Width increases (2px → 4px)
Frame 3:   Full selection state

Duration: 200ms
Easing: ease-out
Effect: Blue glow + width increase
```

---

### 10. Responsive Behavior

#### Mobile View (< 768px)
```
- Offset distance: 40px (increased for touch targets)
- Stroke width: 3px (increased for visibility)
- Minimum click target: 44x44px
- Labels: Hidden by default, show on tap
- Badge: Always visible
```

#### Tablet View (768px - 1024px)
```
- Offset distance: 35px
- Stroke width: 2px
- Click target: 44x44px
- Labels: Show on hover
- Badge: Visible when 4+ edges
```

#### Desktop View (> 1024px)
```
- Offset distance: 30px (default)
- Stroke width: 2px
- Click target: natural edge width
- Labels: Always visible
- Badge: Visible when 4+ edges
```

---

### 11. Edge Case Visual Handling

#### Self-Loop Edge
```
     Node A
    ┌──────┐
    │      │ ╭─╮
    │  A   │ │ │ (Loop extends 80px from node)
    │      │ ╰─╯
    └──────┘

    Rendered as circular arc
    Extends 80px from node edge
    Arrow points back to source
    Label positioned outside loop
```

#### Very Short Distance Between Nodes
```
    Node A  Node B
    ┌───┐   ┌───┐
    │ A │╭→ │ B │
    │   │╰→ │   │
    └───┘   └───┘

    Offset: Reduced to 15px (50% of default)
    Curves: Sharper to fit space
    Labels: Hidden to prevent overlap
    Badge: Positioned above nodes
```

#### Long Distance Between Nodes
```
    Node A                                               Node B
    ┌───┐                                                ┌───┐
    │ A │  ╭───────────────────────────────────────→    │ B │
    │   │  ─────────────────────────────────────────→   │   │
    │   │  ╰───────────────────────────────────────→    │   │
    └───┘                                                └───┘

    Offset: 30px (constant)
    Curves: Gentle (control point distance capped at 150px)
    Labels: Positioned at midpoint
    Visual: Offset less noticeable but still distinct
```

---

## Design Tokens

### Spacing
```typescript
const EDGE_OFFSET_BASE = 30;        // Base offset in pixels
const EDGE_OFFSET_MOBILE = 40;      // Increased for touch
const EDGE_OFFSET_MIN = 15;         // Minimum for close nodes
const LABEL_OFFSET = 5;             // Label offset from curve
const BADGE_PADDING = '4px 8px';    // Badge internal padding
```

### Strokes
```typescript
const STROKE_DEFAULT = 2;           // Default edge width
const STROKE_HOVER = 3;             // Hovered edge width
const STROKE_SELECTED = 4;          // Selected edge width
const STROKE_DIMMED = 2;            // Width when dimmed (opacity changes)
const STROKE_HIGH_CONTRAST = 4;     // Width in high contrast mode
```

### Opacity
```typescript
const OPACITY_DEFAULT = 1.0;        // Normal edge visibility
const OPACITY_DIMMED = 0.3;         // Non-hovered parallel edges
const OPACITY_SEMI_DIMMED = 0.5;    // Non-selected parallel edges
const OPACITY_FILTERED = 0.2;       // Edges filtered out by search
```

### Colors
```typescript
const COLOR_SELECTION_GLOW = '#3b82f6';     // Blue focus/selection
const COLOR_BADGE_BG = '#6b7280';           // Gray badge background
const COLOR_BADGE_TEXT = '#ffffff';         // White badge text
const COLOR_LABEL_BG = '#ffffff';           // White label background
const COLOR_LABEL_BORDER = '#d1d5db';       // Gray label border
```

### Timing
```typescript
const DURATION_HOVER = 150;         // Hover transition duration (ms)
const DURATION_SELECTION = 200;     // Selection animation duration (ms)
const DURATION_CREATION = 300;      // Edge creation animation (ms)
const DURATION_TOOLTIP_DELAY = 200; // Delay before tooltip appears (ms)
```

### Bezier Curves
```typescript
const CONTROL_POINT_RATIO = 0.4;    // 40% of distance between nodes
const CONTROL_POINT_MIN = 40;       // Minimum control point distance (px)
const CONTROL_POINT_MAX = 150;      // Maximum control point distance (px)
```

---

## Implementation Reference

### CSS Classes (for styled edges)
```css
.edge-default {
  stroke-width: 2px;
  opacity: 1;
  transition: stroke-width 150ms ease-in-out, opacity 150ms ease-in-out;
}

.edge-hover {
  stroke-width: 3px;
  opacity: 1;
  z-index: 100;
}

.edge-selected {
  stroke-width: 4px;
  opacity: 1;
  filter: drop-shadow(0 0 4px #3b82f6);
}

.edge-dimmed {
  opacity: 0.3;
}

.edge-badge {
  background: #6b7280;
  color: #ffffff;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.edge-label {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  max-width: 200px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .edge-default {
    stroke-width: 4px;
  }
}

/* Focus indicator for keyboard navigation */
.edge-focused {
  outline: 2px solid #3b82f6;
  outline-offset: 4px;
}
```

---

## Conclusion

This visual guide provides detailed specifications for implementing parallel edge offset in the Constellation Analyzer. All measurements, colors, and animations are designed to:

1. **Maintain visual consistency** with existing design patterns
2. **Ensure accessibility** across different modes and devices
3. **Scale gracefully** from mobile to desktop
4. **Provide clear interaction feedback** through hover, selection, and focus states
5. **Handle edge cases** without breaking the visual hierarchy

Use this guide alongside the main UX proposal document for implementation.

---

**Related Files:**
- Main proposal: `/home/jbruhn/dev/constellation-analyzer/EDGE_OVERLAP_UX_PROPOSAL.md`
- Current edge implementation: `/home/jbruhn/dev/constellation-analyzer/src/components/Edges/CustomEdge.tsx`
- Edge utilities: `/home/jbruhn/dev/constellation-analyzer/src/utils/edgeUtils.ts`
