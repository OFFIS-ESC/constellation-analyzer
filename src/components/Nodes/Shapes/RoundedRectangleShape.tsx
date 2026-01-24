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
  selected = false,
  isHighlighted = false,
  children,
  className = '',
}: RoundedRectangleShapeProps) => {
  const shadowStyle = selected
    ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}40`
    : isHighlighted
      ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}80, 0 0 12px ${color}60`
      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  return (
    <div
      className={`px-4 py-3 min-w-[120px] transition-shadow duration-200 ${className}`}
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
