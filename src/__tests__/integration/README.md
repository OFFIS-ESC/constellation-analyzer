# Integration Tests

This directory contains integration tests for the Constellation Analyzer application.

## Overview

Integration tests verify that multiple components and stores work together correctly. Unlike unit tests that test individual stores or functions in isolation, integration tests ensure that:

1. Multiple stores synchronize state correctly
2. Components respond properly to store changes
3. Complex user flows work end-to-end
4. State persists and loads correctly across documents

## Test Files

### `document-lifecycle.test.tsx`
Tests multi-document workflows including:
- Creating and switching between documents
- Preserving state when switching documents
- Deleting documents
- Persisting documents to localStorage
- Maintaining independent graph state for each document

### `graph-editing-history.test.tsx`
Tests graph editing operations with history tracking:
- Undo/redo for node operations (add, delete, update)
- Undo/redo for edge operations
- Undo/redo for group operations
- History state management across documents
- Clearing redo stack when new actions are performed

### `timeline-state-management.test.tsx`
Tests timeline/temporal state functionality:
- Creating new timeline states
- Cloning graph data when creating states
- Switching between timeline states
- Maintaining independent graph data for each state
- Preserving timeline state hierarchy (parent-child relationships)
- Timeline state persistence

## Testing Approach

### Store-First Testing
These integration tests primarily interact with stores directly rather than simulating UI interactions. This approach:
- Tests the core business logic integration
- Is more reliable than trying to find specific UI elements
- Runs faster than full UI interaction tests
- Is less brittle (doesn't break when UI changes)

### When UI Interaction is Used
UI interactions are used when testing:
- Tab switching (document tabs)
- Undo/redo buttons
- Timeline state selection

This ensures that the UI properly triggers store actions.

## Running the Tests

```bash
# Run all integration tests
npm run test:integration

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

Each test follows this pattern:

1. **Setup**: Clear localStorage and reset stores
2. **Action**: Perform operations through stores or UI
3. **Assertion**: Verify expected state and behavior
4. **Cleanup**: Tests use `beforeEach` to ensure clean state

## Future Enhancements

Potential areas for additional integration tests:

1. **Search & Filter Integration**
   - Multi-store interaction between search and graph stores
   - Filter combinations
   - Search persistence across document switches

2. **Bibliography Integration**
   - Citation management with graph elements
   - Import/export of citation formats
   - Bibliography persistence with documents

3. **Type System Integration**
   - Creating custom actor/relation types
   - Type persistence across documents
   - Type deletion with existing actors/relations

4. **Import/Export Workflows**
   - Full document export/import
   - Workspace ZIP archives
   - PNG/SVG image exports

## Notes

- Integration tests use the same setup as unit tests (`src/test/setup.ts`)
- Tests run in a happy-dom environment for better performance
- localStorage is mocked and cleared between tests
- React Flow is rendered but interactions with the canvas are limited
