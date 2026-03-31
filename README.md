# Constellation Analyzer

A React-based visual editor for Constellation Analysis — mapping actors (nodes) and their relationships (edges) in an interactive graph.

> **Vibe-Warning**: This is a testing ground for agent-based LLM coding. The codebase contains no hand-written code. Take it with a grain of salt.

## Features

- **Multi-document workspace** — open multiple analyses in tabs, persist to localStorage
- **Graph editor** — drag-and-drop actors and relations with custom types, shapes, colors, and directionality
- **Groups** — cluster actors into named, collapsible groups
- **Timeline / States** — branching constellation states within a document (parallel scenarios or time evolution)
- **Presentation mode** — fullscreen view with timeline overlay for presenting analyses
- **Undo / Redo** — per-document history with operation descriptions
- **Bibliography** — citation management via Citation.js (BibTeX, RIS, DOI, CSL)
- **TUIO integration** — tangible token support over WebSocket/OSC for physical interaction
- **Export** — PNG, SVG, JSON (document), ZIP (workspace)
- **Search & filters** — filter graph by actor type, relation type, or label

## Tech Stack

| | |
|---|---|
| Framework | React 18.2, TypeScript 5.2, Vite 5.1 |
| Graph | @xyflow/react 12.3 |
| State | Zustand 4.5 |
| UI | MUI 5.15, Tailwind CSS 3.4 |
| Bibliography | Citation.js 0.7 |
| TUIO | tuio-client 0.1, osc-js 2.4 |
| Testing | Vitest 3.2, Testing Library 16.3 |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm test
```

## Project Structure

```
src/
├── components/
│   ├── Config/        # Node/edge/tangible/bibliography config dialogs
│   ├── Editor/        # Main graph editor (GraphEditor.tsx)
│   ├── Edges/         # Custom edge renderers
│   ├── Menu/          # Menu bar (File, Edit, View, Help)
│   ├── Nodes/         # CustomNode, GroupNode, shape renderers
│   ├── Panels/        # Left/right side panels, property editors
│   ├── Presentation/  # Fullscreen presentation overlay
│   ├── Timeline/      # Timeline/states UI
│   └── Workspace/     # Document tabs and document manager
├── hooks/             # useGraphWithHistory, useDocumentHistory, useTuioIntegration, …
├── stores/            # Zustand stores (graph, timeline, workspace, history, bibliography, tuio, …)
├── types/             # TypeScript definitions
└── utils/             # Export, graph analysis, bibliography parsing, migrations
```

## Development Guidelines

### Graph Mutations — Always Use `useGraphWithHistory`

```typescript
// ✅ Correct — history tracked, undo/redo works
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
const { addNode, updateNode, deleteNode, addEdge, ... } = useGraphWithHistory();

// ❌ Wrong — bypasses history
import { useGraphStore } from '../../stores/graphStore';
```

Read-only access in display components (CustomNode, CustomEdge) can use `useGraphStore` directly.

### Tests

```bash
npm run test:unit        # Store unit tests (src/stores/*.test.ts)
npm run test:integration # Integration tests (src/__tests__/integration/)
npm test                 # All tests
```

Always update tests when modifying store logic. See `CLAUDE.md` for testing patterns.

## License

MIT
