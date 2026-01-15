import React, { useEffect, useRef } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useTimelineStore } from '../../stores/timelineStore';

/**
 * PresentationTimelineOverlay Component
 *
 * Floating timeline control for navigating between constellation states
 * in presentation mode. Positioned like ReactFlow controls at the bottom center.
 */

const PresentationTimelineOverlay: React.FC = () => {
  const { activeDocumentId } = useWorkspaceStore();
  const { timelines, getAllStates, switchToState } = useTimelineStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const timeline = activeDocumentId ? timelines.get(activeDocumentId) : null;
  const states = getAllStates();
  const currentStateId = timeline?.currentStateId;
  const currentIndex = states.findIndex(s => s.id === currentStateId);

  // Auto-scroll to current state on mount or when current state changes
  useEffect(() => {
    if (!scrollContainerRef.current || !currentStateId) return;

    const currentButton = scrollContainerRef.current.querySelector(
      `[data-state-id="${currentStateId}"]`
    );
    if (currentButton) {
      currentButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentStateId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      switchToState(states[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < states.length - 1) {
      switchToState(states[currentIndex + 1].id);
    }
  };

  // Don't show anything if only one state (no navigation needed)
  if (states.length <= 1) return null;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Timeline Navigation */}
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 flex items-stretch">
          {/* Previous Button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`px-3 py-2 rounded-l-lg touch-manipulation transition-colors flex items-center justify-center ${
              currentIndex === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Previous State"
          >
            <ChevronLeftIcon sx={{ fontSize: 28 }} />
          </button>

          {/* State List - Horizontal Scrollable */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2 overflow-x-auto py-2 px-3 max-w-screen-md"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {states.map((state) => (
              <button
                key={state.id}
                data-state-id={state.id}
                onClick={() => switchToState(state.id)}
                className={`
                  px-6 py-3 rounded-md whitespace-nowrap
                  touch-manipulation cursor-pointer
                  transition-all duration-200 text-sm
                  flex items-center justify-center
                  ${
                    state.id === currentStateId
                      ? 'bg-blue-500 text-white font-semibold shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                aria-label={`Navigate to ${state.label}`}
                aria-current={state.id === currentStateId ? 'true' : undefined}
              >
                {state.label}
              </button>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentIndex === states.length - 1}
            className={`px-3 py-2 rounded-r-lg touch-manipulation transition-colors flex items-center justify-center ${
              currentIndex === states.length - 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Next State"
          >
            <ChevronRightIcon sx={{ fontSize: 28 }} />
          </button>
      </div>
    </div>
  );
};

export default PresentationTimelineOverlay;
