import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import type { ConstellationDocument } from './types';
import { createDocument } from './saver';
import { validateDocument, deserializeGraphState } from './loader';

/**
 * File I/O - Export and import ConstellationDocument to/from files
 */

/**
 * Export current graph state to a JSON file
 */
export function exportGraphToFile(
  nodes: Actor[],
  edges: Relation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[]
): void {
  // Create the document using the existing saver
  const doc = createDocument(nodes, edges, nodeTypes, edgeTypes);

  // Convert to JSON with pretty formatting
  const jsonString = JSON.stringify(doc, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = window.document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `constellation-analysis-${dateStr}.json`;

  // Trigger download
  window.document.body.appendChild(link);
  link.click();

  // Cleanup
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import graph state from a JSON file
 */
export function importGraphFromFile(
  file: File,
  onSuccess: (data: {
    nodes: Actor[];
    edges: Relation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
  }) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();

  reader.onload = (event) => {
    try {
      const jsonString = event.target?.result as string;
      const parsed = JSON.parse(jsonString);

      // Validate using the existing loader validation
      if (!validateDocument(parsed)) {
        throw new Error('Invalid file format: File does not match expected Constellation Analyzer format');
      }

      // Deserialize the graph state
      const graphState = deserializeGraphState(parsed as ConstellationDocument);

      if (!graphState) {
        throw new Error('Failed to parse graph data from file');
      }

      onSuccess(graphState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred while importing file';
      onError(errorMessage);
    }
  };

  reader.onerror = () => {
    onError('Failed to read file');
  };

  reader.readAsText(file);
}

/**
 * Trigger file selection dialog for import
 */
export function selectFileForImport(
  onSuccess: (data: {
    nodes: Actor[];
    edges: Relation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
  }) => void,
  onError: (error: string) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      importGraphFromFile(file, onSuccess, onError);
    }
  };

  input.click();
}
