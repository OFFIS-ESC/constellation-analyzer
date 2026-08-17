import LayersIcon from '@mui/icons-material/Layers';
import FilterCenterFocusIcon from '@mui/icons-material/FilterCenterFocus';

/**
 * ScopeBadge - makes the document/state boundary visible
 *
 * The single most consequential thing this application never told anyone:
 * some parts of a document are shared by every timeline state, and some belong
 * only to the state you are standing in. Actor types, relation types, labels,
 * the bibliography and tangibles are global; actors, relations and groups are
 * per-state.
 *
 * Every configuration surface that edits global data carries this badge, so a
 * user editing one actor's type can see that the change reaches further than
 * the thing they clicked.
 */

export type EditScope = 'document' | 'state';

const SCOPE_COPY: Record<EditScope, { text: string; classes: string }> = {
  document: {
    text: 'Shared by every state in this document',
    classes: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  state: {
    text: 'Applies to the current state only',
    classes: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

interface ScopeBadgeProps {
  scope: EditScope;
  className?: string;
}

const ScopeBadge = ({ scope, className = '' }: ScopeBadgeProps) => {
  const { text, classes } = SCOPE_COPY[scope];
  const Icon = scope === 'document' ? LayersIcon : FilterCenterFocusIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${classes} ${className}`}
    >
      <Icon sx={{ fontSize: 13 }} />
      {text}
    </span>
  );
};

export default ScopeBadge;
