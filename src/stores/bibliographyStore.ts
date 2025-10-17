import { create } from "zustand";
// @ts-expect-error - citation.js doesn't have TypeScript definitions
import { Cite } from "@citation-js/core";
// Load plugins
import "@citation-js/plugin-csl";
import "@citation-js/plugin-doi";
import "@citation-js/plugin-bibtex";
import "@citation-js/plugin-ris";
import "@citation-js/plugin-pubmed";
import "@citation-js/plugin-software-formats";

import type {
  BibliographyReference,
  CSLReference,
  ReferenceAppMetadata,
  BibliographySettings,
} from "../types/bibliography";

interface BibliographyStore {
  // State
  citeInstance: Cite; // The citation.js instance
  appMetadata: Record<string, ReferenceAppMetadata>; // App-specific data
  settings: BibliographySettings;

  // Getters
  getReferences: () => BibliographyReference[]; // Merges CSL + app data
  getReferenceById: (id: string) => BibliographyReference | undefined;
  getCSLData: () => CSLReference[]; // Raw CSL-JSON from Cite

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
  formatReference: (
    id: string,
    style?: string,
    format?: "html" | "text",
  ) => string;
  formatBibliography: (style?: string, format?: "html" | "text") => string;
  parseInput: (input: string) => Promise<CSLReference[]>;
  exportAs: (format: "bibtex" | "ris" | "json") => string;
}

export const useBibliographyStore = create<BibliographyStore>((set, get) => ({
  citeInstance: new Cite([]),
  appMetadata: {},
  settings: {
    defaultStyle: "apa",
    sortOrder: "author",
  },

  getReferences: () => {
    const csl = get().citeInstance.data as CSLReference[];
    const metadata = get().appMetadata;

    // Merge CSL data with app metadata
    return csl.map((ref) => ({
      ...ref,
      _app: metadata[ref.id],
    }));
  },

  getReferenceById: (id) => {
    const refs = get().getReferences();
    return refs.find((ref) => ref.id === id);
  },

  getCSLData: () => {
    return get().citeInstance.data as CSLReference[];
  },

  addReference: (ref) => {
    const { citeInstance } = get();

    // Generate ID if not provided
    const id =
      ref.id || `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const fullRef = { ...ref, id };

    // Use citation.js add() method
    citeInstance.add(fullRef);

    // Add app metadata
    const now = new Date().toISOString();
    set((state) => ({
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
    const updatedData = data.map((ref) =>
      ref.id === id ? { ...ref, ...updates } : ref,
    );

    // Use citation.js set() method to replace all data
    citeInstance.set(updatedData);

    // Update metadata timestamp
    set((state) => ({
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
    const filteredData = data.filter((ref) => ref.id !== id);
    citeInstance.set(filteredData);

    // Remove metadata
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _removed, ...rest } = state.appMetadata;
      return { appMetadata: rest };
    });
  },

  duplicateReference: (id) => {
    const original = get().getReferenceById(id);
    if (!original) return "";

    const newId = `ref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const duplicate = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
    };

    // Remove _app before adding to Cite
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    refs.forEach((ref) => {
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
    set((state) => {
      const newMetadata = { ...state.appMetadata };
      refs.forEach((ref) => {
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
    get().citeInstance.reset(); // citation.js method to clear all data
    set({ appMetadata: {} });
  },

  updateMetadata: (id, updates) => {
    set((state) => ({
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

  formatReference: (id, style, format = "html") => {
    const { citeInstance, settings } = get();
    const styleToUse = style || settings.defaultStyle;

    // Find the reference
    const ref = (citeInstance.data as CSLReference[]).find((r) => r.id === id);
    if (!ref) return "";

    // Create temporary Cite instance for single reference
    const cite = new Cite(ref);

    // Use citation.js format() method
    return cite.format("bibliography", {
      format: format,
      template: styleToUse,
      lang: "en-US",
    });
  },

  formatBibliography: (style, format = "html") => {
    const { citeInstance, settings } = get();
    const styleToUse = style || settings.defaultStyle;

    // Use citation.js format() method on entire instance
    return citeInstance.format("bibliography", {
      format: format,
      template: styleToUse,
      lang: "en-US",
    });
  },

  parseInput: async (input) => {
    try {
      // Use citation.js async parsing
      // This handles DOIs, URLs, BibTeX, RIS, etc. automatically
      const cite = await Cite.async(input);
      return cite.data as CSLReference[];
    } catch (error) {
      console.error("Failed to parse input:", error);
      throw new Error("Could not parse citation data");
    }
  },

  exportAs: (format) => {
    const { citeInstance } = get();

    // Use citation.js format() method
    switch (format) {
      case "bibtex":
        return citeInstance.format("bibtex");
      case "ris":
        return citeInstance.format("ris");
      case "json":
        return JSON.stringify(citeInstance.data, null, 2);
      default:
        return "";
    }
  },
}));

// Clear bibliography when switching documents
export const clearBibliographyForDocumentSwitch = () => {
  useBibliographyStore.setState({
    citeInstance: new Cite([]),
    appMetadata: {},
    settings: {
      defaultStyle: "apa",
      sortOrder: "author",
    },
  });
};
