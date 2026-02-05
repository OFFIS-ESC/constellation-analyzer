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
  isHighlighted = false,
  children,
  className = '',
}: RectangleShapeProps) => {
  // Simplified shadow for performance - single shadow instead of multiple layers
  const shadowStyle = isHighlighted
    ? `0 0 0 2px ${color}80` // Simple outline for highlight
    : '0 2px 4px rgb(0 0 0 / 0.1)'; // Single lightweight shadow

  return (
    <div
      className={`px-4 py-3 rounded-lg min-w-[120px] ${className}`}
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
