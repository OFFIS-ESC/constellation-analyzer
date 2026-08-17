import { describe, it, expect, beforeEach } from 'vitest';
import { saveDocumentToStorage, loadDocumentFromStorage, clearWorkspaceStorage } from './persistence';
import { getCurrentGraphFromDocument, serializeActors } from './documentUtils';
import { SCHEMA_VERSION, APP_NAME } from '../persistence/constants';
import type { ConstellationDocument } from '../persistence/types';
import type { Actor } from '../../types';

/**
 * Group membership round-trip
 *
 * React Flow expresses "this actor sits inside that group" as `parentId` on the
 * actor. Losing that link on save silently takes every group apart, so the trip
 * out to storage and back is worth pinning down explicitly.
 */

const DOC_ID = 'doc-group-roundtrip';

/** A document shaped the way the running app stores one: runtime nodes, deep-copied. */
function documentWithGroupedActor(): ConstellationDocument {
  const now = new Date().toISOString();
  const stateId = 'state-1';

  return {
    metadata: {
      version: SCHEMA_VERSION,
      appName: APP_NAME,
      createdAt: now,
      updatedAt: now,
      lastSavedBy: 'browser',
      documentId: DOC_ID,
      title: 'Group round-trip',
    },
    nodeTypes: [{ id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle' }],
    edgeTypes: [],
    labels: [],
    timeline: {
      states: {
        [stateId]: {
          id: stateId,
          label: 'Initial State',
          graph: {
            // `parentId` / `extent` are what graphStore holds and what
            // saveCurrentGraph deep-copies into the timeline verbatim.
            nodes: [
              {
                id: 'actor-1',
                type: 'custom',
                position: { x: 20, y: 20 },
                data: { label: 'Inside a group', type: 'person' },
                parentId: 'group-1',
                extent: 'parent',
              },
            ] as never[],
            edges: [],
            groups: [
              {
                id: 'group-1',
                type: 'group',
                position: { x: 0, y: 0 },
                data: { label: 'A group', color: 'rgba(240,242,245,0.5)', actorIds: ['actor-1'] },
                width: 300,
                height: 200,
              },
            ] as never[],
          },
          createdAt: now,
          updatedAt: now,
        },
      },
      currentStateId: stateId,
      rootStateId: stateId,
    },
  };
}

describe('group membership persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    clearWorkspaceStorage();
  });

  it('survives a save and reload', () => {
    saveDocumentToStorage(DOC_ID, documentWithGroupedActor());

    const reloaded = loadDocumentFromStorage(DOC_ID);
    expect(reloaded).not.toBeNull();

    const graph = getCurrentGraphFromDocument(reloaded!);
    expect(graph).not.toBeNull();

    const actor = graph!.nodes[0] as unknown as Actor & { parentId?: string; extent?: string };
    expect(actor.parentId).toBe('group-1');
    expect(actor.extent).toBe('parent');
  });

  it('keeps the group itself, with its member list', () => {
    saveDocumentToStorage(DOC_ID, documentWithGroupedActor());

    const graph = getCurrentGraphFromDocument(loadDocumentFromStorage(DOC_ID)!);
    expect(graph!.groups).toHaveLength(1);
    expect(graph!.groups[0].data.actorIds).toEqual(['actor-1']);
  });

  it('serializeActors emits parentId, matching what the loader reads back', () => {
    // This function renames the field, so it is the one place the two shapes
    // could drift apart. It must agree with the raw round trip above.
    const runtimeActor = {
      id: 'actor-1',
      type: 'custom',
      position: { x: 20, y: 20 },
      data: { label: 'Inside a group', type: 'person' },
      parentId: 'group-1',
      extent: 'parent',
    } as unknown as Actor;

    const [serialized] = serializeActors([runtimeActor]) as unknown as Array<
      Record<string, unknown>
    >;

    expect(serialized.parentId).toBe('group-1');
    expect(serialized.extent).toBe('parent');
  });

  it('still understands documents that stored the link as parentNode', () => {
    // Older builds wrote `parentNode`. Those documents are on disk in people's
    // browsers, so the loader has to normalize them.
    const doc = documentWithGroupedActor();
    const state = doc.timeline.states['state-1'];
    state.graph.nodes = [
      {
        id: 'actor-1',
        type: 'custom',
        position: { x: 20, y: 20 },
        data: { label: 'Inside a group', type: 'person' },
        parentNode: 'group-1',
        extent: 'parent',
      },
    ] as never[];

    saveDocumentToStorage(DOC_ID, doc);

    const graph = getCurrentGraphFromDocument(loadDocumentFromStorage(DOC_ID)!);
    const actor = graph!.nodes[0] as unknown as Actor & { parentId?: string };
    expect(actor.parentId).toBe('group-1');
  });
});
