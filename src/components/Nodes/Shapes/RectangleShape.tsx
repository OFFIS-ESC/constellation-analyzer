import { ReactNode } from 'react';

interface RectangleShapeProps {
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * RectangleShape - Standard rectangular node shape
 *
 * This is the default shape, maintaining the current node appearance.
 * Handles are positioned at the midpoints of each side (top, right, bottom, left).
 */
const RectangleShape = ({
  color,
  borderColor,
  textColor,
  selected = false,
  isHighlighted = false,
  children,
  className = '',
}: RectangleShapeProps) => {
  // Build shadow style
  const shadowStyle = selected
    ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}40`
    : isHighlighted
      ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}80, 0 0 12px ${color}60`
      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  return (
    <div
      className={`px-4 py-3 rounded-lg min-w-[120px] transition-shadow duration-200 ${className}`}
      style={{
        backgroundColor: color,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        boxShadow: shadowStyle,
      }}
    >
      {children}
    </div>
  );
};

export default RectangleShape;
