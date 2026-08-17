import { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ConceptDialog from './ConceptDialog';
import { concepts, conceptOrder, type ConceptId } from '../../help/concepts';

/**
 * ConceptIndex - the front door to the concept dialogs
 *
 * The "?" buttons are contextual, which makes them easy to miss if you are not
 * already looking at the right panel. This lists the whole set in one place so
 * the documentation can be browsed rather than stumbled upon.
 */

interface ConceptIndexProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConceptIndex = ({ isOpen, onClose }: ConceptIndexProps) => {
  const [selected, setSelected] = useState<ConceptId | null>(null);

  useEffect(() => {
    if (!isOpen) setSelected(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // While a concept dialog is open on top, let it handle Escape first.
      if (e.key === 'Escape' && !selected) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selected, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="concept-index-title"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MenuBookIcon sx={{ fontSize: 26 }} />
              <h2 id="concept-index-title" className="text-xl font-bold">
                How this works
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto p-4 space-y-2">
            {conceptOrder.map((id) => {
              const concept = concepts[id];
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className="w-full text-left px-4 py-3 rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="text-sm font-semibold text-gray-900">{concept.title}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{concept.summary}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ConceptDialog conceptId={selected} onClose={() => setSelected(null)} />
    </>
  );
};

export default ConceptIndex;
