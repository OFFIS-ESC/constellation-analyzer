import { ReactNode } from 'react';

interface PillShapeProps {
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * PillShape - Capsule/pill node shape
 *
 * Best for: Tags, labels, flow elements, actions
 * Characteristics: Fully rounded ends, compact, modern look
 * Handles: Positioned at cardinal points (top, right, bottom, left) of bounding box
 */
const PillShape = ({
  color,
  borderColor,
  textColor,
  isHighlighted = false,
  children,
  className = '',
}: PillShapeProps) => {
  // Simplified shadow for performance - single shadow instead of multiple layers
  const shadowStyle = isHighlighted
    ? `0 0 0 2px ${color}80` // Simple outline for highlight
    : '0 2px 4px rgb(0 0 0 / 0.1)'; // Single lightweight shadow

  return (
    <div
      className={`px-6 py-3 min-w-[120px] flex items-center justify-center ${className}`}
      style={{
        backgroundColor: color,
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: borderColor,
        color: textColor,
        borderRadius: '999px',
        boxShadow: shadowStyle,
      }}
    >
      {children}
    </div>
  );
};

export default PillShape;
