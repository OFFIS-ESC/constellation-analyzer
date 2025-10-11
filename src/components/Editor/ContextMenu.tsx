import { useEffect, useRef } from 'react';

/**
 * ContextMenu - Custom right-click menu for graph editor
 *
 * Features:
 * - Positioned at click location
 * - Closes on click outside or escape key
 * - Supports nested menu items with icons
 */

interface MenuAction {
  label: string;
  icon?: React.ReactNode;
  color?: string;
  onClick: () => void;
}

interface MenuSection {
  title?: string;
  actions: MenuAction[];
}

interface Props {
  x: number;
  y: number;
  sections: MenuSection[];
  onClose: () => void;
}

const ContextMenu = ({ x, y, sections, onClose }: Props) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Delay adding listeners to avoid immediate close from the triggering click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to prevent overflow
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      // Check right edge overflow
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      // Check bottom edge overflow
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      // Check left edge overflow
      if (adjustedX < 10) {
        adjustedX = 10;
      }

      // Check top edge overflow
      if (adjustedY < 10) {
        adjustedY = 10;
      }

      // Apply adjusted position
      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${adjustedX}px`;
        menuRef.current.style.top = `${adjustedY}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx}>
          {section.title && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              {section.title}
            </div>
          )}
          {section.actions.map((action, actionIdx) => (
            <button
              key={actionIdx}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors"
            >
              {action.color && (
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: action.color }}
                />
              )}
              {action.icon && (
                <span className="text-gray-600 flex-shrink-0 flex items-center">{action.icon}</span>
              )}
              <span className="flex-1">{action.label}</span>
            </button>
          ))}
          {sectionIdx < sections.length - 1 && (
            <div className="h-px bg-gray-200 my-1" />
          )}
        </div>
      ))}
    </div>
  );
};

export default ContextMenu;
