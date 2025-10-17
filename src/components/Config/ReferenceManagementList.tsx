import { useBibliographyWithHistory } from '../../hooks/useBibliographyWithHistory';
import { formatShortCitation } from '../../utils/bibliography/formatting';
import { useConfirm } from '../../hooks/useConfirm';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { BibliographyReference } from '../../types/bibliography';

interface ReferenceManagementListProps {
  references: BibliographyReference[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ReferenceManagementList = ({ references, onEdit, onDelete }: ReferenceManagementListProps) => {
  const { getCitationCount } = useBibliographyWithHistory();
  const { confirm } = useConfirm();

  const handleDelete = async (ref: BibliographyReference) => {
    const citationCount = getCitationCount(ref.id);
    const totalCitations = citationCount.nodes + citationCount.edges;

    const message =
      totalCitations > 0
        ? `Delete "${ref.title}"? This reference is cited ${totalCitations} time${totalCitations > 1 ? 's' : ''} (${citationCount.nodes} actors, ${citationCount.edges} relations). Citations will be removed.`
        : `Delete "${ref.title}"?`;

    const confirmed = await confirm({
      title: 'Delete Reference',
      message,
      severity: totalCitations > 0 ? 'warning' : 'info',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      onDelete(ref.id);
    }
  };

  if (references.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No references yet.</p>
        <p className="text-xs mt-1">Add your first reference using the form on the left.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        All References ({references.length})
      </h3>

      {references.map((ref) => {
        const shortCitation = formatShortCitation(ref);
        const citationCount = getCitationCount(ref.id);
        const totalCitations = citationCount.nodes + citationCount.edges;

        return (
          <div
            key={ref.id}
            className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex-1 cursor-pointer min-w-0"
                onClick={() => onEdit(ref.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit(ref.id);
                  }
                }}
              >
                <div className="font-medium text-sm text-gray-900 line-clamp-2">
                  {ref.title || 'Untitled'}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {shortCitation}
                </div>

                {/* Reference Type Badge */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {ref.type.replace(/-/g, ' ')}
                  </span>

                  {/* Citation Count */}
                  {totalCitations > 0 && (
                    <span className="text-xs text-gray-500">
                      {totalCitations} citation{totalCitations > 1 ? 's' : ''}
                    </span>
                  )}

                  {/* DOI indicator */}
                  {ref.DOI && (
                    <span className="text-xs text-blue-600">
                      DOI
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(ref.id)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Edit reference"
                  title="Edit reference"
                >
                  <EditIcon className="text-base" />
                </button>
                <button
                  onClick={() => handleDelete(ref)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Delete reference"
                  title="Delete reference"
                >
                  <DeleteIcon className="text-base" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReferenceManagementList;
