# Multi-File/Multi-Document Architecture Plan

## Overview

Transform Constellation Analyzer from a single-document app to a multi-document workspace with tabbed interface, leveraging the existing persistence infrastructure.

---

## 1. Core Concept: Workspace vs Document

### Current Architecture
- **Single Document**: One graph with its nodes, edges, nodeTypes, edgeTypes
- **Auto-save**: Automatically saves to `localStorage` under one key

### New Architecture
- **Workspace**: Container for multiple documents + workspace settings
- **Documents**: Individual constellation analyses (each is a `ConstellationDocument`)
- **Active Document**: The currently visible/editable document in a tab
- **Workspace Settings**: Cross-document preferences, recent files list, tab order

---

## 2. Data Model Evolution

### Workspace Structure
```typescript
interface WorkspaceState {
  // Workspace metadata
  workspaceId: string;                    // Unique workspace ID
  workspaceName: string;                  // "My Workspace"

  // Document management
  documents: Map<string, ConstellationDocument>;  // documentId -> document
  documentOrder: string[];                // Order of tabs
  activeDocumentId: string | null;       // Currently visible document

  // Document metadata (separate from document content for performance)
  documentMetadata: Map<string, DocumentMetadata>;

  // Workspace-level settings
  settings: WorkspaceSettings;
}

interface DocumentMetadata {
  id: string;
  title: string;                          // User-friendly name
  fileName?: string;                      // If loaded from file
  filePath?: string;                      // For future file system access
  isDirty: boolean;                       // Has unsaved changes
  lastModified: string;                   // ISO timestamp
  thumbnail?: string;                     // Base64 mini-preview (optional)
  color?: string;                         // Tab color identifier
}

interface WorkspaceSettings {
  maxOpenDocuments: number;               // Limit tabs (e.g., 10)
  autoSaveEnabled: boolean;
  defaultNodeTypes: NodeTypeConfig[];     // Workspace defaults
  defaultEdgeTypes: EdgeTypeConfig[];     // Workspace defaults
  recentFiles: RecentFile[];             // Recently opened files
}

interface RecentFile {
  path: string;
  title: string;
  lastOpened: string;
  thumbnail?: string;
}
```

### Updated ConstellationDocument
```typescript
// Already exists, but add:
interface ConstellationDocument {
  // ... existing fields
  metadata: {
    // ... existing fields
    documentId: string;                   // NEW: Unique document ID
    title: string;                        // NEW: Document title
  };
  graph: {
    // ... existing: nodes, edges, nodeTypes, edgeTypes
  };
}
```

---

## 3. Storage Strategy

### LocalStorage Key Structure
```typescript
const STORAGE_KEYS = {
  // Workspace-level
  WORKSPACE_STATE: 'constellation:workspace:v1',
  WORKSPACE_SETTINGS: 'constellation:workspace:settings:v1',

  // Document-level (dynamic)
  DOCUMENT_PREFIX: 'constellation:document:v1:',  // + documentId
  DOCUMENT_METADATA_PREFIX: 'constellation:meta:v1:', // + documentId

  // Legacy (for migration)
  LEGACY_GRAPH_STATE: 'constellation:graph:v1',
};
```

### Storage Pattern
```
localStorage:
  ├─ constellation:workspace:v1
  │    → { workspaceId, workspaceName, documentOrder, activeDocumentId }
  │
  ├─ constellation:workspace:settings:v1
  │    → { maxOpenDocuments, autoSaveEnabled, defaultNodeTypes, ... }
  │
  ├─ constellation:document:v1:doc-123
  │    → Full ConstellationDocument
  │
  ├─ constellation:meta:v1:doc-123
  │    → DocumentMetadata (for quick loading)
  │
  └─ ... (more documents)
```

**Benefits:**
- **Partial loading**: Load metadata first, full documents on demand
- **Quota management**: Can delete old documents individually
- **Performance**: Don't load all documents at startup
- **Granular auto-save**: Only save changed documents

---

## 4. Architecture Changes

### New Store: `workspaceStore.ts`
```typescript
interface WorkspaceStore {
  // Workspace state
  workspaceId: string;
  workspaceName: string;
  documentOrder: string[];
  activeDocumentId: string | null;
  documentMetadata: Map<string, DocumentMetadata>;
  settings: WorkspaceSettings;

  // Document management
  documents: Map<string, ConstellationDocument>; // Only loaded docs in memory

  // Actions
  createDocument: (title?: string) => string;     // Returns documentId
  loadDocument: (documentId: string) => void;
  closeDocument: (documentId: string) => void;
  deleteDocument: (documentId: string) => void;
  renameDocument: (documentId: string, newTitle: string) => void;
  duplicateDocument: (documentId: string) => string;

  switchToDocument: (documentId: string) => void;
  reorderDocuments: (newOrder: string[]) => void;

  importDocumentFromFile: (file: File) => Promise<string>;
  exportDocument: (documentId: string) => void;

  // Workspace actions
  saveWorkspace: () => void;
  loadWorkspace: () => void;
  clearWorkspace: () => void;
}
```

### Updated `graphStore.ts`
```typescript
// REFACTOR: Make graphStore document-scoped
interface GraphStore {
  // Remove persistence - now handled by workspace
  nodes: Actor[];
  edges: Relation[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];

  // Same CRUD operations, but no auto-save to localStorage
  // Instead, mark document as dirty in workspace
  addNode: (node: Actor) => void;
  updateNode: (id: string, updates: Partial<Actor>) => void;
  // ... etc

  // NEW: Hook to notify workspace of changes
  _onChangeCallback?: () => void;
}

// Create instance per document
const createGraphStore = (documentId: string) => {
  return create<GraphStore>((set) => ({
    // ... existing implementation
    // But call _onChangeCallback on mutations
  }));
};
```

### Store Relationship
```
workspaceStore (singleton)
  ├─ Manages document metadata
  ├─ Manages active document
  └─ Delegates graph operations to active graphStore

graphStoreInstances (Map<documentId, GraphStore>)
  ├─ One instance per loaded document
  ├─ Active instance linked to UI
  └─ Notifies workspace on changes
```

---

## 5. UI Changes

### New Components

#### 1. **DocumentTabs** (top of editor)
```tsx
<DocumentTabs>
  <Tab
    id="doc-123"
    title="Analysis 1"
    isActive={true}
    isDirty={true}
    onClose={handleClose}
    onClick={handleSwitch}
  />
  <Tab
    id="doc-456"
    title="Analysis 2"
    isActive={false}
    isDirty={false}
    onClose={handleClose}
    onClick={handleSwitch}
  />
  <NewTabButton onClick={handleNew} />
</DocumentTabs>
```

Features:
- Close button (X) with unsaved warning
- Drag-to-reorder tabs
- Double-click to rename
- Right-click context menu (rename, duplicate, delete, export)
- Visual indicator for unsaved changes (dot or asterisk)
- Tab overflow handling (scroll or dropdown)

#### 2. **DocumentManager** (sidebar or modal)
```tsx
<DocumentManager>
  <DocumentGrid>
    {documents.map(doc => (
      <DocumentCard
        key={doc.id}
        title={doc.title}
        thumbnail={doc.thumbnail}
        lastModified={doc.lastModified}
        onClick={() => openDocument(doc.id)}
        onDelete={() => deleteDocument(doc.id)}
      />
    ))}
  </DocumentGrid>
  <ImportButton />
  <NewDocumentButton />
</DocumentManager>
```

#### 3. **UnsavedChangesDialog**
```tsx
<UnsavedChangesDialog
  documentTitle="Analysis 1"
  onSave={handleSave}
  onDiscard={handleDiscard}
  onCancel={handleCancel}
/>
```

### Updated App Structure
```tsx
<App>
  <Header>
    <Title>Constellation Analyzer</Title>
    <WorkspaceMenu />
  </Header>

  <DocumentTabs />  {/* NEW */}

  <Toolbar />

  <GraphEditor
    documentId={activeDocumentId}
    graphStore={activeGraphStore}
  />

  <DocumentManager isOpen={showManager} />  {/* NEW */}
</App>
```

---

## 6. Persistence Flow

### Auto-Save Strategy
```typescript
// Workspace-level debounced save
let workspaceSaveTimeout: NodeJS.Timeout;

const saveWorkspace = debounce(() => {
  // Save workspace metadata
  localStorage.setItem(
    STORAGE_KEYS.WORKSPACE_STATE,
    JSON.stringify(workspaceState)
  );
}, 1000);

// Document-level debounced save
const saveDocument = debounce((documentId: string) => {
  const doc = documents.get(documentId);
  if (!doc) return;

  // Save full document
  localStorage.setItem(
    `${STORAGE_KEYS.DOCUMENT_PREFIX}${documentId}`,
    JSON.stringify(doc)
  );

  // Update metadata
  const meta = documentMetadata.get(documentId);
  if (meta) {
    meta.isDirty = false;
    meta.lastModified = new Date().toISOString();
    localStorage.setItem(
      `${STORAGE_KEYS.DOCUMENT_METADATA_PREFIX}${documentId}`,
      JSON.stringify(meta)
    );
  }
}, 1000);

// On graph change
graphStore.subscribe((state) => {
  markDocumentDirty(activeDocumentId);
  saveDocument(activeDocumentId);
});
```

### Startup Sequence
```
1. App loads
2. Load workspace metadata from localStorage
3. Load all document metadata (lightweight)
4. If activeDocumentId exists, load that document
5. Create graphStore instance for active document
6. Render UI with tabs and active graph
```

### Tab Switch Flow
```
1. User clicks different tab
2. Check if current document has unsaved changes
   → If yes and auto-save disabled, show dialog
3. Save current document (if needed)
4. Load target document from localStorage (if not in memory)
5. Switch activeDocumentId
6. Update graphStore reference
7. GraphEditor re-renders with new data
```

---

## 7. Migration Strategy

### Migrating from Single-Doc to Multi-Doc

```typescript
// src/stores/persistence/migration-workspace.ts
export function migrateToWorkspace(): WorkspaceState | null {
  // Check for legacy data
  const legacyData = localStorage.getItem(STORAGE_KEYS.LEGACY_GRAPH_STATE);
  if (!legacyData) return null;

  try {
    const oldDoc = JSON.parse(legacyData) as ConstellationDocument;

    // Create first document from legacy data
    const documentId = generateDocumentId();
    const newDoc: ConstellationDocument = {
      ...oldDoc,
      metadata: {
        ...oldDoc.metadata,
        documentId,
        title: 'Imported Analysis',
      },
    };

    // Create workspace
    const workspace: WorkspaceState = {
      workspaceId: generateWorkspaceId(),
      workspaceName: 'My Workspace',
      documentOrder: [documentId],
      activeDocumentId: documentId,
      documentMetadata: new Map([[documentId, {
        id: documentId,
        title: 'Imported Analysis',
        isDirty: false,
        lastModified: new Date().toISOString(),
      }]]),
      documents: new Map([[documentId, newDoc]]),
      settings: {
        maxOpenDocuments: 10,
        autoSaveEnabled: true,
        defaultNodeTypes: oldDoc.graph.nodeTypes,
        defaultEdgeTypes: oldDoc.graph.edgeTypes,
        recentFiles: [],
      },
    };

    // Save to new format
    saveWorkspace(workspace);
    saveDocument(documentId, newDoc);

    // Remove legacy data
    localStorage.removeItem(STORAGE_KEYS.LEGACY_GRAPH_STATE);

    return workspace;
  } catch (error) {
    console.error('Migration failed:', error);
    return null;
  }
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Multi-Doc Store)
- [ ] Create `workspaceStore.ts` with document management
- [ ] Refactor `graphStore.ts` to be instance-based
- [ ] Update storage keys and persistence layer
- [ ] Implement migration from single-doc to multi-doc
- [ ] Basic create/load/delete document functionality

### Phase 2: UI - Tabs
- [ ] Create `DocumentTabs` component
- [ ] Implement tab switching logic
- [ ] Add close/rename tab functionality
- [ ] Handle unsaved changes dialog
- [ ] Visual indicators (dirty state, active tab)

### Phase 3: Document Management
- [ ] Create `DocumentManager` component (grid view)
- [ ] Implement import from file → new document
- [ ] Implement export single document
- [ ] Add duplicate document functionality
- [ ] Thumbnail generation (optional)

### Phase 4: Advanced Features
- [ ] Drag-to-reorder tabs
- [ ] Recent files list
- [ ] Tab context menu (right-click)
- [ ] Keyboard shortcuts (Ctrl+Tab, Ctrl+W, etc.)
- [ ] Search/filter documents in manager

### Phase 5: Polish & Optimization
- [ ] Lazy loading: Load documents on-demand
- [ ] Memory management: Unload inactive documents
- [ ] Tab overflow handling (scroll or dropdown)
- [ ] Export all documents as ZIP
- [ ] Workspace import/export

---

## 9. Key Technical Decisions

### 1. **Store Architecture: Singleton Workspace + Instance-based Graph**
- **Why**: GraphStore contains mutable state that must be isolated per document
- **How**: `Map<documentId, GraphStore>` managed by workspace

### 2. **Lazy Document Loading**
- **Why**: Don't load 20 full documents at startup
- **How**: Load metadata first, full documents when tab is activated

### 3. **Document ID Generation**
```typescript
const generateDocumentId = () =>
  `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

### 4. **Auto-Save per Document**
- Each document saves independently
- Debounced per document (not global)
- Workspace state saves separately (tab order, active doc)

### 5. **Unsaved Changes Handling**
```typescript
const canCloseDocument = (docId: string): boolean => {
  const meta = documentMetadata.get(docId);
  if (!meta?.isDirty) return true;

  return window.confirm(`"${meta.title}" has unsaved changes. Close anyway?`);
};
```

### 6. **Default Values Strategy**
- Workspace has default nodeTypes/edgeTypes
- New documents inherit workspace defaults
- Individual documents can customize their types
- Workspace defaults can be updated from any document

---

## 10. Future Enhancements

### Potential Features
1. **Document Templates**: Pre-configured node/edge types
2. **Document Linking**: Reference nodes across documents
3. **Workspace Sharing**: Export entire workspace to file
4. **Cloud Sync**: Replace localStorage with backend
5. **Collaborative Editing**: Multi-user support
6. **Version History**: Document snapshots
7. **Document Tags/Categories**: Organize many documents
8. **Search Across Documents**: Find nodes/edges globally

---

## 11. Risk Mitigation

### LocalStorage Quota
- **Risk**: 5-10MB limit, could fill with many documents
- **Mitigation**:
  - Show storage usage indicator
  - Warn when approaching limit
  - Offer to delete old documents
  - Implement document export before delete

### Performance
- **Risk**: Many documents slow down UI
- **Mitigation**:
  - Lazy loading
  - Virtual scrolling for document manager
  - Limit open tabs (configurable)
  - Unload inactive documents from memory

### Data Loss
- **Risk**: Corrupted document affects all
- **Mitigation**:
  - Each document stored separately
  - Backup on export
  - Migration safety checks

---

## Summary

This multi-file architecture:
✅ Leverages existing `ConstellationDocument` schema
✅ Reuses persistence infrastructure (saver, loader, validation)
✅ Maintains backward compatibility via migration
✅ Provides professional multi-document UX
✅ Scales to many documents with lazy loading
✅ Keeps data safe with per-document isolation

**Key Insight**: The existing persistence layer is perfectly suited for this - we just need to change from "one document in localStorage" to "many documents in localStorage", managed by a workspace orchestrator.
