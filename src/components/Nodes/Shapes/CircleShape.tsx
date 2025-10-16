import { ReactNode } from 'react';

interface CircleShapeProps {
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * CircleShape - Circular/elliptical node shape
 *
 * Best for: People, concepts, end states
 * Characteristics: Compact, no directional bias, works well in radial layouts
 * Handles: Positioned at cardinal points (top, right, bottom, left) of bounding box
 */
const CircleShape = ({
  color,
  borderColor,
  textColor,
  selected = false,
  isHighlighted = false,
  children,
  className = '',
}: CircleShapeProps) => {
  const shadowStyle = selected
    ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}40`
    : isHighlighted
      ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}80, 0 0 12px ${color}60`
      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  return (
    <div
      className={`px-4 py-3 rounded-full min-w-[120px] flex items-center justify-center transition-shadow duration-200 ${className}`}
      style={{
        backgroundColor: color,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        aspectRatio: '1 / 1',
        boxShadow: shadowStyle,
      }}
    >
      {children}
    </div>
  );
};

export default CircleShape;
