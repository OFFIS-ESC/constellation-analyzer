import { useWorkspaceStore } from '../stores/workspaceStore';
import type { WorkspaceSettings } from '../types';

/**
 * Default settings for tests
 */
export const defaultTestSettings: WorkspaceSettings = {
  maxOpenDocuments: 10,
  autoSaveEnabled: true,
  defaultNodeTypes: [
    { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'Individual person' },
    { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'Company or group' },
    { id: 'system', label: 'System', color: '#f59e0b', shape: 'roundedRectangle', icon: 'Computer', description: 'Technical system' },
    { id: 'concept', label: 'Concept', color: '#8b5cf6', shape: 'roundedRectangle', icon: 'Lightbulb', description: 'Abstract concept' },
  ],
  defaultEdgeTypes: [
    { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid' },
    { id: 'reports-to', label: 'Reports To', color: '#10b981', style: 'solid' },
    { id: 'depends-on', label: 'Depends On', color: '#f59e0b', style: 'dashed' },
    { id: 'influences', label: 'Influences', color: '#8b5cf6', style: 'dotted' },
  ],
  recentFiles: [],
};

/**
 * Reset workspace store to a clean state for testing
 */
export function resetWorkspaceStore() {
  useWorkspaceStore.setState({
    workspaceId: 'test-workspace',
    workspaceName: 'Test Workspace',
    documents: new Map(),
    documentMetadata: new Map(),
    documentOrder: [],
    activeDocumentId: null,
    settings: defaultTestSettings,
  });
}
