import { describe, it, expect } from 'vitest';
import { describeTypeUsage, type TypeUsage } from './useTypeUsage';

/**
 * These strings are the warning a user reads before making a document-wide
 * edit from a single-item panel, so the wording is behaviour, not decoration.
 */

const usage = (over: Partial<TypeUsage> = {}): TypeUsage => ({
  count: 0,
  stateCount: 0,
  totalStateCount: 1,
  ...over,
});

describe('describeTypeUsage', () => {
  it('reassures rather than warns when the type is unused', () => {
    expect(describeTypeUsage('actor', usage())).toBe('Not used yet — safe to change');
    expect(describeTypeUsage('relation', usage())).toBe('Not used yet — safe to change');
  });

  it('uses the singular for a single item', () => {
    expect(describeTypeUsage('actor', usage({ count: 1, stateCount: 1 }))).toBe(
      'Changes all 1 actor of this type'
    );
    expect(describeTypeUsage('relation', usage({ count: 1, stateCount: 1 }))).toBe(
      'Changes all 1 relation of this type'
    );
  });

  it('uses the plural for several items', () => {
    expect(describeTypeUsage('actor', usage({ count: 7, stateCount: 1 }))).toBe(
      'Changes all 7 actors of this type'
    );
  });

  it('names the state count once the edit reaches beyond the visible state', () => {
    expect(
      describeTypeUsage('actor', usage({ count: 12, stateCount: 3, totalStateCount: 4 }))
    ).toBe('Changes all 12 actors of this type, across 3 states');
  });

  it('omits the state count when the document has only one state', () => {
    expect(
      describeTypeUsage('relation', usage({ count: 5, stateCount: 1, totalStateCount: 1 }))
    ).toBe('Changes all 5 relations of this type');
  });

  it('omits the state count when only one state actually uses the type', () => {
    expect(
      describeTypeUsage('actor', usage({ count: 4, stateCount: 1, totalStateCount: 6 }))
    ).toBe('Changes all 4 actors of this type');
  });
});
