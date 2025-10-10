# Local Storage Persistence Plan for Constellation Analyzer

## 1. Data Format Specification

### JSON Schema Structure

```typescript
interface ConstellationDocument {
  // Metadata
  metadata: {
    version: string;           // Schema version (e.g., "1.0.0")
    appName: string;           // "constellation-analyzer"
    createdAt: string;         // ISO timestamp
    updatedAt: string;         // ISO timestamp
    lastSavedBy: string;       // Browser fingerprint or "unknown"
  };

  // Graph state
  graph: {
    nodes: SerializedActor[];     // Simplified Actor[] without React Flow internals
    edges: SerializedRelation[];  // Simplified Relation[] without React Flow internals
    nodeTypes: NodeTypeConfig[];  // Already serializable
    edgeTypes: EdgeTypeConfig[];  // Already serializable
  };

  // Editor settings (optional - may persist separately)
  editorSettings?: EditorSettings;
}

// Simplified node structure for storage
interface SerializedActor {
  id: string;
  type: string;  // React Flow node type (e.g., "custom")
  position: { x: number; y: number };
  data: ActorData;
  selected?: boolean;
  dragging?: boolean;
}

// Simplified edge structure for storage
interface SerializedRelation {
  id: string;
  source: string;
  target: string;
  type?: string;  // React Flow edge type
  data: RelationData;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}
```

**Rationale:**
- Separate metadata for versioning and migration support
- Exclude React Flow-specific runtime properties (measured, width, height, etc.)
- Store minimal required data to reconstruct full state
- Include timestamps for debugging and conflict resolution

---

## 2. Storage Strategy

### Architecture Choice: **Zustand Middleware Pattern**

**Recommended approach:** Create a custom Zustand middleware that intercepts state changes and persists to localStorage.

### Storage Keys Strategy

```typescript
const STORAGE_KEYS = {
  GRAPH_STATE: 'constellation:graph:v1',      // Main graph data
  EDITOR_SETTINGS: 'constellation:editor:v1', // Editor preferences
  AUTOSAVE_FLAG: 'constellation:autosave',    // Flag for crash recovery
  LAST_SAVED: 'constellation:lastSaved',      // Timestamp
};
```

**Why separate keys:**
- Allow partial updates (save graph independently from settings)
- Different persistence strategies (graph = debounced, settings = immediate)
- Easier to manage storage quota

### Debouncing Strategy

```typescript
// Debounce configuration
const DEBOUNCE_CONFIG = {
  DELAY: 1000,              // 1 second after last change
  MAX_WAIT: 5000,           // Force save every 5 seconds
  THROTTLE_NODE_DRAG: 500,  // Faster saves during drag operations
};
```

**Implementation approach:**
- Use `lodash.debounce` or custom implementation
- Different debounce times for different operations:
  - Node dragging: 500ms (frequent but predictable)
  - Adding/deleting: 1000ms (less frequent)
  - Typing in properties: 1000ms (standard)
- Max wait ensures data isn't lost even during continuous editing

### When to Save

**Auto-save triggers:**
1. Any GraphStore state mutation (nodes, edges, nodeTypes, edgeTypes)
2. EditorStore settings changes (optional, can be immediate)
3. Before window unload (emergency save)
4. After successful import (to persist imported state)

**Don't save:**
- Temporary UI state (selectedRelationType, hover states)
- React Flow internals (viewport, connection state)

---

## 3. Loading Strategy

### Bootstrap Sequence

```
1. App starts → Check for stored data
2. Validate schema version
3. If valid: Deserialize → Hydrate store
4. If invalid: Attempt migration OR use defaults
5. If corrupted: Show recovery dialog → Load defaults
6. Set up auto-save listeners
```

### Validation Approach

Use runtime validation to ensure data integrity.

**Validation checks:**
- Schema version exists and is supported
- All required fields present
- Node IDs are unique
- Edge source/target references exist in nodes
- Type references (node.data.type) exist in nodeTypes
- Color values are valid hex codes

### Hydration Process

Initialize store with loaded data, adding back React Flow properties with defaults.

---

## 4. Error Handling Strategy

### Error Categories

```typescript
enum PersistenceError {
  QUOTA_EXCEEDED = 'quota_exceeded',
  CORRUPTED_DATA = 'corrupted_data',
  VERSION_MISMATCH = 'version_mismatch',
  PARSE_ERROR = 'parse_error',
  STORAGE_UNAVAILABLE = 'storage_unavailable',
}
```

### Error Recovery Strategies

| Error | Strategy | User Experience |
|-------|----------|-----------------|
| **Quota Exceeded** | 1. Show warning<br>2. Compress data (remove whitespace)<br>3. Offer export to file<br>4. Continue without auto-save | Toast notification: "Storage full. Save to file to preserve work." |
| **Corrupted Data** | 1. Attempt partial recovery<br>2. Load default state<br>3. Log error for debugging<br>4. Offer to restore from backup | Dialog: "Previous session corrupted. Starting fresh." + Show details |
| **Version Mismatch** | 1. Attempt migration<br>2. If migration fails, load defaults<br>3. Preserve old data as backup | Toast: "Updated to new version. Data migrated successfully." |
| **Parse Error** | 1. Clear corrupted data<br>2. Load defaults<br>3. Log error | Toast: "Unable to restore previous session." |
| **Storage Unavailable** | 1. Detect private/incognito mode<br>2. Disable auto-save<br>3. Show warning | Banner: "Auto-save disabled (private mode). Export to save work." |

### Multi-Tab Synchronization

**Problem:** Multiple tabs open, each saving independently → conflicts

**Solution:** Use `storage` event listener

**Recommendation:** Start with last-write-wins. Add conflict resolution later if needed.

---

## 5. Code Architecture

### Folder Structure

```
/src
  /stores
    /persistence
      constants.ts           # Storage keys, config
      types.ts               # Serialization types
      loader.ts              # Load and validate data
      saver.ts               # Save and serialize data
      middleware.ts          # Zustand middleware for auto-save
      migrations.ts          # Version migration logic (future)
      hooks.ts               # React hooks for persistence features (future)
    graphStore.ts            # Enhanced with persistence
    editorStore.ts           # Enhanced with persistence
```

### Module Responsibilities

**constants.ts**
- Storage keys
- Debounce configuration
- Current schema version

**types.ts**
- ConstellationDocument interface
- SerializedActor, SerializedRelation interfaces
- PersistenceError enum

**loader.ts**
- Reads from localStorage
- Validates schema
- Deserializes data
- Returns typed ConstellationDocument or null

**saver.ts**
- Serializes current store state
- Writes to localStorage
- Handles quota errors
- Updates lastSaved timestamp

**middleware.ts**
- Intercepts Zustand state changes
- Triggers debounced saves
- Filters what gets persisted

**migrations.ts** (Phase 3)
- Version detection
- Data transformation between versions
- Backward compatibility

**hooks.ts** (Phase 3)
- `usePersistence()` - Monitor save status
- `useAutoSave()` - Manual save trigger
- `useStorageStats()` - Storage quota info

---

## 6. Migration Strategy

### Version Naming Convention

Use semantic versioning: `MAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes (incompatible schema)
- **MINOR:** New fields (backward compatible)
- **PATCH:** Bug fixes, no schema changes

### Migration Registry

```typescript
// migrations.ts
type Migration = (old: any) => ConstellationDocument;

const MIGRATIONS: Record<string, Migration> = {
  '0.9.0->1.0.0': (old) => {
    // Example: Rename field
    return {
      ...old,
      graph: {
        ...old.graph,
        nodes: old.graph.actors.map(actor => ({
          ...actor,
          data: { ...actor.data, label: actor.data.name },
        })),
      },
    };
  },
};
```

---

## 7. Implementation Phases

### Phase 1: Core Persistence (MVP) ✅ IMPLEMENTING NOW
- [x] Create serialization types
- [x] Create constants
- [x] Implement saver.ts with debouncing
- [x] Implement loader.ts with basic validation
- [x] Add persistence middleware to graphStore
- [ ] Test save/load cycle

### Phase 2: Error Handling
- [ ] Add quota exceeded handling
- [ ] Add corrupted data recovery
- [ ] Add storage unavailable detection
- [ ] Create user-facing error messages

### Phase 3: Advanced Features
- [ ] Multi-tab synchronization
- [ ] Migration system
- [ ] Backup rotation
- [ ] Storage stats monitoring

### Phase 4: Polish
- [ ] Performance optimization
- [ ] Compression for large graphs
- [ ] Export/import integration
- [ ] User preferences for auto-save behavior

---

## 8. Testing Strategy

### Test Cases

**Manual Tests (Phase 1):**
- Create nodes/edges → Reload page → Verify restored
- Edit node properties → Reload → Verify persisted
- Add custom actor types → Reload → Verify persisted
- Create relations → Reload → Verify persisted

**Integration Tests (Phase 2):**
- Save → Clear → Load → Verify state matches
- Corrupted data → Loads defaults
- Quota exceeded → Handles gracefully

**E2E Tests (Phase 3):**
- Multiple tabs → Changes sync
- Version migration works

---

## Summary

**Key Technical Decisions:**

1. **Architecture:** Zustand middleware pattern for clean separation
2. **Storage:** localStorage with versioned schema
3. **Serialization:** Minimal JSON format, exclude React Flow internals
4. **Debouncing:** 1s delay, 5s max wait, operation-specific tuning
5. **Validation:** Runtime validation on load
6. **Errors:** Graceful degradation with user notifications
7. **Multi-tab:** Storage event listener with last-write-wins
8. **Migration:** Version registry with transformation functions

**Current Version:** 1.0.0
**Current Phase:** Phase 1 (MVP Implementation)
