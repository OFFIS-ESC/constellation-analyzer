import { describe, it, expect } from 'vitest';
import { concepts, conceptOrder, getConcept, type ConceptId } from './concepts';

/**
 * The concept registry is prose, so it cannot be type-checked into correctness.
 * These are the structural guarantees the help system relies on: every concept
 * resolves, every cross-link points somewhere real, and every dialog earns its
 * existence by defusing a specific misconception.
 */

const ids = Object.keys(concepts) as ConceptId[];

describe('concept registry', () => {
  it('exposes every concept in the browse order, exactly once', () => {
    expect([...conceptOrder].sort()).toEqual([...ids].sort());
    expect(new Set(conceptOrder).size).toBe(conceptOrder.length);
  });

  it('keys every concept by its own id', () => {
    ids.forEach((id) => {
      expect(concepts[id].id).toBe(id);
      expect(getConcept(id)).toBe(concepts[id]);
    });
  });

  it.each(ids)('%s has all five required parts', (id) => {
    const concept = concepts[id];

    expect(concept.title.trim()).not.toBe('');
    expect(concept.summary.trim()).not.toBe('');
    expect(concept.whatItIs.trim()).not.toBe('');
    expect(concept.howItWorks.length).toBeGreaterThan(0);
    concept.howItWorks.forEach((point) => expect(point.trim()).not.toBe(''));
  });

  it.each(ids)('%s defuses a specific misconception', (id) => {
    // A concept with nothing to get wrong does not need a dialog - it needs a
    // FieldHint. The guard is what justifies the heavier treatment.
    expect(concepts[id].guard.trim().length).toBeGreaterThan(40);
  });

  it.each(ids)('%s only links to concepts that exist', (id) => {
    concepts[id].related.forEach((relatedId) => {
      expect(ids).toContain(relatedId);
    });
  });

  it.each(ids)('%s does not link to itself', (id) => {
    expect(concepts[id].related).not.toContain(id);
  });

  it.each(ids)('%s offers a real decision when it offers one at all', (id) => {
    const choice = concepts[id].whichToChoose;
    if (!choice) return;

    // A single option is not a choice.
    expect(choice.options.length).toBeGreaterThanOrEqual(2);
    choice.options.forEach((option) => {
      expect(option.option.trim()).not.toBe('');
      expect(option.when.trim()).not.toBe('');
    });
  });

  it.each(ids)('%s closes every emphasis marker it opens', (id) => {
    // The dialog turns _text_ into emphasis. An unpaired underscore renders as a
    // literal one, so the prose has to keep them balanced.
    const concept = concepts[id];
    const prose = [
      concept.whatItIs,
      concept.guard,
      ...concept.howItWorks,
      concept.whichToChoose?.intro ?? '',
      ...(concept.whichToChoose?.options.flatMap((o) => [o.option, o.when]) ?? []),
    ];

    prose.forEach((text) => {
      const underscores = (text.match(/_/g) ?? []).length;
      expect(underscores % 2, `unbalanced underscore in: ${text}`).toBe(0);
    });
  });

  // NOTE: figure coverage is not tested here - it is enforced by the compiler.
  // `FIGURES` in ConceptFigure is a `Record<FigureId, ...>`, so every id must
  // have a drawing, and `figure?: FigureId` stops the registry naming one that
  // does not exist. A runtime test would only restate that.

  it('is reachable as a whole - no concept is orphaned from the rest', () => {
    // Every concept should be linked to by at least one other, so a reader who
    // enters at any point can navigate outward rather than hitting a dead end.
    const linkedTo = new Set(ids.flatMap((id) => concepts[id].related));
    ids.forEach((id) => expect(linkedTo).toContain(id));
  });
});
