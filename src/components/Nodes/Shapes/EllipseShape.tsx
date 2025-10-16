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
  selected = false,
  isHighlighted = false,
  children,
  className = '',
}: EllipseShapeProps) => {
  const shadowStyle = selected
    ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}40`
    : isHighlighted
      ? `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 3px ${color}80, 0 0 12px ${color}60`
      : '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';

  return (
    <div
      className={`px-6 py-3 min-w-[140px] min-h-[80px] flex items-center justify-center transition-shadow duration-200 ${className}`}
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
