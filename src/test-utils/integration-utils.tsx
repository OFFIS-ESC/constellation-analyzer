import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { ReactFlowProvider } from '@xyflow/react';
import App from '../App';
import { KeyboardShortcutProvider } from '../contexts/KeyboardShortcutContext';

/**
 * Setup function for integration tests that renders the full App with all providers
 */
export function setupIntegrationTest() {
  const user = userEvent.setup();
  const renderResult = render(
    <KeyboardShortcutProvider>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </KeyboardShortcutProvider>
  );

  return {
    user,
    ...renderResult,
  };
}

/**
 * Helper to create a new document through the UI
 */
export async function createDocument(user: UserEvent, title: string) {
  // Click the "New Document" button
  const newDocButton = screen.getByRole('button', { name: /new document/i });
  await user.click(newDocButton);

  // Wait for dialog to appear and fill in title
  const titleInput = await screen.findByLabelText(/title/i);
  await user.clear(titleInput);
  await user.type(titleInput, title);

  // Click create button
  const createButton = screen.getByRole('button', { name: /^create$/i });
  await user.click(createButton);

  // Wait for document to be created
  await waitFor(() => {
    expect(screen.getByRole('tab', { name: title })).toBeInTheDocument();
  });
}

/**
 * Helper to switch to a document by title
 */
export async function switchToDocument(user: UserEvent, title: string) {
  const tab = screen.getByRole('tab', { name: title });
  await user.click(tab);

  // Wait for document to be active
  await waitFor(() => {
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });
}

/**
 * Helper to add an actor node through the UI
 */
export async function addActorNode(user: UserEvent, typeName: string) {
  // Find and click the actor type button in the toolbar
  const typeButton = screen.getByRole('button', { name: new RegExp(typeName, 'i') });
  await user.click(typeButton);

  // Wait for the node to appear in the graph
  // Note: This may need adjustment based on how nodes are rendered
  await waitFor(() => {
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  }, { timeout: 2000 });
}

/**
 * Helper to delete the current document
 */
export async function deleteCurrentDocument(user: UserEvent) {
  // Click the document menu button
  const menuButton = screen.getByRole('button', { name: /document menu/i });
  await user.click(menuButton);

  // Click delete option
  const deleteOption = screen.getByRole('menuitem', { name: /delete/i });
  await user.click(deleteOption);

  // Confirm deletion if dialog appears
  const confirmButton = screen.queryByRole('button', { name: /^delete$/i });
  if (confirmButton) {
    await user.click(confirmButton);
  }
}

/**
 * Helper to perform undo action
 */
export async function performUndo(user: UserEvent) {
  const undoButton = screen.getByRole('button', { name: /undo/i });
  await user.click(undoButton);
}

/**
 * Helper to perform redo action
 */
export async function performRedo(user: UserEvent) {
  const redoButton = screen.getByRole('button', { name: /redo/i });
  await user.click(redoButton);
}

/**
 * Helper to create a new timeline state
 */
export async function createTimelineState(user: UserEvent, stateName: string) {
  // Click the "New State" button in the timeline panel
  const newStateButton = screen.getByRole('button', { name: /new state/i });
  await user.click(newStateButton);

  // Wait for dialog and fill in name
  const nameInput = await screen.findByLabelText(/name|title/i);
  await user.clear(nameInput);
  await user.type(nameInput, stateName);

  // Click create button
  const createButton = screen.getByRole('button', { name: /^create$/i });
  await user.click(createButton);

  // Wait for state to appear
  await waitFor(() => {
    expect(screen.getByText(stateName)).toBeInTheDocument();
  });
}

/**
 * Helper to switch to a timeline state
 */
export async function switchToTimelineState(user: UserEvent, stateName: string) {
  const stateElement = screen.getByText(stateName);
  await user.click(stateElement);

  // Wait for state to become active
  await waitFor(() => {
    // The active state should have some visual indicator
    expect(stateElement.closest('[data-active="true"]')).toBeInTheDocument();
  });
}

/**
 * Helper to get the current document's node count from the store
 */
export function getNodeCount(): number {
  const canvas = document.querySelector('.react-flow');
  if (!canvas) return 0;

  const nodes = canvas.querySelectorAll('.react-flow__node');
  return nodes.length;
}

/**
 * Helper to get the current document's edge count
 */
export function getEdgeCount(): number {
  const canvas = document.querySelector('.react-flow');
  if (!canvas) return 0;

  const edges = canvas.querySelectorAll('.react-flow__edge');
  return edges.length;
}

/**
 * Wait for React Flow to be ready
 */
export async function waitForReactFlow() {
  await waitFor(() => {
    const canvas = document.querySelector('.react-flow');
    expect(canvas).toBeInTheDocument();
  }, { timeout: 3000 });
}

/**
 * Helper to search for text in the search panel
 */
export async function searchFor(user: UserEvent, searchText: string) {
  const searchInput = screen.getByPlaceholderText(/search/i);
  await user.clear(searchInput);
  await user.type(searchInput, searchText);

  // Wait for search to process
  await waitFor(() => {
    // Search results should update
    expect(searchInput).toHaveValue(searchText);
  });
}

/**
 * Helper to clear all filters
 */
export async function clearAllFilters(user: UserEvent) {
  const clearButton = screen.queryByRole('button', { name: /clear.*filter/i });
  if (clearButton) {
    await user.click(clearButton);
  }
}
