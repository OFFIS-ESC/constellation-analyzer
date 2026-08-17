import { describe, it, expect } from 'vitest';
import { buildExampleDocument, EXAMPLE_TITLE } from './exampleAnalysis';

/**
 * The example is the first real document most people will open, so a broken one
 * is a broken first impression. These assertions cover the ways it could be
 * quietly wrong: dangling references, ids that collide between two copies, or a
 * timeline that does not hang together.
 */

describe('buildExampleDocument', () => {
  it('is titled and self-describing', () => {
    const doc = buildExampleDocument();
    expect(doc.metadata.title).toBe(EXAMPLE_TITLE);
    expect(doc.metadata.appName).toBe('constellation-analyzer');
  });

  it('gives every copy its own state ids, so two can be open at once', () => {
    const a = buildExampleDocument();
    const b = buildExampleDocument();

    const aStates = Object.keys(a.timeline.states);
    const bStates = Object.keys(b.timeline.states);

    expect(aStates).toHaveLength(2);
    aStates.forEach((id) => expect(bStates).not.toContain(id));
  });

  it('does not share mutable graph data between copies', () => {
    const a = buildExampleDocument();
    const b = buildExampleDocument();

    const aGraph = a.timeline.states[a.timeline.currentStateId].graph;
    const bGraph = b.timeline.states[b.timeline.currentStateId].graph;

    aGraph.nodes[0].data.label = 'mutated';
    expect(bGraph.nodes[0].data.label).not.toBe('mutated');
  });

  it('has a coherent timeline: a root, and a child hanging off it', () => {
    const doc = buildExampleDocument();
    const { states, rootStateId, currentStateId } = doc.timeline;

    expect(states[rootStateId]).toBeDefined();
    expect(states[currentStateId]).toBeDefined();
    expect(states[rootStateId].parentStateId).toBeUndefined();

    const children = Object.values(states).filter((s) => s.parentStateId);
    expect(children).toHaveLength(1);
    expect(children[0].parentStateId).toBe(rootStateId);
  });

  it('starts the reader on the earlier state', () => {
    const doc = buildExampleDocument();
    expect(doc.timeline.currentStateId).toBe(doc.timeline.rootStateId);
  });

  it('only uses actor types the document defines', () => {
    const doc = buildExampleDocument();
    const typeIds = doc.nodeTypes.map((t) => t.id);

    Object.values(doc.timeline.states).forEach((state) => {
      state.graph.nodes.forEach((node) => {
        expect(typeIds).toContain(node.data.type);
      });
    });
  });

  it('only uses relation types the document defines', () => {
    const doc = buildExampleDocument();
    const typeIds = doc.edgeTypes.map((t) => t.id);

    Object.values(doc.timeline.states).forEach((state) => {
      state.graph.edges.forEach((edge) => {
        expect(typeIds).toContain(edge.data?.type);
      });
    });
  });

  it('only uses labels the document defines, within their declared scope', () => {
    const doc = buildExampleDocument();
    const byId = new Map((doc.labels ?? []).map((l) => [l.id, l]));

    Object.values(doc.timeline.states).forEach((state) => {
      state.graph.nodes.forEach((node) => {
        (node.data.labels ?? []).forEach((id) => {
          const label = byId.get(id);
          expect(label, `unknown label ${id}`).toBeDefined();
          expect(['actors', 'both']).toContain(label!.appliesTo);
        });
      });

      state.graph.edges.forEach((edge) => {
        (edge.data?.labels ?? []).forEach((id) => {
          const label = byId.get(id);
          expect(label, `unknown label ${id}`).toBeDefined();
          expect(['relations', 'both']).toContain(label!.appliesTo);
        });
      });
    });
  });

  it('has no relation pointing at a missing actor', () => {
    const doc = buildExampleDocument();

    Object.values(doc.timeline.states).forEach((state) => {
      const nodeIds = new Set(state.graph.nodes.map((n) => n.id));
      state.graph.edges.forEach((edge) => {
        expect(nodeIds, `dangling source on ${edge.id}`).toContain(edge.source);
        expect(nodeIds, `dangling target on ${edge.id}`).toContain(edge.target);
      });
    });
  });

  it('has no citation pointing at a missing reference', () => {
    const doc = buildExampleDocument();
    const refIds = (doc.bibliography?.references ?? []).map((r) => r.id);

    Object.values(doc.timeline.states).forEach((state) => {
      state.graph.nodes.forEach((node) => {
        (node.data.citations ?? []).forEach((id) => expect(refIds).toContain(id));
      });
    });
  });

  it('uses unique relation ids within each state', () => {
    const doc = buildExampleDocument();

    Object.values(doc.timeline.states).forEach((state) => {
      const ids = state.graph.edges.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('carries no groups, keeping a newcomer’s first screen uncluttered', () => {
    const doc = buildExampleDocument();
    Object.values(doc.timeline.states).forEach((state) => {
      expect(state.graph.groups ?? []).toHaveLength(0);
    });
  });

  it('demonstrates the vocabulary a newcomer has to learn', () => {
    const doc = buildExampleDocument();
    const root = doc.timeline.states[doc.timeline.rootStateId];

    // More than one actor type in play, or types teach nothing.
    const usedNodeTypes = new Set(root.graph.nodes.map((n) => n.data.type));
    expect(usedNodeTypes.size).toBeGreaterThanOrEqual(3);

    // Both directionalities present, so the distinction is visible.
    const directions = new Set(root.graph.edges.map((e) => e.data?.directionality));
    expect(directions).toContain('directed');
    expect(directions).toContain('bidirectional');

    // At least one label actually attached, and at least one citation.
    const labelled = root.graph.nodes.filter((n) => (n.data.labels ?? []).length > 0);
    expect(labelled.length).toBeGreaterThan(0);

    const cited = root.graph.nodes.filter((n) => (n.data.citations ?? []).length > 0);
    expect(cited.length).toBeGreaterThan(0);
  });

  it('differs between its two states, or the timeline demonstrates nothing', () => {
    const doc = buildExampleDocument();
    const [a, b] = Object.values(doc.timeline.states);

    const edgesOf = (s: typeof a) => s.graph.edges.map((e) => e.id).sort().join(',');
    expect(edgesOf(a)).not.toBe(edgesOf(b));
  });
});
