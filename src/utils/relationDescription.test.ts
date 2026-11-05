import { describe, it, expect } from 'vitest';
import {
  getToggleAllDescriptionsAction,
  hasRelationDescription,
  isRelationDescriptionVisible,
} from './relationDescription';
import type { Relation, RelationData } from '../types';

describe('hasRelationDescription', () => {
  it('is false without data or text', () => {
    expect(hasRelationDescription(undefined)).toBe(false);
    expect(hasRelationDescription({})).toBe(false);
    expect(hasRelationDescription({ description: ' \n ' })).toBe(false);
  });

  it('is true for text, shown or not', () => {
    expect(hasRelationDescription({ description: 'Text' })).toBe(true);
    expect(hasRelationDescription({ description: 'Text', showDescription: true })).toBe(true);
  });

  it('is false on aggregated edges', () => {
    expect(hasRelationDescription({ description: 'Text', aggregatedCount: 3 })).toBe(false);
  });
});

describe('isRelationDescriptionVisible', () => {
  it('is hidden until switched on, keeping the text', () => {
    expect(isRelationDescriptionVisible({ description: 'Text' })).toBe(false);
  });

  it('is visible when switched on', () => {
    expect(isRelationDescriptionVisible({ description: 'Text', showDescription: true })).toBe(true);
  });

  it('is hidden without text even when switched on', () => {
    expect(isRelationDescriptionVisible({ showDescription: true })).toBe(false);
  });

  it('is hidden on aggregated edges', () => {
    expect(
      isRelationDescriptionVisible({ description: 'Text', showDescription: true, aggregatedCount: 3 }),
    ).toBe(false);
  });

  it('lets a presenting override win in both directions', () => {
    expect(isRelationDescriptionVisible({ description: 'Text' }, true)).toBe(true);
    expect(isRelationDescriptionVisible({ description: 'Text', showDescription: true }, false)).toBe(false);
  });

  it('cannot show missing text through an override', () => {
    expect(isRelationDescriptionVisible({}, true)).toBe(false);
  });
});

describe('getToggleAllDescriptionsAction', () => {
  const edge = (id: string, data: Partial<RelationData>): Relation =>
    ({ id, source: 'a', target: 'b', data: { type: 'knows', ...data } }) as Relation;
  const shown = { description: 'Text', showDescription: true };
  const hidden = { description: 'Text' };

  it('applies to every relation with text, and no others', () => {
    const edges = [edge('none', {}), edge('off', hidden), edge('on', shown)];
    expect(getToggleAllDescriptionsAction(edges, {}).ids).toEqual(['off', 'on']);
  });

  it('hides when at least one box is open', () => {
    expect(getToggleAllDescriptionsAction([edge('a', shown), edge('b', hidden)], {}).show).toBe(false);
  });

  it('shows when no box is open', () => {
    expect(getToggleAllDescriptionsAction([edge('a', hidden), edge('b', hidden)], {}).show).toBe(true);
  });

  it('takes presenting overrides into account', () => {
    expect(getToggleAllDescriptionsAction([edge('a', shown)], { a: false }).show).toBe(true);
  });

  it('has nothing to act on without text', () => {
    expect(getToggleAllDescriptionsAction([edge('a', {})], {}).ids).toEqual([]);
  });
});
