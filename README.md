# Constellation Analyzer

A React-based visual editor for creating and analyzing Constellation Analyses. Build interactive graphs to examine actors (nodes) and their relationships (edges) with a powerful drag-and-drop interface.

## Features

- **Interactive Graph Visualization**: Built on React Flow for smooth, performant graph editing
- **Customizable Node Types**: Define and configure multiple actor types with distinct visual properties
- **Flexible Edge Types**: Create various relationship categories with different styles and colors
- **Drag-and-Drop Interface**: Intuitive node manipulation and edge creation
- **Real-time Updates**: Instant visual feedback as you build your constellation
- **Type-Safe**: Full TypeScript support for robust development
- **State Management**: Zustand for lightweight, efficient state handling
- **Responsive Design**: Tailwind CSS for modern, adaptive UI

## Technology Stack

- **React 18.2** - UI framework
- **TypeScript 5.2** - Type safety
- **Vite 5.1** - Build tool and dev server
- **React Flow 11.11** - Graph visualization library
- **Zustand 4.5** - State management
- **Tailwind CSS 3.4** - Styling framework

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server (opens at http://localhost:3000)
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Lint

```bash
# Run ESLint
npm run lint
```

## Project Structure

```
constellation-analyzer/
├── src/
│   ├── components/          # React components
│   │   ├── Editor/         # Main graph editor
│   │   │   └── GraphEditor.tsx
│   │   ├── Nodes/          # Custom node components
│   │   │   └── CustomNode.tsx
│   │   ├── Edges/          # Custom edge components
│   │   │   └── CustomEdge.tsx
│   │   └── Toolbar/        # Editor controls
│   │       └── Toolbar.tsx
│   ├── stores/             # Zustand state stores
│   │   ├── graphStore.ts   # Graph state (nodes, edges, types)
│   │   └── editorStore.ts  # Editor settings
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── nodeUtils.ts
│   │   └── edgeUtils.ts
│   ├── styles/             # Global styles
│   │   └── index.css
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── vite-env.d.ts       # Vite types
├── public/                 # Static assets
├── index.html             # HTML template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── tailwind.config.js     # Tailwind config
└── README.md              # This file
```

## Usage

### Adding Actors (Nodes)

1. Click any of the actor type buttons in the toolbar (Person, Organization, System, Concept)
2. A new node will appear on the canvas
3. Drag the node to position it

### Creating Relations (Edges)

1. Click and drag from any colored handle (circle) on a node
2. Release over a handle on another node to create a connection
3. The edge will automatically appear with default styling

### Deleting Elements

- **Delete Node**: Select a node and press `Delete` or `Backspace`
- **Delete Edge**: Select an edge and press `Delete` or `Backspace`

### Navigation

- **Pan**: Click and drag on empty canvas space
- **Zoom**: Use mouse wheel or pinch gesture
- **Fit View**: Use the controls in bottom-left corner
- **MiniMap**: View overview and navigate in bottom-right corner

## Core Concepts

### Actors (Nodes)

Actors represent entities in your analysis. Each actor has:
- **Type**: Category (person, organization, system, concept)
- **Label**: Display name
- **Description**: Optional details
- **Position**: X/Y coordinates on canvas
- **Metadata**: Custom properties

### Relations (Edges)

Relations connect actors to show relationships. Each relation has:
- **Type**: Category (collaborates, reports-to, depends-on, influences)
- **Label**: Optional description
- **Style**: Visual representation (solid, dashed, dotted)
- **Source/Target**: Connected actors

### Node Types

Pre-configured actor categories:
- **Person**: Individual (Blue)
- **Organization**: Company/group (Green)
- **System**: Technical system (Orange)
- **Concept**: Abstract idea (Purple)

### Edge Types

Pre-configured relationship categories:
- **Collaborates**: Working together (Blue, solid)
- **Reports To**: Hierarchical (Green, solid)
- **Depends On**: Dependency (Orange, dashed)
- **Influences**: Impact (Purple, dotted)

## Customization

### Adding New Node Types

Edit `/src/stores/graphStore.ts`:

```typescript
const defaultNodeTypes: NodeTypeConfig[] = [
  // Add your custom type
  {
    id: 'custom-type',
    label: 'Custom Type',
    color: '#ff6b6b',
    description: 'My custom actor type'
  },
];
```

### Adding New Edge Types

Edit `/src/stores/graphStore.ts`:

```typescript
const defaultEdgeTypes: EdgeTypeConfig[] = [
  // Add your custom type
  {
    id: 'custom-relation',
    label: 'Custom Relation',
    color: '#ff6b6b',
    style: 'solid'
  },
];
```

## Architecture Decisions

### Why React Flow?
- React-native components for seamless integration
- Excellent performance with large graphs
- Rich API for customization
- Active community and maintenance

### Why Zustand?
- Lightweight (< 1KB)
- Simple, hook-based API
- No boilerplate compared to Redux
- Perfect for graph state management

### Why Vite?
- Lightning-fast HMR (Hot Module Replacement)
- Modern build tool with ES modules
- Optimized production builds
- Better DX than Create React App

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Small production bundle (unused classes purged)
- Easy responsive design

## Development Guidelines

### ⚠️ Important: Always Use History-Tracked Operations

When modifying graph state in components, **always use `useGraphWithHistory()`** instead of `useGraphStore()` directly:

```typescript
// ✅ CORRECT: Uses history tracking (enables undo/redo)
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';

function MyComponent() {
  const { addNode, updateNode, deleteNode } = useGraphWithHistory();

  const handleAddNode = () => {
    addNode(newNode);  // Automatically tracked in history
  };
}
```

```typescript
// ❌ WRONG: Bypasses history (undo/redo won't work)
import { useGraphStore } from '../../stores/graphStore';

function MyComponent() {
  const graphStore = useGraphStore();

  const handleAddNode = () => {
    graphStore.addNode(newNode);  // History not tracked!
  };
}
```

**Exception**: Read-only access in presentation components (CustomNode, CustomEdge) is acceptable since it doesn't modify state.

### History-Tracked Operations

All these operations automatically create undo/redo history entries:
- Node operations: `addNode`, `updateNode`, `deleteNode`
- Edge operations: `addEdge`, `updateEdge`, `deleteEdge`
- Type operations: `addNodeType`, `updateNodeType`, `deleteNodeType`, `addEdgeType`, `updateEdgeType`, `deleteEdgeType`
- Utility: `clearGraph`

See `src/hooks/useGraphWithHistory.ts` for complete documentation.

## Next Steps

### Suggested Enhancements

1. **Data Persistence**
   - Save/load graphs to/from JSON
   - Local storage integration
   - Export to PNG/SVG

2. **Advanced Editing**
   - Multi-select nodes
   - Copy/paste functionality
   - ✅ Undo/redo history (implemented - per-document with 50 action limit)

3. **Node/Edge Properties Panel**
   - Edit labels and descriptions
   - Change types dynamically
   - Add custom metadata

4. **Layout Algorithms**
   - Auto-arrange nodes
   - Hierarchical layout
   - Force-directed layout

5. **Analysis Tools**
   - Calculate graph metrics
   - Find shortest paths
   - Identify clusters

6. **Collaboration**
   - Real-time multi-user editing
   - Version control
   - Comments and annotations

## Contributing

This is a new project. Contributions are welcome!

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
