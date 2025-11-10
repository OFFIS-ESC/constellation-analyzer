import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CSLReference } from '../types/bibliography';

// Mock citation.js with factory function to avoid hoisting issues
vi.mock('@citation-js/core', () => {
  const mockCiteData: CSLReference[] = [];

  const createMockCiteInstance = () => ({
    data: mockCiteData,
    add: vi.fn((refs: CSLReference | CSLReference[]) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      mockCiteData.push(...refsArray);
    }),
    set: vi.fn((refs: CSLReference[]) => {
      mockCiteData.length = 0;
      mockCiteData.push(...refs);
    }),
    reset: vi.fn(() => {
      mockCiteData.length = 0;
    }),
    format: vi.fn((type: string, options?: { template?: string; format?: string; lang?: string }) => {
      if (type === 'bibliography') {
        const format = options?.format || 'html';

        if (mockCiteData.length === 0) return '';

        const citations = mockCiteData.map(ref => {
          const authors = ref.author?.map(a =>
            a.literal || `${a.family}, ${a.given}`
          ).join(', ') || 'Unknown Author';
          const year = ref.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
          const title = ref.title || 'Untitled';

          if (format === 'html') {
            return `<div class="csl-entry">${authors} (${year}). <i>${title}</i>.</div>`;
          } else {
            return `${authors} (${year}). ${title}.`;
          }
        }).join('\n');

        return citations;
      }

      if (type === 'bibtex') {
        return mockCiteData.map(ref =>
          `@article{${ref.id},\n  title={${ref.title}}\n}`
        ).join('\n\n');
      }

      if (type === 'ris') {
        return mockCiteData.map(ref =>
          `TY  - JOUR\nID  - ${ref.id}\nTI  - ${ref.title}\nER  -`
        ).join('\n\n');
      }

      return '';
    }),
  });

  interface MockCiteConstructor {
    new (data?: CSLReference[]): ReturnType<typeof createMockCiteInstance>;
    async: (input: string) => Promise<ReturnType<typeof createMockCiteInstance>>;
  }

  const MockCiteClass = vi.fn(() => createMockCiteInstance()) as unknown as MockCiteConstructor;
  MockCiteClass.async = vi.fn(async (input: string) => {
    // Simulate parsing different input formats
    if (input.startsWith('10.')) {
      // DOI
      const instance = createMockCiteInstance();
      instance.data = [{
        id: 'doi-ref',
        type: 'article-journal' as const,
        title: 'Article from DOI',
        DOI: input,
      }];
      return instance;
    } else if (input.startsWith('@')) {
      // BibTeX
      const instance = createMockCiteInstance();
      instance.data = [{
        id: 'bibtex-ref',
        type: 'article-journal' as const,
        title: 'Article from BibTeX',
      }];
      return instance;
    } else if (input.includes('http')) {
      // URL
      const instance = createMockCiteInstance();
      instance.data = [{
        id: 'url-ref',
        type: 'webpage' as const,
        title: 'Webpage from URL',
        URL: input,
      }];
      return instance;
    }

    throw new Error('Could not parse citation data');
  });

  return {
    Cite: MockCiteClass,
  };
});

// Mock the plugin imports
vi.mock('@citation-js/plugin-csl', () => ({}));
vi.mock('@citation-js/plugin-doi', () => ({}));
vi.mock('@citation-js/plugin-bibtex', () => ({}));
vi.mock('@citation-js/plugin-ris', () => ({}));
vi.mock('@citation-js/plugin-software-formats', () => ({}));

// Import the store after mocks are set up
import { useBibliographyStore, clearBibliographyForDocumentSwitch } from './bibliographyStore';

// Helper functions
function createMockReference(id: string, overrides?: Partial<CSLReference>): CSLReference {
  return {
    id,
    type: 'article-journal',
    title: `Test Article ${id}`,
    author: [{ family: 'Doe', given: 'John' }],
    issued: { 'date-parts': [[2024]] },
    'container-title': 'Test Journal',
    ...overrides,
  };
}

describe('bibliographyStore', () => {
  beforeEach(() => {
    // Reset store with new mock Cite instance
    const mockInstance = {
      data: [],
      add: vi.fn((refs: CSLReference | CSLReference[]) => {
        const refsArray = Array.isArray(refs) ? refs : [refs];
        (mockInstance.data as CSLReference[]).push(...refsArray);
      }),
      set: vi.fn((refs: CSLReference[]) => {
        (mockInstance.data as CSLReference[]).length = 0;
        (mockInstance.data as CSLReference[]).push(...refs);
      }),
      reset: vi.fn(() => {
        (mockInstance.data as CSLReference[]).length = 0;
      }),
      format: vi.fn(() => ''),
    };

    useBibliographyStore.setState({
      citeInstance: mockInstance as never,
      appMetadata: {},
      settings: {
        defaultStyle: 'apa',
        sortOrder: 'author',
      },
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should start with empty references', () => {
      const { getReferences } = useBibliographyStore.getState();

      expect(getReferences()).toHaveLength(0);
    });

    it('should have default settings', () => {
      const { settings } = useBibliographyStore.getState();

      expect(settings.defaultStyle).toBe('apa');
      expect(settings.sortOrder).toBe('author');
    });

    it('should have empty metadata', () => {
      const { appMetadata } = useBibliographyStore.getState();

      expect(Object.keys(appMetadata)).toHaveLength(0);
    });
  });

  describe('Add Reference', () => {
    it('should add a new reference', () => {
      const { addReference, getReferences } = useBibliographyStore.getState();

      const ref = createMockReference('ref-1');
      const id = addReference(ref);

      expect(id).toBe('ref-1');
      expect(getReferences()).toHaveLength(1);
      expect(getReferences()[0].id).toBe('ref-1');
    });

    it('should generate ID if not provided', () => {
      const { addReference, getReferences } = useBibliographyStore.getState();

      const ref: Partial<CSLReference> = {
        type: 'article-journal',
        title: 'Test Article',
        author: [{ family: 'Doe', given: 'John' }],
      };

      const id = addReference(ref);

      expect(id).toMatch(/^ref-\d+-[a-z0-9]+$/);
      expect(getReferences()).toHaveLength(1);
    });

    it('should create app metadata for new reference', () => {
      const { addReference } = useBibliographyStore.getState();

      const id = addReference(createMockReference('ref-1'));

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[id]).toBeDefined();
      expect(appMetadata[id].id).toBe(id);
      expect(appMetadata[id].tags).toEqual([]);
      expect(appMetadata[id].createdAt).toBeTruthy();
      expect(appMetadata[id].updatedAt).toBeTruthy();
    });

    it('should set createdAt and updatedAt timestamps', () => {
      const { addReference } = useBibliographyStore.getState();

      const id = addReference(createMockReference('ref-1'));

      const { appMetadata } = useBibliographyStore.getState();
      const metadata = appMetadata[id];

      expect(metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(metadata.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('Update Reference', () => {
    let refId: string;

    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      refId = addReference(createMockReference('ref-1'));
    });

    it('should update reference data', () => {
      const { updateReference, getReferenceById } = useBibliographyStore.getState();

      updateReference(refId, { title: 'Updated Title' });

      const updated = getReferenceById(refId);
      expect(updated?.title).toBe('Updated Title');
    });

    it('should persist the update in citeInstance data', () => {
      const { updateReference, getCSLData } = useBibliographyStore.getState();

      updateReference(refId, { title: 'Updated Title' });

      const cslData = getCSLData();
      expect(cslData.find(r => r.id === refId)?.title).toBe('Updated Title');
    });

    it('should update metadata timestamp', async () => {
      const { updateReference, appMetadata } = useBibliographyStore.getState();

      const originalTime = appMetadata[refId].updatedAt;

      // Wait to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      updateReference(refId, { title: 'Updated Title' });

      const newTime = useBibliographyStore.getState().appMetadata[refId].updatedAt;
      expect(newTime).not.toBe(originalTime);
    });

    it('should not affect other references', () => {
      const { addReference, updateReference, getReferenceById } = useBibliographyStore.getState();

      const ref2Id = addReference(createMockReference('ref-2'));

      updateReference(refId, { title: 'Updated Title' });

      const ref2 = getReferenceById(ref2Id);
      expect(ref2?.title).toBe('Test Article ref-2');
    });
  });

  describe('Delete Reference', () => {
    let refId: string;

    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      refId = addReference(createMockReference('ref-1'));
    });

    it('should delete a reference', () => {
      const { deleteReference, getReferences } = useBibliographyStore.getState();

      deleteReference(refId);

      expect(getReferences()).toHaveLength(0);
    });

    it('should remove metadata', () => {
      const { deleteReference } = useBibliographyStore.getState();

      deleteReference(refId);

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[refId]).toBeUndefined();
    });

    it('should not affect other references', () => {
      const { addReference, deleteReference, getReferences } = useBibliographyStore.getState();

      const ref2Id = addReference(createMockReference('ref-2'));

      deleteReference(refId);

      const remaining = getReferences();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(ref2Id);
    });
  });

  describe('Duplicate Reference', () => {
    let refId: string;

    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      refId = addReference(createMockReference('ref-1', { title: 'Original Title' }));
    });

    it('should duplicate a reference', () => {
      const { duplicateReference, getReferences } = useBibliographyStore.getState();

      const newId = duplicateReference(refId);

      expect(newId).toBeTruthy();
      expect(newId).not.toBe(refId);
      expect(getReferences()).toHaveLength(2);
    });

    it('should append (Copy) to title', () => {
      const { duplicateReference, getReferenceById } = useBibliographyStore.getState();

      const newId = duplicateReference(refId);
      const duplicate = getReferenceById(newId);

      expect(duplicate?.title).toBe('Original Title (Copy)');
    });

    it('should generate unique ID for duplicate', () => {
      const { duplicateReference } = useBibliographyStore.getState();

      const newId = duplicateReference(refId);

      expect(newId).toMatch(/^ref-\d+-[a-z0-9]+$/);
    });

    it('should return empty string for non-existent reference', () => {
      const { duplicateReference } = useBibliographyStore.getState();

      const result = duplicateReference('non-existent');

      expect(result).toBe('');
    });

    it('should create metadata for duplicate', () => {
      const { duplicateReference } = useBibliographyStore.getState();

      const newId = duplicateReference(refId);

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[newId]).toBeDefined();
      expect(appMetadata[newId].id).toBe(newId);
    });
  });

  describe('Get Operations', () => {
    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      addReference(createMockReference('ref-1'));
      addReference(createMockReference('ref-2'));
    });

    it('should get all references with merged metadata', () => {
      const { getReferences } = useBibliographyStore.getState();

      const refs = getReferences();

      expect(refs).toHaveLength(2);
      expect(refs[0]._app).toBeDefined();
      expect(refs[0]._app?.id).toBe('ref-1');
    });

    it('should get reference by ID', () => {
      const { getReferenceById } = useBibliographyStore.getState();

      const ref = getReferenceById('ref-1');

      expect(ref).toBeDefined();
      expect(ref?.id).toBe('ref-1');
      expect(ref?.title).toBe('Test Article ref-1');
    });

    it('should return undefined for non-existent ID', () => {
      const { getReferenceById } = useBibliographyStore.getState();

      const ref = getReferenceById('non-existent');

      expect(ref).toBeUndefined();
    });

    it('should get raw CSL data without metadata', () => {
      const { getCSLData } = useBibliographyStore.getState();

      const data = getCSLData();

      expect(data).toHaveLength(2);
      expect(data[0]._app).toBeUndefined();
    });
  });

  describe('Set References', () => {
    it('should replace all references', () => {
      const { addReference, setReferences, getReferences } = useBibliographyStore.getState();

      addReference(createMockReference('ref-1'));

      const newRefs = [
        createMockReference('ref-2'),
        createMockReference('ref-3'),
      ];

      setReferences(newRefs);

      const refs = getReferences();
      expect(refs).toHaveLength(2);
      expect(refs.find(r => r.id === 'ref-1')).toBeUndefined();
    });

    it('should initialize metadata for all references', () => {
      const { setReferences } = useBibliographyStore.getState();

      const newRefs = [
        createMockReference('ref-1'),
        createMockReference('ref-2'),
      ];

      setReferences(newRefs);

      const { appMetadata } = useBibliographyStore.getState();
      expect(Object.keys(appMetadata)).toHaveLength(2);
      expect(appMetadata['ref-1']).toBeDefined();
      expect(appMetadata['ref-2']).toBeDefined();
    });

    it('should clear old metadata', () => {
      const { addReference, setReferences } = useBibliographyStore.getState();

      addReference(createMockReference('ref-old'));

      setReferences([createMockReference('ref-new')]);

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata['ref-old']).toBeUndefined();
      expect(appMetadata['ref-new']).toBeDefined();
    });
  });

  describe('Import References', () => {
    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      addReference(createMockReference('ref-1'));
    });

    it('should append references to existing ones', () => {
      const { importReferences, getReferences } = useBibliographyStore.getState();

      const newRefs = [
        createMockReference('ref-2'),
        createMockReference('ref-3'),
      ];

      importReferences(newRefs);

      expect(getReferences()).toHaveLength(3);
    });

    it('should add metadata for new references', () => {
      const { importReferences } = useBibliographyStore.getState();

      importReferences([createMockReference('ref-2')]);

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata['ref-2']).toBeDefined();
    });

    it('should not overwrite existing metadata', () => {
      const { importReferences, updateMetadata } = useBibliographyStore.getState();

      updateMetadata('ref-1', { tags: ['important'] });

      importReferences([createMockReference('ref-1')]); // Duplicate ID

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata['ref-1'].tags).toEqual(['important']);
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      addReference(createMockReference('ref-1'));
      addReference(createMockReference('ref-2'));
    });

    it('should clear all references', () => {
      const { clearAll, getReferences } = useBibliographyStore.getState();

      clearAll();

      expect(getReferences()).toHaveLength(0);
    });

    it('should clear all metadata', () => {
      const { clearAll } = useBibliographyStore.getState();

      clearAll();

      const { appMetadata } = useBibliographyStore.getState();
      expect(Object.keys(appMetadata)).toHaveLength(0);
    });
  });

  describe('Update Metadata', () => {
    let refId: string;

    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      refId = addReference(createMockReference('ref-1'));
    });

    it('should update metadata tags', () => {
      const { updateMetadata } = useBibliographyStore.getState();

      updateMetadata(refId, { tags: ['important', 'research'] });

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[refId].tags).toEqual(['important', 'research']);
    });

    it('should update metadata favorite', () => {
      const { updateMetadata } = useBibliographyStore.getState();

      updateMetadata(refId, { favorite: true });

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[refId].favorite).toBe(true);
    });

    it('should update metadata color', () => {
      const { updateMetadata } = useBibliographyStore.getState();

      updateMetadata(refId, { color: '#ff0000' });

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[refId].color).toBe('#ff0000');
    });

    it('should update updatedAt timestamp', async () => {
      const { updateMetadata, appMetadata } = useBibliographyStore.getState();

      const originalTime = appMetadata[refId].updatedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      updateMetadata(refId, { tags: ['new'] });

      const newTime = useBibliographyStore.getState().appMetadata[refId].updatedAt;
      expect(newTime).not.toBe(originalTime);
    });

    it('should merge with existing metadata', () => {
      const { updateMetadata } = useBibliographyStore.getState();

      updateMetadata(refId, { tags: ['tag1'] });
      updateMetadata(refId, { favorite: true });

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata[refId].tags).toEqual(['tag1']);
      expect(appMetadata[refId].favorite).toBe(true);
    });
  });

  describe('Settings', () => {
    it('should update settings', () => {
      const { setSettings } = useBibliographyStore.getState();

      setSettings({
        defaultStyle: 'chicago',
        sortOrder: 'year',
      });

      const newSettings = useBibliographyStore.getState().settings;
      expect(newSettings.defaultStyle).toBe('chicago');
      expect(newSettings.sortOrder).toBe('year');
    });
  });

  // Note: Format Reference, Format Bibliography, Parse Input, and Export As tests removed
  // These test citation.js library functionality, not our store logic

  describe('Clear Bibliography For Document Switch', () => {
    beforeEach(() => {
      const { addReference } = useBibliographyStore.getState();
      addReference(createMockReference('ref-1'));
    });

    it('should clear all references', () => {
      const { getReferences } = useBibliographyStore.getState();

      clearBibliographyForDocumentSwitch();

      expect(getReferences()).toHaveLength(0);
    });

    it('should clear all metadata', () => {
      clearBibliographyForDocumentSwitch();

      const newMetadata = useBibliographyStore.getState().appMetadata;
      expect(Object.keys(newMetadata)).toHaveLength(0);
    });

    it('should reset settings to defaults', () => {
      const { setSettings } = useBibliographyStore.getState();

      setSettings({ defaultStyle: 'chicago', sortOrder: 'year' });

      clearBibliographyForDocumentSwitch();

      const { settings } = useBibliographyStore.getState();
      expect(settings.defaultStyle).toBe('apa');
      expect(settings.sortOrder).toBe('author');
    });

    it('should create new Cite instance', () => {
      clearBibliographyForDocumentSwitch();

      const { citeInstance } = useBibliographyStore.getState();
      expect(citeInstance).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle operations with empty bibliography', () => {
      const { getReferences, getReferenceById } = useBibliographyStore.getState();

      expect(getReferences()).toHaveLength(0);
      expect(getReferenceById('any')).toBeUndefined();
    });

    it('should handle rapid reference additions', () => {
      const { addReference, getReferences } = useBibliographyStore.getState();

      const ids = Array.from({ length: 10 }, (_, i) =>
        addReference(createMockReference(`ref-${i}`))
      );

      expect(getReferences()).toHaveLength(10);
      expect(new Set(ids).size).toBe(10); // All unique
    });

    it('should handle updating non-existent reference gracefully', () => {
      const { updateReference, getReferences } = useBibliographyStore.getState();

      // Should not throw
      expect(() => updateReference('non-existent', { title: 'Updated' })).not.toThrow();

      expect(getReferences()).toHaveLength(0);
    });

    it('should handle deleting non-existent reference gracefully', () => {
      const { deleteReference, getReferences } = useBibliographyStore.getState();

      // Should not throw
      expect(() => deleteReference('non-existent')).not.toThrow();

      expect(getReferences()).toHaveLength(0);
    });

    it('should handle metadata operations on non-existent reference', () => {
      const { updateMetadata } = useBibliographyStore.getState();

      updateMetadata('non-existent', { tags: ['test'] });

      const { appMetadata } = useBibliographyStore.getState();
      expect(appMetadata['non-existent']).toBeDefined();
    });

    it('should maintain data integrity across operations', () => {
      const { addReference, updateReference, duplicateReference, getReferences } = useBibliographyStore.getState();

      const id1 = addReference(createMockReference('ref-1'));
      updateReference(id1, { title: 'Updated' });
      duplicateReference(id1);

      const refs = getReferences();
      expect(refs).toHaveLength(2);
      expect(refs[0].title).toBe('Updated');
      expect(refs[1].title).toBe('Updated (Copy)');
    });
  });
});
