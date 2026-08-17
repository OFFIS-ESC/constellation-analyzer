import { useMemo } from 'react';
import { useGraphStore } from '../stores/graphStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useWorkspaceStore } from '../stores/workspaceStore';

/**
 * useTypeUsage - live consequence counts for document-wide type edits
 *
 * Actor and relation types are global to a document, so editing one reaches
 * every state - including states the user is not looking at. A count computed
 * from real data is worth more than any amount of explanatory prose, so the
 * property panels and config modals use this to say exactly how far an edit
 * reaches before it is made.
 *
 * The current state is counted from `graphStore` rather than from its timeline
 * snapshot: the snapshot only catches up on save or state switch, so reading it
 * would under-report edits made in the last second.
 */

export type TypeKind = 'actor' | 'relation';

export interface TypeUsage {
  /** Total items of this type across every state in the document. */
  count: number;
  /** How many states contain at least one item of this type. */
  stateCount: number;
  /** How many states the document has in total. */
  totalStateCount: number;
}

const EMPTY: TypeUsage = { count: 0, stateCount: 0, totalStateCount: 1 };

function typeOf(data: { type?: string } | undefined): string | undefined {
  return data?.type;
}

export function useTypeUsage(kind: TypeKind, typeId: string | null | undefined): TypeUsage {
  const activeDocumentId = useWorkspaceStore((s) => s.activeDocumentId);
  const timelines = useTimelineStore((s) => s.timelines);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  return useMemo(() => {
    if (!typeId) return EMPTY;

    const liveCount =
      kind === 'actor'
        ? nodes.filter((n) => typeOf(n.data) === typeId).length
        : edges.filter((e) => typeOf(e.data) === typeId).length;

    const timeline = activeDocumentId ? timelines.get(activeDocumentId) : undefined;
    const states = timeline ? Array.from(timeline.states.values()) : [];

    // No timeline yet (or a document mid-initialization): the live graph is all
    // there is, so report it as a single state.
    if (!timeline || states.length === 0) {
      return {
        count: liveCount,
        stateCount: liveCount > 0 ? 1 : 0,
        totalStateCount: 1,
      };
    }

    let count = 0;
    let stateCount = 0;

    states.forEach((state) => {
      const isCurrent = state.id === timeline.currentStateId;
      const inState = isCurrent
        ? liveCount
        : kind === 'actor'
          ? state.graph.nodes.filter((n) => typeOf(n.data)  === typeId).length
          : state.graph.edges.filter((e) => typeOf(e.data) === typeId).length;

      count += inState;
      if (inState > 0) stateCount += 1;
    });

    return { count, stateCount, totalStateCount: states.length };
  }, [kind, typeId, activeDocumentId, timelines, nodes, edges]);
}

/**
 * Turns a usage count into the sentence shown under a type control.
 *
 * Reads as a warning only when there is something to warn about - an unused
 * type is genuinely safe to rename, and saying so is more useful than a
 * blanket caution nobody reads.
 */
export function describeTypeUsage(kind: TypeKind, usage: TypeUsage): string {
  const noun = kind === 'actor' ? 'actor' : 'relation';
  const plural = kind === 'actor' ? 'actors' : 'relations';

  if (usage.count === 0) {
    return `Not used yet — safe to change`;
  }

  const items = `${usage.count} ${usage.count === 1 ? noun : plural}`;

  if (usage.totalStateCount <= 1 || usage.stateCount <= 1) {
    return `Changes all ${items} of this type`;
  }

  return `Changes all ${items} of this type, across ${usage.stateCount} states`;
}
