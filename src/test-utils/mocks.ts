import { vi } from 'vitest';
import type { ConstellationDocument } from '../stores/persistence/types';
import type { NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../types';

/**
 * Test Mocks and Utilities
 *
 * Shared mocks for testing stores with complex dependencies
 */

// Mock default node types
export const mockNodeTypes: NodeTypeConfig[] = [
  { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'Individual person' },
  { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'Company or group' },
];

// Mock default edge types
export const mockEdgeTypes: EdgeTypeConfig[] = [
  { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid' },
  { id: 'reports-to', label: 'Reports To', color: '#10b981', style: 'solid' },
];

// Mock default labels
export const mockLabels: LabelConfig[] = [
  { id: 'label-1', name: 'Important', color: '#ef4444', appliesTo: 'both' },
  { id: 'label-2', name: 'Archive', color: '#6b7280', appliesTo: 'both' },
];

// Create a mock document
export function createMockDocument(overrides?: Partial<ConstellationDocument>): ConstellationDocument {
  const now = new Date().toISOString();
  const rootStateId = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  return {
    metadata: {
      version: '1.0.0',
      appName: 'Constellation Analyzer',
      createdAt: now,
      updatedAt: now,
      lastSavedBy: 'browser',
      documentId: 'test-doc-id',
      title: 'Test Document',
      ...overrides?.metadata,
    },
    nodeTypes: mockNodeTypes,
    edgeTypes: mockEdgeTypes,
    labels: mockLabels,
    timeline: {
      states: {
        [rootStateId]: {
          id: rootStateId,
          label: 'Initial State',
          parentStateId: undefined,
          graph: {
            nodes: [],
            edges: [],
            groups: [],
          },
          createdAt: now,
          updatedAt: now,
        },
      },
      currentStateId: rootStateId,
      rootStateId: rootStateId,
    },
    bibliography: {
      references: [],
      metadata: {},
      settings: { defaultStyle: 'apa', sortOrder: 'author' },
    },
    ...overrides,
  };
}

// Mock toast store
export function mockToastStore() {
  return {
    showToast: vi.fn(),
    hideToast: vi.fn(),
    clearAllToasts: vi.fn(),
  };
}

// Mock timeline store
export function mockTimelineStore() {
  const timelines = new Map();

  return {
    getState: () => ({
      timelines,
      activeDocumentId: null,
      loadTimeline: vi.fn((documentId: string, timeline: unknown) => {
        timelines.set(documentId, timeline);
      }),
      clearTimeline: vi.fn(),
    }),
    setState: vi.fn(),
  };
}

// Mock graph store
export function mockGraphStore() {
  return {
    getState: () => ({
      nodes: [],
      edges: [],
      groups: [],
      nodeTypes: mockNodeTypes,
      edgeTypes: mockEdgeTypes,
      labels: mockLabels,
      setNodeTypes: vi.fn(),
      setEdgeTypes: vi.fn(),
      setLabels: vi.fn(),
      loadGraphState: vi.fn(),
    }),
    setState: vi.fn(),
  };
}

// Mock bibliography store
export function mockBibliographyStore() {
  // Mock Cite instance
  const mockCite = {
    data: [],
    add: vi.fn(),
    set: vi.fn(),
    reset: vi.fn(),
    format: vi.fn(() => ''),
  };

  return {
    getState: () => ({
      citeInstance: mockCite,
      appMetadata: {},
      settings: { defaultStyle: 'apa', sortOrder: 'author' },
    }),
    setState: vi.fn(),
  };
}

// Mock history store
export function mockHistoryStore() {
  return {
    getState: () => ({
      histories: new Map(),
      initializeHistory: vi.fn(),
      clearHistory: vi.fn(),
      removeHistory: vi.fn(),
    }),
    setState: vi.fn(),
  };
}

// Mock file input for import testing
export function mockFileInput(fileName: string, content: string) {
  const file = new File([content], fileName, { type: 'application/json' });
  const mockInput = document.createElement('input');
  mockInput.type = 'file';

  Object.defineProperty(mockInput, 'files', {
    value: [file],
    writable: false,
  });

  return mockInput;
}

// Mock URL.createObjectURL for export testing
export function mockURLCreateObjectURL() {
  const urls: string[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  global.URL.createObjectURL = vi.fn((_blob: Blob) => {
    const url = `blob:mock-url-${urls.length}`;
    urls.push(url);
    return url;
  });

  global.URL.revokeObjectURL = vi.fn();

  return {
    getUrls: () => urls,
    cleanup: () => {
      urls.length = 0;
    },
  };
}

// Mock download trigger
export function mockDownload() {
  const downloads: Array<{ href: string; download: string }> = [];

  const originalCreateElement = document.createElement.bind(document);
  document.createElement = vi.fn((tagName: string) => {
    const element = originalCreateElement(tagName);

    if (tagName === 'a') {
      const originalClick = element.click.bind(element);
      element.click = vi.fn(() => {
        downloads.push({
          href: element.getAttribute('href') || '',
          download: element.getAttribute('download') || '',
        });
        originalClick();
      });
    }

    return element;
  }) as typeof document.createElement;

  return {
    getDownloads: () => downloads,
    cleanup: () => {
      downloads.length = 0;
      document.createElement = originalCreateElement;
    },
  };
}
