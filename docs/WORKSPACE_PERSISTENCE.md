# Workspace Persistence Architecture

## Overview

The workspace manager now functions as a **persistent document library**. Documents are stored permanently in localStorage and remain available even after their tabs are closed.

## Key Concepts

### Document States

1. **Created Documents**: All documents created, imported, or opened are stored persistently in localStorage
2. **Open Documents**: Documents with active tabs (tracked in `documentOrder`)
3. **Closed Documents**: Documents stored in localStorage but without active tabs

### Data Structure

```typescript
// Workspace State (saved to localStorage)
{
  workspaceId: string;
  workspaceName: string;
  documentOrder: string[];          // IDs of documents with open tabs
  activeDocumentId: string | null;  // Currently visible document
  settings: WorkspaceSettings;
}

// Document Metadata (lightweight, one per document)
{
  id: string;
  title: string;
  isDirty: boolean;
  lastModified: string;
  viewport?: { x, y, zoom };       // Persisted viewport state
}

// In-Memory State
{
  documents: Map<string, ConstellationDocument>;     // Loaded documents (performance optimization)
  documentMetadata: Map<string, DocumentMetadata>;   // All document metadata
}
```

## User Flows

### Creating a Document

1. User clicks "New Document"
2. Document is created and saved to localStorage
3. Document ID is added to `documentOrder` (opens as tab)
4. Document metadata is added to `documentMetadata`
5. Document is loaded into memory (`documents` Map)

### Closing a Tab

1. User closes a document tab (X button)
2. `closeDocument()` is called
3. Document ID is **removed from `documentOrder`** (tab disappears)
4. Document **remains in localStorage** (persistent storage)
5. Document metadata **remains in `documentMetadata`**
6. Document is unloaded from memory (performance optimization)

### Opening a Closed Document

1. User opens Document Manager
2. All documents from `documentMetadata` are displayed (including closed ones)
3. Closed documents are visually indicated (no "Open" badge)
4. User clicks on a closed document
5. `switchToDocument()` is called
6. Document is loaded from localStorage into memory
7. Document ID is **added back to `documentOrder`** (tab appears)
8. Document becomes active

### Deleting a Document

1. User clicks Delete in Document Manager
2. Confirmation dialog appears
3. If confirmed, `deleteDocument()` is called
4. Document is **removed from localStorage** (permanent deletion)
5. Document is removed from `documentOrder` (if open)
6. Document metadata is removed from `documentMetadata`
7. Document is unloaded from memory

## Implementation Details

### Key Functions

#### `closeDocument(documentId)`
- Removes from `documentOrder` (closes tab)
- Keeps in localStorage (persistent)
- Checks for unsaved changes before closing

#### `switchToDocument(documentId)`
- Loads document from localStorage if not in memory
- Adds to `documentOrder` if not already there (reopens tab)
- Sets as `activeDocumentId`

#### `deleteDocument(documentId)`
- Permanently removes from localStorage
- Removes from `documentOrder`
- Removes from `documentMetadata`
- Requires confirmation

### Document Manager Display

- Shows **all documents** from `documentMetadata` (not just `documentOrder`)
- Visual indicators:
  - **Blue border + "Open" badge**: Document has an active tab
  - **Orange dot**: Document has unsaved changes
  - **Search**: Filters across all documents
- Footer shows: "X documents in workspace • Y open"

### Performance Optimizations

- **Lazy Loading**: Documents are only loaded into memory when needed
- **Unload**: Closed documents are removed from memory (but stay in storage)
- **Viewport Persistence**: Each document's viewport state is saved and restored

### History Management

- History stacks are per-document but **not persisted** to localStorage
- History is reset when a document is closed and reopened
- This is intentional to avoid localStorage bloat

## Storage Keys

```typescript
// Workspace state
'constellation:workspace:v1'

// Individual document
'constellation:document:v1:{documentId}'

// Document metadata
'constellation:meta:v1:{documentId}'
```

## Migration Notes

- Old single-document format is automatically migrated on first load
- Migration creates a workspace with the legacy document as the first document
- Migration is one-way (cannot downgrade)

## Future Enhancements

Potential improvements for future versions:

1. **Recent Documents List**: Show recently accessed documents separately
2. **Favorites**: Star/pin frequently used documents
3. **Document Tags**: Categorize documents with user-defined tags
4. **Trash/Archive**: Soft delete with recovery option
5. **Cloud Sync**: Synchronize workspace across devices
6. **History Persistence**: Optionally save undo/redo stacks (with size limits)
