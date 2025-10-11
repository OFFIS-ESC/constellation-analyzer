import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import type { ConstellationDocument } from './types';
import { createDocument, serializeActors, serializeRelations } from './saver';
import { validateDocument, deserializeGraphState } from './loader';

/**
 * File I/O - Export and import ConstellationDocument to/from files
 */

/**
 * Export a complete ConstellationDocument to a JSON file
 * Includes all timeline states and metadata
 */
export function exportDocumentToFile(document: ConstellationDocument): void {
  // Convert to JSON with pretty formatting
  const jsonString = JSON.stringify(document, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Create download link
  const link = window.document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  const title = document.metadata.title || 'constellation-analysis';
  const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  link.download = `${sanitizedTitle}-${dateStr}.json`;

  // Trigger download
  window.document.body.appendChild(link);
  link.click();

  // Cleanup
  window.document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export current graph state to a JSON file
 * Creates a new document with a single "Initial State"
 */
export function exportGraphToFile(
  nodes: Actor[],
  edges: Relation[],
  nodeTypes: NodeTypeConfig[],
  edgeTypes: EdgeTypeConfig[]
): void {
  // Serialize actors and relations
  const serializedNodes = serializeActors(nodes);
  const serializedEdges = serializeRelations(edges);

  // Create the document using the existing saver
  const doc = createDocument(serializedNodes, serializedEdges, nodeTypes, edgeTypes);

  // Use the main export function
  exportDocumentToFile(doc);
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
