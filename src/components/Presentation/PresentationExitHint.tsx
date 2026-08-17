/**
 * PresentationExitHint - Persistent "press Esc" affordance for presentation mode
 *
 * Presentation mode hides every panel, including anything that could advertise
 * the way out. A toast on entry only helps someone who was watching the screen
 * in the first few seconds; a presenter who takes over an already-running
 * session never sees it. This stays put instead, dim enough to ignore during a
 * presentation and legible whenever someone looks for it.
 */

const PresentationExitHint = () => (
  <div className="absolute top-4 right-4 z-50 pointer-events-none select-none">
    <span className="px-3 py-1.5 rounded-md bg-black/30 text-white text-xs backdrop-blur-sm opacity-50">
      <kbd className="font-sans font-semibold">Esc</kbd> to exit presentation mode
    </span>
  </div>
);

export default PresentationExitHint;
