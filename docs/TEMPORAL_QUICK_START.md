# Temporal & Scenario Analysis - Quick Start Guide

## What This Is (And Isn't)

### This IS:
- A tool for **temporal evolution analysis** (how constellations change over time)
- A tool for **scenario exploration** (exploring alternative futures)
- A **comparison and analysis** framework (visualizing differences)
- A **storytelling platform** (presenting network dynamics)

### This Is NOT:
- Version control for your work (not Git for graphs)
- Undo/redo functionality (that's separate)
- Collaborative editing (that's separate)
- A backup system (save your documents!)

---

## Core Concepts

### 1. States
A **state** is a snapshot of your constellation at a specific moment in time or scenario. Think of it as a photograph of your network.

**Two types:**
- **Temporal States**: Time-based snapshots (e.g., "Q1 2023", "Session 5", "Post-Merger")
- **Scenario States**: Alternative futures (e.g., "Strategy A", "Pessimistic Case", "Option 2")

### 2. Timelines
A **timeline** is an ordered sequence of temporal states showing evolution over time.

**Example Timeline:**
```
2020 → 2021 → 2022 → 2023 → Projected 2024
```

### 3. Scenarios
A **scenario** is a branch from a specific point to explore "what if" alternatives.

**Example Scenario Tree:**
```
Current State
    ├→ Strategy A → Quarter 2 → Quarter 3
    ├→ Strategy B → Quarter 2
    └→ Strategy C → Quarter 2 → Quarter 3 → Quarter 4
```

### 4. Comparisons
**Comparison** shows the differences between any two states with visual highlighting:
- Green: Added actors/relations
- Red: Removed actors/relations
- Yellow: Modified actors/relations

### 5. Actor Journeys
An **actor journey** tracks a specific actor across multiple states to see how they evolve.

---

## Common Use Cases

### Use Case 1: Historical Analysis
**Scenario**: You want to show how a team's structure evolved over a year.

**Steps:**
1. Create states for each quarter: Q1, Q2, Q3, Q4
2. Set temporal metadata (dates or sequence)
3. Add these states to a timeline
4. Use timeline scrubber to navigate through time
5. Compare Q1 vs Q4 to see total change

**Result**: You can present the evolution story and identify key inflection points.

---

### Use Case 2: Therapeutic Progress
**Scenario**: A therapist tracking a patient's family constellation across sessions.

**Steps:**
1. Capture state after each session: "Session 1", "Session 5", "Session 10"
2. Track specific family members (actors) across sessions
3. Compare early vs. late sessions to show progress
4. Create animation showing relationship evolution

**Result**: Visual evidence of therapeutic progress and relationship changes.

---

### Use Case 3: Strategic Planning
**Scenario**: Exploring three different organizational restructuring options.

**Steps:**
1. Capture current state: "Current Org Structure"
2. Create three scenario branches:
   - "Option A: Consolidation"
   - "Option B: Decentralization"
   - "Option C: Hybrid"
3. Develop each scenario with different actor configurations
4. Compare all three scenarios side-by-side
5. Present findings to leadership

**Result**: Clear visual comparison of strategic alternatives.

---

### Use Case 4: Project Evolution
**Scenario**: Tracking how a project's stakeholder network changes from kickoff to completion.

**Steps:**
1. Create timeline: "Kickoff" → "Planning" → "Execution" → "Closure"
2. Capture state at each phase
3. Track key stakeholders across all phases
4. Generate actor journey reports for executives
5. Animate the evolution for presentation

**Result**: Compelling narrative of project dynamics and stakeholder engagement.

---

## Key Features

### Feature Matrix

| Feature | Phase | Priority | Use Case |
|---------|-------|----------|----------|
| **Capture State** | 1 | HIGH | Create snapshots of current graph |
| **Load State** | 1 | HIGH | Switch between different states |
| **Timeline View** | 2 | HIGH | Navigate temporal sequences |
| **Temporal Metadata** | 2 | HIGH | Label states with dates/periods |
| **Compare States** | 3 | HIGH | Side-by-side comparison |
| **Visual Diff** | 3 | HIGH | Highlight changes on graph |
| **Change Summary** | 3 | HIGH | Statistics and change lists |
| **Scenario Branching** | 4 | MEDIUM | Create alternative futures |
| **Scenario Tree** | 4 | MEDIUM | Visualize branches |
| **Actor Journey** | 5 | MEDIUM | Track actors across states |
| **State Animation** | 6 | MEDIUM | Smooth transitions |
| **Presentation Mode** | 6 | MEDIUM | Full-screen slideshow |
| **Semantic Search** | 7 | MEDIUM | Find states by description |
| **Pattern Recognition** | 7 | MEDIUM | Identify similar states |

---

## User Interface Overview

### 1. Main Toolbar
```
┌─────────────────────────────────────────────────────────┐
│ [File] [Edit] [View] [States] [Help]                   │
│                                                          │
│ Current State: Q3 2023 ▼  [📸 Capture] [🔍 Compare]   │
└─────────────────────────────────────────────────────────┘
```

**New Controls:**
- **State Selector Dropdown**: Quick switch between states
- **Capture Button**: Create new state from current graph
- **Compare Button**: Open comparison view

### 2. Bottom Timeline Panel
```
┌─────────────────────────────────────────────────────────┐
│ Timeline: Project Evolution        [+] State   [≡] View │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ●═══●═══●═══●═══●════┬══●═══●                        │
│  Q1  Q2  Q3  Q4  Now  │  S1  S2  (Branch A)           │
│ 2023 2023 2023 2023   │                                │
│                        └──●═══●    (Branch B)          │
│                           S1  S2                        │
│                                                          │
│  [◀] [▶] Navigate  [⏯] Animate  [⚖] Compare           │
└─────────────────────────────────────────────────────────┘
```

**Features:**
- Horizontal timeline with state markers
- Vertical scenario branches
- Navigation controls
- Animation playback
- Quick compare access

### 3. Right Panel (When State Selected)
```
┌─────────────────────────────────────┐
│ State: Q3 2023                      │
├─────────────────────────────────────┤
│ Type: Temporal                       │
│ Date: 2023-09-30                     │
│ Sequence: 3 of 4                     │
│                                      │
│ Actors: 12                           │
│ Relations: 18                        │
│                                      │
│ Notes:                               │
│ "Significant restructuring after    │
│  merger announcement..."             │
│                                      │
│ [Edit Metadata] [Compare] [Delete]  │
│                                      │
│ Navigation:                          │
│ ← Q2 2023 | Q4 2023 →               │
└─────────────────────────────────────┘
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Capture current state |
| `Ctrl+Shift+T` | Open timeline panel |
| `Ctrl+Shift+C` | Open comparison view |
| `←` / `→` | Navigate timeline (when focused) |
| `Space` | Play/pause animation (when focused) |
| `Ctrl+J` | View actor journeys |
| `Ctrl+Shift+P` | Presentation mode |

---

## Workflow Examples

### Workflow 1: Creating a Temporal Sequence

```
1. Start with your current graph
   └→ [Capture State] → "January 2025"

2. Make changes to graph (add/remove/modify actors)
   └→ [Capture State] → "February 2025"

3. Continue for each time period
   └→ [Capture State] → "March 2025"

4. View timeline panel
   └→ See all states in sequence
   └→ Use scrubber to navigate

5. Compare any two states
   └→ [Compare] → Select "January" vs "March"
   └→ See visual diff

6. Animate evolution
   └→ [Play] → Watch smooth transition
```

### Workflow 2: Exploring Scenarios

```
1. Load the state you want to branch from
   └→ Select "Current State" from dropdown

2. Create scenario branch
   └→ [States Menu] → [Create Scenario Branch]
   └→ Name: "Strategy A"
   └→ Description: "Aggressive expansion"
   └→ Assumptions: ["Funding secured", "Market growth"]

3. Modify graph for this scenario
   └→ Add new actors, relations

4. Capture states along this scenario
   └→ [Capture State] → "Strategy A - Q2"
   └→ [Capture State] → "Strategy A - Q3"

5. Return to branching point
   └→ Select "Current State" again

6. Create alternative scenario
   └→ [Create Scenario Branch] → "Strategy B"
   └→ Different modifications

7. Compare scenarios
   └→ [Compare] → "Strategy A - Q3" vs "Strategy B - Q3"
```

### Workflow 3: Actor Journey Analysis

```
1. Ensure you have multiple states captured

2. Select an actor on the graph
   └→ Click actor node

3. View actor journey
   └→ [Right Panel] → [View Journey]
   OR
   └→ [Ctrl+J] → Select actor from list

4. Journey viewer shows:
   └→ All states where actor appears
   └→ Property changes over time
   └→ Relationship changes
   └→ Position evolution

5. Export actor report
   └→ [Export Journey] → PDF or JSON
```

---

## Best Practices

### 1. State Naming
- **Use descriptive labels**: "Q3 2023 Post-Restructuring" not just "State 3"
- **Include context**: "Strategy A: Optimistic Scenario - Year 2"
- **Be consistent**: Use same format for similar states

### 2. Timeline Organization
- **One timeline per narrative**: Don't mix different stories
- **Logical sequencing**: Ensure temporal order makes sense
- **Manageable length**: Consider breaking very long timelines

### 3. Scenario Branching
- **Clear branching points**: Choose meaningful divergence points
- **Document assumptions**: Always explain what makes scenarios different
- **Parallel development**: Develop scenario branches to similar time horizons
- **Color coding**: Use colors to distinguish branches visually

### 4. Comparison Analysis
- **Compare meaningful pairs**: Adjacent states or alternative scenarios
- **Focus on key changes**: Filter by change type if needed
- **Document insights**: Add notes about significant differences
- **Export reports**: Save comparison results for reference

### 5. Presentation
- **Start with context**: Begin with overview state
- **Show progression**: Use animation for temporal sequences
- **Highlight key changes**: Use comparison view for dramatic differences
- **Tell a story**: Sequence states to create narrative flow

---

## Common Pitfalls to Avoid

### 1. Too Many States
**Problem**: Creating state for every tiny change clutters timeline
**Solution**: Capture states at significant milestones only

### 2. Inconsistent Labeling
**Problem**: "Jan", "February 2023", "2023-03-15" in same timeline
**Solution**: Choose format and stick with it

### 3. Forgetting Metadata
**Problem**: States labeled "State 1", "State 2" with no context
**Solution**: Always add description, date, or sequence info

### 4. Not Using Comparison
**Problem**: Just switching between states without analyzing differences
**Solution**: Use comparison view to identify and document changes

### 5. Orphaned Scenarios
**Problem**: Creating scenario branches but not developing them
**Solution**: Either fully develop scenarios or delete incomplete branches

### 6. Mixing Temporal and Scenario
**Problem**: Putting scenarios and time progression in same timeline
**Solution**: Keep temporal timelines and scenario branches separate

---

## Performance Tips

### For Large Graphs (100+ actors)
- Capture states selectively (not every change)
- Use diff caching (automatic in ChromaDB integration)
- Limit animation quality for smooth playback
- Consider pagination for very long timelines

### For Many States (50+ states)
- Organize into multiple timelines by theme
- Use semantic search to find relevant states
- Archive old/unused states
- Export and backup state data regularly

---

## Integration with Existing Features

### Document System
- Each document can have its own state history
- States are document-specific (not shared across documents)
- Duplicate document includes all states

### Export/Import
- Export document includes all states
- Import preserves state structure
- Can export specific timeline or scenario branch

### Undo/Redo
- Undo/redo works on current working graph
- Does NOT affect captured states
- Capturing state does not add to undo history

---

## Next Steps

### Phase 1: Getting Started (Week 1-2)
1. Implement basic state capture and loading
2. Create simple state selector
3. Test with example document

### Phase 2: Temporal Features (Week 3-4)
1. Build timeline panel UI
2. Add temporal metadata editor
3. Implement timeline navigation

### Phase 3: Comparison (Week 5-6)
1. Develop diff algorithm
2. Create comparison view UI
3. Add visual diff overlay

**Continue with remaining phases as outlined in main implementation plan**

---

## Questions to Consider

Before implementing, discuss:

1. **State Limit**: Should we limit number of states per document?
2. **Storage**: IndexedDB for states or localStorage? (Recommend IndexedDB)
3. **Persistence**: Auto-save states or explicit save?
4. **Naming**: Should users be prompted to name states or auto-generate?
5. **Default State**: What happens when document opens - load latest state or working graph?
6. **Branching UI**: Tree view or timeline with vertical branches?
7. **Animation**: Default animation duration and easing function?
8. **Export**: Include states in normal JSON export or separate?

---

## Resources

- **Main Implementation Plan**: See `TEMPORAL_SCENARIO_IMPLEMENTATION_PLAN.md` for complete technical details
- **Type Definitions**: `/src/types/temporal.ts` (to be created)
- **Store Implementation**: `/src/stores/stateStore.ts` (to be created)
- **UI Components**: `/src/components/TemporalAnalysis/` (to be created)

---

## Success Criteria

You'll know the implementation is successful when users can:

1. Capture a state in < 3 clicks
2. Navigate timeline intuitively
3. Immediately see differences when comparing states
4. Create and understand scenario branches
5. Animate evolution smoothly
6. Find specific states quickly (with ChromaDB)
7. Present findings effectively to stakeholders

---

## Support

For questions about this implementation:
- Review the main implementation plan for technical details
- Check type definitions for data structures
- Examine workflow examples for common patterns
- Test with real use cases early and often

**Remember**: This is about storytelling and analysis, not version control!
