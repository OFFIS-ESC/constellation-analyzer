# Temporal & Scenario Analysis Implementation Plan

## Executive Summary

This implementation plan transforms Constellation Analyzer into a powerful tool for **temporal evolution analysis** and **scenario exploration**. This is NOT a version control system - it's a storytelling and analytical tool that helps users:

1. **Track temporal evolution**: Show how constellations change over time (historical or projected)
2. **Explore scenarios**: Branch from any point to explore alternative futures
3. **Compare and analyze**: Visualize differences between states
4. **Present findings**: Create compelling narratives about network dynamics

### Key ChromaDB Integration Opportunities

ChromaDB should be leveraged for:
- **State metadata search**: Find states by description, time period, or scenario assumptions
- **Actor trajectory analysis**: Track how specific actors evolve across states
- **Pattern recognition**: Identify similar states or recurring patterns
- **Annotation storage**: Store and retrieve analytical notes about changes
- **Comparison results**: Cache diff calculations for quick retrieval

---

## 1. Revised Data Model

### 1.1 Core Types (New File: `/src/types/temporal.ts`)

```typescript
/**
 * Type of analysis state
 */
export type StateType = 'temporal' | 'scenario';

/**
 * Temporal metadata for time-based states
 */
export interface TemporalMetadata {
  // Absolute date/time
  timestamp?: string;  // ISO 8601 format

  // Relative ordering
  sequenceNumber?: number;

  // Human-readable labels
  label: string;  // e.g., "Q1 2023", "Session 5", "Post-Merger"

  // Period information
  periodStart?: string;
  periodEnd?: string;

  // Display properties
  displayFormat?: 'date' | 'sequence' | 'label';
}

/**
 * Scenario metadata for branched alternatives
 */
export interface ScenarioMetadata {
  // Scenario identification
  label: string;  // e.g., "Strategy A", "Pessimistic Outlook"

  // Analytical context
  description: string;
  assumptions: string[];  // Key assumptions for this scenario

  // Probability/confidence
  probability?: number;  // 0-1 scale
  confidence?: 'high' | 'medium' | 'low';

  // Visual properties
  color?: string;  // Color code for this scenario branch
}

/**
 * Relationship between states
 */
export interface StateRelationship {
  type: 'temporal-next' | 'temporal-previous' | 'scenario-branch' | 'scenario-parent';
  targetStateId: string;
}

/**
 * Analysis state - represents the constellation at a specific point in time or scenario
 */
export interface AnalysisState {
  // Identity
  stateId: string;
  stateType: StateType;

  // Graph snapshot
  snapshot: {
    nodes: SerializedActor[];
    edges: SerializedRelation[];
    // Note: nodeTypes and edgeTypes inherited from document
  };

  // Metadata based on type
  temporal?: TemporalMetadata;
  scenario?: ScenarioMetadata;

  // Relationships
  relationships: StateRelationship[];

  // Annotations and analysis
  notes?: string;
  tags?: string[];

  // Tracking
  createdAt: string;
  createdBy?: string;

  // ChromaDB integration
  embeddingId?: string;  // ID in ChromaDB for semantic search
}

/**
 * Diff between two states
 */
export interface StateDiff {
  fromStateId: string;
  toStateId: string;

  // Actor changes
  actorsAdded: SerializedActor[];
  actorsRemoved: SerializedActor[];
  actorsModified: Array<{
    actorId: string;
    changes: {
      label?: { from: string; to: string };
      type?: { from: string; to: string };
      position?: { from: { x: number; y: number }; to: { x: number; y: number } };
      metadata?: { from: any; to: any };
    };
  }>;

  // Relation changes
  relationsAdded: SerializedRelation[];
  relationsRemoved: SerializedRelation[];
  relationsModified: Array<{
    relationId: string;
    changes: {
      type?: { from: string; to: string };
      directionality?: { from: string; to: string };
      strength?: { from: number; to: number };
    };
  }>;

  // Summary statistics
  summary: {
    totalActorChanges: number;
    totalRelationChanges: number;
    networkDensityChange?: number;
    centralityChanges?: Map<string, number>;  // Actor ID -> centrality delta
  };
}

/**
 * Actor journey - tracks a specific actor across multiple states
 */
export interface ActorJourney {
  actorId: string;
  label: string;

  // Appearances in different states
  appearances: Array<{
    stateId: string;
    stateLabel: string;
    actor: SerializedActor;
    timestamp?: string;
  }>;

  // Summary
  firstAppearance: string;  // State ID
  lastAppearance: string;   // State ID
  appearanceCount: number;
}

/**
 * Timeline - ordered sequence of temporal states
 */
export interface Timeline {
  timelineId: string;
  label: string;
  description?: string;

  // Ordered states
  states: string[];  // State IDs in temporal order

  // Display settings
  displaySettings: {
    showGrid: boolean;
    snapToInterval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    autoLayout: boolean;
  };
}

/**
 * Scenario tree - hierarchical structure of branched scenarios
 */
export interface ScenarioTree {
  rootStateId: string;
  branches: Array<{
    branchId: string;
    label: string;
    states: string[];  // State IDs in this branch
    color?: string;
  }>;
}
```

### 1.2 Updated Document Type

```typescript
// Update to ConstellationDocument in /src/stores/persistence/types.ts
export interface ConstellationDocument {
  metadata: {
    version: string;
    appName: string;
    createdAt: string;
    updatedAt: string;
    lastSavedBy: string;
    documentId?: string;
    title?: string;

    // NEW: Multi-state support
    supportsStates?: boolean;  // Feature flag
  };

  // Current/working graph state
  graph: {
    nodes: SerializedActor[];
    edges: SerializedRelation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
  };

  // NEW: Temporal and scenario states
  states?: {
    // All states
    stateList: AnalysisState[];

    // Current active state
    currentStateId: string | null;

    // Organization
    timelines: Timeline[];
    scenarioTrees: ScenarioTree[];

    // Settings
    settings: {
      enableAutoDiff: boolean;
      showChangeIndicators: boolean;
      defaultStateType: StateType;
    };
  };
}
```

---

## 2. Component Architecture

### 2.1 New Components

#### `/src/components/TemporalAnalysis/` (New Directory)

**TimelinePanel.tsx**
- Bottom panel for timeline/scenario visualization
- Horizontal axis: temporal progression
- Vertical axis: scenario branches
- Interactive timeline scrubber
- State creation and navigation controls

**StateSelector.tsx**
- Dropdown/modal for selecting states
- Filter by type (temporal/scenario)
- Search by label, description, tags
- Visual tree/timeline representation

**ComparisonView.tsx**
- Side-by-side or overlay comparison of two states
- Diff highlighting (added/removed/modified)
- Toggle between different comparison modes
- Export comparison reports

**StateDiffViewer.tsx**
- Visual representation of changes between states
- Color-coded change indicators
- Summary statistics panel
- Drill-down into specific changes

**StateMetadataEditor.tsx**
- Edit temporal/scenario metadata
- Set labels, timestamps, descriptions
- Manage assumptions for scenarios
- Add tags and notes

**ActorJourneyViewer.tsx**
- Track specific actors across states
- Timeline visualization of actor evolution
- Relationship changes over time
- Export actor-specific reports

**StateAnimator.tsx**
- Smooth transitions between states
- Configurable animation speed
- Morph visualization (actors moving, appearing, disappearing)
- Playback controls (play, pause, step forward/back)

**PresentationMode.tsx**
- Slideshow through states
- Full-screen mode
- Annotations and narration
- Export as video/animated GIF

#### `/src/components/Panels/` (Updates to Existing)

**BottomPanel.tsx** (Replace or Extend)
- Integrate TimelinePanel
- Collapsible/expandable
- Drag to resize height
- State management controls

**RightPanel.tsx** (Update)
- Add "State History" section
- Show current state metadata
- Quick comparison tools
- State navigation shortcuts

### 2.2 Component Hierarchy

```
App
├── MenuBar
│   └── States Menu (new)
│       ├── Create State
│       ├── View Timeline
│       ├── Compare States
│       └── Manage Scenarios
├── Toolbar
│   └── State Controls (new)
│       ├── Current State Indicator
│       ├── Quick State Switch
│       └── Create Snapshot Button
├── GraphEditor
│   └── State Overlay (new)
│       ├── Change Indicators
│       └── Diff Highlighting
├── BottomPanel
│   └── TimelinePanel (new)
│       ├── Timeline View
│       ├── Scenario Tree View
│       └── State Creation Controls
└── Modals
    ├── ComparisonView (new)
    ├── StateMetadataEditor (new)
    ├── ActorJourneyViewer (new)
    └── PresentationMode (new)
```

---

## 3. Store Architecture

### 3.1 New Store: `stateStore.ts`

```typescript
// /src/stores/stateStore.ts

import { create } from 'zustand';
import type { AnalysisState, StateDiff, Timeline, ScenarioTree, StateType } from '../types/temporal';

interface StateStore {
  // State management
  states: Map<string, AnalysisState>;
  currentStateId: string | null;

  // Organization
  timelines: Timeline[];
  scenarioTrees: ScenarioTree[];

  // Actions
  createState: (
    type: StateType,
    snapshot: { nodes: SerializedActor[]; edges: SerializedRelation[] },
    metadata: Partial<TemporalMetadata> | Partial<ScenarioMetadata>,
    parentStateId?: string
  ) => string;

  loadState: (stateId: string) => void;
  deleteState: (stateId: string) => void;
  updateStateMetadata: (stateId: string, updates: Partial<AnalysisState>) => void;

  // Timeline management
  createTimeline: (label: string, stateIds: string[]) => string;
  addStateToTimeline: (timelineId: string, stateId: string, position?: number) => void;
  removeStateFromTimeline: (timelineId: string, stateId: string) => void;
  reorderTimeline: (timelineId: string, newOrder: string[]) => void;

  // Scenario management
  createScenarioBranch: (parentStateId: string, label: string) => string;
  addStateToScenario: (branchId: string, stateId: string) => void;

  // Comparison and analysis
  compareStates: (stateId1: string, stateId2: string) => StateDiff;
  getActorJourney: (actorId: string, stateIds?: string[]) => ActorJourney;

  // Navigation
  getNextState: (currentStateId: string, type?: 'temporal' | 'scenario') => string | null;
  getPreviousState: (currentStateId: string) => string | null;
  getStatesByTimeline: (timelineId: string) => AnalysisState[];
  getStatesByScenario: (branchId: string) => AnalysisState[];

  // ChromaDB integration
  indexStateForSearch: (stateId: string) => Promise<void>;
  searchStates: (query: string) => Promise<AnalysisState[]>;
}
```

### 3.2 Updated `workspaceStore.ts`

Add state-related actions:
```typescript
interface WorkspaceActions {
  // ... existing actions ...

  // State operations
  captureCurrentState: (type: StateType, metadata: any) => string;
  restoreState: (stateId: string) => void;
  exportStatesTimeline: (timelineId: string) => void;
  importStatesTimeline: () => Promise<void>;
}
```

---

## 4. Implementation Phases

### Phase 1: Core State Management (Week 1-2)
**Priority: HIGH - Foundation for all features**

1. **Data Model Setup**
   - Create `/src/types/temporal.ts`
   - Update `ConstellationDocument` type
   - Add migration for existing documents

2. **Basic State Store**
   - Implement `stateStore.ts`
   - Basic CRUD operations for states
   - Simple state switching

3. **Snapshot Functionality**
   - Capture current graph as state
   - Store state metadata
   - Load state back to graph

4. **UI Integration**
   - Add "Capture State" button to toolbar
   - Basic state selector dropdown
   - Current state indicator

**Deliverable**: Users can create snapshots and switch between them

---

### Phase 2: Temporal Analysis (Week 3-4)
**Priority: HIGH - Core use case**

1. **Timeline Management**
   - Create Timeline data structure
   - Timeline CRUD operations
   - State ordering and sequencing

2. **Timeline Panel UI**
   - Bottom panel with timeline visualization
   - Horizontal timeline scrubber
   - State markers with labels
   - Click to load state

3. **Temporal Metadata**
   - Date/time picker for states
   - Sequence number assignment
   - Period labeling

4. **Timeline Navigation**
   - Previous/Next state navigation
   - Keyboard shortcuts (← →)
   - Timeline auto-scrolling

**Deliverable**: Users can create temporal sequences and navigate through time

---

### Phase 3: Comparison & Diff Analysis (Week 5-6)
**Priority: HIGH - Key analytical feature**

1. **Diff Calculation Engine**
   - Implement `compareStates()` function
   - Actor-level diff detection
   - Relation-level diff detection
   - Change summarization

2. **Visual Diff Indicators**
   - Overlay mode on graph
   - Color coding (green=added, red=removed, yellow=modified)
   - Change badges/icons
   - Animated transitions

3. **Comparison View Component**
   - Side-by-side state comparison
   - Synchronized panning/zooming
   - Difference highlighting
   - Export comparison report

4. **Change Summary Panel**
   - Statistics dashboard
   - List of changes
   - Filter by change type
   - Jump to changed actors

**Deliverable**: Users can compare any two states and see visual differences

---

### Phase 4: Scenario Branching (Week 7-8)
**Priority: MEDIUM - Advanced feature**

1. **Scenario Data Model**
   - Scenario tree structure
   - Branch metadata management
   - Parent-child relationships

2. **Scenario Creation UI**
   - "Branch from here" action
   - Scenario metadata form
   - Assumptions editor
   - Probability/confidence inputs

3. **Scenario Tree Visualization**
   - Vertical branching in timeline panel
   - Branch color coding
   - Branch labels and descriptions
   - Interactive branch selection

4. **Scenario Navigation**
   - Switch between branches
   - Compare scenario outcomes
   - Merge/delete branches

**Deliverable**: Users can create and explore alternative scenarios

---

### Phase 5: Actor Tracking & Journeys (Week 9-10)
**Priority: MEDIUM - Valuable analysis tool**

1. **Journey Calculation**
   - Track actor across states
   - Detect appearances/disappearances
   - Calculate trajectory metrics
   - Relationship evolution tracking

2. **Journey Viewer UI**
   - Actor selection interface
   - Timeline visualization of actor
   - Relationship changes display
   - Export actor report

3. **Multi-Actor Comparison**
   - Compare multiple actor journeys
   - Network position changes
   - Relationship dynamics

**Deliverable**: Users can follow specific actors through time/scenarios

---

### Phase 6: Animation & Presentation (Week 11-12)
**Priority: MEDIUM - Storytelling feature**

1. **State Animation Engine**
   - Smooth transitions between states
   - Actor movement interpolation
   - Fade in/out for added/removed actors
   - Configurable animation speed

2. **Animation Controls**
   - Play/pause/step controls
   - Speed adjustment
   - Loop options
   - Auto-play through timeline

3. **Presentation Mode**
   - Full-screen slideshow
   - Narration/annotation overlay
   - Custom sequence selection
   - Export as video/GIF (stretch goal)

**Deliverable**: Users can create animated presentations of their analyses

---

### Phase 7: ChromaDB Integration (Week 13-14)
**Priority: MEDIUM - Enhanced search and analysis**

1. **State Indexing**
   - Index state metadata in ChromaDB
   - Include descriptions, assumptions, notes
   - Tag-based organization
   - Semantic embeddings

2. **Semantic Search**
   - Search states by description
   - Find similar states
   - Query by temporal criteria
   - Tag-based filtering

3. **Pattern Recognition**
   - Identify recurring patterns
   - Find similar network structures
   - Anomaly detection
   - Trend analysis

4. **Annotation Storage**
   - Store analytical notes in ChromaDB
   - Link notes to specific changes
   - Search annotations
   - Generate analysis reports

**Deliverable**: Users can semantically search and analyze their state history

---

### Phase 8: Advanced Features (Week 15-16)
**Priority: LOW - Nice-to-have enhancements**

1. **Automatic State Capture**
   - Periodic auto-snapshots
   - Significant change detection
   - Configurable triggers

2. **State Templates**
   - Save state as template
   - Apply template to create new state
   - Template library

3. **Collaborative Features**
   - Share timelines/scenarios
   - Comment on states
   - Approval workflows

4. **Advanced Analytics**
   - Network metrics over time
   - Predictive modeling
   - Statistical analysis
   - Export to analysis tools

---

## 5. File Structure

```
/src
├── types/
│   ├── index.ts (existing)
│   └── temporal.ts (NEW)
│
├── stores/
│   ├── workspaceStore.ts (update)
│   ├── stateStore.ts (NEW)
│   ├── panelStore.ts (existing)
│   └── toastStore.ts (existing)
│
├── components/
│   ├── TemporalAnalysis/ (NEW)
│   │   ├── TimelinePanel.tsx
│   │   ├── StateSelector.tsx
│   │   ├── ComparisonView.tsx
│   │   ├── StateDiffViewer.tsx
│   │   ├── StateMetadataEditor.tsx
│   │   ├── ActorJourneyViewer.tsx
│   │   ├── StateAnimator.tsx
│   │   └── PresentationMode.tsx
│   │
│   ├── Panels/ (existing, update)
│   │   ├── LeftPanel.tsx
│   │   ├── RightPanel.tsx (update)
│   │   └── BottomPanel.tsx (update or replace)
│   │
│   ├── Toolbar/ (existing, update)
│   │   └── StateControls.tsx (NEW)
│   │
│   └── Menu/ (existing, update)
│       └── StatesMenu.tsx (NEW)
│
├── utils/
│   ├── stateComparison.ts (NEW)
│   ├── stateDiff.ts (NEW)
│   ├── stateAnimation.ts (NEW)
│   └── chromaIntegration.ts (NEW)
│
├── hooks/
│   ├── useStateManagement.ts (NEW)
│   ├── useStateDiff.ts (NEW)
│   ├── useStateAnimation.ts (NEW)
│   └── useActorJourney.ts (NEW)
│
└── contexts/
    └── StateContext.tsx (NEW, optional)
```

---

## 6. Terminology Guide

### Old (Version Control) → New (Temporal/Scenario Analysis)

| Old Term | New Term | Context |
|----------|----------|---------|
| Version | State / Timepoint / Scenario | General |
| Commit | Capture State / Create Snapshot | Action |
| Checkout | Load State / View State | Action |
| Branch | Create Scenario Branch | Action |
| Version History | Timeline / State History | View |
| Version Graph | Timeline / Scenario Tree | Visualization |
| Diff | Comparison / Change Analysis | Analysis |
| Merge | N/A (not applicable) | - |
| Revert | Restore State | Action |

---

## 7. UI/UX Wireframes

### 7.1 Bottom Timeline Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline: Project Evolution          [+] Create State   [≡] View │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ●─────●─────●─────●─────●────────┬──●────●────●         │   │
│  │ Q1    Q2    Q3    Q4    Current  │  B1   B2   B3        │   │
│  │ 2023  2023  2023  2023   (2024)  │ (Strat A)            │   │
│  │                                   │                       │   │
│  │                                   └──●────●              │   │
│  │                                      C1   C2             │   │
│  │                                   (Strat B)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Timeline: ◀ ▶   Scenarios: ▲ ▼   Compare: [Select Two]         │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 State Selector Dropdown

```
┌────────────────────────────────────┐
│ Current State: Q4 2023        ▼   │
├────────────────────────────────────┤
│ Recent States:                     │
│  ● Current (Unsaved)              │
│  ● Q4 2023                        │
│  ● Q3 2023                        │
│                                    │
│ Timelines:                         │
│  📅 Project Evolution (5 states)  │
│  📅 Historical (3 states)         │
│                                    │
│ Scenarios:                         │
│  🌿 Strategy A Branch (3 states)  │
│  🌿 Strategy B Branch (2 states)  │
│                                    │
│ [View All States] [New State]     │
└────────────────────────────────────┘
```

### 7.3 Comparison View

```
┌─────────────────────────────────────────────────────────────────┐
│ Compare States                                             [×]  │
├─────────────────────────────────────────────────────────────────┤
│ From: Q3 2023 ▼            To: Q4 2023 ▼        Mode: Side-by  │
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│  State: Q3 2023             │  State: Q4 2023                 │
│                              │                                  │
│  [Graph Visualization]       │  [Graph Visualization]          │
│                              │                                  │
│  Actors: 12                  │  Actors: 15 (+3)                │
│  Relations: 18               │  Relations: 22 (+4)             │
│                              │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│ Changes Summary:                                                │
│  Added: 3 actors, 4 relations                                  │
│  Removed: 0 actors, 0 relations                                │
│  Modified: 2 actors (properties changed)                       │
│                                                                 │
│  [View Detailed Changes] [Export Report]                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Key Algorithms

### 8.1 State Diff Calculation

```typescript
// /src/utils/stateDiff.ts

export function calculateStateDiff(
  fromState: AnalysisState,
  toState: AnalysisState
): StateDiff {
  const diff: StateDiff = {
    fromStateId: fromState.stateId,
    toStateId: toState.stateId,
    actorsAdded: [],
    actorsRemoved: [],
    actorsModified: [],
    relationsAdded: [],
    relationsRemoved: [],
    relationsModified: [],
    summary: {
      totalActorChanges: 0,
      totalRelationChanges: 0,
    },
  };

  // Create lookup maps
  const fromActors = new Map(
    fromState.snapshot.nodes.map(n => [n.id, n])
  );
  const toActors = new Map(
    toState.snapshot.nodes.map(n => [n.id, n])
  );

  // Find added actors
  toState.snapshot.nodes.forEach(actor => {
    if (!fromActors.has(actor.id)) {
      diff.actorsAdded.push(actor);
    }
  });

  // Find removed actors
  fromState.snapshot.nodes.forEach(actor => {
    if (!toActors.has(actor.id)) {
      diff.actorsRemoved.push(actor);
    }
  });

  // Find modified actors
  fromState.snapshot.nodes.forEach(fromActor => {
    const toActor = toActors.get(fromActor.id);
    if (toActor) {
      const changes = detectActorChanges(fromActor, toActor);
      if (Object.keys(changes).length > 0) {
        diff.actorsModified.push({
          actorId: fromActor.id,
          changes,
        });
      }
    }
  });

  // Similar logic for relations...

  // Calculate summary
  diff.summary.totalActorChanges =
    diff.actorsAdded.length +
    diff.actorsRemoved.length +
    diff.actorsModified.length;

  return diff;
}

function detectActorChanges(
  fromActor: SerializedActor,
  toActor: SerializedActor
): any {
  const changes: any = {};

  if (fromActor.data.label !== toActor.data.label) {
    changes.label = {
      from: fromActor.data.label,
      to: toActor.data.label,
    };
  }

  if (fromActor.data.type !== toActor.data.type) {
    changes.type = {
      from: fromActor.data.type,
      to: toActor.data.type,
    };
  }

  if (
    fromActor.position.x !== toActor.position.x ||
    fromActor.position.y !== toActor.position.y
  ) {
    changes.position = {
      from: fromActor.position,
      to: toActor.position,
    };
  }

  return changes;
}
```

### 8.2 Actor Journey Tracking

```typescript
// /src/utils/actorJourney.ts

export function getActorJourney(
  actorId: string,
  states: AnalysisState[]
): ActorJourney {
  const appearances = states
    .map(state => {
      const actor = state.snapshot.nodes.find(n => n.id === actorId);
      if (actor) {
        return {
          stateId: state.stateId,
          stateLabel: state.temporal?.label || state.scenario?.label || 'Unknown',
          actor,
          timestamp: state.temporal?.timestamp,
        };
      }
      return null;
    })
    .filter(Boolean);

  return {
    actorId,
    label: appearances[0]?.actor.data.label || 'Unknown',
    appearances,
    firstAppearance: appearances[0]?.stateId || '',
    lastAppearance: appearances[appearances.length - 1]?.stateId || '',
    appearanceCount: appearances.length,
  };
}
```

### 8.3 State Animation Interpolation

```typescript
// /src/utils/stateAnimation.ts

export function interpolateStates(
  fromState: AnalysisState,
  toState: AnalysisState,
  progress: number // 0 to 1
): { nodes: Actor[]; edges: Relation[] } {
  // For each actor, interpolate position and properties
  const interpolatedNodes = toState.snapshot.nodes.map(toNode => {
    const fromNode = fromState.snapshot.nodes.find(n => n.id === toNode.id);

    if (!fromNode) {
      // Actor being added - fade in
      return {
        ...toNode,
        style: {
          opacity: progress,
        },
      };
    }

    // Interpolate position
    const x = fromNode.position.x + (toNode.position.x - fromNode.position.x) * progress;
    const y = fromNode.position.y + (toNode.position.y - fromNode.position.y) * progress;

    return {
      ...toNode,
      position: { x, y },
    };
  });

  // Handle actors being removed (fade out)
  fromState.snapshot.nodes.forEach(fromNode => {
    const existsInTo = toState.snapshot.nodes.find(n => n.id === fromNode.id);
    if (!existsInTo) {
      interpolatedNodes.push({
        ...fromNode,
        style: {
          opacity: 1 - progress,
        },
      });
    }
  });

  // Similar logic for edges...

  return { nodes: interpolatedNodes, edges: interpolatedEdges };
}
```

---

## 9. ChromaDB Integration Details

### 9.1 Collections Structure

```typescript
// State metadata collection
const stateMetadataCollection = {
  name: 'constellation_states',
  metadata: {
    description: 'Analysis states with temporal and scenario metadata',
  },
};

// Documents to index:
{
  id: stateId,
  embedding: [/* vector from description + notes + assumptions */],
  metadata: {
    documentId: string,
    stateType: 'temporal' | 'scenario',
    label: string,
    timestamp?: string,
    tags: string[],
    actorCount: number,
    relationCount: number,
  },
  document: `${label} ${description} ${notes} ${assumptions.join(' ')}`,
}

// Actor journey collection
const actorJourneyCollection = {
  name: 'actor_journeys',
  metadata: {
    description: 'Actor trajectories across states',
  },
};

// Comparison results collection (caching)
const comparisonCacheCollection = {
  name: 'state_comparisons',
  metadata: {
    description: 'Cached comparison results',
  },
};
```

### 9.2 Query Examples

```typescript
// Find states by semantic search
async function searchStates(query: string): Promise<AnalysisState[]> {
  const results = await chromaClient.query({
    collection: 'constellation_states',
    queryTexts: [query],
    nResults: 10,
  });

  // Retrieve full states from store
  return results.ids[0].map(id => stateStore.states.get(id));
}

// Find similar states (pattern recognition)
async function findSimilarStates(stateId: string): Promise<AnalysisState[]> {
  const state = stateStore.states.get(stateId);
  const description = generateStateDescription(state);

  const results = await chromaClient.query({
    collection: 'constellation_states',
    queryTexts: [description],
    nResults: 5,
    where: {
      documentId: state.documentId,
      stateId: { $ne: stateId }, // Exclude self
    },
  });

  return results.ids[0].map(id => stateStore.states.get(id));
}

// Track actor mentions across states
async function findStatesWithActor(actorLabel: string): Promise<AnalysisState[]> {
  const results = await chromaClient.query({
    collection: 'constellation_states',
    queryTexts: [actorLabel],
    nResults: 20,
    where: {
      tags: { $contains: 'actor:' + actorLabel },
    },
  });

  return results.ids[0].map(id => stateStore.states.get(id));
}
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- State creation and serialization
- Diff calculation accuracy
- Actor journey tracking
- Timeline ordering
- Scenario branching logic

### 10.2 Integration Tests

- State store integration with workspace store
- ChromaDB indexing and retrieval
- UI component interactions
- Animation performance

### 10.3 User Acceptance Tests

- Create temporal sequence (historical and projected)
- Create scenario branches
- Compare two states visually
- Track actor through timeline
- Animate transition between states
- Export comparison report
- Search states semantically

---

## 11. Migration Strategy

### 11.1 Existing Documents

Documents without state support will continue to work normally. The `states` property in `ConstellationDocument` is optional.

### 11.2 Enabling States for Existing Documents

Users can "enable" temporal analysis for any document:

```typescript
function enableStatesForDocument(documentId: string) {
  const doc = workspaceStore.documents.get(documentId);
  if (!doc) return;

  // Create initial state from current graph
  const initialState: AnalysisState = {
    stateId: generateStateId(),
    stateType: 'temporal',
    snapshot: {
      nodes: doc.graph.nodes,
      edges: doc.graph.edges,
    },
    temporal: {
      label: 'Initial State',
      timestamp: new Date().toISOString(),
      sequenceNumber: 0,
    },
    relationships: [],
    notes: 'Initial state captured when enabling temporal analysis',
    createdAt: new Date().toISOString(),
  };

  doc.states = {
    stateList: [initialState],
    currentStateId: initialState.stateId,
    timelines: [{
      timelineId: generateTimelineId(),
      label: 'Main Timeline',
      states: [initialState.stateId],
      displaySettings: {
        showGrid: true,
        autoLayout: true,
      },
    }],
    scenarioTrees: [],
    settings: {
      enableAutoDiff: true,
      showChangeIndicators: true,
      defaultStateType: 'temporal',
    },
  };

  doc.metadata.supportsStates = true;
  saveDocumentToStorage(documentId, doc);
}
```

---

## 12. Performance Considerations

### 12.1 State Storage

- Store states in separate IndexedDB entries (not inline with document)
- Lazy load states on demand
- Implement state pagination for documents with many states

### 12.2 Diff Calculation

- Cache diff results in ChromaDB
- Compute diffs in Web Worker for large graphs
- Implement incremental diff for sequential states

### 12.3 Animation

- Use requestAnimationFrame for smooth animations
- Implement frame skipping for performance
- Provide quality/performance toggle

### 12.4 ChromaDB

- Batch index operations
- Implement indexing queue
- Cache frequently accessed queries
- Use metadata filtering to reduce embedding computations

---

## 13. Future Enhancements (Post-MVP)

### 13.1 Advanced Analytics

- Network density over time
- Centrality metrics evolution
- Clustering coefficient changes
- Community detection across states

### 13.2 Predictive Modeling

- Extrapolate future states
- Trend analysis
- Anomaly detection
- Pattern-based predictions

### 13.3 Collaborative Features

- Share timelines with team
- Comment threads on specific changes
- Approval workflows for scenarios
- Real-time collaboration

### 13.4 Export Capabilities

- Export as video/GIF
- Generate PowerPoint presentations
- PDF reports with comparison analysis
- Interactive HTML export

### 13.5 Integration

- Import time-series data from external sources
- API for programmatic state creation
- Webhook triggers for auto-capture
- Integration with project management tools

---

## 14. Success Metrics

### 14.1 Feature Adoption

- % of documents with states enabled
- Average number of states per document
- Timeline vs. scenario usage ratio

### 14.2 User Engagement

- Time spent in comparison view
- Number of comparisons per session
- Animation playback usage
- Actor journey queries

### 14.3 Performance

- State creation time < 500ms
- Diff calculation time < 1s for typical graphs
- Animation frame rate > 30fps
- ChromaDB query latency < 200ms

---

## 15. Documentation Plan

### 15.1 User Guide

- "Getting Started with Temporal Analysis"
- "Creating and Managing Timelines"
- "Exploring Scenarios"
- "Comparing States Effectively"
- "Tracking Actor Journeys"
- "Presentation Mode Tutorial"

### 15.2 Developer Documentation

- State data model reference
- API documentation for stateStore
- ChromaDB integration guide
- Custom animation plugins
- Extension points for advanced analytics

---

## Conclusion

This implementation plan transforms Constellation Analyzer from a static graph editor into a powerful temporal and scenario analysis tool. By focusing on storytelling, comparison, and analysis rather than version control, we enable users to:

1. **Understand evolution**: Track how networks change over time
2. **Explore alternatives**: Branch and compare different scenarios
3. **Analyze dynamics**: Identify patterns and trends
4. **Communicate insights**: Present findings effectively

The phased approach ensures we deliver value incrementally while building toward a comprehensive solution. ChromaDB integration adds semantic search and pattern recognition capabilities that elevate the tool beyond simple visualization.

**Recommended Starting Point**: Begin with Phase 1 (Core State Management) and Phase 2 (Temporal Analysis) as these provide immediate value and establish the foundation for all subsequent features.
