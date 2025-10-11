# Temporal & Scenario Analysis - Visual Examples

This document provides concrete visual examples of how the temporal and scenario analysis features should look and behave.

---

## Example 1: Organizational Evolution (Temporal Analysis)

### Scenario
A company tracking how its organizational structure changed during a merger over 12 months.

### Timeline
```
2023 January → April → July → October → 2024 January
(Pre-Merger) (Integration) (Consolidation) (Restructuring) (New Structure)
```

### State 1: January 2023 (Pre-Merger)
```
Graph:
  Company A: 25 employees
  - CEO (Alice)
  - 3 Department Heads
  - 21 Team Members

  Company B: 18 employees
  - CEO (Bob)
  - 2 Department Heads
  - 15 Team Members

  No relations between companies yet
```

### State 2: April 2023 (Integration)
```
Graph:
  Merged Company: 43 employees
  - Co-CEOs (Alice + Bob)
  - 5 Department Heads (3 from A, 2 from B)
  - Joint steering committee (6 people)
  - 36 Team Members

  New relations:
  - Cross-company collaboration edges
  - Reporting structure changes
```

### State 3: July 2023 (Consolidation)
```
Graph:
  Merged Company: 40 employees (-3 departures)
  - Single CEO (Alice, Bob moves to advisory)
  - 4 Department Heads (1 department merged)
  - 35 Team Members

  Changes:
  - Removed: 3 actors (departures)
  - Modified: Bob's role and relations
  - Added: Advisory board node
```

### State 4: October 2023 (Restructuring)
```
Graph:
  Merged Company: 42 employees (+2 new hires)
  - CEO (Alice)
  - 4 Department Heads (reshuffled)
  - 2 new leadership roles
  - 36 Team Members

  Changes:
  - Added: 2 new strategic roles
  - Modified: Several reporting relationships
  - Removed: Steering committee (integration complete)
```

### State 5: January 2024 (New Structure)
```
Graph:
  Merged Company: 45 employees (+3 new hires)
  - CEO (Alice)
  - 4 Department Heads (stable)
  - Established matrix structure
  - 40 Team Members

  Changes:
  - Added: Cross-functional teams (new edge types)
  - Added: 3 new hires
  - Stabilized structure
```

### Comparison: State 1 vs State 5

**Visual Diff:**
```
Green (Added):
  - 2 new leadership roles
  - 5 new team members
  - 30+ cross-functional collaboration edges
  - Matrix structure edges

Red (Removed):
  - Bob as Co-CEO (moved to advisory)
  - 1 department head (consolidation)
  - 3 departed employees
  - Company B as separate entity

Yellow (Modified):
  - Alice: Title change (Co-CEO → CEO)
  - Bob: Role change (Co-CEO → Advisor)
  - Multiple reporting relationship changes
  - 5 department heads repositioned in hierarchy
```

**Summary Statistics:**
- Total actors: 43 → 45 (+2, +4.7%)
- Total relations: 68 → 112 (+44, +64.7%)
- Network density: 0.037 → 0.056 (+51%)
- Average connections per person: 3.2 → 5.0 (+56%)

### Actor Journey: Bob
```
Timeline visualization:

Jan 2023          Apr 2023       Jul 2023       Oct 2023      Jan 2024
   ●                 ●               ●              ●             ●
  CEO           Co-CEO          Advisor         Advisor       Advisor
Company B      Merged Co       Merged Co       Merged Co     Merged Co

Relations:
  17 direct reports → 20 → 4 → 2 → 2
  Type: Leadership → Leadership → Advisory → Advisory → Advisory
  Position: Center → Center → Periphery → Periphery → Periphery

Key Changes:
  Apr 2023: Became Co-CEO, gained cross-company relations
  Jul 2023: Transitioned to advisor, lost most direct reports
  Oct 2023+: Stable advisory role
```

---

## Example 2: Therapeutic Progress (Temporal Analysis)

### Scenario
Family therapist tracking a family constellation across 10 therapy sessions.

### Timeline
```
Session 1 → Session 3 → Session 5 → Session 7 → Session 10
(Intake)  (Early Work) (Breakthrough) (Integration) (Closure)
```

### State 1: Session 1 (Intake)
```
Graph:
  Family Members:
  - Mother (Sarah)
  - Father (John)
  - Daughter (Emma, 16)
  - Son (Michael, 12)

  Relations:
  - Sarah ←conflict→ John (high intensity, red)
  - Sarah ←protective→ Emma (strong, dashed)
  - John ←distant→ Michael (weak, dotted)
  - Emma ←tension→ Michael (medium, orange)

  Notes: "High conflict between parents, children taking sides,
          triangulation patterns evident"
```

### State 2: Session 3 (Early Work)
```
Changes from Session 1:
  Modified:
  - Sarah ↔ John: Conflict intensity reduced (high → medium)
  - Sarah → Emma: Protective edge slightly weakened

  Added:
  - John ↔ Emma: New communication edge (weak)

  Notes: "Parents beginning to communicate more directly,
          Emma less involved in parental conflict"
```

### State 3: Session 5 (Breakthrough)
```
Changes from Session 3:
  Modified:
  - Sarah ↔ John: Conflict edge changed to "communication" type
  - John → Michael: Distant edge strengthened (engagement improving)

  Added:
  - Family unit node (representing whole family identity)
  - All members connected to family unit

  Notes: "Major breakthrough - parents able to discuss issues
          without involving children. Family identity emerging."
```

### State 4: Session 7 (Integration)
```
Changes from Session 5:
  Modified:
  - Sarah ↔ John: Communication edge strengthened
  - Emma ↔ Michael: Tension edge changed to "sibling bond"

  Added:
  - John → Emma: Communication edge strengthened
  - Sarah → Michael: New supportive edge

  Notes: "Parents functioning as parental team. Sibling
          relationship improving. Cross-generational boundaries
          clearer."
```

### State 5: Session 10 (Closure)
```
Changes from Session 7:
  Modified:
  - Sarah ↔ John: Strong partnership edge (blue, solid)
  - All parent-child edges balanced and healthy
  - Sibling edge strong and positive

  Removed:
  - No conflict edges remaining
  - Protective/distant edges normalized

  Notes: "Family system stabilized. Healthy boundaries,
          effective communication, age-appropriate relationships.
          Ready for termination."
```

### Animated Visualization

**Frame-by-frame description:**
```
Frame 1 (Session 1):
  - Actors positioned with visible tension
  - Conflict edge pulsing in red
  - Protective edge thick and binding

Frame 10 (Session 3):
  - Conflict edge fading to orange
  - New communication line appearing (fade in)
  - Emma moving slightly away from protective orbit

Frame 20 (Session 5):
  - Family unit node appearing in center (fade in)
  - Connections to family unit growing out
  - All actors shifting toward center

Frame 30 (Session 7):
  - Sibling edge morphing from orange to blue
  - Cross-connections strengthening
  - Network becoming more interconnected

Frame 40 (Session 10):
  - All edges now healthy colors (blue, green)
  - Balanced positioning
  - Strong sense of unity and connection
```

### Actor Journey: Emma
```
Timeline:

Session 1    Session 3    Session 5    Session 7    Session 10
    ●            ●            ●            ●             ●

Role:
Parentified  Transitioning  De-triangulated  Teen Member  Healthy Teen

Position:
Between      Moving out    Periphery        Appropriate   Age-appropriate
parents      of middle     of conflict      teen role     teen role

Key Relations:
Mother: Protective, enmeshed → Lessening → Normal parental → Healthy
Father: Distant → Emerging → Communicating → Connected
Brother: Tension → Neutral → Improving → Sibling bond

Notes:
  Session 1-3: Caught in parental conflict, taking mother's side
  Session 5: Breakthrough allowed her to step out of middle
  Session 7+: Re-established as teenager, not parent-proxy
```

---

## Example 3: Strategic Planning (Scenario Analysis)

### Scenario
Tech startup exploring three growth strategies over 2 years.

### Current State (Branching Point)
```
Graph:
  Team: 15 people
  - 1 CEO
  - 2 Co-founders (CTO, CPO)
  - 3 Engineers
  - 2 Designers
  - 3 Sales
  - 2 Marketing
  - 2 Support

  Product: Single core product
  Market: Single vertical
```

### Scenario A: Rapid Expansion
```
Branch: "Strategy A - Rapid Expansion"
Assumptions:
  - $5M Series A funding secured
  - Aggressive hiring
  - Market demand high
  - Risk: Operational complexity

Year 1:
  Team: 35 people (+20)
  - Added: 2 managers, 8 engineers, 4 sales, 3 marketing, 3 support
  - Added: Product expansion team (5 people)
  - Added: VP Sales node

Year 2:
  Team: 65 people (+30)
  - Added: 3 managers, 15 engineers, 7 sales, 5 marketing
  - Added: International team (8 people)
  - Added: VP Engineering, VP Marketing nodes
  - Network density: High complexity

Outcome Analysis:
  Strengths: Market capture, rapid growth, multiple products
  Risks: Management overhead, coordination challenges, burn rate
```

### Scenario B: Focused Growth
```
Branch: "Strategy B - Focused Growth"
Assumptions:
  - $2M seed extension
  - Selective hiring
  - Deep vertical penetration
  - Risk: Market saturation

Year 1:
  Team: 22 people (+7)
  - Added: 3 engineers, 2 sales, 2 support
  - Focus: Core product improvement
  - Strengthened: Sales/customer relations

Year 2:
  Team: 30 people (+8)
  - Added: 4 engineers, 2 sales, 2 marketing
  - Added: Customer success team (3 people)
  - Network density: Moderate, well-connected

Outcome Analysis:
  Strengths: Product excellence, customer loyalty, sustainable growth
  Risks: Slower growth, single product dependency
```

### Scenario C: Pivot to Platform
```
Branch: "Strategy C - Platform Pivot"
Assumptions:
  - $3M funding
  - Product architecture change
  - Partner ecosystem
  - Risk: Technical debt, market confusion

Year 1:
  Team: 28 people (+13)
  - Added: Platform team (8 people: 5 engineers, 2 product, 1 architect)
  - Added: Partner relations (2 people)
  - Added: Developer advocacy (2 people)
  - Restructured: Product org → Platform + Ecosystem

Year 2:
  Team: 42 people (+14)
  - Added: Partner ecosystem (external nodes)
  - Added: Developer community node
  - Added: Integration team (5 people)
  - Network: Extended beyond company (partners)

Outcome Analysis:
  Strengths: Ecosystem leverage, network effects, scalability
  Risks: Complex coordination, dependency on partners
```

### Comparison: Scenario A vs B vs C (Year 2)

**Side-by-side visualization:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│   Scenario A     │   Scenario B     │   Scenario C     │
│ Rapid Expansion  │ Focused Growth   │ Platform Pivot   │
├──────────────────┼──────────────────┼──────────────────┤
│ Team: 65 people  │ Team: 30 people  │ Team: 42 people  │
│ 5 VPs            │ 3 Managers       │ 4 Managers       │
│ High complexity  │ Moderate density │ Extended network │
│                  │                  │                  │
│ [Dense graph]    │ [Tight graph]    │ [Extended graph] │
│ Many nodes       │ Fewer nodes      │ External nodes   │
│ Hierarchical     │ Flat structure   │ Hub-and-spoke    │
│                  │                  │                  │
│ Burn: High       │ Burn: Low        │ Burn: Medium     │
│ Revenue: High    │ Revenue: Medium  │ Revenue: Variable│
│ Risk: Medium     │ Risk: Low        │ Risk: High       │
└──────────────────┴──────────────────┴──────────────────┘
```

**Comparison metrics:**
```
Metric                  Scenario A    Scenario B    Scenario C
─────────────────────────────────────────────────────────────
Team Size               65            30            42
Management Layers       4             2             3
Network Density         0.089         0.156         0.112*
Avg Connections/Person  5.8           4.7           6.3*
External Connections    5             8             24
Products                3             1             Platform
Revenue Potential       $15M          $5M           $8M
Risk Score             7/10          3/10          8/10

* Including external partner nodes
```

### Actor Journey: CTO (Across All Scenarios)

**Scenario A (Rapid Expansion):**
```
Current → Year 1 → Year 2

Role:
  CTO (Hands-on) → VP Engineering → CTO (Strategic)

Direct Reports:
  3 → 8 → 23

Focus:
  Architecture → Team building → Organization leadership

Network Position:
  Central-technical → Central-management → Central-strategic

Note: Increasingly removed from code, focus on scaling organization
```

**Scenario B (Focused Growth):**
```
Current → Year 1 → Year 2

Role:
  CTO (Hands-on) → CTO (Hands-on) → CTO (Technical Lead)

Direct Reports:
  3 → 6 → 10

Focus:
  Architecture → Product excellence → Technical depth

Network Position:
  Central-technical → Central-technical → Central-technical

Note: Remains hands-on, deep technical involvement, leads by example
```

**Scenario C (Platform Pivot):**
```
Current → Year 1 → Year 2

Role:
  CTO (Hands-on) → CTO + Chief Architect → CTO (Ecosystem)

Direct Reports:
  3 → 8 → 12

Focus:
  Product → Platform architecture → External integrations

Network Position:
  Central-technical → Central-hub → Hub-to-external

Note: Shifts to platform thinking, manages internal + external relations
```

**Comparison visualization:**
```
               Scenario A         Scenario B         Scenario C
Year 2:        (Strategic)        (Technical)        (Ecosystem)

Hands-on       ●──────────●──────────●──────────●    ●──────────●
Code:          None              Moderate            Some

Team Size:     ●──────────●──────────●──────────●    ●──────────●
               Huge (23)         Small (10)         Medium (12)

External       ●──────────●──────────●──────────●    ●──────────●
Focus:         Low               Low                 High

Stress:        ●──────────●──────────●──────────●    ●──────────●
               High              Low                 Medium

Job            ●──────────●──────────●──────────●    ●──────────●
Satisfaction:  Medium            High                Medium
```

---

## Example 4: Timeline Scrubber Interaction

### Visual Design
```
┌─────────────────────────────────────────────────────────────────┐
│ Timeline: Company Evolution                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ↓ (You are here)                                                │
│  ●═══●═══●═══●═══●═══●═══●═══●═══●═══●═══●═══●              │
│  │   │   │   │   │   │   │   │   │   │   │   │                │
│  J   F   M   A   M   J   J   A   S   O   N   D                │
│  a   e   a   p   a   u   u   u   e   c   o   e                │
│  n   b   r   r   y   n   l   g   p   t   v   c                │
│                                                                   │
│  ◀───────────────────────────────────────────────────────▶      │
│        [Drag to scrub through timeline]                          │
│                                                                   │
│  Speed: [◀] [1x] [▶]    Loop: [ ]    Auto-play: [ ]           │
└─────────────────────────────────────────────────────────────────┘
```

### Interaction States

**Hover over state marker:**
```
     ●  ← Marker highlights
     ╱╲
    ╱  ╲ Tooltip appears:
   ┌────────────────┐
   │ April 2023     │
   │ Q2 Review      │
   │ 12 actors      │
   │ 18 relations   │
   │ Click to view  │
   └────────────────┘
```

**Click state marker:**
```
Before:                      After:
  ●───●───●───●                ●───●───●───●
  ↑                                    ↑
  (You are here)                (You are here)

Graph updates with transition animation:
  - Actors fade out/in
  - Actors move to new positions
  - Relations appear/disappear
  - Duration: 500ms
```

**Drag scrubber:**
```
Dragging:
  ●═══●═══●═══●═══●
      ↑ ↑ ↑ ↑
      (scrubbing through intermediate frames)

  Graph continuously updates
  Shows interpolated states
  Smooth animation at 30fps
```

**Multi-select for comparison:**
```
Click first state (Shift+Click):
  ●═══●═══●═══●═══●
  ✓ (selected)

Click second state:
  ●═══●═══●═══●═══●
  ✓       ✓
  └───────┘
  (Range highlighted)

Compare button appears:
  [⚖ Compare Selected]
```

---

## Example 5: Diff Visualization Modes

### Mode 1: Overlay Mode
```
Original graph (State A) shown in gray/muted colors
Changes overlaid with highlighting:

  ┌─────────────────────────────────────┐
  │                                     │
  │     Alice                           │
  │     (gray)                          │
  │       │                             │
  │       │                             │
  │     ┌─┴─┐                          │
  │     │   │                           │
  │    Bob  Carol                       │
  │   (gray)(gray)                      │
  │                                     │
  │           NEW!                      │
  │          ┌─────┐                   │
  │          │ Dave │ ← Green border   │
  │          └─────┘                   │
  │             │                       │
  │             │ ← Green edge          │
  │             │                       │
  │           Carol                     │
  │                                     │
  └─────────────────────────────────────┘

Legend:
  ■ Green = Added
  ■ Red = Removed (shown faded)
  ■ Yellow = Modified
  ■ Gray = Unchanged
```

### Mode 2: Side-by-Side Mode
```
┌──────────────────────┬──────────────────────┐
│ State A (Before)     │ State B (After)      │
├──────────────────────┼──────────────────────┤
│                      │                      │
│     Alice            │     Alice            │
│       │              │       │              │
│       │              │       │              │
│     ┌─┴─┐            │     ┌─┴─┐            │
│     │   │            │     │   │            │
│    Bob  Carol        │    Bob  Carol        │
│                      │            │          │
│                      │            │          │
│                      │          Dave         │
│                      │          (green)      │
│                      │                      │
│ Actors: 3            │ Actors: 4            │
│ Relations: 2         │ Relations: 3         │
└──────────────────────┴──────────────────────┘

Synchronized: Zoom and pan linked between both views
```

### Mode 3: Diff List View
```
┌─────────────────────────────────────────────────────────┐
│ Changes: State A → State B                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ADDED (1 actor, 1 relation)                             │
│   ✓ Dave (Person)                                       │
│   ✓ Carol → Dave (Collaboration)                        │
│                                                          │
│ REMOVED (0)                                              │
│   (none)                                                 │
│                                                          │
│ MODIFIED (1 actor)                                       │
│   ○ Carol                                               │
│     • Position: (120, 80) → (180, 100)                 │
│     • Connections: 1 → 2                                │
│                                                          │
│ UNCHANGED (2 actors, 2 relations)                       │
│   [Collapse to hide]                                    │
│                                                          │
│ Summary:                                                 │
│   Total changes: 3                                      │
│   Actors affected: 2 (50%)                              │
│   Relations affected: 1 (33%)                           │
│   Network density change: +15%                          │
└─────────────────────────────────────────────────────────┘
```

### Mode 4: Animated Diff
```
Animation sequence (10 frames, 2 seconds total):

Frame 0 (State A):
  Alice, Bob, Carol visible

Frame 3:
  Dave fades in (opacity 0.3)

Frame 5:
  Dave fully visible
  New edge starts growing from Carol

Frame 7:
  Edge fully connected
  Carol moves to new position (interpolated)

Frame 10 (State B):
  Final state
  Highlighting fades out over 1 second

Visual cues during animation:
  - New elements pulse briefly
  - Removed elements fade with red glow
  - Modified elements highlighted during change
```

---

## Example 6: Actor Journey Visualization

### Journey Timeline View
```
Actor: Sarah Chen
Timeframe: January 2023 - December 2023

┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    Sep    │
│   ●──────●──────●──────●──────●──────●──────●──────●──────●    │
│   │      │      │      │      │      │      │      │      │     │
│   │      │      │      │      │      │      │      │      │     │
│ Eng   Eng   Sr.Eng  Sr.Eng Lead  Lead  Manager Manager Manager│
│                                                                   │
│  Connections: 3→3→4→5→6→7→8→10→12                              │
│                                                                   │
│  Key Events:                                                     │
│  Mar: Promotion to Senior Engineer                               │
│  May: Promoted to Team Lead                                      │
│  Jul: Became Engineering Manager                                 │
│  Sep: Team expanded significantly                                │
│                                                                   │
│  Property Changes:                                               │
│  • Title changed: 3 times                                        │
│  • Direct reports: 0→0→2→2→4→4→8→8→8                         │
│  • Position: Center-left → Center (more central)                │
│                                                                   │
│  Relationship Evolution:                                         │
│  • Peer relationships: 3→3→4→4→3→3→2→2→1 (declining)         │
│  • Managerial relations: 0→0→0→2→4→4→8→10→12 (growing)       │
│  • Cross-team relations: 0→0→1→2→3→5→6→8→10 (growing)        │
└─────────────────────────────────────────────────────────────────┘
```

### Journey Graph View
```
Visual representation of Sarah's network evolution:

January (Starting point):
      [Sarah]
         │
    ┌────┼────┐
    │    │    │
  [Tom][Ann][Lee]
  (peers)

May (Became Team Lead):
      [Sarah] ← Now has direct reports
         │
    ┌────┼────┬────┐
    │    │    │    │
  [Tom][Ann][Lee][New]
    ↓    ↓
  [Jr1][Jr2]

September (Engineering Manager):
            [Sarah]
               │
      ┌────────┼────────┐
      │        │        │
    [Lead1][Lead2][Lead3]
      │        │        │
    ┌─┼─┐    ┌─┼─┐    ┌─┼─┐
   [T][T]  [T][T]  [T][T]

Network metrics:
  Betweenness centrality: 0.05 → 0.15 → 0.42 (×8.4 increase)
  Degree centrality: 0.12 → 0.18 → 0.35 (×2.9 increase)
  Closeness centrality: 0.25 → 0.32 → 0.48 (×1.9 increase)
```

---

## Example 7: Scenario Branching Visualization

### Tree View
```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario Tree: Strategic Planning                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│                     Current State                                │
│                    (Jan 2024)                                    │
│                         ●                                        │
│                         │                                        │
│          ┌──────────────┼──────────────┐                        │
│          │              │              │                         │
│     Scenario A     Scenario B     Scenario C                    │
│   (Rapid Expand)  (Focused)      (Platform)                     │
│          ●              ●              ●                         │
│          │              │              │                         │
│     ┌────┼────┐    ┌────┴────┐   ┌────┴────┐                  │
│     │    │    │    │         │   │         │                   │
│    Q2   Q3   Q4   Q2        Q3   Q2        Q3                  │
│     ●    ●    ●    ●         ●   ●         ●                   │
│          │                        │                              │
│        Q4-A1                      │                              │
│          ●                   ┌────┴────┐                        │
│          │                   │         │                         │
│       Q4-A2                Q4-C1    Q4-C2                       │
│          ●                   ●         ●                         │
│                                                                   │
│  Colors:                                                         │
│  ● Blue = Scenario A branch                                     │
│  ● Green = Scenario B branch                                    │
│  ● Purple = Scenario C branch                                   │
│  ● Gray = Current reality                                       │
│                                                                   │
│  [Expand All] [Collapse All] [Compare Scenarios]                │
└─────────────────────────────────────────────────────────────────┘
```

### Timeline View with Branches
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                                ●─────●─────● Scenario A          │
│                              /  Q2   Q3   Q4 (Rapid)             │
│                            /                                     │
│  ●────────Current────────●                                      │
│  Jan 2024                 │                                      │
│                            \                                     │
│                              ●────● Scenario B                   │
│                               Q2   Q3 (Focused)                  │
│                                                                   │
│                             ●─────●─────●─────● Scenario C       │
│                           /  Q2   Q3   Q4-C1  Q4-C2 (Platform)  │
│                         /                                        │
│                       /                                          │
│                     ●                                            │
│                                                                   │
│  Hover on branch to see:                                         │
│  • Scenario assumptions                                          │
│  • Key metrics comparison                                        │
│  • Probability/confidence                                        │
│  • Notes and rationale                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Example 8: Presentation Mode

### Full-Screen Slideshow
```
┌───────────────────────────────────────────────────────────────────┐
│                                                                     │
│                      [F to toggle fullscreen]                      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │                Organizational Evolution                      │   │
│  │                      2023-2024                              │   │
│  │                                                             │   │
│  │                                                             │   │
│  │                    [Graph Visual]                           │   │
│  │                                                             │   │
│  │                                                             │   │
│  │                                                             │   │
│  │                                                             │   │
│  │  Key Insights:                                             │   │
│  │  • Team grew by 80% over 12 months                        │   │
│  │  • Network density increased significantly                 │   │
│  │  • Leadership structure matured                            │   │
│  │                                                             │   │
│  │                                              State 3 of 5   │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                     │
│  [◀ Previous]  [⏸ Pause]  [▶ Next]  [Esc Exit]                  │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘

Navigation:
  - Arrow keys to navigate
  - Space to play/pause
  - Esc to exit presentation mode
  - Number keys to jump to slide
  - 'R' to restart from beginning
```

---

## Summary

These examples demonstrate:

1. **Temporal Evolution**: How organizations, families, and systems change over time
2. **Scenario Exploration**: Comparing alternative futures with different assumptions
3. **Visual Comparison**: Multiple ways to see and understand differences
4. **Actor Tracking**: Following individuals through changes
5. **Interactive Timeline**: Scrubbing, clicking, and animating through states
6. **Presentation**: Telling compelling stories with data

All visualizations should be:
- **Interactive**: Click, drag, hover for more information
- **Animated**: Smooth transitions between states
- **Informative**: Rich metadata and context
- **Exportable**: Save as images, videos, or reports
- **Responsive**: Work on different screen sizes

The goal is to make temporal and scenario analysis intuitive, visual, and powerful for storytelling and analysis.
