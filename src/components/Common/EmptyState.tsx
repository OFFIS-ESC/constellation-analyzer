import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

/**
 * EmptyState - Tier 0 of the help model
 *
 * The first thing a newcomer sees, so it answers the question they actually
 * have: what is this for? It used to answer a question nobody had asked, with
 * three cards listing keyboard shortcuts.
 *
 * Four steps, then two ways in. The example is the strongest teacher here — a
 * populated graph explains actors, relations, types and states faster than this
 * screen can — so it gets equal billing with starting from nothing.
 */

interface EmptyStateProps {
  onNewDocument: () => void;
  onOpenDocumentManager: () => void;
  onOpenExample?: () => void;
}

const STEPS: Array<{ n: string; title: string; body: string }> = [
  {
    n: '1',
    title: 'Add the actors',
    body: 'Everyone and everything that matters — people, organizations, systems, the ideas they argue about.',
  },
  {
    n: '2',
    title: 'Draw the relations',
    body: 'Who funds, opposes, depends on or works with whom. Say whether each link runs one way or both.',
  },
  {
    n: '3',
    title: 'Give them types and labels',
    body: 'A type decides how an actor looks. Labels are tags that cut across types, and both let you filter.',
  },
  {
    n: '4',
    title: 'Add states, if it changes',
    body: 'A state is a snapshot of the whole graph. Use them for points in time, or for competing scenarios.',
  },
];

const EmptyState: React.FC<EmptyStateProps> = ({
  onNewDocument,
  onOpenDocumentManager,
  onOpenExample,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto px-8 py-14">
        {/* What this is */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Map who shapes what
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            A constellation analysis lays out the actors in a situation and the
            relations between them, so the pattern becomes something you can look at
            and argue with.
          </p>
        </div>

        {/* The method, in four steps */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-white rounded-lg p-5 shadow-sm flex gap-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm flex items-center justify-center">
                {step.n}
              </div>
              <div>
                <div className="font-semibold text-gray-800 mb-1">{step.title}</div>
                <div className="text-sm text-gray-600 leading-relaxed">{step.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Ways in */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          {onOpenExample && (
            <button
              onClick={onOpenExample}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <AutoAwesomeIcon />
              Open an example analysis
            </button>
          )}
          <button
            onClick={onNewDocument}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <AddIcon />
            Start from nothing
          </button>
          <button
            onClick={onOpenDocumentManager}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <FolderOpenIcon />
            Open a saved one
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          The example is a normal document — edit it, break it, delete it.
          Everything else is explained under <span className="font-medium text-gray-700">Help → How this works</span>.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
