import { useToastStore } from '../../stores/toastStore';
import { usePanelStore } from '../../stores/panelStore';
import Toast from './Toast';

/**
 * ToastContainer - Container for toast notifications
 *
 * Features:
 * - Positioned in top-right corner (below header/menu)
 * - Intelligently avoids overlapping with right panel
 * - Stacks toasts vertically
 * - Max 3 toasts visible (enforced by store)
 * - Slide-in animation from right
 *
 * Positioning Strategy:
 * - When right panel is hidden/collapsed: 16px from right edge
 * - When right panel is visible: positioned to the left of the panel with 16px gap
 */
const ToastContainer = () => {
  const { toasts, hideToast } = useToastStore();
  const { rightPanelVisible, rightPanelCollapsed, rightPanelWidth } = usePanelStore();

  // Calculate right offset to avoid right panel
  // Header (88px) + MenuBar (40px) + Tabs (~48px) + Toolbar (~56px) = ~232px from top
  const topOffset = 240; // px from top (safely below UI chrome)

  // Right offset calculation:
  // - If right panel is visible and expanded: offset by panel width + 16px gap
  // - If right panel is collapsed: offset by collapsed width (40px) + 16px gap
  // - If right panel is hidden: just 16px from edge
  const rightOffset = rightPanelVisible
    ? rightPanelCollapsed
      ? 40 + 16 // Collapsed width + gap
      : rightPanelWidth + 16 // Panel width + gap
    : 16; // Just gap from edge

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-[9999] pointer-events-none transition-all duration-300"
      style={{
        top: `${topOffset}px`,
        right: `${rightOffset}px`,
      }}
    >
      <div className="flex flex-col items-end pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={hideToast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
