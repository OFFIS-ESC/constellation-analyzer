import { ReactNode } from 'react';
import { ROUNDED_RECTANGLE_RADIUS } from '../../../constants';

interface RoundedRectangleShapeProps {
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * RoundedRectangleShape - Rounded rectangular node shape
 *
 * Best for: Softer entities (teams, groups, communities)
 * Characteristics: Friendly appearance, similar layout behavior to rectangle
 * Handles: Positioned at the midpoints of each side (top, right, bottom, left)
 */
const RoundedRectangleShape = ({
  color,
  borderColor,
  textColor,
  isHighlighted = false,
  children,
  className = '',
}: RoundedRectangleShapeProps) => {
  // Simplified shadow for performance - single shadow instead of multiple layers
  const shadowStyle = isHighlighted
    ? `0 0 0 2px ${color}80` // Simple outline for highlight
    : '0 2px 4px rgb(0 0 0 / 0.1)'; // Single lightweight shadow

  return (
    <div
      className={`px-4 py-3 min-w-[120px] ${className}`}
      style={{
        backgroundColor: color,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        borderRadius: `${ROUNDED_RECTANGLE_RADIUS}px`,
        boxShadow: shadowStyle,
      }}
    >
      {children}
    </div>
  );
};

export default RoundedRectangleShape;
