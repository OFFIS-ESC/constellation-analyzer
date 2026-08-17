import { describe, it, expect } from 'vitest';
import {
  migrateActorParentRef,
  migrateActorParentRefs,
  migrateDocumentParentRefs,
} from '../parentRefMigration';
import type { ConstellationDocument, SerializedActor } from '../../stores/persistence/types';

const actor = (extra: Record<string, unknown> = {}): SerializedActor =>
  ({
    id: 'actor-1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'An actor', type: 'person' },
    ...extra,
  }) as SerializedActor;

describe('migrateActorParentRef', () => {
  it('renames a legacy parentNode to parentId', () => {
    const migrated = migrateActorParentRef(actor({ parentNode: 'group-1' })) as SerializedActor & {
      parentNode?: string;
    };

    expect(migrated.parentId).toBe('group-1');
    expect(migrated.parentNode).toBeUndefined();
  });

  it('leaves a current parentId alone', () => {
    const migrated = migrateActorParentRef(actor({ parentId: 'group-1' }));
    expect(migrated.parentId).toBe('group-1');
  });

  it('prefers parentId when a document somehow carries both', () => {
    const migrated = migrateActorParentRef(
      actor({ parentId: 'group-new', parentNode: 'group-old' })
    ) as SerializedActor & { parentNode?: string };

    expect(migrated.parentId).toBe('group-new');
    expect(migrated.parentNode).toBeUndefined();
  });

  it('leaves an ungrouped actor untouched', () => {
    const input = actor();
    const migrated = migrateActorParentRef(input);

    expect(migrated).toBe(input); // same reference - nothing to do
    expect(migrated.parentId).toBeUndefined();
  });

  it('keeps the extent flag, which groups need alongside the parent', () => {
    const migrated = migrateActorParentRef(actor({ parentNode: 'group-1', extent: 'parent' }));
    expect(migrated.extent).toBe('parent');
  });

  it('preserves everything else about the actor', () => {
    const migrated = migrateActorParentRef(
      actor({ parentNode: 'group-1', data: { label: 'Kept', type: 'person', labels: ['a'] } })
    );

    expect(migrated.id).toBe('actor-1');
    expect(migrated.position).toEqual({ x: 0, y: 0 });
    expect(migrated.data.label).toBe('Kept');
    expect(migrated.data.labels).toEqual(['a']);
  });
});

describe('migrateActorParentRefs', () => {
  it('migrates a mixed list', () => {
    const migrated = migrateActorParentRefs([
      actor({ id: 'a', parentNode: 'group-1' }),
      actor({ id: 'b', parentId: 'group-2' }),
      actor({ id: 'c' }),
    ]);

    expect(migrated[0].parentId).toBe('group-1');
    expect(migrated[1].parentId).toBe('group-2');
    expect(migrated[2].parentId).toBeUndefined();
  });

  it('handles an empty list', () => {
    expect(migrateActorParentRefs([])).toEqual([]);
  });
});

describe('migrateDocumentParentRefs', () => {
  const documentWith = (statesGraph: Record<string, SerializedActor[]>): ConstellationDocument =>
    ({
      metadata: {
        version: '1.0.0',
        appName: 'constellation-analyzer',
        createdAt: '',
        updatedAt: '',
        lastSavedBy: 'browser',
      },
      nodeTypes: [],
      edgeTypes: [],
      timeline: {
        states: Object.fromEntries(
          Object.entries(statesGraph).map(([id, nodes]) => [
            id,
            { id, label: id, graph: { nodes, edges: [] }, createdAt: '', updatedAt: '' },
          ])
        ),
        currentStateId: Object.keys(statesGraph)[0],
        rootStateId: Object.keys(statesGraph)[0],
      },
    }) as ConstellationDocument;

  it('migrates every state, not only the current one', () => {
    const doc = documentWith({
      's1': [actor({ id: 'a', parentNode: 'group-1' })],
      's2': [actor({ id: 'b', parentNode: 'group-2' })],
    });

    migrateDocumentParentRefs(doc);

    expect(doc.timeline.states['s1'].graph.nodes[0].parentId).toBe('group-1');
    expect(doc.timeline.states['s2'].graph.nodes[0].parentId).toBe('group-2');
  });

  it('survives a document with no timeline', () => {
    const doc = { metadata: {} } as unknown as ConstellationDocument;
    expect(() => migrateDocumentParentRefs(doc)).not.toThrow();
  });

  it('survives a state with no graph', () => {
    const doc = documentWith({ s1: [] });
    // @ts-expect-error - deliberately malformed, as a corrupted document would be
    doc.timeline.states['s1'].graph = undefined;

    expect(() => migrateDocumentParentRefs(doc)).not.toThrow();
  });
});
