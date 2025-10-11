# Temporal & Scenario Analysis - UX Concept (Revised)

## Executive Summary

This document outlines the UX concept for multi-graph capabilities in Constellation Analyzer, focusing on **temporal evolution** and **scenario exploration**. This is NOT a version control system - it's a tool for understanding how constellations change over time and exploring alternative futures.

**Core Use Cases:**
- Track relationship evolution across time periods (historical analysis)
- Explore alternative scenarios and strategic options (what-if analysis)
- Compare different states side-by-side (comparative analysis)
- Present evolution to stakeholders (storytelling and presentation)

---

## 1. Terminology & Mental Model

### 1.1 Recommended Terms

After careful consideration, we recommend a **dual-mode terminology** that adapts to user context:

#### Primary Terms:
- **State** - A single snapshot of the constellation at a point in time or scenario
- **Timeline** - The collection of states with temporal/branching relationships
- **Evolution** - The progression of states over time
- **Branch** - A divergence point where scenarios split from a common state

#### Context-Specific Labels:
The system should allow users to set their analysis mode:

**Temporal Mode** (for time-based analysis):
- States are called "Timepoints"
- Labels show dates/periods: "January 2024", "Q2 2024", "6 months post-merger"
- Navigation emphasizes chronological progression
- Visual: Timeline with chronological markers

**Scenario Mode** (for strategic exploration):
- States are called "Scenarios"
- Labels show scenario names: "Aggressive Growth", "Conservative Approach", "Status Quo"
- Navigation emphasizes comparison and alternatives
- Visual: Decision tree or parallel tracks

**Hybrid Mode** (combines both):
- Temporal progression WITH scenario branches at key points
- Example: "Pre-merger" → "Option A: Quick Integration" vs "Option B: Gradual Transition"
- Visual: Timeline with branching points

### 1.2 Mental Model

Users should think of this feature as:
> "A timeline of my constellation's evolution, with the ability to explore 'what-if' branches at any point"

**Metaphor:** Think of a photo album with multiple timelines - you can flip through one person's life chronologically, or compare different life paths they could have taken at decision points.

**Not like:** Git branches, version control, or undo/redo history

---

## 2. UI Architecture

### 2.1 Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Constellation Analyzer                              │
├─────────────────────────────────────────────────────────────┤
│ Menu Bar                                                     │
├─────────────────────────────────────────────────────────────┤
│ Document Tabs                                               │
├─────────────────────────────────────────────────────────────┤
│ ┌──────┐ Current State Indicator                           │
│ │ ICON │ "Jan 2024" or "Scenario A: Aggressive Growth"     │
│ └──────┘ [Timeline Controls] [Compare] [Present]           │
├──────────┬──────────────────────────────────┬──────────────┤
│   Left   │                                  │    Right     │
│   Panel  │        Graph Canvas              │    Panel     │
│  (Tools) │                                  │ (Properties) │
│          │                                  │              │
├──────────┴──────────────────────────────────┴──────────────┤
│                   Timeline Panel                            │
│   [═══●═══●═══●═══●═══] Timeline scrubber                  │
│   [Visual timeline with states and branches]               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Current State Indicator (New Component)

**Location:** Between toolbar and main canvas, full width
**Purpose:** Always show which state user is viewing/editing

**Design:**
```
┌────────────────────────────────────────────────────────────────┐
│ 📍 Current State: January 2024                                │
│    ← Q4 2023    |    [Edit State Info]    |    Feb 2024 →     │
│    Branch: Main Timeline                                       │
└────────────────────────────────────────────────────────────────┘
```

**Features:**
- Large, clear state name/label
- Navigation arrows to previous/next state in sequence
- Branch indicator if applicable
- Quick edit button for state metadata
- Visual connection to timeline panel below

### 2.3 Timeline Panel (Bottom Panel - Redesigned)

**Default State:** Collapsed (shows only scrubber bar)
**Expanded State:** Shows full timeline visualization

#### Collapsed View (40px height):
```
┌────────────────────────────────────────────────────────────────┐
│ ▲ Timeline    [═══●═══●═══●═══●═══]    [+] [⚙] [Expand]      │
└────────────────────────────────────────────────────────────────┘
```
- Mini timeline scrubber with state markers
- Current state highlighted
- Click markers to jump to state
- Quick add state button
- Settings for timeline display
- Expand/collapse toggle

#### Expanded View (200-400px height, resizable):
```
┌────────────────────────────────────────────────────────────────┐
│ Timeline View: [Linear] [Tree] [Matrix]        [+] [⚙] [▼]    │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Temporal Mode (Linear):                                       │
│  ─────●─────────●──────────●──────────●─────────●────          │
│     Jan 24   Mar 24    Jun 24    Sep 24    Dec 24             │
│   "Setup"  "Growth"   "Stable"  "Expansion" "Future"          │
│                                                                 │
│  Scenario Mode (Tree):                                         │
│                    ┌──●── "Aggressive" ───●── "Year 2"         │
│                    │   "High Risk"      "Scale Up"            │
│  ──●───────●──────●                                            │
│  "Now"  "Setup"   │  "Decision Point"                         │
│                    │                                            │
│                    └──●── "Conservative" ───●── "Stable"       │
│                        "Low Risk"        "Maintain"           │
│                                                                 │
│  Hybrid Mode (Matrix):                                         │
│  Shows both temporal and scenario dimensions                   │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Visualization Modes:**

1. **Linear Timeline** (Temporal):
   - Horizontal timeline with evenly spaced or date-proportional spacing
   - State cards with labels, dates, descriptions
   - Visual continuity indicators (lines/arrows)
   - Current state highlighted with distinct styling
   - Hover shows preview thumbnail

2. **Tree View** (Scenarios):
   - Branch visualization showing decision points
   - Parent-child relationships clear
   - Color coding by branch/scenario family
   - Collapsible branches
   - Labels emphasize scenario names over dates

3. **Matrix View** (Hybrid):
   - Horizontal axis: Time progression
   - Vertical tracks: Different scenario branches
   - Grid layout showing all parallel scenarios at each timepoint
   - Quick comparison across scenarios

**Interactions:**
- Click state to navigate to it
- Drag to reorder (with confirmation)
- Right-click for context menu
- Double-click to edit metadata
- Drag timeline area to scroll
- Pinch/zoom to adjust spacing

---

## 3. Core Workflows

### 3.1 Creating a New State

**From Current State:**

1. User clicks [+ New State] button in timeline panel or current state indicator
2. Dialog appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Create New State                        │
   ├─────────────────────────────────────────┤
   │ ○ Continue Timeline                     │
   │   Next step in temporal progression     │
   │                                          │
   │ ○ Branch into Scenario                  │
   │   Alternative possibility from here     │
   ├─────────────────────────────────────────┤
   │ Label: [_____________________]          │
   │                                          │
   │ ○ Temporal Mode                         │
   │   Date/Period: [Jan 2024 ▼]            │
   │                                          │
   │ ○ Scenario Mode                         │
   │   Description: [____________]           │
   │                                          │
   │ Starting Point:                         │
   │ ⦿ Clone current state                   │
   │ ○ Clean slate                           │
   │                                          │
   │        [Cancel]  [Create State]         │
   └─────────────────────────────────────────┘
   ```

3. User fills in:
   - **Label:** Required name for the state
   - **Type:** Continue timeline (sequential) or branch (alternative)
   - **Mode:** Temporal (with date) or Scenario (with description)
   - **Starting point:** Clone current actors/relations or start empty

4. New state is created and becomes the active state
5. Timeline panel updates to show new state in context

**Quick Actions:**
- "Next Month" button (temporal): Creates next sequential timepoint
- "What If?" button (scenario): Creates branch from current state
- Keyboard shortcut: Ctrl+Shift+N

### 3.2 Navigating Between States

**Timeline Panel:**
- Click any state marker to jump to it
- Use scrubber to drag through states (with animation)
- Arrow keys when timeline focused: ← → navigate chronologically

**Current State Indicator:**
- Previous/Next arrows for sequential navigation
- Dropdown showing all states with search/filter

**Keyboard Shortcuts:**
- Alt + Left/Right Arrow: Previous/Next state
- Alt + Number: Jump to state (1-9)
- Alt + B: Show branch menu

**Animation:**
- When navigating between states, show smooth transition
- Actors that exist in both: morph positions/properties
- Actors only in old state: fade out
- Actors only in new state: fade in
- Configurable animation speed or instant toggle

### 3.3 Comparing States

Users need powerful comparison tools for analysis.

#### Side-by-Side Comparison

1. Click [Compare] button in toolbar
2. Comparison mode activates:
   ```
   ┌────────────────────────────────────────────────────────┐
   │ Compare Mode: [State A ▼] vs [State B ▼]  [Exit]      │
   ├──────────────────────────┬─────────────────────────────┤
   │                          │                             │
   │   State A: Jan 2024      │   State B: Jun 2024         │
   │   "Initial Setup"        │   "After Growth"            │
   │                          │                             │
   │   [Graph visualization]  │   [Graph visualization]     │
   │                          │                             │
   └──────────────────────────┴─────────────────────────────┘
   ```

3. Features:
   - Synchronized zoom/pan (toggle)
   - Highlight differences
   - Shared actors connected with visual lines
   - Color coding: Added (green), Removed (red), Changed (yellow)
   - Comparison metrics panel (optional)

#### Overlay/Diff Mode

1. From comparison mode, toggle to overlay
2. Single canvas shows both states:
   - State A actors: Semi-transparent
   - State B actors: Full opacity
   - Movement arrows showing position changes
   - New/removed actors clearly marked
   - Toggle layers on/off

#### Difference Report

1. Click [Generate Report] in comparison mode
2. Automatic analysis shows:
   - Actors added/removed
   - Relations added/removed
   - Property changes
   - Network metrics comparison (density, centrality, etc.)
   - Export as PDF/HTML

### 3.4 Animation Between States

**Presentation Mode** (for stakeholder demos):

1. Click [Present] button
2. Presentation interface appears:
   ```
   ┌──────────────────────────────────────────────────────────┐
   │                    ╔═════════════╗                       │
   │                    ║  ◄  ▐▐  ►  ║ [Exit Presentation]   │
   │                    ╚═════════════╝                       │
   ├──────────────────────────────────────────────────────────┤
   │                                                           │
   │                Full-screen Graph View                    │
   │                                                           │
   │                State: January 2024                       │
   │                "Initial Team Structure"                  │
   │                                                           │
   │           [Actors and relations displayed]               │
   │                                                           │
   └──────────────────────────────────────────────────────────┘
   ```

3. Features:
   - Full-screen mode (ESC to exit)
   - Play/pause automated progression through states
   - Adjustable animation speed
   - State titles and descriptions display as subtitles
   - Voice-over text field (optional annotations read aloud)
   - Export as video/animated GIF

4. Presentation Controls:
   - Left/Right arrows: Previous/Next state
   - Space: Play/Pause animation
   - Number keys: Jump to state
   - Escape: Exit presentation mode

**Auto-play Settings:**
- Duration per state: 3s / 5s / 10s / Custom
- Animation speed: Slow / Medium / Fast / Instant
- Pause on branches (show decision point)

### 3.5 Editing State Metadata

**State Information Dialog:**

Right-click state in timeline → "Edit State Info"

```
┌─────────────────────────────────────────┐
│ State Information                       │
├─────────────────────────────────────────┤
│ Label: [January 2024____________]       │
│                                          │
│ Mode: ⦿ Temporal  ○ Scenario            │
│                                          │
│ [Temporal]                              │
│ Date: [2024-01-15___]                   │
│ Period: [Q1 2024_________]              │
│                                          │
│ Description:                            │
│ [Initial team structure                 │
│  after reorganization...]               │
│                                          │
│ Tags: [planning] [actual] [+]           │
│                                          │
│ Parent State: ← Q4 2023                 │
│ Next State: → February 2024             │
│                                          │
│ Color: [🎨 Blue]                        │
│                                          │
│ Notes:                                  │
│ [Additional context for                 │
│  presenters and analysts...]            │
│                                          │
│        [Delete State]  [Save]           │
└─────────────────────────────────────────┘
```

**Fields:**
- **Label:** Display name (required)
- **Mode:** Temporal or Scenario
- **Date/Period:** For temporal states
- **Description:** Rich text description
- **Tags:** Categorization and filtering
- **Color:** Custom color for timeline visualization
- **Notes:** Presenter notes (shown in presentation mode)

---

## 4. Visual Design Recommendations

### 4.1 Timeline Visualization

**State Cards in Timeline:**
```
┌────────────────────┐
│  January 2024      │  ← Large, readable label
│  ┌──────────────┐  │
│  │   [preview]  │  │  ← Small graph thumbnail (optional)
│  └──────────────┘  │
│  Initial Setup     │  ← Short description
│  📅 2024-01-15     │  ← Date/metadata
│  👥 12 actors      │  ← Quick stats
└────────────────────┘
     ●                   ← Connection point
     │
```

**Current State Highlighting:**
- Distinct color (blue/accent color)
- Subtle glow or border
- Larger card size
- Animated pulse (subtle)

**Branch Visualization:**
```
Main Timeline
─────●─────●─────●─────
     │
     ├──●──● "Scenario A"
     │
     └──●──● "Scenario B"
```
- Branch lines with different colors
- Clear labels at divergence points
- Hierarchy preserved visually

### 4.2 Color Coding System

**By Branch/Timeline:**
- Main timeline: Blue
- Scenario branches: Purple, Orange, Green, etc.
- Auto-assign colors, user can override

**By State Type:**
- Temporal (historical): Darker shades
- Temporal (projected): Lighter shades, dashed borders
- Scenarios: Solid colors, distinct from temporal

**By Status:**
- Current state: Highlighted accent color
- Past states: Full color
- Future states: Semi-transparent
- Draft/incomplete: Gray with icon

### 4.3 Comparison View Design

**Side-by-Side:**
- Vertical divider with drag handle
- Synchronized indicators (when zoom/pan synced)
- Difference highlights:
  - Added actors: Green outline with + badge
  - Removed actors: Red outline with - badge (ghost in removed state)
  - Changed actors: Yellow outline
  - Unchanged actors: Normal appearance

**Overlay/Diff:**
- Layer opacity controls
- Toggle visibility per layer
- Color shifts to indicate temporal position
- Movement arrows with directional animation

### 4.4 Animation Design

**Smooth Transitions:**
- Actor movement: Bezier curve paths (not straight lines)
- Fade timing: Staggered (not all at once)
- Duration: 300-800ms (configurable)
- Easing: Ease-in-out for natural feel

**Attention Direction:**
- Highlight changes sequentially
- Narration overlay option
- Pause points at key changes

---

## 5. Advanced Features

### 5.1 Diff Analysis Tools

**Change Detection:**
- Automatic identification of:
  - New actors (not in previous state)
  - Removed actors
  - Moved actors (position change >threshold)
  - Re-typed actors (type change)
  - New relations
  - Removed relations
  - Changed relation properties

**Visualization:**
- Diff panel (bottom or right)
- List of changes with categories
- Click to highlight in graph
- Filter by change type

**Example:**
```
┌─────────────────────────────────────────┐
│ Changes: Jan 2024 → Jun 2024            │
├─────────────────────────────────────────┤
│ ✅ Actors Added (3)                     │
│   + Alice Johnson (Team Lead)           │
│   + Bob Chen (Designer)                 │
│   + Carol Smith (Engineer)              │
│                                          │
│ ❌ Actors Removed (1)                   │
│   - David Lee (Former Manager)          │
│                                          │
│ 🔄 Relations Changed (5)                │
│   ≈ Alice → Bob: "supervises"          │
│   ≈ Carol → Bob: "collaborates"        │
│   ...                                   │
│                                          │
│ 📊 Network Metrics                      │
│   Density: 0.45 → 0.52 (+15%)          │
│   Avg Connections: 3.2 → 4.1           │
└─────────────────────────────────────────┘
```

### 5.2 Actor Tracking Across Time

**Follow Actor Feature:**

1. Right-click actor → "Track Across States"
2. Actor timeline appears:
   ```
   ┌─────────────────────────────────────────┐
   │ Tracking: Alice Johnson                 │
   ├─────────────────────────────────────────┤
   │                                          │
   │ Jan 24    Mar 24    Jun 24    Sep 24    │
   │   ●─────────●─────────●─────────●       │
   │   │         │         │         │       │
   │ Junior    Team     Senior     Manager   │
   │ Dev       Lead     Dev                  │
   │                                          │
   │ Connections: 2 → 5 → 8 → 12             │
   │ Centrality: 0.1 → 0.3 → 0.5 → 0.7       │
   └─────────────────────────────────────────┘
   ```

3. Shows:
   - Actor presence in each state
   - Property changes over time
   - Relationship changes
   - Metrics evolution
   - Graph of metrics over time

**Use Cases:**
- Track individual's career progression
- Monitor key stakeholder involvement
- Analyze relationship building patterns
- Identify critical transition points

### 5.3 Scenario Comparison Matrix

**For Strategic Planning:**

```
┌───────────────────────────────────────────────────────────┐
│ Scenario Comparison Matrix                                │
├───────────┬─────────────┬─────────────┬─────────────┬────┤
│           │ Aggressive  │ Conservative│ Status Quo  │...│
├───────────┼─────────────┼─────────────┼─────────────┼────┤
│ Team Size │ 25 actors   │ 15 actors   │ 12 actors   │    │
│ Density   │ 0.65        │ 0.42        │ 0.38        │    │
│ Leaders   │ 4           │ 2           │ 1           │    │
│ Risk      │ High        │ Medium      │ Low         │    │
│ Cost      │ $$$         │ $$          │ $           │    │
├───────────┴─────────────┴─────────────┴─────────────┴────┤
│ [View] [View] [View] [View]                               │
└───────────────────────────────────────────────────────────┘
```

- Compare metrics across scenarios
- Custom metric definitions
- Export to spreadsheet
- Visual heatmap of differences

### 5.4 Smart Suggestions

**AI-Assisted Analysis:**

- "Key changes between states" summary
- "Critical actors in this period" identification
- "Potential issues" detection (isolated actors, broken connections)
- "Similar patterns" from other states
- "Recommended next state" based on patterns

(Note: Requires AI integration, future feature)

### 5.5 Export & Reporting

**Export Options:**

1. **Timeline Report (PDF/HTML):**
   - All states with graphs
   - Annotations and descriptions
   - Change summaries
   - Metrics evolution charts
   - Professional formatting

2. **Presentation Deck:**
   - PowerPoint/Google Slides
   - One slide per state
   - Transition animations
   - Speaker notes from state notes

3. **Video/Animation:**
   - MP4 export of presentation mode
   - Configurable duration and transitions
   - Voiceover from notes (text-to-speech)
   - Watermark and branding options

4. **Data Export:**
   - CSV with state metadata
   - JSON with full state data
   - Graph metrics per state
   - Change log

---

## 6. Data Model

### 6.1 State Structure

```typescript
interface ConstellationState {
  id: string;
  label: string;
  description?: string;

  // Mode and temporal information
  mode: 'temporal' | 'scenario';
  date?: string; // ISO date for temporal states
  period?: string; // e.g., "Q1 2024", "6 months post-merger"

  // Graph data
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];

  // Relationships to other states
  parentStateId?: string; // State this was created from
  childStateIds: string[]; // States created from this one
  branchName?: string; // For organizing branches

  // Metadata
  tags: string[];
  color?: string; // Custom color for timeline
  notes?: string; // Presenter notes
  thumbnail?: string; // Base64 or URL to preview image

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### 6.2 Timeline Structure

```typescript
interface Timeline {
  id: string;
  documentId: string; // Link to parent document

  states: ConstellationState[];

  // Timeline metadata
  name: string;
  description?: string;
  defaultMode: 'temporal' | 'scenario' | 'hybrid';

  // View preferences
  viewMode: 'linear' | 'tree' | 'matrix';
  sortBy: 'date' | 'created' | 'custom';

  // Presentation settings
  presentationSettings: {
    autoPlayDuration: number; // seconds per state
    animationSpeed: 'slow' | 'medium' | 'fast' | 'instant';
    showDescriptions: boolean;
    pauseOnBranches: boolean;
  };
}
```

### 6.3 Document Structure Update

```typescript
interface Document {
  // Existing fields...
  id: string;
  name: string;

  // Add timeline reference
  timelineId?: string;
  currentStateId?: string; // Active state being edited

  // Legacy support: documents without timeline
  // use existing nodes/edges directly
  nodes?: Actor[];
  edges?: Relation[];
  nodeTypes?: NodeTypeConfig[];
  edgeTypes?: EdgeTypeConfig[];
}
```

**Migration Strategy:**
- Existing documents: Continue to work without timeline
- User can "Enable Timeline" to convert to multi-state
- First state created automatically from current graph
- Backwards compatible

---

## 7. User Stories & Use Cases

### 7.1 Organizational Consultant

**Scenario:** Track team dynamics over 6-month transformation

**Story:**
> "As an organizational consultant, I want to document how team relationships evolved during a restructuring so that I can present the transformation to leadership and identify success factors."

**Workflow:**
1. Create document: "Sales Team Transformation"
2. Set to Temporal Mode
3. Create state "January 2024 - Before Restructure"
   - Add all team members
   - Map current reporting relationships
4. Create state "March 2024 - Mid-transition"
   - Update structure, add new manager
   - Show matrix relationships forming
5. Create state "June 2024 - New Structure"
   - Final organizational structure
   - New collaboration patterns
6. Use Compare mode to show before/after
7. Generate presentation showing evolution
8. Present to leadership with animated transitions

**Key Features Used:**
- Temporal mode with dates
- State-to-state animation
- Comparison view
- Presentation mode
- Change detection

### 7.2 Strategic Planner

**Scenario:** Evaluate three alternative market entry strategies

**Story:**
> "As a strategic planner, I want to model different partnership scenarios so that our executive team can compare approaches and make an informed decision."

**Workflow:**
1. Create document: "APAC Market Entry 2025"
2. Set to Scenario Mode
3. Create base state "Current Partnerships - Q4 2024"
   - Map existing partner ecosystem
4. Branch into three scenarios:
   - "Scenario A: Direct Entry" (build own team)
   - "Scenario B: Strategic Acquisition" (acquire local player)
   - "Scenario C: JV Partnership" (joint venture)
5. Model each scenario:
   - Different actor sets (internal vs. external)
   - Different relationship patterns
   - Add cost/risk tags
6. Use Comparison Matrix to evaluate:
   - Team size, relationship density
   - Risk factors, dependencies
7. Present all three to executive team
8. Decision made, continue developing chosen scenario

**Key Features Used:**
- Scenario mode with branches
- State cloning with modifications
- Comparison matrix
- Scenario-specific metadata
- Multi-scenario presentation

### 7.3 Family Therapist

**Scenario:** Track family system changes through therapy

**Story:**
> "As a family therapist, I want to visualize how family relationships evolve over our sessions so that family members can see their progress and understand the changes they've made."

**Workflow:**
1. Create document: "Johnson Family System"
2. Set to Temporal Mode
3. Create state "Session 1 - Initial Intake"
   - Map family members
   - Show conflict patterns (red edges)
   - Identify isolated members
4. Create state "Session 5 - After First Intervention"
   - Update relationship types
   - Show new communication patterns
5. Create state "Session 10 - Current State"
   - Document improvements
   - Identify remaining work areas
6. Show animated progression to family
7. Highlight positive changes
8. Discuss next goals based on visual

**Key Features Used:**
- Temporal progression
- Relationship type tracking
- Visual storytelling
- Change highlighting
- Actor tracking (family member journeys)

### 7.4 Researcher - Historical Analysis

**Scenario:** Study political alliance formation pre-WWI

**Story:**
> "As a historian, I want to map how European alliances shifted from 1900-1914 so that I can analyze the path to war and teach students about alliance dynamics."

**Workflow:**
1. Create document: "European Alliances 1900-1914"
2. Set to Temporal Mode
3. Create states for key years:
   - "1900 - Post-Victorian Era"
   - "1904 - Entente Cordiale"
   - "1907 - Triple Entente Formed"
   - "1912 - Balkan Wars Impact"
   - "1914 - Pre-War System"
4. For each state:
   - Add nations as actors
   - Map alliances as relations
   - Annotate with historical context
5. Create "What-If" branches:
   - "If Britain remained neutral"
   - "If Russia-Japan alliance continued"
6. Use presentation mode for lectures
7. Generate report with analysis

**Key Features Used:**
- Historical timeline
- Dense annotations
- Counterfactual scenarios (branches)
- Educational presentation
- Export for publication

### 7.5 Product Manager - Stakeholder Mapping

**Scenario:** Plan stakeholder engagement for product launch

**Story:**
> "As a product manager, I want to model how our stakeholder ecosystem will evolve from beta to GA launch so that we can plan our engagement strategy and identify key influencers at each stage."

**Workflow:**
1. Create document: "Product X Launch Stakeholders"
2. Set to Temporal Mode
3. Create states:
   - "Current - Pre-announcement"
   - "Beta Program - Month 1"
   - "Beta Program - Month 3"
   - "GA Launch"
   - "3 Months Post-GA"
4. For each state:
   - Add/remove stakeholders
   - Update engagement levels (edge strength)
   - Mark key influencers
5. Track specific stakeholders across timeline
6. Identify where to focus engagement efforts
7. Share with marketing team

**Key Features Used:**
- Temporal planning
- Actor tracking
- Relationship strength evolution
- Strategic planning view
- Team collaboration

---

## 8. Implementation Priorities

### Phase 1: Core Functionality (MVP)
**Goal:** Basic multi-state support

- [ ] State data model and storage
- [ ] Create/switch between states
- [ ] Simple timeline panel (linear view)
- [ ] Current state indicator
- [ ] Basic state metadata editing
- [ ] Timeline navigation

**Success Criteria:**
- User can create multiple states
- User can switch between states
- Changes are saved per-state
- UI clearly shows current state

### Phase 2: Temporal & Scenario Modes
**Goal:** Differentiate use cases

- [ ] Temporal vs. Scenario mode selection
- [ ] Date/period fields for temporal states
- [ ] Branch creation from states
- [ ] Tree view in timeline panel
- [ ] State cloning options
- [ ] Basic comparison (side-by-side)

**Success Criteria:**
- User can track temporal progression
- User can branch into scenarios
- User can compare two states side-by-side
- Timeline visualizes branches clearly

### Phase 3: Analysis & Comparison
**Goal:** Power user features

- [ ] Advanced comparison (overlay/diff)
- [ ] Change detection and highlighting
- [ ] Actor tracking across states
- [ ] Comparison matrix for scenarios
- [ ] Metrics evolution charts
- [ ] Difference reports

**Success Criteria:**
- User can analyze changes between states
- User can track individual actors over time
- User can generate comparison reports

### Phase 4: Presentation & Export
**Goal:** Storytelling and sharing

- [ ] Presentation mode
- [ ] State-to-state animation
- [ ] Auto-play with timing controls
- [ ] Export timeline as PDF
- [ ] Export as PowerPoint
- [ ] Video/GIF export
- [ ] Presenter notes support

**Success Criteria:**
- User can present evolution to stakeholders
- User can export for external sharing
- Animations are smooth and professional

### Phase 5: Advanced Features
**Goal:** Enterprise and research use

- [ ] Smart suggestions/AI analysis
- [ ] Custom metrics tracking
- [ ] Advanced filtering and search
- [ ] Collaborative editing per state
- [ ] Template scenarios
- [ ] Import/export timeline formats

---

## 9. Design Patterns & Best Practices

### 9.1 State Management

**Immutability:**
- Each state is independent snapshot
- Editing state A doesn't affect state B
- Changes are isolated to active state

**Auto-save:**
- Changes save immediately to current state
- No "save state" button needed
- Visual indicator when saving

**Conflicts:**
- Not applicable (no concurrent editing of same state)
- But consider: collaborative scenarios in future

### 9.2 Performance Considerations

**Large Timelines:**
- Lazy load state data
- Only active state + neighbors in memory
- Thumbnails for preview
- Virtualized timeline rendering

**Complex Graphs:**
- Same optimization as single-state graphs
- Cache state thumbnails
- Progressive loading in comparison mode

### 9.3 User Guidance

**First-time Use:**
- Onboarding tour explaining temporal/scenario concepts
- Template timelines for common use cases
- Example documents with states

**Inline Help:**
- Tooltips explaining state operations
- Context-sensitive help in timeline panel
- Visual cues for branch points

### 9.4 Accessibility

**Keyboard Navigation:**
- All timeline operations keyboard-accessible
- State switcher with keyboard
- Presentation mode keyboard controls

**Screen Readers:**
- Announce state changes
- Describe timeline structure
- Alternative text for visualizations

**Visual Design:**
- High contrast for current state
- Clear focus indicators
- Colorblind-safe highlighting

---

## 10. Measuring Success

### 10.1 User Metrics

**Engagement:**
- Percentage of users who create 2+ states
- Average states per document
- Time spent in comparison mode
- Presentation mode usage

**Feature Adoption:**
- Temporal mode vs. Scenario mode usage
- Branch creation frequency
- Actor tracking usage
- Export/presentation frequency

### 10.2 User Feedback

**Qualitative:**
- User interviews with consultants, strategists
- Usability testing of timeline panel
- Feedback on comparison features
- Presentation mode effectiveness

**Quantitative:**
- NPS score for timeline feature
- Feature satisfaction ratings
- Bug reports and friction points

### 10.3 Success Indicators

**Good Signs:**
- Users naturally create states without prompting
- Users share presentations with stakeholders
- Users request advanced comparison features
- Users migrate existing documents to timelines

**Warning Signs:**
- Users confused about state vs. document
- Timeline panel rarely used
- Users try to use as version control
- High abandonment of multi-state documents

---

## 11. Future Enhancements

### 11.1 Collaborative Scenarios

**Multi-user Planning:**
- Different team members model different scenarios
- Merge scenarios for discussion
- Voting/commenting on scenario states

### 11.2 Dynamic States

**Live Data Integration:**
- States update from external data sources
- Real-time stakeholder maps
- Automated state creation from events

### 11.3 AI-Powered Insights

**Predictive Modeling:**
- "Likely evolution" suggestions
- Pattern matching from similar timelines
- Risk assessment across scenarios
- Anomaly detection

### 11.4 Advanced Visualizations

**3D Timeline:**
- Time as Z-axis
- Spatial evolution visualization
- VR presentation mode

**Network Metrics Over Time:**
- Animated metric dashboards
- Trend analysis
- Correlation detection

---

## Conclusion

This revised UX concept positions Constellation Analyzer's multi-graph feature as a powerful tool for **temporal analysis** and **scenario exploration**, not version control.

**Key Differentiators:**
1. **Dual-mode design**: Temporal and Scenario modes for different use cases
2. **Comparison-first**: Multiple ways to compare and analyze states
3. **Presentation-ready**: Built for storytelling and stakeholder communication
4. **Evolution tracking**: Follow actors and relationships over time
5. **Strategic planning**: Model and evaluate alternative futures

**Next Steps:**
1. Validate terminology with target users (consultants, strategists, researchers)
2. Create interactive prototype of timeline panel
3. User test comparison and presentation modes
4. Prioritize Phase 1 features for development
5. Build example use cases for each user persona

---

## Appendix: Alternative Terminology Considered

### Timeline Terms:
- ✅ Timeline - Clear, intuitive
- ❌ History - Implies past only
- ❌ Evolution - Too biological
- ❌ Journey - Too narrative-focused
- ❌ Progression - Good but less common

### State Terms:
- ✅ State - Neutral, technical but clear
- ✅ Snapshot - Intuitive but implies static
- ❌ Version - Too version-control-like
- ❌ Instance - Too technical
- ❌ Frame - Too video-like
- ❌ Point - Too minimal

### Branch Terms:
- ✅ Branch - Familiar from trees/git
- ✅ Scenario - Clear for alternatives
- ❌ Fork - Too git-specific
- ❌ Alternative - Too wordy
- ❌ Path - Could work but less clear

**Final Decision:** Adaptive terminology based on user-selected mode (Temporal vs. Scenario) provides the best user experience.
