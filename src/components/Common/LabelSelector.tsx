import { useMemo } from 'react';
import { useGraphStore } from '../../stores/graphStore';
import LabelBadge from './LabelBadge';

/**
 * LabelSelector - Multi-select dropdown for assigning labels to actors or relations
 *
 * Features:
 * - Shows available labels filtered by scope (actors/relations/both)
 * - Displays selected labels as badges with remove button
 * - Checkbox interface for adding/removing labels
 * - Empty state when no labels are configured
 */

interface Props {
  value: string[]; // Array of selected label IDs
  onChange: (labelIds: string[]) => void;
  scope: 'actors' | 'relations'; // Filter labels by scope
}

const LabelSelector = ({ value, onChange, scope }: Props) => {
  const labels = useGraphStore((state) => state.labels);

  // Filter labels by scope
  const availableLabels = useMemo(() => {
    return labels.filter(
      (label) => label.appliesTo === scope || label.appliesTo === 'both'
    );
  }, [labels, scope]);

  const selectedLabels = useMemo(() => {
    return availableLabels.filter((label) => value.includes(label.id));
  }, [availableLabels, value]);

  const handleToggle = (labelId: string) => {
    if (value.includes(labelId)) {
      onChange(value.filter((id) => id !== labelId));
    } else {
      onChange([...value, labelId]);
    }
  };

  const handleRemove = (labelId: string) => {
    onChange(value.filter((id) => id !== labelId));
  };

  if (availableLabels.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No labels configured. Configure labels in Edit → Configure Labels.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Selected labels display */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded border border-gray-200">
          {selectedLabels.map((label) => (
            <div key={label.id} className="flex items-center gap-1">
              <LabelBadge name={label.name} color={label.color} size="sm" />
              <button
                onClick={() => handleRemove(label.id)}
                className="text-gray-500 hover:text-red-600 text-xs font-bold leading-none"
                title={`Remove ${label.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Label selection checkboxes */}
      <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
        {availableLabels.length === 0 ? (
          <div className="p-3 text-sm text-gray-500 italic">
            No {scope} labels available
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {availableLabels.map((label) => (
              <label
                key={label.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(label.id)}
                  onChange={() => handleToggle(label.id)}
                  className="w-4 h-4"
                />
                <LabelBadge
                  name={label.name}
                  color={label.color}
                  size="sm"
                />
                {label.description && (
                  <span className="text-xs text-gray-500 ml-auto">
                    {label.description}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelSelector;
