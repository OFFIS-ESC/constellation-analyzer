import { useState, useEffect, useCallback, Fragment, type ReactNode } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ConceptFigure from './ConceptFigure';
import { concepts, type ConceptId } from '../../help/concepts';

/**
 * The registry names on-screen controls with _underscores_, the way the
 * surrounding project documentation does. Render those as emphasis rather than
 * printing the underscores. Deliberately not a markdown parser - this is the
 * only piece of formatting the prose is allowed to use.
 */
function withEmphasis(text: string): ReactNode {
  const parts = text.split(/_([^_]+)_/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} className="font-medium not-italic text-gray-900">
        {part}
      </em>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

/**
 * ConceptDialog - Tier 3 of the help model
 *
 * Explains an idea rather than a control. One dialog per concept, never per
 * control: a dialog attached to a single checkbox is the signal that the copy
 * belongs in a FieldHint instead.
 *
 * Content comes entirely from the concept registry, so every dialog has the
 * same five-part shape and the prose stays reviewable in one place.
 */

interface ConceptDialogProps {
  /** Concept to show, or null when closed. */
  conceptId: ConceptId | null;
  onClose: () => void;
}

const ConceptDialog = ({ conceptId, onClose }: ConceptDialogProps) => {
  // Following a "related" link swaps the content without closing the dialog,
  // so the set reads as one body of documentation rather than eight dead ends.
  const [viewing, setViewing] = useState<ConceptId | null>(conceptId);

  useEffect(() => {
    setViewing(conceptId);
  }, [conceptId]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!viewing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [viewing, handleClose]);

  if (!viewing) return null;

  const concept = concepts[viewing];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={handleClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="concept-dialog-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <h2 id="concept-dialog-title" className="text-xl font-bold text-gray-900">
              {concept.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{concept.summary}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <p className="text-sm text-gray-700 leading-relaxed">{withEmphasis(concept.whatItIs)}</p>

          {concept.figure && (
            <ConceptFigure figure={concept.figure} className="border border-gray-200 rounded-md p-3 bg-gray-50" />
          )}

          <div>
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              How it works
            </h3>
            <ul className="space-y-1.5">
              {concept.howItWorks.map((point) => (
                <li key={point} className="text-sm text-gray-700 leading-relaxed flex gap-2">
                  <span className="text-gray-400 select-none">•</span>
                  <span>{withEmphasis(point)}</span>
                </li>
              ))}
            </ul>
          </div>

          {concept.whichToChoose && (
            <div>
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Which to choose
              </h3>
              {concept.whichToChoose.intro && (
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {withEmphasis(concept.whichToChoose.intro)}
                </p>
              )}
              <div className="space-y-2">
                {concept.whichToChoose.options.map((choice) => (
                  <div
                    key={choice.option}
                    className="border border-gray-200 rounded-md px-3 py-2 bg-gray-50"
                  >
                    <div className="text-sm font-semibold text-gray-800">{choice.option}</div>
                    <div className="text-sm text-gray-600 mt-0.5 leading-relaxed">{withEmphasis(choice.when)}</div>
                    {choice.figure && <ConceptFigure figure={choice.figure} className="mt-2" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* The misconception guard - the reason this dialog exists. */}
          <div className="border-l-2 border-amber-500 bg-amber-50 rounded-r px-4 py-3">
            <h3 className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <ReportProblemOutlinedIcon sx={{ fontSize: 14 }} />
              Easy to get wrong
            </h3>
            <p className="text-sm text-amber-900 leading-relaxed">{withEmphasis(concept.guard)}</p>
          </div>

          {concept.related.length > 0 && (
            <div className="pt-1">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Related
              </h3>
              <div className="flex flex-wrap gap-2">
                {concept.related.map((relatedId) => (
                  <button
                    key={relatedId}
                    onClick={() => setViewing(relatedId)}
                    className="px-3 py-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {concepts[relatedId].title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConceptDialog;
