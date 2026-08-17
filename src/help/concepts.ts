/**
 * Concept registry — every Tier 3 explanation in the application
 *
 * All explanatory prose lives here rather than in JSX, for three reasons:
 * it can be reviewed as writing instead of hunted through components, it can be
 * translated as a unit, and it enforces "one fact, one home" — a concept has
 * exactly one canonical explanation, which tooltips and hints point at rather
 * than restate.
 *
 * Every concept follows the same five-part shape so readers learn to trust the
 * format:
 *
 *   whatItIs      what the thing is, in plain language, no graph theory
 *   howItWorks    the mechanics
 *   whichToChoose the decision the user is actually facing (optional — some
 *                 concepts explain a thing rather than a fork)
 *   guard         the misconception this dialog exists to defuse (required)
 *   related       cross-links, so the set is navigable
 *
 * `guard` is deliberately non-optional: a concept with no misconception to
 * defuse does not need a dialog, and should be a FieldHint instead.
 *
 * House style: short declarative sentences, one idea each. Address the reader
 * as "you". Name buttons and panels exactly as they appear on screen. State
 * failure modes bluntly rather than softening them — someone reading this is
 * usually here because something already surprised them.
 */

export type ConceptId =
  | 'actors-and-types'
  | 'relations-and-direction'
  | 'labels-vs-types'
  | 'groups'
  | 'timeline-states'
  | 'reading-analysis'
  | 'bibliography-and-citations'
  | 'saving-exporting'
  | 'tangibles-presentation';

/**
 * Inline diagrams available to concepts. Drawn in ConceptFigure; named here so
 * the registry stays prose and the drawing code stays out of it.
 *
 * Only add one where a shape is genuinely hard to say in a sentence. Most
 * explanations need no picture, and a decorative diagram costs the reader time.
 */
export type FigureId =
  | 'state-alternative'
  | 'state-series'
  | 'scope-document-vs-state'
  | 'direction-one-way'
  | 'direction-two-way'
  | 'direction-mutual'
  | 'group-collapsed';

/** A labelled comparison row under "Which to choose". */
export interface ConceptChoice {
  option: string;
  when: string;
  figure?: FigureId;
}

export interface Concept {
  id: ConceptId;
  title: string;
  /** One line, used in the Help → How this works index. */
  summary: string;
  whatItIs: string;
  /** Shown directly under `whatItIs`, when the whole concept has a shape. */
  figure?: FigureId;
  howItWorks: string[];
  whichToChoose?: {
    intro?: string;
    options: ConceptChoice[];
  };
  guard: string;
  related: ConceptId[];
}

export const concepts: Record<ConceptId, Concept> = {
  'actors-and-types': {
    id: 'actors-and-types',
    title: 'Actors and actor types',
    summary: 'One thing in your analysis, and the template that styles it.',
    whatItIs:
      'An actor is one thing in your analysis. One person, one organization, one system. An actor type is a template that decides how actors of that kind look: their color, shape and icon. You will usually end up with a lot of actors and only a handful of types.',
    howItWorks: [
      'Click a type in the Tools panel to drop a new actor onto the canvas.',
      'Every actor has exactly one type. You can change it any time from the Actor Properties panel.',
      'Types belong to the document, not to the actor. Every state in the timeline shares the same set.',
      'Deleting a type does not delete the actors using it. They just lose their styling, so give them a new type afterwards.',
    ],
    whichToChoose: {
      intro: 'When you want to record a distinction, work out whether it is a type or a label.',
      options: [
        {
          option: 'Make it a type',
          when: 'Every actor has exactly one, and it should change how the actor looks. Person against organization.',
        },
        {
          option: 'Make it a label',
          when: 'An actor can have several at once, or none, and it cuts across types. External, under review, key informant.',
        },
      ],
    },
    guard:
      'The pencil next to Actor Type does not edit this actor. It edits the type, which restyles every actor using it, in every state of the document. Hover it first and it tells you how many that is.',
    related: ['labels-vs-types', 'groups', 'timeline-states'],
  },

  'relations-and-direction': {
    id: 'relations-and-direction',
    title: 'Relations and direction',
    summary: 'Connecting actors, and what one-way, two-way and mutual actually claim.',
    whatItIs:
      'A relation is a link between two actors. Like an actor it has a type, which sets its color and line style. It also has a direction, which says how influence or action flows between the two ends.',
    howItWorks: [
      'Drag from one of the dots on an actor’s edge onto another actor to connect them.',
      'New relations take whatever is selected under _New relations will be_ in the Tools panel. Change it there before you draw, or change any relation afterwards.',
      'You can run several relations between the same two actors. They fan out so each one stays clickable.',
      'Use the reverse button in Relation Properties to flip a direction without redrawing anything.',
    ],
    whichToChoose: {
      intro: 'Direction is a claim about the world, not a drawing style. Pick it by what you are asserting.',
      options: [
        {
          option: 'One-way',
          when: 'The first actor acts on the second and not the other way round. Reports to, funds, supplies.',
          figure: 'direction-one-way',
        },
        {
          option: 'Two-way',
          when: 'Both act on each other, and you want that visible. They negotiate, they trade.',
          figure: 'direction-two-way',
        },
        {
          option: 'Mutual',
          when: 'Direction does not mean anything for this kind of link. They are siblings, they co-occur, they sit on the same committee.',
          figure: 'direction-mutual',
        },
      ],
    },
    guard:
      'Mutual means direction does not apply. It does not mean you have not worked it out yet. If you are unsure, pick your best guess and say so in the relation’s label. Otherwise the open question quietly disappears, and in three months you will read it as settled.',
    related: ['actors-and-types', 'reading-analysis'],
  },

  'labels-vs-types': {
    id: 'labels-vs-types',
    title: 'Labels against types',
    summary: 'Both are colored, both filter, and they do different jobs.',
    whatItIs:
      'Types and labels look alike and behave nothing like each other. A type is structural. Every actor has exactly one, and it decides how the actor is drawn. A label is a tag. An actor can carry any number of them, or none, and labels cut straight across types.',
    howItWorks: [
      'Attach labels from the Actor or Relation Properties panel. Attach as many as you like.',
      'Each label says what it can go on — actors, relations, or both — so the pickers only offer the ones that make sense there.',
      'Labels never change how anything is drawn. They show up as small badges, and they drive filtering.',
      'Like types, labels belong to the document, and every state shares them.',
    ],
    whichToChoose: {
      options: [
        {
          option: 'Type',
          when: 'Exactly one per actor, and it should change how the actor looks.',
        },
        {
          option: 'Label',
          when: 'Zero, one or many per actor, and it cuts across the type distinction.',
        },
      ],
    },
    guard:
      'Both are colored and both turn up in the filter panel, which makes them look interchangeable. They are not. Changing an actor’s type restyles that one actor. Changing the type itself restyles everything using it. A label does neither.',
    related: ['actors-and-types', 'tangibles-presentation'],
  },

  groups: {
    id: 'groups',
    title: 'Groups',
    summary: 'Clustering actors, and what collapsing one does to their relations.',
    whatItIs:
      'A group gathers several actors into a named, colored container. A department, a coalition, a site. Groups organize the canvas. They do not change the actors inside them.',
    figure: 'group-collapsed',
    howItWorks: [
      'Select two or more actors, right-click, and choose _Create Group_.',
      'Drag a group and everything inside it moves together.',
      'Collapse a group and its members disappear behind a single box. Every relation crossing the boundary is drawn as one line.',
      'Groups belong to the state you are in, like actors and relations. They are not shared across states.',
    ],
    whichToChoose: {
      intro: 'There are two ways to take a group apart, and they are not the same.',
      options: [
        {
          option: 'Ungroup — keeps the actors',
          when: 'The container goes, the actors stay. They return to the canvas untouched.',
        },
        {
          option: 'Delete group and everything in it',
          when: 'The actors go too, along with every relation attached to them. Undo is the only way back.',
        },
      ],
    },
    guard:
      'Collapsing a group merges its relations into one line, which looks exactly like relations being deleted. They are all still there. Expand the group again and you can see and edit them.',
    related: ['actors-and-types', 'timeline-states'],
  },

  'timeline-states': {
    id: 'timeline-states',
    title: 'Timeline and states',
    summary: 'How one document holds several versions of the same constellation.',
    whatItIs:
      'A state is a complete snapshot of your graph. Every actor, relation and group in it. One document can hold many states, and that is how a single analysis carries several versions of the same constellation: how it changed over time, or how it would look under a different scenario.',
    figure: 'scope-document-vs-state',
    howItWorks: [
      'The timeline along the bottom shows every state. Click one to switch the canvas to it.',
      'States branch, so one starting point can lead to several alternatives.',
      'Your work is kept automatically when you switch away. You do not have to do anything first.',
      'Actors, relations and groups belong to one state each. Actor types, relation types, labels, the bibliography and tangibles are shared by all of them.',
    ],
    whichToChoose: {
      intro: 'Duplicating a state asks you where the copy should sit.',
      options: [
        {
          option: 'As an alternative to this state',
          when: 'The copy becomes a sibling. A different scenario growing from the same starting point.',
          figure: 'state-alternative',
        },
        {
          option: 'As the next step after this state',
          when: 'The copy follows on. The same constellation, later.',
          figure: 'state-series',
        },
      ],
    },
    guard:
      'Switching states swaps out everything on the canvas at once, and it looks exactly like losing your work. Nothing is lost. The state you left is saved and untouched. The trap in the other direction is quieter: because types, labels and the bibliography are shared, editing them changes every state at once, including the ones you cannot see.',
    related: ['actors-and-types', 'saving-exporting', 'tangibles-presentation'],
  },

  'reading-analysis': {
    id: 'reading-analysis',
    title: 'Reading the graph analysis',
    summary: 'What each measure means, and how far to trust it.',
    whatItIs:
      'With nothing selected, the right-hand panel describes the shape of your constellation. How many actors and relations it holds, how densely they connect, which actors sit in the middle of everything. These are descriptions, not verdicts. They tell you where to look. They do not tell you what to conclude.',
    howItWorks: [
      'How connected — of every link that could exist between your actors, the share that does. Low numbers are normal. A real constellation is not supposed to be fully wired.',
      'Connections per actor — the average. It is most useful as a baseline: compare individual actors against it to find the unusually central and the unusually isolated.',
      'Unconnected actors — actors you have not linked to anything.',
      'Separate islands — clusters with no path between them. More than one means your constellation is split into parts that do not reach each other.',
      'Most connected actors — ranked by how many relations each one has.',
    ],
    guard:
      'The most connected actor is not automatically the most important one. Counting relations measures how busy an actor is in your map, and your map reflects your own mapping decisions at least as much as it reflects the world. Treat a high count as a question worth asking, not an answer. It runs the other way too: an actor with no relations is often the finding itself, not a gap you forgot to fill in.',
    related: ['relations-and-direction', 'timeline-states'],
  },

  'bibliography-and-citations': {
    id: 'bibliography-and-citations',
    title: 'Bibliography and citations',
    summary: 'Keeping your sources with the analysis, and attaching them to what they support.',
    whatItIs:
      'The bibliography is the list of sources behind this analysis. Once a reference is in it, you can attach it to any actor or relation, so a claim on the canvas points at where it came from. References belong to the document, and every state shares them.',
    howItWorks: [
      'Open it from Edit, then _Manage Bibliography_.',
      'Paste a DOI, a URL, an ISBN, a PubMed ID, a Wikidata ID, or a whole BibTeX or RIS entry. The details are looked up and filled in for you.',
      'Attach references to an actor or relation under Citations in its properties panel. One actor can cite several sources.',
      'Choose the citation style — APA, Chicago, MLA, Harvard and a few others — and every reference is formatted in it.',
      'You can import a .bib or .ris file, and export the bibliography as BibTeX, RIS, JSON, or a finished reference list.',
    ],
    whichToChoose: {
      intro: 'There are two ways to get a reference in, and pasting is almost always the faster one.',
      options: [
        {
          option: 'Paste an identifier',
          when: 'You have a DOI, a URL, an ISBN or a BibTeX entry. Paste it and the fields fill themselves in. Looking up a DOI or a URL needs an internet connection; everything else works offline.',
        },
        {
          option: 'Type it in by hand',
          when: 'There is nothing to paste. An interview, an internal document, a conversation. Pick the reference type first, because it decides which fields you get.',
        },
      ],
    },
    guard:
      'Deleting a reference does not only remove it from the list. It is also stripped from every actor and relation that cited it, in every state. That leaves nothing pointing at a source which no longer exists, which is usually what you want — but it does quietly edit parts of your graph you are not looking at.',
    related: ['saving-exporting', 'actors-and-types'],
  },

  'saving-exporting': {
    id: 'saving-exporting',
    title: 'Saving, exporting and where your work lives',
    summary: 'There is no save button, and what that means for backups.',
    whatItIs:
      'Your work saves itself. About a second after you stop typing, the document is written into this browser, and the orange dot on the tab is that write happening. There is no save button because there is nothing to save by hand.',
    howItWorks: [
      'Everything lives in this browser, on this computer. Nothing is sent anywhere.',
      'Export Document writes one document, with all its states, to a .json file you can import again later.',
      'Export All as ZIP writes every document as its own file inside one archive.',
      'Export Workspace writes every document plus your tabs and settings as a single file.',
      'PNG and SVG give you a picture of the current state. Good for a report. You cannot import them back.',
    ],
    whichToChoose: {
      intro: 'Which export you want depends on what you are going to do with it.',
      options: [
        { option: 'Export Document', when: 'Sending one analysis to someone, or backing it up on its own.' },
        { option: 'Export Workspace', when: 'Moving everything to another computer, or taking a full backup.' },
        { option: 'PNG or SVG', when: 'Putting the constellation into a slide, a paper or a report.' },
      ],
    },
    guard:
      'Because your work lives only in this browser, clearing your browsing data deletes it, and it will not be there on your other computer. Saving automatically stops you losing work while you edit. It is not a backup. If the analysis matters, export it.',
    related: ['timeline-states', 'bibliography-and-citations'],
  },

  'tangibles-presentation': {
    id: 'tangibles-presentation',
    title: 'Tangibles and presentation mode',
    summary: 'Driving the graph with physical tokens during a workshop.',
    whatItIs:
      'Presentation mode fills the screen with the constellation and hides every panel, for showing an analysis to a room. Tangibles go further. Physical tokens on a table can filter the graph or switch between states, so a workshop can steer the analysis by hand instead of by mouse.',
    howItWorks: [
      'Tangibles need hardware: a surface that reports TUIO, and a TUIO server this application can reach over WebSocket. Without both, nothing happens.',
      'Set the connection up under View, then _TUIO Connection Settings_.',
      'Each tangible is matched to a physical token by its hardware ID. Open the tangible settings with the table running and the IDs it detects are offered to you.',
      'A filter tangible shows only the matching actors and relations while its token is on the table. A state tangible switches the graph to a state you picked.',
      'Press Esc to leave presentation mode.',
    ],
    whichToChoose: {
      intro: 'A filter tangible can carry several conditions at once, and how they combine changes what you see.',
      options: [
        {
          option: 'Show a wider slice',
          when: 'Anything matching any one of the conditions appears. Use it to bring several categories into view together.',
        },
        {
          option: 'Show a narrower slice',
          when: 'Only things matching every condition appear. Use it to isolate one precise intersection.',
        },
      ],
    },
    guard:
      'Tangibles do nothing in the editor. They only act in presentation mode, with a TUIO table connected. So if you set one up and nothing changes on screen, that is expected, not a fault.',
    related: ['timeline-states', 'labels-vs-types'],
  },
};

/** Stable display order for the Help → How this works index. */
export const conceptOrder: ConceptId[] = [
  'actors-and-types',
  'relations-and-direction',
  'labels-vs-types',
  'groups',
  'timeline-states',
  'reading-analysis',
  'bibliography-and-citations',
  'saving-exporting',
  'tangibles-presentation',
];

export function getConcept(id: ConceptId): Concept {
  return concepts[id];
}
