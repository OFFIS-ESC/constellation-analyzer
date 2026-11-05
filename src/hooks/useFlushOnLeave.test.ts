import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFlushOnLeave } from './useFlushOnLeave';

describe('useFlushOnLeave', () => {
  it('does not flush while the id stays the same', () => {
    const flush = vi.fn();
    const { rerender } = renderHook(({ id }) => useFlushOnLeave(id, flush), {
      initialProps: { id: 'a' },
    });

    rerender({ id: 'a' });

    expect(flush).not.toHaveBeenCalled();
  });

  it('flushes with the previous callback when the id changes', () => {
    const flushA = vi.fn();
    const flushB = vi.fn();
    const { rerender } = renderHook(({ id, flush }) => useFlushOnLeave(id, flush), {
      initialProps: { id: 'a', flush: flushA },
    });

    rerender({ id: 'b', flush: flushB });

    expect(flushA).toHaveBeenCalledTimes(1);
    expect(flushB).not.toHaveBeenCalled();
  });

  it('flushes on unmount with the latest callback', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const { rerender, unmount } = renderHook(({ flush }) => useFlushOnLeave('a', flush), {
      initialProps: { flush: first },
    });

    rerender({ flush: latest });
    unmount();

    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });
});
