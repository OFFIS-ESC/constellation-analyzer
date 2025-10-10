import type { StateCreator } from 'zustand';
import type { Actor, Relation, NodeTypeConfig, EdgeTypeConfig } from '../../types';
import { debouncedSave } from './saver';
import { DEBOUNCE_CONFIG } from './constants';

/**
 * Persistence Middleware - Auto-saves graph state to localStorage
 *
 * This middleware intercepts state changes in the Zustand store and
 * triggers debounced saves to localStorage.
 */



export const persistenceMiddleware = <
  T extends {
    nodes: Actor[];
    edges: Relation[];
    nodeTypes: NodeTypeConfig[];
    edgeTypes: EdgeTypeConfig[];
  }
>(
  config: StateCreator<T>
): StateCreator<T> => (set, get, api) => {
  const stateCreator = config(set, get, api);

  api.subscribe((state) => {
    if (state.nodes && state.edges && state.nodeTypes && state.edgeTypes) {
      debouncedSave(
        state.nodes,
        state.edges,
        state.nodeTypes,
        state.edgeTypes,
        DEBOUNCE_CONFIG.DELAY,
        DEBOUNCE_CONFIG.MAX_WAIT
      );
    }
  });

  return stateCreator;
};
