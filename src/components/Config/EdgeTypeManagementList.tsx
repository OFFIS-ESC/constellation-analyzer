import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { EdgeTypeConfig } from '../../types';

/**
 * EdgeTypeManagementList - List view of existing relation types
 *
 * Features:
 * - Scrollable list of relation types
 * - Visual preview of line style and color
 * - Edit, duplicate, and delete actions
 * - Hover states for better UX
 */

interface Props {
  types: EdgeTypeConfig[];
  onEdit: (type: EdgeTypeConfig) => void;
  onDelete: (id: string) => void;
  onDuplicate: (type: EdgeTypeConfig) => void;
}

const EdgeTypeManagementList = ({ types, onEdit, onDelete, onDuplicate }: Props) => {
  const renderStylePreview = (style: 'solid' | 'dashed' | 'dotted', color: string) => {
    const strokeDasharray = {
      solid: '0',
      dashed: '8,4',
      dotted: '2,4',
    }[style];

    return (
      <svg width="100" height="20">
        <line
          x1="0"
          y1="10"
          x2="100"
          y2="10"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={strokeDasharray}
        />
      </svg>
    );
  };

  if (types.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No relation types yet.</p>
        <p className="text-xs mt-1">Add your first relation type above.</p>
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
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 mb-1">
                {type.label}
              </div>
              <div className="flex items-center gap-2">
                {renderStylePreview(type.style || 'solid', type.color)}
                <span className="text-xs text-gray-500">
                  {type.defaultDirectionality === 'directed' && '→'}
                  {type.defaultDirectionality === 'bidirectional' && '↔'}
                  {type.defaultDirectionality === 'undirected' && '—'}
                </span>
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

export default EdgeTypeManagementList;
