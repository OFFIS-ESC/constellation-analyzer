# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Constellation Analyzer is a React-based visual editor for creating and analyzing Constellation Analyses. A Constellation Analysis examines actors (nodes) and their relationships (edges) to each other, resulting in an interactive graph visualization.

## Core Concepts

### Actors (Nodes)
- Represent entities in the analysis
- Support multiple configurable node types
- Each node type can have distinct visual properties and behaviors

### Relations (Edges)
- Connect actors to show relationships
- Support multiple definable edge types
- Edge types can represent different relationship categories

### Graph Editor
- Interactive visual canvas for creating and editing constellation graphs
- Drag-and-drop interface for node manipulation
- Visual edge creation between nodes
- Real-time graph updates

## Project Status

This is a new project. The codebase structure needs to be established including:
- React application scaffolding
- Graph visualization library integration
- State management setup
- Component architecture
- Data model definitions

## Architecture Decisions Needed

When implementing this project, consider:

1. **Graph Visualization Library**: Choose between React Flow, vis.js, Cytoscape.js, or similar
2. **State Management**: Redux, Zustand, Jotai, or React Context
3. **Build Tool**: Vite, Create React App, or Next.js
4. **Styling**: CSS Modules, Styled Components, Tailwind CSS, or plain CSS
5. **TypeScript**: Strongly recommended for type-safe node/edge definitions
6. **Data Persistence**: Local storage, backend API, or file export/import

## Development Workflow

- build: npm run build
- lint: npm run lint
- test: npm test
- test unit: npm run test:unit
- test integration: npm run test:integration

## Test Maintenance (CRITICAL)

**ALWAYS update tests when modifying code.** This project has comprehensive test coverage that must be maintained:

### Test Structure
- **Unit Tests**: `src/stores/*.test.ts` (367 tests) - Test individual store logic
- **Integration Tests**: `src/__tests__/integration/*.test.tsx` (19 tests) - Test store-to-store interactions

### When to Update Tests

**Store Logic Changes**:
- Modified a store function? → Update the corresponding unit test in `src/stores/[storeName].test.ts`
- Changed store state structure? → Update all tests that reference that state
- Added new store methods? → Add unit tests for the new methods

**Store Interface Changes**:
- Changed function signatures? → Update all tests calling those functions
- Modified return types? → Update test assertions
- Changed store state shape? → Update tests that access that state

**Integration Points**:
- Modified how stores interact? → Update `src/__tests__/integration/store-synchronization.test.tsx`
- Changed document lifecycle? → Update document creation/deletion tests
- Modified multi-store workflows? → Update relevant integration tests

### Key Testing Patterns

**Zustand State Pattern** (CRITICAL):
```typescript
// ✅ CORRECT - Always get fresh state after mutations
const docId = useWorkspaceStore.getState().createDocument('Test');
const doc = useWorkspaceStore.getState().documents.get(docId);

// ❌ WRONG - Stale state reference
const store = useWorkspaceStore.getState();
const docId = store.createDocument('Test');
const doc = store.documents.get(docId); // Stale!
```

**Store Reset in Tests**:
```typescript
beforeEach(() => {
  localStorage.clear();
  resetWorkspaceStore(); // From src/test/test-helpers.ts
});
```

### Test Philosophy
- **Unit tests**: Test individual store functions in isolation
- **Integration tests**: Test store-to-store coordination (NOT UI)
- **No UI testing**: Integration tests focus on business logic layer only

### Running Tests
```bash
npm run test:unit        # Run store unit tests only
npm run test:integration # Run integration tests only
npm test                 # Run all tests
npm run test:ui          # Interactive test UI
```

### Before Committing
1. Run all tests: `npm test`
2. Verify all tests pass
3. If tests fail, update them to match new behavior
4. If behavior change is intentional, update test expectations
5. Never commit broken tests