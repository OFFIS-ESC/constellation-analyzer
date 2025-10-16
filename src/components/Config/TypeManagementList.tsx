import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { NodeTypeConfig } from '../../types';

/**
 * TypeManagementList - Compact list view for managing existing actor types
 *
 * Features:
 * - White background cards with click to edit
 * - Color badge + name + description preview
 * - Always visible duplicate and delete buttons
 * - Keyboard accessible
 * - ARIA compliant
 */

interface Props {
  types: NodeTypeConfig[];
  onEdit: (type: NodeTypeConfig) => void;
  onDelete: (id: string) => void;
  onDuplicate: (type: NodeTypeConfig) => void;
}

const TypeManagementList = ({ types, onEdit, onDelete, onDuplicate }: Props) => {

  if (types.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No actor types yet.</p>
        <p className="text-xs mt-1">Add your first actor type above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {types.map((type) => (
        <div
          key={type.id}
          className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => onEdit(type)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdit(type);
            }
          }}
          aria-label={`Edit ${type.label}`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Type Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Color Badge */}
              <div
                className="w-10 h-10 rounded flex-shrink-0"
                style={{ backgroundColor: type.color }}
                aria-hidden="true"
              />

              {/* Name & Description */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {type.label}
                </div>
                {type.description && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {type.description}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(type);
                }}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                aria-label={`Duplicate ${type.label}`}
                title="Duplicate"
              >
                <ContentCopyIcon fontSize="small" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(type.id);
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete ${type.label}`}
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

export default TypeManagementList;
