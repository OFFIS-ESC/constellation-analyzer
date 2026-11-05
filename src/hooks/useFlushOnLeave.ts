import { useEffect, useRef } from 'react';

/**
 * Runs `flush` when `id` changes or the component unmounts, using the callback
 * from the last committed render — the one that still holds the state of the
 * item being left. Lets a debounced form save what is pending instead of
 * dropping it when the user selects something else.
 */
export function useFlushOnLeave(id: string, flush: () => void) {
  const flushRef = useRef(flush);

  // A passive effect on purpose: React runs all passive cleanups before any
  // passive setup, so the cleanup below still sees the previous render's flush.
  useEffect(() => {
    flushRef.current = flush;
  });

  useEffect(() => () => flushRef.current(), [id]);
}
