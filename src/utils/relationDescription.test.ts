import { describe, it, expect } from 'vitest';
import { getRelationDescriptionDisplay } from './relationDescription';

describe('getRelationDescriptionDisplay', () => {
  it('is hidden without data or text', () => {
    expect(getRelationDescriptionDisplay(undefined)).toBe('hidden');
    expect(getRelationDescriptionDisplay({ showDescription: true })).toBe('hidden');
    expect(getRelationDescriptionDisplay({ description: ' \n ', showDescription: true })).toBe('hidden');
  });

  it('is hidden until switched on, keeping the text', () => {
    expect(getRelationDescriptionDisplay({ description: 'Text' })).toBe('hidden');
  });

  it('shows the text when switched on', () => {
    expect(getRelationDescriptionDisplay({ description: 'Text', showDescription: true })).toBe('expanded');
  });

  it('is hidden on aggregated edges', () => {
    expect(
      getRelationDescriptionDisplay({ description: 'Text', showDescription: true, aggregatedCount: 3 }),
    ).toBe('hidden');
  });
});
