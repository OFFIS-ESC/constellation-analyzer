import { ReactNode } from 'react';

interface EllipseShapeProps {
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * EllipseShape - Elliptical/oval node shape
 *
 * Best for: Processes, stages, states, horizontal groupings
 * Characteristics: Wider than tall, smooth edges, good for labeled stages
 * Handles: Positioned at cardinal points (top, right, bottom, left) of bounding box
 */
const EllipseShape = ({
  color,
  borderColor,
  textColor,
  isHighlighted = false,
  children,
  className = '',
}: EllipseShapeProps) => {
  // Simplified shadow for performance - single shadow instead of multiple layers
  const shadowStyle = isHighlighted
    ? `0 0 0 2px ${color}80` // Simple outline for highlight
    : '0 2px 4px rgb(0 0 0 / 0.1)'; // Single lightweight shadow

  return (
    <div
      className={`px-6 py-3 min-w-[140px] min-h-[80px] flex items-center justify-center ${className}`}
      style={{
        backgroundColor: color,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        borderRadius: '50%',
        boxShadow: shadowStyle,
      }}
    >
      {children}
    </div>
  );
};

export default EllipseShape;
