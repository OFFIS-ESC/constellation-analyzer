/**
 * ConceptFigure - the small inline diagrams used inside concept dialogs
 *
 * These earn their place only where a shape is genuinely hard to say in a
 * sentence: how a duplicated state sits relative to its original, which parts
 * of a document are shared, what collapsing a group does to its relations.
 * Anything a sentence handles well stays a sentence.
 *
 * Drawings live here rather than in the registry so the registry stays
 * reviewable as prose. The registry only names a figure.
 */

import type { FigureId } from '../../help/concepts';

const INK = '#374151';
const MUTED = '#9ca3af';
const LINE = '#d1d5db';
const ACCENT = '#3b82f6';
const ACCENT_SOFT = '#eff6ff';
const SURFACE = '#ffffff';

interface ConceptFigureProps {
  figure: FigureId;
  className?: string;
}

/** A rounded state/actor box with a label. */
const Box = ({
  x,
  y,
  w = 62,
  h = 30,
  label,
  highlight = false,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  highlight?: boolean;
}) => (
  <>
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={4}
      fill={highlight ? ACCENT_SOFT : SURFACE}
      stroke={highlight ? ACCENT : LINE}
      strokeWidth={highlight ? 1.5 : 1}
    />
    <text
      x={x + w / 2}
      y={y + h / 2 + 3.5}
      textAnchor="middle"
      fontSize="10"
      fill={INK}
      fontFamily="system-ui, sans-serif"
    >
      {label}
    </text>
  </>
);

/**
 * `maxWidth` caps how large a figure is allowed to draw. The small ones look
 * silly stretched across the dialog; the scope diagram needs every pixel it can
 * get, so it omits the cap and fills the width.
 */
const FIGURES: Record<
  FigureId,
  { title: string; viewBox: string; maxWidth?: number; content: JSX.Element }
> = {
  'state-series': {
    title: 'Three states in a row, each following the one before it',
    viewBox: '0 0 240 52',
    maxWidth: 260,
    content: (
      <>
        <Box x={2} y={11} label="Jan" />
        <path d="M64 26 H 86" stroke={LINE} strokeWidth={1.5} />
        <Box x={88} y={11} label="Jun" />
        <path d="M150 26 H 172" stroke={LINE} strokeWidth={1.5} />
        <Box x={174} y={11} label="Dec" highlight />
      </>
    ),
  },

  'state-alternative': {
    title: 'One state branching into two alternatives that sit side by side',
    viewBox: '0 0 240 82',
    maxWidth: 260,
    content: (
      <>
        <Box x={2} y={26} label="Now" />
        {/* Split: one parent, two siblings */}
        <path d="M64 41 H 78 V 16 H 96" stroke={LINE} strokeWidth={1.5} fill="none" />
        <path d="M78 41 V 66 H 96" stroke={LINE} strokeWidth={1.5} fill="none" />
        <Box x={98} y={1} w={78} label="Strategy A" />
        <Box x={98} y={51} w={78} label="Strategy B" highlight />
      </>
    ),
  },

  'scope-document-vs-state': {
    title:
      'A document holds one shared set of types and labels, plus several states that each hold their own graph',
    // No maxWidth: this one fills the dialog. The state boxes are sized so their
    // "Actors · Relations · Groups" line fits inside the border at this scale.
    viewBox: '0 0 520 142',
    content: (
      <>
        <rect x={1} y={1} width={518} height={140} rx={5} fill="none" stroke={LINE} />
        <text x={12} y={17} fontSize="8.5" fill={MUTED} letterSpacing="0.9" fontFamily="system-ui, sans-serif">
          DOCUMENT
        </text>

        {/* Shared band */}
        <rect x={12} y={25} width={496} height={42} rx={4} fill={ACCENT_SOFT} stroke={ACCENT} />
        <text x={24} y={40} fontSize="8.5" fill={ACCENT} letterSpacing="0.8" fontFamily="system-ui, sans-serif">
          SHARED BY EVERY STATE
        </text>
        <text x={24} y={57} fontSize="10" fill={INK} fontFamily="system-ui, sans-serif">
          Actor types · Relation types · Labels · Bibliography · Tangibles
        </text>

        {/* Per-state band */}
        <text x={12} y={85} fontSize="8.5" fill={MUTED} letterSpacing="0.8" fontFamily="system-ui, sans-serif">
          EACH STATE HAS ITS OWN
        </text>
        {[12, 180, 348].map((x, i) => (
          <g key={x}>
            <rect
              x={x}
              y={93}
              width={160}
              height={40}
              rx={4}
              fill={i === 0 ? ACCENT_SOFT : SURFACE}
              stroke={i === 0 ? ACCENT : LINE}
              strokeWidth={i === 0 ? 1.5 : 1}
            />
            <text x={x + 12} y={109} fontSize="10" fill={INK} fontFamily="system-ui, sans-serif">
              {['State 1', 'State 2', 'State 3'][i]}
            </text>
            <text x={x + 12} y={124} fontSize="9" fill={MUTED} fontFamily="system-ui, sans-serif">
              Actors · Relations · Groups
            </text>
          </g>
        ))}
      </>
    ),
  },

  'direction-one-way': {
    title: 'Two actors joined by an arrow pointing from the first to the second',
    viewBox: '0 0 150 34',
    maxWidth: 170,
    content: (
      <>
        <circle cx={14} cy={17} r={9} fill={SURFACE} stroke={LINE} />
        <path d="M27 17 H 118" stroke={INK} strokeWidth={1.5} markerEnd="url(#cf-arrow)" />
        <circle cx={134} cy={17} r={9} fill={SURFACE} stroke={LINE} />
      </>
    ),
  },

  'direction-two-way': {
    title: 'Two actors joined by a line with an arrow at each end',
    viewBox: '0 0 150 34',
    maxWidth: 170,
    content: (
      <>
        <circle cx={14} cy={17} r={9} fill={SURFACE} stroke={LINE} />
        <path d="M30 17 H 118" stroke={INK} strokeWidth={1.5} markerEnd="url(#cf-arrow)" markerStart="url(#cf-arrow-back)" />
        <circle cx={134} cy={17} r={9} fill={SURFACE} stroke={LINE} />
      </>
    ),
  },

  'direction-mutual': {
    title: 'Two actors joined by a plain line with no arrowheads',
    viewBox: '0 0 150 34',
    maxWidth: 170,
    content: (
      <>
        <circle cx={14} cy={17} r={9} fill={SURFACE} stroke={LINE} />
        <path d="M25 17 H 123" stroke={INK} strokeWidth={1.5} />
        <circle cx={134} cy={17} r={9} fill={SURFACE} stroke={LINE} />
      </>
    ),
  },

  'group-collapsed': {
    title:
      'An expanded group showing three separate relations, and the same group collapsed showing one merged line',
    viewBox: '0 0 320 92',
    maxWidth: 360,
    content: (
      <>
        {/* Expanded */}
        <rect x={2} y={14} width={74} height={58} rx={5} fill="none" stroke={LINE} strokeDasharray="3 2" />
        {[26, 43, 60].map((cy) => (
          <circle key={cy} cx={26} cy={cy} r={6} fill={SURFACE} stroke={LINE} />
        ))}
        {[26, 43, 60].map((cy) => (
          <path key={cy} d={`M33 ${cy} H 104`} stroke={MUTED} strokeWidth={1.2} />
        ))}
        <circle cx={112} cy={43} r={8} fill={SURFACE} stroke={LINE} />
        <text x={39} y={83} fontSize="9" fill={MUTED} fontFamily="system-ui, sans-serif" textAnchor="middle">
          expanded
        </text>

        {/* Transition */}
        <path d="M138 43 H 164" stroke={LINE} strokeWidth={1.5} markerEnd="url(#cf-arrow-muted)" />

        {/* Collapsed */}
        <rect x={180} y={28} width={74} height={30} rx={5} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.5} />
        <text x={217} y={47} fontSize="9.5" fill={INK} textAnchor="middle" fontFamily="system-ui, sans-serif">
          Group
        </text>
        <path d="M256 43 H 300" stroke={MUTED} strokeWidth={2} />
        <circle cx={308} cy={43} r={8} fill={SURFACE} stroke={LINE} />
        <text x={217} y={83} fontSize="9" fill={MUTED} fontFamily="system-ui, sans-serif" textAnchor="middle">
          collapsed — 3 relations, 1 line
        </text>
      </>
    ),
  },
};

const ConceptFigure = ({ figure, className = '' }: ConceptFigureProps) => {
  const spec = FIGURES[figure];
  if (!spec) return null;

  return (
    <div className={`overflow-x-auto ${className}`}>
      <svg
        viewBox={spec.viewBox}
        role="img"
        aria-label={spec.title}
        className="w-full h-auto"
        style={spec.maxWidth ? { maxWidth: spec.maxWidth } : undefined}
      >
        <defs>
          <marker id="cf-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={INK} />
          </marker>
          <marker id="cf-arrow-back" markerWidth="7" markerHeight="7" refX="1" refY="3" orient="auto">
            <path d="M7,0 L1,3 L7,6 Z" fill={INK} />
          </marker>
          <marker id="cf-arrow-muted" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill={MUTED} />
          </marker>
        </defs>
        {spec.content}
      </svg>
    </div>
  );
};

export default ConceptFigure;
