import { describe, it, expect } from 'vitest';
import { buildExampleDocument, EXAMPLE_TITLE } from './exampleAnalysis';
import { validateDocument } from '../stores/workspace/documentUtils';

/**
 * The example is a document file, replaceable by exporting a new analysis from
 * the app and overwriting `exampleAnalysis.json`. So these tests deliberately do
 * not assert anything about its contents — how many actors it has, which types it
 * uses, how its states differ. Those are curation choices, and pinning them here
 * would mean rewriting this file every time the example is swapped.
 *
 * What is worth protecting is that the file is a document the app can actually
 * open, and that the loader hands out independent copies.
 */

describe('the example analysis', () => {
  it('is a document this app recognizes', () => {
    // The same check used when loading any document from storage or a file, so
    // a bad hand-edit or a truncated export fails here rather than at runtime.
    expect(validateDocument(buildExampleDocument())).toBe(true);
  });

  it('has a title, which becomes the document tab name', () => {
    expect(EXAMPLE_TITLE.trim()).not.toBe('');
    expect(buildExampleDocument().metadata.title).toBe(EXAMPLE_TITLE);
  });

  it('opens on a state that exists', () => {
    const { timeline } = buildExampleDocument();
    expect(timeline.states[timeline.currentStateId]).toBeDefined();
    expect(timeline.states[timeline.rootStateId]).toBeDefined();
  });

  it('hands out an independent copy each time', () => {
    const a = buildExampleDocument();
    const b = buildExampleDocument();

    expect(a).not.toBe(b);

    const graphOf = (doc: typeof a) => doc.timeline.states[doc.timeline.currentStateId].graph;
    graphOf(a).nodes[0].data.label = 'mutated';

    expect(graphOf(b).nodes[0].data.label).not.toBe('mutated');
  });
});
