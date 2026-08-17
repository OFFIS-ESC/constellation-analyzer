import type { ConstellationDocument, SerializedActor, SerializedRelation } from '../stores/persistence/types';
import type { NodeTypeConfig, EdgeTypeConfig, LabelConfig } from '../types';
import type { ConstellationState } from '../types/timeline';
import { SCHEMA_VERSION, APP_NAME } from '../stores/persistence/constants';

/**
 * The worked example analysis — Tier 0 of the help model
 *
 * A populated graph teaches the vocabulary faster than any amount of prose, so
 * the empty state offers one. Everything a newcomer has to learn is present and
 * visible: four actor types, five relation types, one-way and two-way relations,
 * labels doing cross-cutting work, a citation, and two timeline states.
 *
 * The scenario is fictional, and its sources are fictional with it — an example
 * should never ship a real-looking citation nobody can check.
 *
 * No group, for now. The reason it was originally left out - group membership
 * not surviving a reload - has since been fixed, so one could be added; it is
 * held back only to keep the first thing a newcomer sees uncluttered. Groups are
 * explained in their own concept dialog either way.
 */

const TITLE = 'Example · Neighbourhood Heat Transition';

const NODE_TYPES: NodeTypeConfig[] = [
  { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'An individual' },
  { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'A company, authority or association' },
  { id: 'system', label: 'System', color: '#f59e0b', shape: 'roundedRectangle', icon: 'Computer', description: 'Infrastructure or a technical system' },
  { id: 'concept', label: 'Concept', color: '#8b5cf6', shape: 'roundedRectangle', icon: 'Lightbulb', description: 'An idea, goal or shared value' },
];

const EDGE_TYPES: EdgeTypeConfig[] = [
  { id: 'funds', label: 'Funds', color: '#10b981', style: 'solid', defaultDirectionality: 'directed', description: 'Provides money' },
  { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid', defaultDirectionality: 'bidirectional', description: 'Works together with' },
  { id: 'opposes', label: 'Opposes', color: '#ef4444', style: 'dashed', defaultDirectionality: 'directed', description: 'Works against' },
  { id: 'depends-on', label: 'Depends On', color: '#f59e0b', style: 'dashed', defaultDirectionality: 'directed', description: 'Cannot operate without' },
  { id: 'influences', label: 'Influences', color: '#8b5cf6', style: 'dotted', defaultDirectionality: 'directed', description: 'Shapes without controlling' },
];

const LABELS: LabelConfig[] = [
  { id: 'key-actor', name: 'Key actor', color: '#eab308', appliesTo: 'actors', description: 'Central to how this turns out' },
  { id: 'external', name: 'External', color: '#64748b', appliesTo: 'actors', description: 'Outside the neighbourhood' },
  { id: 'contested', name: 'Contested', color: '#ef4444', appliesTo: 'relations', description: 'Disputed or unstable' },
];

/** Actors are shared by both states; only the relations between them change. */
const ACTORS: SerializedActor[] = [
  {
    id: 'ex-council',
    type: 'custom',
    position: { x: 300, y: 60 },
    data: {
      label: 'City Council',
      type: 'organization',
      description: 'Sets the heat planning framework',
      labels: ['key-actor'],
      citations: ['ex-ref-heat-plan'],
    },
  },
  {
    id: 'ex-utility',
    type: 'custom',
    // Pushed well right of the grid operator: it is the busiest actor in the
    // graph, and closer in its relations overlapped each other.
    position: { x: 840, y: 140 },
    data: {
      label: 'Municipal Utility',
      type: 'organization',
      description: 'Owns and operates the heat network',
      labels: ['key-actor'],
    },
  },
  {
    id: 'ex-grid',
    type: 'custom',
    position: { x: 580, y: 360 },
    data: {
      label: 'Regional Grid Operator',
      type: 'organization',
      description: 'Approves every new connection',
      labels: ['external'],
    },
  },
  {
    id: 'ex-pilot',
    type: 'custom',
    position: { x: 300, y: 300 },
    data: {
      label: 'Heat Pump Pilot',
      type: 'system',
      description: 'Twelve houses, running since spring',
    },
  },
  {
    id: 'ex-residents',
    type: 'custom',
    position: { x: 30, y: 170 },
    data: {
      label: 'Residents’ Association',
      type: 'organization',
      description: 'Speaks for 240 households',
      labels: ['key-actor'],
    },
  },
  {
    id: 'ex-maria',
    type: 'custom',
    position: { x: 30, y: 360 },
    data: {
      label: 'Maria Lange',
      type: 'person',
      description: 'Coordinator — trusted by both sides',
      // Switched on so the example shows this option exists at all.
      showDescriptionInNode: true,
    },
  },
  {
    id: 'ex-autonomy',
    type: 'custom',
    position: { x: 300, y: 500 },
    data: {
      label: 'Energy Autonomy',
      type: 'concept',
      description: 'The goal residents keep returning to',
    },
  },
];

/** The pilot phase, with the grid fee dispute still open. */
const PILOT_RELATIONS: SerializedRelation[] = [
  { id: 'ex-r1', source: 'ex-council', target: 'ex-pilot', type: 'custom', data: { type: 'funds', directionality: 'directed' } },
  { id: 'ex-r2', source: 'ex-council', target: 'ex-utility', type: 'custom', data: { type: 'collaborates', directionality: 'bidirectional' } },
  {
    id: 'ex-r3',
    source: 'ex-residents',
    target: 'ex-utility',
    type: 'custom',
    data: { type: 'opposes', label: 'Grid fee dispute', directionality: 'directed', labels: ['contested'] },
  },
  { id: 'ex-r4', source: 'ex-maria', target: 'ex-residents', type: 'custom', data: { type: 'collaborates', directionality: 'bidirectional' } },
  { id: 'ex-r5', source: 'ex-maria', target: 'ex-council', type: 'custom', data: { type: 'collaborates', directionality: 'bidirectional' } },
  { id: 'ex-r6', source: 'ex-pilot', target: 'ex-grid', type: 'custom', data: { type: 'depends-on', directionality: 'directed' } },
  { id: 'ex-r7', source: 'ex-utility', target: 'ex-grid', type: 'custom', data: { type: 'depends-on', directionality: 'directed' } },
  { id: 'ex-r8', source: 'ex-residents', target: 'ex-autonomy', type: 'custom', data: { type: 'influences', directionality: 'directed' } },
];

/**
 * The rollout, two years on: the dispute has been settled into a working
 * relationship, and the council now funds the utility directly. Same actors,
 * different relations — which is exactly what a state is for.
 */
const ROLLOUT_RELATIONS: SerializedRelation[] = [
  ...PILOT_RELATIONS.filter((r) => r.id !== 'ex-r3'),
  { id: 'ex-r9', source: 'ex-residents', target: 'ex-utility', type: 'custom', data: { type: 'collaborates', directionality: 'bidirectional' } },
  { id: 'ex-r10', source: 'ex-council', target: 'ex-utility', type: 'custom', data: { type: 'funds', directionality: 'directed' } },
];

/**
 * Builds the example document. A fresh copy every call, with fresh state ids, so
 * two examples opened side by side cannot collide.
 */
export function buildExampleDocument(): ConstellationDocument {
  const now = new Date().toISOString();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const pilotStateId = `state_${stamp}_pilot`;
  const rolloutStateId = `state_${stamp}_rollout`;

  const pilotState: ConstellationState = {
    id: pilotStateId,
    label: '2024 · Pilot phase',
    description: 'Twelve houses connected. The grid fee dispute is still open.',
    graph: {
      nodes: structuredClone(ACTORS),
      edges: structuredClone(PILOT_RELATIONS),
      groups: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  const rolloutState: ConstellationState = {
    id: rolloutStateId,
    label: '2026 · Full rollout',
    description: 'The dispute is settled and the utility is funded directly.',
    parentStateId: pilotStateId,
    graph: {
      nodes: structuredClone(ACTORS),
      edges: structuredClone(ROLLOUT_RELATIONS),
      groups: [],
    },
    createdAt: now,
    updatedAt: now,
  };

  return {
    metadata: {
      version: SCHEMA_VERSION,
      appName: APP_NAME,
      createdAt: now,
      updatedAt: now,
      lastSavedBy: 'browser',
      title: TITLE,
    },
    nodeTypes: structuredClone(NODE_TYPES),
    edgeTypes: structuredClone(EDGE_TYPES),
    labels: structuredClone(LABELS),
    bibliography: {
      references: [
        {
          id: 'ex-ref-heat-plan',
          type: 'report',
          title: 'Municipal Heat Planning Framework',
          author: [{ literal: 'City Council' }],
          issued: { 'date-parts': [[2024]] },
          publisher: 'City Council',
          note: 'Fictional source, part of the example analysis.',
        },
      ],
      metadata: {
        'ex-ref-heat-plan': {
          id: 'ex-ref-heat-plan',
          createdAt: now,
          updatedAt: now,
        },
      },
      settings: { defaultStyle: 'apa', sortOrder: 'author' },
    },
    tangibles: [],
    timeline: {
      states: {
        [pilotStateId]: pilotState,
        [rolloutStateId]: rolloutState,
      },
      currentStateId: pilotStateId,
      rootStateId: pilotStateId,
    },
  };
}

export const EXAMPLE_TITLE = TITLE;
