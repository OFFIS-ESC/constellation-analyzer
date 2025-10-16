import { ReactNode } from 'react';
import type { NodeShape } from '../../../types';
import RectangleShape from './RectangleShape';
import CircleShape from './CircleShape';
import RoundedRectangleShape from './RoundedRectangleShape';
import EllipseShape from './EllipseShape';
import PillShape from './PillShape';

interface NodeShapeRendererProps {
  shape: NodeShape;
  color: string;
  borderColor: string;
  textColor: string;
  selected?: boolean;
  isHighlighted?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * NodeShapeRenderer - Renders the appropriate shape component based on shape type
 *
 * This component acts as a router that selects the correct shape component
 * to render based on the NodeTypeConfig.shape property.
 *
 * All shapes maintain consistent sizing and layout behavior to ensure
 * proper alignment with React Flow's edge routing and layout algorithms.
 *
 * Usage:
 *   <NodeShapeRenderer
 *     shape="circle"
 *     color="#3b82f6"
 *     borderColor="#1e40af"
 *     textColor="white"
 *   >
 *     <YourNodeContent />
 *   </NodeShapeRenderer>
 */
const NodeShapeRenderer = ({
  shape,
  color,
  borderColor,
  textColor,
  selected = false,
  isHighlighted = false,
  children,
  className = '',
}: NodeShapeRendererProps) => {
  const shapeProps = {
    color,
    borderColor,
    textColor,
    selected,
    isHighlighted,
    className,
  };

  switch (shape) {
    case 'rectangle':
      return <RectangleShape {...shapeProps}>{children}</RectangleShape>;

    case 'circle':
      return <CircleShape {...shapeProps}>{children}</CircleShape>;

    case 'roundedRectangle':
      return <RoundedRectangleShape {...shapeProps}>{children}</RoundedRectangleShape>;

    case 'ellipse':
      return <EllipseShape {...shapeProps}>{children}</EllipseShape>;

    case 'pill':
      return <PillShape {...shapeProps}>{children}</PillShape>;

    default:
      // Fallback to rectangle for unknown shapes
      return <RectangleShape {...shapeProps}>{children}</RectangleShape>;
  }
};

export default NodeShapeRenderer;
