# Bibliography System - Technical Specification (Revised for citation.js)

## Overview

This document provides detailed technical specifications for implementing the bibliography/reference management system in Constellation Analyzer, **deeply integrated with the citation.js library** to avoid reinventing functionality. Based on the UX design in `UX_BIBLIOGRAPHY_DESIGN.md`.

**Key Change**: This revision leverages citation.js for all parsing, formatting, and conversion tasks, eliminating custom implementations where the library already provides the functionality.

---

## 1. Citation.js Architecture

### 1.1 What citation.js Provides

Citation.js will handle:
- ✅ **Input parsing**: DOI, BibTeX, RIS, URLs, ISBNs, PubMed IDs, etc.
- ✅ **Format conversion**: Between BibTeX, RIS, CSL-JSON, and more
- ✅ **Citation formatting**: APA, MLA, Chicago, Vancouver, and 10,000+ CSL styles
- ✅ **Data normalization**: All inputs → CSL-JSON internally
- ✅ **Bibliography generation**: Formatted HTML, text, RTF output
- ✅ **Async fetching**: DOI/ISBN/PubMed metadata retrieval

### 1.2 What We Build on Top

We still need to build:
- ❌ UI components (modals, forms, selectors)
- ❌ State management (Zustand stores)
- ❌ Document persistence (storing bibliography with graph)
- ❌ App-specific metadata (tags, favorites, usage tracking)
- ❌ Citation linking (connecting references to nodes/edges)
- ❌ History tracking (undo/redo integration)

### 1.3 Integration Strategy

**Core Pattern**: Use a `Cite` instance per document as the single source of truth for references, synced with our Zustand store for UI state.

```typescript
// citation.js manages the CSL-JSON data
const citeInstance = new Cite(references);

// Our store manages app-specific data and UI state
const bibliographyStore = {
  citeInstance,      // The citation.js instance
  appMetadata: {},   // App-specific fields (_app)
  // ... other state
};
```

---

## 2. Data Models

### 2.1 CSL-JSON Types (from citation.js)

Citation.js uses standard CSL-JSON. We import types from `@citation-js/core` or define compatible interfaces:

**Location**: `/src/types/bibliography.ts`

```typescript
/**
 * CSL-JSON types are provided by citation.js
 * We extend with app-specific metadata
 */

// Standard CSL-JSON types (compatible with citation.js)
export type ReferenceType =
  | 'article-journal'
  | 'article-magazine'
  | 'article-newspaper'
  | 'book'
  | 'chapter'
  | 'paper-conference'
  | 'report'
  | 'thesis'
  | 'webpage'
  | 'interview'
  | 'manuscript'
  | 'personal_communication'
  | 'entry-encyclopedia'
  | 'entry-dictionary';

/**
 * Standard CSL-JSON reference structure
 * This is what citation.js expects
 */
export interface CSLReference {
  id: string;
  type: ReferenceType;
  title?: string;
  author?: Array<{ family?: string; given?: string; literal?: string }>;
  issued?: { 'date-parts': [[number, number?, number?]] };
  'container-title'?: string;
  publisher?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  DOI?: string;
  ISBN?: string;
  URL?: string;
  // ... many more CSL-JSON fields
  [key: string]: any;  // CSL-JSON is extensible
}

/**
 * App-specific metadata (NOT part of CSL-JSON)
 * Stored separately from the Cite instance
 */
export interface ReferenceAppMetadata {
  id: string;  // Matches CSL reference ID
  tags?: string[];
  favorite?: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Combined reference for UI display
 * Merges CSL data + app metadata
 */
export interface BibliographyReference extends CSLReference {
  _app?: ReferenceAppMetadata;
}

/**
 * Bibliography settings per document
 */
export interface BibliographySettings {
  defaultStyle: string;  // CSL style ID (e.g., "apa", "chicago")
  sortOrder: 'author' | 'year' | 'title';
}

/**
 * Complete bibliography data structure for persistence
 */
export interface Bibliography {
  // CSL-JSON array (can be loaded directly into Cite)
  references: CSLReference[];
  // App-specific metadata (stored separately)
  metadata: Record<string, ReferenceAppMetadata>;
  // Settings
  settings: BibliographySettings;
}
```

### 2.2 Extend Existing Types

**Location**: `/src/types/index.ts`

```typescript
// Add to ActorData interface
export interface ActorData {
  // ... existing fields
  citations?: string[];  // Array of reference IDs
}

// Add to RelationData interface
export interface RelationData {
  // ... existing fields
  citations?: string[];  // Array of reference IDs
}
```

**Location**: `/src/stores/persistence/types.ts`

```typescript
// Add to ConstellationDocument interface
export interface ConstellationDocument {
  metadata: {...};
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  labels?: LabelConfig[];
  bibliography?: Bibliography;  // NEW FIELD
  timeline: {...};
}
```

---

## 3. State Management with citation.js

### 3.1 Bibliography Store (Revised)

**Location**: `/src/stores/bibliographyStore.ts`

```typescript
import { create } from 'zustand';
import { Cite } from '@citation-js/core';
// Load plugins
import '@citation-js/plugin-csl';
import '@citation-js/plugin-doi';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-ris';

import type {
  Bibliography,
  BibliographyReference,
  CSLReference,
  ReferenceAppMetadata,
  BibliographySettings
} from '@/types/bibliography';

interface BibliographyStore {
  // State
  citeInstance: Cite;  // The citation.js instance
  appMetadata: Record<string, ReferenceAppMetadata>;  // App-specific data
  settings: BibliographySettings;

  // Getters
  getReferences: () => BibliographyReference[];  // Merges CSL + app data
  getReferenceById: (id: string) => BibliographyReference | undefined;
  getCSLData: () => CSLReference[];  // Raw CSL-JSON from Cite

  // CRUD operations (use citation.js methods)
  addReference: (ref: Partial<CSLReference>) => string;
  updateReference: (id: string, updates: Partial<CSLReference>) => void;
  deleteReference: (id: string) => void;
  duplicateReference: (id: string) => string;

  // Bulk operations
  setReferences: (refs: CSLReference[]) => void;
  importReferences: (refs: CSLReference[]) => void;
  clearAll: () => void;

  // Metadata operations
  updateMetadata: (id: string, metadata: Partial<ReferenceAppMetadata>) => void;

  // Settings
  setSettings: (settings: BibliographySettings) => void;

  // Citation.js powered operations
  formatReference: (id: string, style?: string, format?: 'html' | 'text') => string;
  formatBibliography: (style?: string, format?: 'html' | 'text') => string;
  parseInput: (input: string) => Promise<Partial<CSLReference>[]>;
  exportAs: (format: 'bibtex' | 'ris' | 'json') => string;
}

export const useBibliographyStore = create<BibliographyStore>((set, get) => ({
  citeInstance: new Cite([]),
  appMetadata: {},
  settings: {
    defaultStyle: 'apa',
    sortOrder: 'author',
  },

  getReferences: () => {
    const csl = get().citeInstance.data as CSLReference[];
    const metadata = get().appMetadata;

    // Merge CSL data with app metadata
    return csl.map(ref => ({
      ...ref,
      _app: metadata[ref.id],
    }));
  },

  getReferenceById: (id) => {
    const refs = get().getReferences();
    return refs.find(ref => ref.id === id);
  },

  getCSLData: () => {
    return get().citeInstance.data as CSLReference[];
  },

  addReference: (ref) => {
    const { citeInstance } = get();

    // Generate ID if not provided
    const id = ref.id || `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const fullRef = { ...ref, id };

    // Use citation.js add() method
    citeInstance.add(fullRef);

    // Add app metadata
    const now = new Date().toISOString();
    set(state => ({
      appMetadata: {
        ...state.appMetadata,
        [id]: {
          id,
          tags: [],
          createdAt: now,
          updatedAt: now,
        },
      },
    }));

    return id;
  },

  updateReference: (id, updates) => {
    const { citeInstance } = get();
    const data = citeInstance.data as CSLReference[];

    // Find and update the reference
    const updatedData = data.map(ref =>
      ref.id === id ? { ...ref, ...updates } : ref
    );

    // Use citation.js set() method to replace all data
    citeInstance.set(updatedData);

    // Update metadata timestamp
    set(state => ({
      appMetadata: {
        ...state.appMetadata,
        [id]: {
          ...state.appMetadata[id],
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  },

  deleteReference: (id) => {
    const { citeInstance } = get();
    const data = citeInstance.data as CSLReference[];

    // Remove from citation.js
    const filteredData = data.filter(ref => ref.id !== id);
    citeInstance.set(filteredData);

    // Remove metadata
    set(state => {
      const { [id]: removed, ...rest } = state.appMetadata;
      return { appMetadata: rest };
    });
  },

  duplicateReference: (id) => {
    const original = get().getReferenceById(id);
    if (!original) return '';

    const newId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const duplicate = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
    };

    // Remove _app before adding to Cite
    const { _app, ...cslData } = duplicate;
    get().addReference(cslData);

    return newId;
  },

  setReferences: (refs) => {
    const { citeInstance } = get();

    // Use citation.js set() to replace all references
    citeInstance.set(refs);

    // Initialize metadata for new references
    const metadata: Record<string, ReferenceAppMetadata> = {};
    const now = new Date().toISOString();

    refs.forEach(ref => {
      metadata[ref.id] = {
        id: ref.id,
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
    });

    set({ appMetadata: metadata });
  },

  importReferences: (refs) => {
    const { citeInstance } = get();

    // Use citation.js add() to append references
    citeInstance.add(refs);

    // Add metadata for new references
    const now = new Date().toISOString();
    set(state => {
      const newMetadata = { ...state.appMetadata };
      refs.forEach(ref => {
        if (!newMetadata[ref.id]) {
          newMetadata[ref.id] = {
            id: ref.id,
            tags: [],
            createdAt: now,
            updatedAt: now,
          };
        }
      });
      return { appMetadata: newMetadata };
    });
  },

  clearAll: () => {
    get().citeInstance.reset();  // citation.js method to clear all data
    set({ appMetadata: {} });
  },

  updateMetadata: (id, updates) => {
    set(state => ({
      appMetadata: {
        ...state.appMetadata,
        [id]: {
          ...state.appMetadata[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  },

  setSettings: (settings) => set({ settings }),

  formatReference: (id, style, format = 'html') => {
    const { citeInstance, settings } = get();
    const styleToUse = style || settings.defaultStyle;

    // Find the reference
    const ref = (citeInstance.data as CSLReference[]).find(r => r.id === id);
    if (!ref) return '';

    // Create temporary Cite instance for single reference
    const cite = new Cite(ref);

    // Use citation.js format() method
    return cite.format('bibliography', {
      format: format,
      template: styleToUse,
      lang: 'en-US',
    });
  },

  formatBibliography: (style, format = 'html') => {
    const { citeInstance, settings } = get();
    const styleToUse = style || settings.defaultStyle;

    // Use citation.js format() method on entire instance
    return citeInstance.format('bibliography', {
      format: format,
      template: styleToUse,
      lang: 'en-US',
    });
  },

  parseInput: async (input) => {
    try {
      // Use citation.js async parsing
      // This handles DOIs, URLs, BibTeX, RIS, etc. automatically
      const cite = await Cite.async(input);
      return cite.data as CSLReference[];
    } catch (error) {
      console.error('Failed to parse input:', error);
      throw new Error('Could not parse citation data');
    }
  },

  exportAs: (format) => {
    const { citeInstance } = get();

    // Use citation.js format() method
    switch (format) {
      case 'bibtex':
        return citeInstance.format('bibtex');
      case 'ris':
        return citeInstance.format('ris');
      case 'json':
        return JSON.stringify(citeInstance.data, null, 2);
      default:
        return '';
    }
  },
}));
```

### 3.2 Integration with GraphStore (Unchanged)

**Location**: `/src/hooks/useBibliographyWithHistory.ts`

```typescript
import { useGraphStore } from '@/stores/graphStore';
import { useBibliographyStore } from '@/stores/bibliographyStore';
import { useHistoryStore } from '@/stores/historyStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { CSLReference } from '@/types/bibliography';

/**
 * Hook that wraps bibliography operations with history tracking
 * Similar to useGraphWithHistory pattern
 */
export const useBibliographyWithHistory = () => {
  const { addReference, updateReference, deleteReference } = useBibliographyStore();
  const { pushHistory } = useHistoryStore();
  const { activeDocumentId } = useWorkspaceStore();
  const { nodes, edges, updateNode, updateEdge } = useGraphStore();

  const addReferenceWithHistory = (ref: Partial<CSLReference>) => {
    const id = addReference(ref);
    pushHistory(activeDocumentId!, `Added reference: ${ref.title}`);
    return id;
  };

  const updateReferenceWithHistory = (id: string, updates: Partial<CSLReference>) => {
    const ref = useBibliographyStore.getState().getReferenceById(id);
    updateReference(id, updates);
    pushHistory(activeDocumentId!, `Updated reference: ${ref?.title}`);
  };

  const deleteReferenceWithHistory = (id: string) => {
    const ref = useBibliographyStore.getState().getReferenceById(id);

    // Remove citations from nodes and edges
    nodes.forEach(node => {
      if (node.data.citations?.includes(id)) {
        updateNode(node.id, {
          citations: node.data.citations.filter(cid => cid !== id),
        });
      }
    });

    edges.forEach(edge => {
      if (edge.data?.citations?.includes(id)) {
        updateEdge(edge.id, {
          citations: edge.data.citations.filter(cid => cid !== id),
        });
      }
    });

    deleteReference(id);
    pushHistory(activeDocumentId!, `Deleted reference: ${ref?.title}`);
  };

  const getCitationCount = (referenceId: string) => {
    const nodeCount = nodes.filter(n => n.data.citations?.includes(referenceId)).length;
    const edgeCount = edges.filter(e => e.data?.citations?.includes(referenceId)).length;
    return { nodes: nodeCount, edges: edgeCount };
  };

  return {
    addReference: addReferenceWithHistory,
    updateReference: updateReferenceWithHistory,
    deleteReference: deleteReferenceWithHistory,
    getCitationCount,
  };
};
```

---

## 4. Utility Functions (Simplified with citation.js)

### 4.1 Smart Input Parser (Uses citation.js)

**Location**: `/src/utils/bibliography/smart-parser.ts`

```typescript
import { Cite } from '@citation-js/core';
import type { CSLReference } from '@/types/bibliography';

/**
 * Parse any citation input using citation.js
 * Handles: DOI, URL, BibTeX, RIS, ISBN, PubMed ID, etc.
 */
export const parseSmartInput = async (input: string): Promise<CSLReference[]> => {
  try {
    const cite = await Cite.async(input);
    return cite.data as CSLReference[];
  } catch (error) {
    throw new Error(`Could not parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if input looks like it can be parsed
 */
export const isValidCitationInput = (input: string): boolean => {
  const trimmed = input.trim();

  // DOI patterns
  if (/^(https?:\/\/)?(dx\.)?doi\.org\/10\.\d{4,}/i.test(trimmed)) return true;
  if (/^10\.\d{4,}\/.+/.test(trimmed)) return true;

  // URL patterns
  if (/^https?:\/\/.+/.test(trimmed)) return true;

  // BibTeX patterns
  if (/^@\w+\{/.test(trimmed)) return true;

  // PubMed ID
  if (/^PMID:\s*\d+/i.test(trimmed)) return true;

  // ISBN
  if (/^ISBN[:\s]*[\d-]+/i.test(trimmed)) return true;

  return false;
};

/**
 * Get input type hint for user
 */
export const getInputTypeHint = (input: string): string => {
  const trimmed = input.trim();

  if (/^10\.\d{4,}\//.test(trimmed)) return 'DOI';
  if (/^https?:\/\//.test(trimmed)) return 'URL';
  if (/^@\w+\{/.test(trimmed)) return 'BibTeX';
  if (/^PMID:/i.test(trimmed)) return 'PubMed ID';
  if (/^ISBN/i.test(trimmed)) return 'ISBN';

  return 'Unknown';
};
```

### 4.2 Citation Formatting (Uses citation.js)

**Location**: `/src/utils/bibliography/formatting.ts`

```typescript
import { Cite } from '@citation-js/core';
import type { CSLReference } from '@/types/bibliography';

/**
 * Format a single reference using citation.js
 */
export const formatReference = (
  ref: CSLReference,
  style: string = 'apa',
  format: 'html' | 'text' = 'text'
): string => {
  try {
    const cite = new Cite(ref);
    return cite.format('bibliography', {
      format,
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Formatting error:', error);
    return `[Error formatting reference: ${ref.title}]`;
  }
};

/**
 * Format short citation for lists (Author, Year)
 * Uses citation.js citation format
 */
export const formatShortCitation = (
  ref: CSLReference,
  style: string = 'apa'
): string => {
  try {
    const cite = new Cite(ref);
    // Use citation format (in-text) instead of bibliography
    return cite.format('citation', {
      format: 'text',
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    // Fallback to simple format
    const author = ref.author?.[0];
    const authorStr = author?.family || author?.literal || 'Unknown';
    const year = ref.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
    return `${authorStr} (${year})`;
  }
};

/**
 * Format full bibliography for multiple references
 */
export const formatBibliography = (
  refs: CSLReference[],
  style: string = 'apa',
  format: 'html' | 'text' = 'html'
): string => {
  try {
    const cite = new Cite(refs);
    return cite.format('bibliography', {
      format,
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Bibliography formatting error:', error);
    return '[Error formatting bibliography]';
  }
};

/**
 * Get list of available citation styles
 * Citation.js supports 10,000+ styles via CSL
 */
export const getAvailableStyles = (): Array<{ id: string; label: string }> => {
  // Common styles for social sciences
  return [
    { id: 'apa', label: 'APA 7th Edition' },
    { id: 'chicago-author-date', label: 'Chicago Author-Date' },
    { id: 'chicago-note-bibliography', label: 'Chicago Notes' },
    { id: 'mla', label: 'MLA 9th Edition' },
    { id: 'harvard1', label: 'Harvard' },
    { id: 'vancouver', label: 'Vancouver' },
    { id: 'american-sociological-association', label: 'ASA' },
    { id: 'american-political-science-association', label: 'APSA' },
  ];
};
```

### 4.3 Import/Export Utilities (Uses citation.js)

**Location**: `/src/utils/bibliography/import-export.ts`

```typescript
import { Cite } from '@citation-js/core';
import type { CSLReference } from '@/types/bibliography';

/**
 * Import from various formats using citation.js
 */
export const importFromFile = async (
  content: string,
  format: 'bibtex' | 'ris' | 'json'
): Promise<CSLReference[]> => {
  try {
    const cite = await Cite.async(content);
    return cite.data as CSLReference[];
  } catch (error) {
    throw new Error(`Failed to import ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export to various formats using citation.js
 */
export const exportToFormat = (
  refs: CSLReference[],
  format: 'bibtex' | 'ris' | 'json'
): string => {
  try {
    const cite = new Cite(refs);

    switch (format) {
      case 'bibtex':
        return cite.format('bibtex');
      case 'ris':
        return cite.format('ris');
      case 'json':
        return JSON.stringify(cite.data, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export formatted bibliography as HTML
 */
export const exportFormattedBibliography = (
  refs: CSLReference[],
  style: string = 'apa'
): string => {
  try {
    const cite = new Cite(refs);
    const bibliography = cite.format('bibliography', {
      format: 'html',
      template: style,
      lang: 'en-US',
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bibliography</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 2em auto;
      line-height: 1.6;
    }
    h1 { text-align: center; }
    .csl-entry {
      margin-bottom: 1em;
      padding-left: 2em;
      text-indent: -2em;
    }
  </style>
</head>
<body>
  <h1>Bibliography</h1>
  ${bibliography}
</body>
</html>`;
  } catch (error) {
    throw new Error(`Failed to generate HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Detect format of input string
 */
export const detectFormat = (content: string): 'bibtex' | 'ris' | 'json' | 'unknown' => {
  const trimmed = content.trim();

  if (trimmed.startsWith('@')) return 'bibtex';
  if (trimmed.startsWith('TY  -')) return 'ris';
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
};
```

---

## 5. Component Integration (Key Changes)

### 5.1 Smart Input Component

**Location**: `/src/components/Bibliography/SmartInputField.tsx`

```typescript
import React, { useState } from 'react';
import { parseSmartInput, isValidCitationInput, getInputTypeHint } from '@/utils/bibliography/smart-parser';
import { useBibliographyWithHistory } from '@/hooks/useBibliographyWithHistory';
import { useToastStore } from '@/stores/toastStore';

interface Props {
  onSuccess?: () => void;
}

export const SmartInputField: React.FC<Props> = ({ onSuccess }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addReference } = useBibliographyWithHistory();
  const { showToast } = useToastStore();

  const handleParse = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      // Use citation.js to parse the input
      const references = await parseSmartInput(input);

      if (references.length === 0) {
        showToast('No references found in input', 'warning');
        return;
      }

      // Add all parsed references
      references.forEach(ref => {
        addReference(ref);
      });

      showToast(
        `Added ${references.length} reference${references.length > 1 ? 's' : ''}`,
        'success'
      );

      setInput('');
      onSuccess?.();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to parse input',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const isValid = isValidCitationInput(input);
  const hint = input.trim() ? getInputTypeHint(input) : '';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Smart Input
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste DOI, URL, BibTeX, RIS, ISBN, or PubMed ID..."
        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
        rows={3}
      />
      {hint && (
        <div className="text-xs text-gray-600">
          Detected: <span className="font-medium">{hint}</span>
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleParse}
          disabled={!isValid || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Parsing...' : 'Auto-Fill'}
        </button>
        <button
          onClick={() => setInput('')}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
      <div className="text-xs text-gray-500">
        💡 Tip: citation.js automatically detects and parses most citation formats
      </div>
    </div>
  );
};
```

### 5.2 Citation Preview Component

**Location**: `/src/components/Bibliography/CitationPreview.tsx`

```typescript
import React, { useMemo } from 'react';
import { formatReference } from '@/utils/bibliography/formatting';
import { useBibliographyStore } from '@/stores/bibliographyStore';
import type { CSLReference } from '@/types/bibliography';

interface Props {
  reference: CSLReference;
}

export const CitationPreview: React.FC<Props> = ({ reference }) => {
  const { settings } = useBibliographyStore();
  const [style, setStyle] = useState(settings.defaultStyle);

  const formattedCitation = useMemo(() => {
    return formatReference(reference, style, 'html');
  }, [reference, style]);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Citation Preview
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="apa">APA</option>
          <option value="chicago-author-date">Chicago</option>
          <option value="mla">MLA</option>
          <option value="harvard1">Harvard</option>
        </select>
      </div>
      <div
        className="text-sm text-gray-800 prose prose-sm"
        dangerouslySetInnerHTML={{ __html: formattedCitation }}
      />
    </div>
  );
};
```

---

## 6. Workspace Integration (Detailed)

### 6.1 Understanding the Existing Persistence Architecture

The app uses a **multi-document workspace** with these key components:

1. **ConstellationDocument**: Complete document structure with metadata, types, labels, timeline
2. **WorkspaceStore**: Manages multiple documents, tabs, active document
3. **LocalStorage**: Persists workspace state and documents
4. **Timeline**: All graphs stored in timeline states (not at document root)

**Key Pattern**: The document is the source of truth for types, labels, and bibliography. Timeline states contain only nodes and edges.

### 6.2 Integration Points in WorkspaceStore

**Location**: `/src/stores/workspaceStore.ts`

#### 6.2.1 Document Loading (`loadDocument` and `switchToDocument`)

Add bibliography loading when switching to a document:

```typescript
// In loadDocument function (line 274)
loadDocument: async (documentId: string) => {
  const state = get();

  // Check if already loaded
  if (state.documents.has(documentId)) {
    return;
  }

  // Load from storage
  const doc = loadDocumentFromStorage(documentId);
  if (!doc) {
    console.error(`Document ${documentId} not found`);
    return;
  }

  // Load timeline if it exists
  if (doc.timeline) {
    useTimelineStore.getState().loadTimeline(documentId, doc.timeline as unknown as Timeline);
  }

  // **NEW: Load bibliography if it exists**
  if (doc.bibliography) {
    const { references, metadata, settings } = doc.bibliography;
    const cite = new Cite(references);

    useBibliographyStore.setState({
      citeInstance: cite,
      appMetadata: metadata,
      settings,
    });
  } else {
    // Initialize empty bibliography for documents without one
    useBibliographyStore.setState({
      citeInstance: new Cite([]),
      appMetadata: {},
      settings: {
        defaultStyle: 'apa',
        sortOrder: 'author',
      },
    });
  }

  set((state) => {
    const newDocuments = new Map(state.documents);
    newDocuments.set(documentId, doc);

    return { documents: newDocuments };
  });
},
```

#### 6.2.2 Document Saving (`saveDocument`)

Add bibliography to saved document:

```typescript
// In saveDocument function (line 715)
saveDocument: (documentId: string) => {
  const state = get();
  const doc = state.documents.get(documentId);
  if (doc) {
    doc.metadata.updatedAt = new Date().toISOString();

    // Save timeline data if exists
    const timelineState = useTimelineStore.getState();
    const timeline = timelineState.timelines.get(documentId);

    if (timeline) {
      // Serialize timeline (convert Map to object)
      const serializedStates: Record<string, ConstellationState> = {};
      timeline.states.forEach((state: ConstellationState, id: string) => {
        serializedStates[id] = state;
      });

      doc.timeline = {
        states: serializedStates,
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      };
    }

    // **NEW: Save bibliography data if exists**
    const bibliographyState = useBibliographyStore.getState();
    const { getCSLData, appMetadata, settings } = bibliographyState;
    const references = getCSLData();

    // Only save bibliography if there are references or metadata
    if (references.length > 0 || Object.keys(appMetadata).length > 0) {
      doc.bibliography = {
        references,
        metadata: appMetadata,
        settings,
      };
    }

    saveDocumentToStorage(documentId, doc);

    const metadata = state.documentMetadata.get(documentId);
    if (metadata) {
      metadata.isDirty = false;
      metadata.lastModified = doc.metadata.updatedAt;
      saveDocumentMetadata(documentId, metadata);

      set((state) => {
        const newMetadata = new Map(state.documentMetadata);
        newMetadata.set(documentId, metadata);
        return { documentMetadata: newMetadata };
      });
    }
  }
},
```

#### 6.2.3 Document Creation (`createDocument`)

Initialize empty bibliography for new documents:

```typescript
// In createDocument function (line 129)
createDocument: (title = 'Untitled Analysis') => {
  const state = get();
  const documentId = generateDocumentId();
  const now = new Date().toISOString();

  // Create copies of the default types
  const nodeTypes = state.settings.defaultNodeTypes.map(nt => ({ ...nt }));
  const edgeTypes = state.settings.defaultEdgeTypes.map(et => ({ ...et }));

  const newDoc = createDocumentHelper(
    [],
    [],
    nodeTypes,
    edgeTypes
  );
  newDoc.metadata.documentId = documentId;
  newDoc.metadata.title = title;
  newDoc.labels = [];  // Initialize with empty labels

  // **NEW: Initialize empty bibliography**
  newDoc.bibliography = {
    references: [],
    metadata: {},
    settings: {
      defaultStyle: 'apa',
      sortOrder: 'author',
    },
  };

  // ... rest of function
},
```

#### 6.2.4 Document Duplication (`duplicateDocument`)

Copy bibliography when duplicating:

```typescript
// In duplicateDocument function (line 440)
duplicateDocument: (documentId: string) => {
  const state = get();
  const sourceDoc = state.documents.get(documentId);
  if (!sourceDoc) {
    console.error(`Document ${documentId} not found`);
    useToastStore.getState().showToast('Failed to duplicate: Document not found', 'error');
    return '';
  }

  const newDocumentId = generateDocumentId();
  const sourceMeta = state.documentMetadata.get(documentId);
  const newTitle = `${sourceMeta?.title || 'Untitled'} (Copy)`;

  const duplicatedDoc: ConstellationDocument = {
    ...sourceDoc,
    metadata: {
      ...sourceDoc.metadata,
      documentId: newDocumentId,
      title: newTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // **NEW: Bibliography is already copied via spread operator**
    // But we could optionally give user choice to copy or start fresh
  };

  // ... rest of function

  // **NEW: Load bibliography into store for new document**
  if (duplicatedDoc.bibliography) {
    const { references, metadata, settings } = duplicatedDoc.bibliography;
    const cite = new Cite(references);

    useBibliographyStore.setState({
      citeInstance: cite,
      appMetadata: metadata,
      settings,
    });
  }

  return newDocumentId;
},
```

#### 6.2.5 Document Import (`importDocumentFromFile`)

Handle bibliography in imported documents:

```typescript
// In importDocumentFromFile function (line 550)
importDocumentFromFile: async () => {
  return new Promise((resolve) => {
    selectFileForImport(
      (importedDoc) => {
        const documentId = generateDocumentId();
        const now = new Date().toISOString();

        // Use the imported document as-is, preserving complete structure
        importedDoc.metadata.documentId = documentId;
        importedDoc.metadata.title = importedDoc.metadata.title || 'Imported Analysis';
        importedDoc.metadata.updatedAt = now;

        // **NEW: Bibliography is preserved from imported document**
        // Validate bibliography structure if present
        if (importedDoc.bibliography) {
          // Ensure it has the expected structure
          if (!importedDoc.bibliography.references) {
            importedDoc.bibliography.references = [];
          }
          if (!importedDoc.bibliography.metadata) {
            importedDoc.bibliography.metadata = {};
          }
          if (!importedDoc.bibliography.settings) {
            importedDoc.bibliography.settings = {
              defaultStyle: 'apa',
              sortOrder: 'author',
            };
          }
        }

        const metadata: DocumentMetadata = {
          id: documentId,
          title: importedDoc.metadata.title || 'Imported Analysis',
          isDirty: false,
          lastModified: now,
        };

        saveDocumentToStorage(documentId, importedDoc);
        saveDocumentMetadata(documentId, metadata);

        // Load timeline
        useTimelineStore.getState().loadTimeline(documentId, importedDoc.timeline as unknown as Timeline);

        // **NEW: Load bibliography if present**
        if (importedDoc.bibliography) {
          const { references, metadata: bibMetadata, settings } = importedDoc.bibliography;
          const cite = new Cite(references);

          useBibliographyStore.setState({
            citeInstance: cite,
            appMetadata: bibMetadata,
            settings,
          });
        } else {
          // Initialize empty bibliography
          useBibliographyStore.setState({
            citeInstance: new Cite([]),
            appMetadata: {},
            settings: {
              defaultStyle: 'apa',
              sortOrder: 'author',
            },
          });
        }

        // ... rest of function
      },
      // ... error handler
    );
  });
},
```

#### 6.2.6 Document Export (`exportDocument`)

Ensure bibliography is included in export:

```typescript
// In exportDocument function (line 617)
exportDocument: (documentId: string) => {
  const doc = get().documents.get(documentId);
  if (!doc) {
    console.error(`Document ${documentId} not found`);
    useToastStore.getState().showToast('Failed to export: Document not found', 'error');
    return;
  }

  try {
    // Ensure timeline is up-to-date before exporting
    const timelineState = useTimelineStore.getState();
    const timeline = timelineState.timelines.get(documentId);

    if (timeline) {
      const serializedStates: Record<string, ConstellationState> = {};
      timeline.states.forEach((state: ConstellationState, id: string) => {
        serializedStates[id] = state;
      });

      doc.timeline = {
        states: serializedStates,
        currentStateId: timeline.currentStateId,
        rootStateId: timeline.rootStateId,
      };
    }

    // **NEW: Ensure bibliography is up-to-date before exporting**
    const bibliographyState = useBibliographyStore.getState();
    const { getCSLData, appMetadata, settings } = bibliographyState;
    const references = getCSLData();

    if (references.length > 0 || Object.keys(appMetadata).length > 0) {
      doc.bibliography = {
        references,
        metadata: appMetadata,
        settings,
      };
    }

    // Export the complete document with all data
    exportDocumentToFile(doc);
    useToastStore.getState().showToast('Document exported successfully', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    useToastStore.getState().showToast(`Failed to export document: ${message}`, 'error', 5000);
  }
},
```

### 6.3 Bibliography Store Lifecycle

The bibliography store needs to be aware of document switching:

```typescript
// Add to bibliographyStore.ts

// Clear bibliography when switching documents
export const clearBibliographyForDocumentSwitch = () => {
  useBibliographyStore.setState({
    citeInstance: new Cite([]),
    appMetadata: {},
    settings: {
      defaultStyle: 'apa',
      sortOrder: 'author',
    },
  });
};
```

### 6.4 Workspace Export/Import

Bibliography data is automatically included when using existing workspace export/import:

**Location**: `/src/stores/workspace/workspaceIO.ts`

The existing functions already handle complete document structures, so bibliography will be included:

```typescript
// exportWorkspace function (line 44) - NO CHANGES NEEDED
// It iterates through all documents and saves them with JSON.stringify
// This automatically includes the bibliography field

// importWorkspaceFromZip function (line 91) - NO CHANGES NEEDED
// It parses the complete document structure
// This automatically includes the bibliography field
```

### 6.5 Marking Documents as Dirty

When bibliography changes, mark document as dirty:

```typescript
// In useBibliographyWithHistory hook

const addReferenceWithHistory = (ref: Partial<CSLReference>) => {
  const id = addReference(ref);
  pushHistory(activeDocumentId!, `Added reference: ${ref.title}`);

  // **NEW: Mark document as dirty**
  useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);

  return id;
};

const updateReferenceWithHistory = (id: string, updates: Partial<CSLReference>) => {
  const ref = useBibliographyStore.getState().getReferenceById(id);
  updateReference(id, updates);
  pushHistory(activeDocumentId!, `Updated reference: ${ref?.title}`);

  // **NEW: Mark document as dirty**
  useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);
};

const deleteReferenceWithHistory = (id: string) => {
  const ref = useBibliographyStore.getState().getReferenceById(id);

  // Remove citations from nodes and edges
  nodes.forEach(node => {
    if (node.data.citations?.includes(id)) {
      updateNode(node.id, {
        citations: node.data.citations.filter(cid => cid !== id),
      });
    }
  });

  edges.forEach(edge => {
    if (edge.data?.citations?.includes(id)) {
      updateEdge(edge.id, {
        citations: edge.data.citations.filter(cid => cid !== id),
      });
    }
  });

  deleteReference(id);
  pushHistory(activeDocumentId!, `Deleted reference: ${ref?.title}`);

  // **NEW: Mark document as dirty**
  useWorkspaceStore.getState().markDocumentDirty(activeDocumentId!);
};
```

### 6.6 Data Flow Summary

```
User Action (Add Reference)
    ↓
BibliographyConfigModal
    ↓
useBibliographyWithHistory
    ↓
bibliographyStore.addReference() ← Updates citation.js Cite instance
    ↓
historyStore.pushHistory() ← Track for undo/redo
    ↓
workspaceStore.markDocumentDirty() ← Indicate unsaved changes
    ↓
(User triggers save: Ctrl+S or File → Export)
    ↓
workspaceStore.saveDocument()
    ↓
Get CSL data from bibliographyStore
    ↓
Update doc.bibliography field
    ↓
saveDocumentToStorage() ← Persist to localStorage
```

### 6.7 Backward Compatibility

Documents created before bibliography feature:

```typescript
// In loadDocument function
if (doc.bibliography) {
  // Load existing bibliography
  const { references, metadata, settings } = doc.bibliography;
  const cite = new Cite(references);
  useBibliographyStore.setState({ citeInstance: cite, appMetadata: metadata, settings });
} else {
  // Old document without bibliography - initialize empty
  useBibliographyStore.setState({
    citeInstance: new Cite([]),
    appMetadata: {},
    settings: { defaultStyle: 'apa', sortOrder: 'author' },
  });

  // Note: Don't save the document automatically
  // Let user add first reference before marking dirty
}
```

---

## 7. Dependencies (Updated)

### 7.1 NPM Packages

```json
{
  "dependencies": {
    "@citation-js/core": "^0.7.14",
    "@citation-js/plugin-bibtex": "^0.7.14",
    "@citation-js/plugin-csl": "^0.7.14",
    "@citation-js/plugin-doi": "^0.7.14",
    "@citation-js/plugin-ris": "^0.7.14",
    "@citation-js/plugin-isbn": "^0.7.0",
    "@citation-js/plugin-pubmed": "^0.7.0"
  },
  "devDependencies": {
    "@types/citation-js": "^0.0.1"  // Community types if available
  }
}
```

**Note**: Each plugin is loaded separately, allowing code-splitting and lazy loading.

---

## 8. Implementation Phases (Revised)

### Phase 1: Core MVP with citation.js

**Setup:**
1. Install citation.js packages
2. Create type definitions
3. Set up bibliography store with Cite instance

**Features:**
- ✅ Smart input parsing (DOI, URL, BibTeX, RIS via citation.js)
- ✅ CRUD operations using citation.js methods
- ✅ Multiple citation styles (APA, Chicago, MLA via citation.js)
- ✅ Citation links to nodes/edges
- ✅ Search/filter references (in-app)
- ✅ Export as CSL-JSON, BibTeX, RIS (via citation.js)
- ✅ Formatted bibliography generation (via citation.js)
- ✅ Undo/redo support

**Estimated Effort**: 2-3 days (reduced from 3-5 days due to citation.js)

### Phase 2: Enhanced UX

**Features:**
- ✅ Advanced search with Fuse.js
- ✅ Tag management and filtering
- ✅ Usage tracking (which nodes/edges cite what)
- ✅ Import modal with file upload
- ✅ Export formatted HTML/PDF
- ✅ Citation style selector

**Estimated Effort**: 2-3 days

### Phase 3: Power Features

**Features:**
- ✅ Duplicate detection
- ✅ Bulk operations
- ✅ Custom CSL style upload
- ✅ Citation graph visualization
- ✅ PDF metadata extraction (via external service)

**Estimated Effort**: 3-4 days

---

## 9. Key Advantages of citation.js Integration

### What We Don't Need to Build Anymore:

1. ❌ **DOI lookup** - citation.js handles it via `@citation-js/plugin-doi`
2. ❌ **BibTeX parser** - citation.js handles it via `@citation-js/plugin-bibtex`
3. ❌ **RIS parser** - citation.js handles it via `@citation-js/plugin-ris`
4. ❌ **CSL formatting engine** - citation.js handles it via `@citation-js/plugin-csl`
5. ❌ **Format conversion logic** - citation.js handles all conversions
6. ❌ **Citation style templates** - citation.js supports 10,000+ styles
7. ❌ **ISBN lookup** - citation.js handles it via `@citation-js/plugin-isbn`
8. ❌ **PubMed lookup** - citation.js handles it via `@citation-js/plugin-pubmed`

### What We Still Build:

1. ✅ **UI Components** - Modal, forms, selectors
2. ✅ **State Management** - Zustand store wrapping Cite instance
3. ✅ **App Metadata** - Tags, favorites, created/updated timestamps
4. ✅ **Citation Linking** - Connecting references to nodes/edges
5. ✅ **History Tracking** - Undo/redo integration
6. ✅ **Document Persistence** - Saving bibliography with graph
7. ✅ **Usage Analytics** - Tracking which items cite what

---

## 10. Testing Strategy

### Unit Tests

**Test citation.js integration:**
```typescript
// test: parsing DOI
test('parseSmartInput handles DOI', async () => {
  const result = await parseSmartInput('10.1234/example');
  expect(result).toHaveLength(1);
  expect(result[0]).toHaveProperty('DOI');
});

// test: formatting
test('formatReference produces APA citation', () => {
  const ref = { id: '1', type: 'book', title: 'Test', author: [...] };
  const formatted = formatReference(ref, 'apa');
  expect(formatted).toContain('Test');
});

// test: export
test('exportToFormat generates BibTeX', () => {
  const refs = [{ id: '1', type: 'book', title: 'Test' }];
  const bibtex = exportToFormat(refs, 'bibtex');
  expect(bibtex).toContain('@book');
});
```

### Integration Tests
- Smart input → parse → add to store → display
- Import BibTeX file → convert → show in list
- Format bibliography → export HTML
- Update reference → see preview update

### E2E Tests
- Paste DOI → auto-fill → save → cite in node → export
- Import BibTeX file → select refs → cite in edge → format bibliography

---

## Conclusion

This revised specification **leverages citation.js extensively** to avoid rebuilding functionality that the library already provides. This results in:

- **Less code to maintain** (no custom parsers/formatters)
- **Better compatibility** (standard CSL-JSON throughout)
- **More features** (10,000+ citation styles, multiple input formats)
- **Faster development** (estimated 30-40% time savings)
- **Higher quality** (battle-tested library used by Zotero and others)

**Architecture Summary:**
- citation.js `Cite` instance = source of truth for CSL-JSON data
- Zustand store = wrapper providing UI state + app metadata
- All parsing/formatting/conversion delegates to citation.js
- We build only UI, persistence, and app-specific features

**Next Steps:**
1. Review and approve revised specification
2. Install citation.js packages
3. Implement Phase 1 with citation.js integration
4. Test DOI parsing and formatting
5. Build UI components