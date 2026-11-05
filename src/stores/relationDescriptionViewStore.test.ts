import { describe, it, expect, beforeEach } from 'vitest';
import { useRelationDescriptionViewStore } from './relationDescriptionViewStore';

describe('relationDescriptionViewStore', () => {
  beforeEach(() => {
    useRelationDescriptionViewStore.getState().clearVisibilityOverrides();
  });

  it('records a choice for each relation', () => {
    useRelationDescriptionViewStore.getState().setVisibilityOverrides(['a', 'b'], true);
    expect(useRelationDescriptionViewStore.getState().visibilityOverrides).toEqual({ a: true, b: true });
  });

  it('keeps earlier choices for other relations', () => {
    useRelationDescriptionViewStore.getState().setVisibilityOverrides(['a'], true);
    useRelationDescriptionViewStore.getState().setVisibilityOverrides(['b'], false);
    expect(useRelationDescriptionViewStore.getState().visibilityOverrides).toEqual({ a: true, b: false });
  });

  it('forgets everything when cleared', () => {
    useRelationDescriptionViewStore.getState().setVisibilityOverrides(['a'], true);
    useRelationDescriptionViewStore.getState().clearVisibilityOverrides();
    expect(useRelationDescriptionViewStore.getState().visibilityOverrides).toEqual({});
  });
});
