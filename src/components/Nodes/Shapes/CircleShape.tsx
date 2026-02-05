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
  isHighlighted = false,
  children,
  className = '',
}: CircleShapeProps) => {
  // Simplified shadow for performance - single shadow instead of multiple layers
  const shadowStyle = isHighlighted
    ? `0 0 0 2px ${color}80` // Simple outline for highlight
    : '0 2px 4px rgb(0 0 0 / 0.1)'; // Single lightweight shadow

  return (
    <div
      className={`px-4 py-3 rounded-full min-w-[120px] flex items-center justify-center ${className}`}
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
