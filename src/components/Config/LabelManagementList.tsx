import DeleteIcon from '@mui/icons-material/Delete';
import type { LabelConfig } from '../../types';

/**
 * LabelManagementList - Compact list view for managing existing labels
 *
 * Features:
 * - White background cards with click to edit
 * - Color badge + name + scope + usage count
 * - Delete button
 * - Keyboard accessible
 * - ARIA compliant
 */

interface Props {
  labels: LabelConfig[];
  usageCounts: Record<string, { actors: number; relations: number }>;
  onEdit: (label: LabelConfig) => void;
  onDelete: (id: string) => void;
}

const LabelManagementList = ({ labels, usageCounts, onEdit, onDelete }: Props) => {
  if (labels.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No labels yet.</p>
        <p className="text-xs mt-1">Add your first label above.</p>
      </div>
    );
  }

  const getScopeLabel = (appliesTo: string) => {
    switch (appliesTo) {
      case 'actors':
        return 'Actors';
      case 'relations':
        return 'Relations';
      case 'both':
        return 'Both';
      default:
        return 'Unknown';
    }
  };

  const getUsageText = (labelId: string) => {
    const usage = usageCounts[labelId] || { actors: 0, relations: 0 };
    const total = usage.actors + usage.relations;

    if (total === 0) return 'Not used';

    const parts = [];
    if (usage.actors > 0) parts.push(`${usage.actors} actor${usage.actors !== 1 ? 's' : ''}`);
    if (usage.relations > 0) parts.push(`${usage.relations} relation${usage.relations !== 1 ? 's' : ''}`);

    return parts.join(', ');
  };

  return (
    <div className="space-y-2">
      {labels.map((label) => (
        <div
          key={label.id}
          className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => onEdit(label)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit(label);
            }
          }}
          aria-label={`Edit ${label.name}`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Label Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Color Badge */}
              <div
                className="w-10 h-10 rounded flex-shrink-0"
                style={{ backgroundColor: label.color }}
                aria-hidden="true"
              />

              {/* Name, Scope & Usage */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {label.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">
                    {getScopeLabel(label.appliesTo)}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">
                    {getUsageText(label.id)}
                  </span>
                </div>
                {label.description && (
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {label.description}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(label.id);
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete ${label.name}`}
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LabelManagementList;
