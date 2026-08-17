import type { ConstellationDocument, SerializedActor } from '../stores/persistence/types';

/**
 * Parent reference migration
 *
 * React Flow expresses "this actor sits inside that group" as `parentId` on the
 * actor, and that is what the editor reads. An earlier `serializeActors` renamed
 * the field to `parentNode` on the way out, and nothing renamed it back on the
 * way in — so any document written through that path lost every group when
 * reopened. The actors survived; they simply stopped being inside anything.
 *
 * Documents in that shape are sitting in people's browsers, so the loader has to
 * normalize them. `parentId` always wins if both are present.
 */

type LegacyActor = SerializedActor & { parentNode?: string };

/** Normalize one actor's parent reference to `parentId`. */
export function migrateActorParentRef(actor: SerializedActor): SerializedActor {
  const legacy = actor as LegacyActor;

  if (!legacy.parentNode) return actor;

  const { parentNode, ...rest } = legacy;
  return {
    ...rest,
    parentId: legacy.parentId ?? parentNode,
  };
}

export function migrateActorParentRefs(actors: SerializedActor[]): SerializedActor[] {
  return actors.map(migrateActorParentRef);
}

/**
 * Normalize every state in a document.
 *
 * Mutates in place, matching how the other migrations are applied at load and
 * import time, so callers do not have to rebuild the timeline.
 */
export function migrateDocumentParentRefs(document: ConstellationDocument): ConstellationDocument {
  const states = document.timeline?.states;
  if (!states) return document;

  Object.keys(states).forEach((stateId) => {
    const state = states[stateId];
    if (state?.graph?.nodes) {
      state.graph.nodes = migrateActorParentRefs(state.graph.nodes);
    }
  });

  return document;
}
