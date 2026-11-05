import { describe, it, expect, beforeEach } from 'vitest';
import { serializeRelations } from './documentUtils';
import { useGraphStore } from '../graphStore';
import type { Relation } from '../../types';

const relation: Relation = {
  id: 'r1',
  source: 'a',
  target: 'b',
  type: 'custom',
  data: { type: 'knows' },
};

describe('relation description persistence', () => {
  beforeEach(() => {
    useGraphStore.setState({ edges: [relation], labels: [] });
  });

  it('saves the text and visibility with the relation', () => {
    const description = '## Titel\n\n> Zitat\n> — Interview 3, Z. 42';
    useGraphStore.getState().updateEdge('r1', { description, showDescription: true });

    const [saved] = serializeRelations(useGraphStore.getState().edges);
    const reloaded = JSON.parse(JSON.stringify(saved));

    expect(reloaded.data.description).toBe(description);
    expect(reloaded.data.showDescription).toBe(true);
  });

  it('keeps the text when the box is hidden', () => {
    useGraphStore.getState().updateEdge('r1', { description: 'Text', showDescription: true });
    useGraphStore.getState().updateEdge('r1', { showDescription: undefined });

    const edge = useGraphStore.getState().edges[0];
    expect(edge.data?.description).toBe('Text');
    expect(edge.data?.showDescription).toBeUndefined();
  });

  it('leaves documents without a description free of the new fields', () => {
    const [saved] = serializeRelations(useGraphStore.getState().edges);
    expect(saved.data).toEqual({ type: 'knows' });
  });
});
