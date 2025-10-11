# Temporal & Scenario Analysis - Quick Reference Card

## At a Glance

**What is this?**
A tool for temporal evolution analysis and scenario exploration of constellation graphs.

**What it's NOT:**
Version control (Git), undo/redo, or collaborative editing.

**Key Idea:**
Capture snapshots of your graph at different times or scenarios, then compare and analyze them.

---

## Core Concepts (5-Second Summary)

| Concept | What It Is | Example |
|---------|-----------|---------|
| **State** | Snapshot of graph at specific moment | "Q1 2023", "Session 5", "Strategy A" |
| **Timeline** | Ordered sequence of states | Jan → Feb → Mar → Apr |
| **Scenario** | Alternative branch from a point | Current → Strategy A vs Strategy B |
| **Comparison** | Visual diff between two states | What changed from Q1 to Q4? |
| **Journey** | Track one actor across states | How did Alice's role evolve? |

---

## Common Use Cases

### 1. Historical Tracking
Track how your network changed over time
- **Example**: Company org chart 2020-2024
- **Action**: Capture state at each quarter/year

### 2. Therapeutic Progress
Show relationship evolution across sessions
- **Example**: Family therapy sessions 1-10
- **Action**: Capture state after each session

### 3. Strategic Planning
Explore different future scenarios
- **Example**: 3 different growth strategies
- **Action**: Branch scenarios from current state

### 4. Project Evolution
Show stakeholder changes through project phases
- **Example**: Kickoff → Planning → Execution → Closure
- **Action**: Capture state at each phase

---

## Quick Actions

### Capture a State
1. Work on your graph
2. Click "Capture State" button (toolbar)
3. Label it (e.g., "Q1 2023")
4. Add notes (optional)
5. Done!

### Load a State
1. Click state selector dropdown (toolbar)
2. Choose state from list
3. Graph updates to that state

### Compare Two States
1. Select state A
2. Click "Compare" button
3. Select state B
4. View differences (side-by-side or overlay)

### Create Timeline
1. Capture several states
2. Open timeline panel (bottom)
3. States auto-appear in order
4. Use scrubber to navigate

### Create Scenario Branch
1. Load the branching point state
2. Menu → States → Create Scenario Branch
3. Name it and add description
4. Modify graph for this scenario
5. Capture states along the scenario

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+S` | Capture current state |
| `Ctrl+Shift+T` | Toggle timeline panel |
| `Ctrl+Shift+C` | Open comparison view |
| `←` / `→` | Navigate timeline (when focused) |
| `Space` | Play/pause animation (when focused) |
| `Ctrl+J` | View actor journeys |
| `Ctrl+Shift+P` | Presentation mode |
| `Esc` | Exit modal/presentation |

---

## UI Components

### Toolbar (Top)
```
Current State: Q3 2023 ▼  [📸 Capture] [🔍 Compare]
```
- **State Selector**: Dropdown to switch states
- **Capture Button**: Create new state
- **Compare Button**: Compare two states

### Timeline Panel (Bottom)
```
●═══●═══●═══●═══●
Q1  Q2  Q3  Q4  Now
```
- **Markers**: Click to load state
- **Scrubber**: Drag to animate through timeline
- **Controls**: Navigate, play, compare

### Right Panel
When state is selected, shows:
- State metadata (date, label, notes)
- Quick stats (actors, relations)
- Navigation (previous/next)
- Actions (edit, compare, delete)

---

## Comparison Modes

### Side-by-Side
Two graphs shown next to each other
- **Best for**: Overall comparison
- **Pros**: Clear separation
- **Cons**: Takes more screen space

### Overlay
Changes highlighted on single graph
- **Best for**: Detailed change analysis
- **Pros**: Shows changes in context
- **Cons**: Can be cluttered with many changes

### Diff List
Text list of all changes
- **Best for**: Systematic review
- **Pros**: Comprehensive, exportable
- **Cons**: Less visual

---

## Change Indicators

### Visual Coding
- 🟢 **Green**: Added (new actors/relations)
- 🔴 **Red**: Removed (deleted actors/relations)
- 🟡 **Yellow**: Modified (changed properties)
- ⚪ **Gray**: Unchanged

### Change Types
- **Actor Added**: New person/entity joined
- **Actor Removed**: Person/entity left
- **Actor Modified**: Role, name, or properties changed
- **Relation Added**: New connection formed
- **Relation Removed**: Connection broken
- **Relation Modified**: Relationship type or strength changed

---

## Best Practices

### Naming States
✅ **Good**: "Q3 2023: Post-Merger Integration"
❌ **Bad**: "State 3"

✅ **Good**: "Session 5: Breakthrough Session"
❌ **Bad**: "May 15"

✅ **Good**: "Strategy A: Aggressive Growth (Optimistic)"
❌ **Bad**: "Option 1"

### When to Capture States
✅ Capture at **significant milestones**
✅ Capture at **regular intervals** (quarterly, sessions)
✅ Capture **before major changes**

❌ Don't capture for every tiny edit
❌ Don't create states "just in case"
❌ Don't capture without context/labels

### Organizing States
✅ **Use timelines** for temporal sequences
✅ **Use scenarios** for alternatives
✅ **Add descriptions** explaining what changed
✅ **Tag states** for easy finding

❌ Don't mix temporal and scenario in same timeline
❌ Don't create orphaned states without context
❌ Don't forget to clean up old/unused states

---

## Common Workflows

### Workflow: Temporal Analysis
```
1. Start with current graph
2. Capture state: "Jan 2024"
3. Make changes to graph
4. Capture state: "Feb 2024"
5. Repeat monthly
6. View timeline
7. Compare Jan vs Dec
8. Animate evolution
```

### Workflow: Scenario Exploration
```
1. Create current state: "Current Reality"
2. Branch scenario: "Strategy A"
3. Modify graph for Strategy A
4. Capture: "Strategy A - Year 1"
5. Return to "Current Reality"
6. Branch scenario: "Strategy B"
7. Develop Strategy B
8. Compare Strategy A vs B
```

### Workflow: Actor Journey
```
1. Ensure multiple states captured
2. Select actor on graph
3. Click "View Journey" (right panel)
4. See actor's timeline
5. Review changes over time
6. Export journey report
```

---

## Data Model Summary

### State
```typescript
{
  stateId: "unique-id",
  stateType: "temporal" | "scenario",
  snapshot: { nodes, edges },
  temporal: { label, timestamp },
  // OR
  scenario: { label, description, assumptions },
  notes: "What changed and why"
}
```

### Timeline
```typescript
{
  timelineId: "unique-id",
  label: "Project Evolution",
  states: ["state1", "state2", "state3"]
}
```

### Scenario Branch
```typescript
{
  branchId: "unique-id",
  label: "Strategy A",
  states: ["stateA1", "stateA2"],
  color: "#3b82f6"
}
```

---

## Comparison Output

### Summary Statistics
- Total actors: Before → After (Δ)
- Total relations: Before → After (Δ)
- Network density change
- Centrality changes

### Detailed Changes
- Actors added: [list]
- Actors removed: [list]
- Actors modified: [list with changes]
- Relations added: [list]
- Relations removed: [list]
- Relations modified: [list with changes]

### Export Formats
- PDF report with graphs
- JSON data for analysis
- CSV for spreadsheet
- HTML interactive report

---

## Performance Tips

### For Large Graphs (100+ actors)
- Capture states selectively
- Use state pagination
- Enable caching
- Reduce animation quality if needed

### For Many States (50+ states)
- Organize into multiple timelines
- Use semantic search (ChromaDB)
- Archive old states
- Export/backup regularly

### For Smooth Animation
- Limit number of frames
- Use simplified rendering
- Adjust animation speed
- Close other applications

---

## Troubleshooting

### Problem: State won't load
**Solution**: Check if state data is corrupted, try restarting app

### Problem: Comparison is slow
**Solution**: Large graph - reduce comparison mode quality or use diff list

### Problem: Animation is choppy
**Solution**: Reduce animation speed or quality setting

### Problem: Can't find a state
**Solution**: Use search function or check timeline filters

### Problem: Timeline is cluttered
**Solution**: Create multiple timelines, archive old states

---

## Implementation Status

| Phase | Feature | Status | Priority |
|-------|---------|--------|----------|
| 1 | Core State Management | 🔲 Not Started | HIGH |
| 2 | Temporal Analysis | 🔲 Not Started | HIGH |
| 3 | Comparison & Diff | 🔲 Not Started | HIGH |
| 4 | Scenario Branching | 🔲 Not Started | MEDIUM |
| 5 | Actor Journeys | 🔲 Not Started | MEDIUM |
| 6 | Animation & Presentation | 🔲 Not Started | MEDIUM |
| 7 | ChromaDB Integration | 🔲 Not Started | MEDIUM |
| 8 | Advanced Features | 🔲 Not Started | LOW |

---

## Resources

### Documentation
- **Summary**: `TEMPORAL_ANALYSIS_SUMMARY.md`
- **Full Plan**: `TEMPORAL_SCENARIO_IMPLEMENTATION_PLAN.md`
- **User Guide**: `TEMPORAL_QUICK_START.md`
- **Examples**: `VISUAL_EXAMPLES.md`
- **Checklist**: `IMPLEMENTATION_CHECKLIST.md`
- **This Card**: `QUICK_REFERENCE.md`

### Key Files (To Be Created)
- Types: `/src/types/temporal.ts`
- Store: `/src/stores/stateStore.ts`
- Components: `/src/components/TemporalAnalysis/`

---

## FAQs

**Q: Will this replace normal editing?**
A: No, it's optional. You can ignore states and use app normally.

**Q: Can I undo after capturing a state?**
A: Yes, undo/redo is separate. States don't affect edit history.

**Q: How many states can I create?**
A: No hard limit, but recommend <100 per document for performance.

**Q: Can I delete a state?**
A: Yes, but be careful - this can't be undone.

**Q: Can I rename states?**
A: Yes, edit state metadata anytime.

**Q: Can states be shared?**
A: Yes, they're included in document export/import.

**Q: What's the difference between temporal and scenario?**
A: Temporal = time progression. Scenario = alternative branches.

**Q: Can I merge scenarios?**
A: No, scenarios are independent explorations for comparison.

---

## Quick Tips

💡 **Tip 1**: Label states descriptively - your future self will thank you

💡 **Tip 2**: Use comparison view liberally - it's the most powerful feature

💡 **Tip 3**: Animate timelines for presentations - it's impressive!

💡 **Tip 4**: Track key actors across states to tell their story

💡 **Tip 5**: Capture states BEFORE making major changes (safety net)

💡 **Tip 6**: Use scenarios to explore "what if" without commitment

💡 **Tip 7**: Export comparison reports for documentation

💡 **Tip 8**: Clean up old/unused states periodically

---

## Remember

This is about **storytelling and analysis**, not version control!

Think: "How did this network evolve?" not "What edits did I make?"

Use states to:
- ✅ Show temporal evolution
- ✅ Explore scenarios
- ✅ Compare alternatives
- ✅ Track actor journeys
- ✅ Present findings

Not to:
- ❌ Undo/redo edits
- ❌ Track every change
- ❌ Collaborate on editing
- ❌ Version control your work

---

**Happy analyzing!** 🎉
