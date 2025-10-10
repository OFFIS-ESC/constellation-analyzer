# Quick Start Guide - Constellation Analyzer

## Get Started in 2 Minutes

### 1. Install & Run
```bash
npm install
npm run dev
```

The application will open automatically at **http://localhost:3000**

### 2. Create Your First Constellation

#### Add Actors (Nodes)
1. Click any colored button in the toolbar:
   - **Person** (Blue) - Individual people
   - **Organization** (Green) - Companies or groups
   - **System** (Orange) - Technical systems
   - **Concept** (Purple) - Abstract ideas

2. Nodes appear on the canvas - drag them to position

#### Create Relations (Edges)
1. Click and hold on any colored dot (handle) on a node
2. Drag your cursor to another node's handle
3. Release to create a connection
4. The edge appears automatically

#### Edit Your Graph
- **Move nodes**: Click and drag anywhere on the node
- **Delete node**: Click to select, press Delete or Backspace
- **Delete edge**: Click the edge, press Delete or Backspace
- **Pan canvas**: Click and drag on empty space
- **Zoom**: Use mouse wheel or trackpad
- **Clear all**: Click "Clear Graph" button (with confirmation)

### 3. Navigation

- **Controls** (bottom-left corner):
  - Zoom in/out buttons
  - Fit view button
  - Lock/unlock button

- **MiniMap** (bottom-right corner):
  - Overview of entire graph
  - Click to navigate
  - Drag viewport rectangle

### 4. Available Commands

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Git
git status           # Check current changes
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
```

## Example: Simple Organization Chart

1. Add a "Person" node (CEO)
2. Add three more "Person" nodes (Managers)
3. Create edges from CEO to each Manager
4. Add "Organization" nodes (Departments)
5. Connect Managers to their Departments
6. Arrange nodes in hierarchy

## Tips

- Use the handles on all four sides of nodes for flexible connections
- Different edge types have different visual styles (solid, dashed, dotted)
- The graph auto-saves in the browser session (lost on page refresh)
- Select multiple nodes by clicking them while dragging

## Next Steps

- Read the full **README.md** for detailed documentation
- Check **PROJECT_SUMMARY.md** for architecture details
- Explore the **src/** folder to understand the code structure
- Start customizing node/edge types in **src/stores/graphStore.ts**

## Need Help?

- Documentation: See README.md
- Architecture: See PROJECT_SUMMARY.md
- Project guidance: See CLAUDE.md
- Issues: Open an issue on the repository

---

**Built with**: React + TypeScript + React Flow + Zustand + Tailwind CSS + Vite

Happy analyzing!
