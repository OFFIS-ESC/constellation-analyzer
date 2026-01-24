import type { Relation, RelationData, NodeShape } from '../types';
import type { Node } from '@xyflow/react';

/**
 * Generates a unique ID for edges
 */
export const generateEdgeId = (source: string, target: string): string => {
  return `edge_${source}_${target}_${Date.now()}`;
};

/**
 * Calculate intersection point with a circle
 * Returns both the intersection point and the normal vector (outward direction)
 */
function getCircleIntersection(
  centerX: number,
  centerY: number,
  radius: number,
  targetX: number,
  targetY: number,
  offset: number = 3
): { x: number; y: number; angle: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance === 0) {
    return { x: centerX + radius + offset, y: centerY, angle: 0 };
  }

  // Normalized direction vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Point on circle border in direction of target, with offset
  return {
    x: centerX + nx * (radius + offset),
    y: centerY + ny * (radius + offset),
    angle: Math.atan2(ny, nx), // Normal angle pointing outward
  };
}

/**
 * Calculate intersection point with an ellipse
 * Returns both the intersection point and the normal vector (outward direction)
 */
function getEllipseIntersection(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  targetX: number,
  targetY: number,
  offset: number = 3
): { x: number; y: number; angle: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (dx === 0 && dy === 0) {
    return { x: centerX + radiusX + offset, y: centerY, angle: 0 };
  }

  // Angle to target point
  const angle = Math.atan2(dy, dx);

  // Point on ellipse border
  const px = radiusX * Math.cos(angle);
  const py = radiusY * Math.sin(angle);

  // Normal vector at this point on the ellipse
  // For ellipse, the gradient at point (px, py) is (px/radiusX^2, py/radiusY^2)
  const normalX = px / (radiusX * radiusX);
  const normalY = py / (radiusY * radiusY);
  const normalLength = Math.sqrt(normalX * normalX + normalY * normalY);
  const nx = normalX / normalLength;
  const ny = normalY / normalLength;

  // Normal angle
  const normalAngle = Math.atan2(ny, nx);

  // Offset point slightly outside ellipse border
  return {
    x: centerX + px + nx * offset,
    y: centerY + py + ny * offset,
    angle: normalAngle,
  };
}

/**
 * Calculate intersection point with a pill (stadium) shape
 * A pill has rounded caps on the ends and straight sides
 */
function getPillIntersection(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number,
  offset: number = 4
): { x: number; y: number; angle: number } {
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  if (dx === 0 && dy === 0) {
    return { x: centerX + width / 2 + offset, y: centerY, angle: 0 };
  }

  // Determine pill orientation and cap radius
  const isHorizontal = width >= height;
  const capRadius = isHorizontal ? height / 2 : width / 2;

  if (isHorizontal) {
    // Horizontal pill: semicircular caps on left and right
    const leftCapX = centerX - (width / 2 - capRadius);
    const rightCapX = centerX + (width / 2 - capRadius);

    // Check if pointing toward left cap
    if (dx < 0 && Math.abs(dx) >= Math.abs(dy)) {
      return getCircleIntersection(leftCapX, centerY, capRadius, targetX, targetY, offset);
    }
    // Check if pointing toward right cap
    else if (dx > 0 && Math.abs(dx) >= Math.abs(dy)) {
      return getCircleIntersection(rightCapX, centerY, capRadius, targetX, targetY, offset);
    }
    // Otherwise it's pointing toward top or bottom straight edge
    else {
      const side = dy < 0 ? -1 : 1;
      const intersectY = centerY + side * capRadius;

      // Calculate x position where line from target to center intersects the horizontal edge
      // Line equation: (y - centerY) / (x - centerX) = dy / dx
      // Solving for x when y = intersectY: x = centerX + dx * (intersectY - centerY) / dy
      const intersectX = Math.abs(dy) > 0.001
        ? centerX + dx * (intersectY - centerY) / dy
        : centerX;

      const normalAngle = side < 0 ? -Math.PI / 2 : Math.PI / 2;

      return {
        x: intersectX,
        y: intersectY + side * offset,
        angle: normalAngle,
      };
    }
  } else {
    // Vertical pill: semicircular caps on top and bottom
    const topCapY = centerY - (height / 2 - capRadius);
    const bottomCapY = centerY + (height / 2 - capRadius);

    // Check if pointing toward top cap
    if (dy < 0 && Math.abs(dy) >= Math.abs(dx)) {
      return getCircleIntersection(centerX, topCapY, capRadius, targetX, targetY, offset);
    }
    // Check if pointing toward bottom cap
    else if (dy > 0 && Math.abs(dy) >= Math.abs(dx)) {
      return getCircleIntersection(centerX, bottomCapY, capRadius, targetX, targetY, offset);
    }
    // Otherwise it's pointing toward left or right straight edge
    else {
      const side = dx < 0 ? -1 : 1;
      const intersectX = centerX + side * capRadius;

      // Calculate y position where line from target to center intersects the vertical edge
      // Line equation: (y - centerY) / (x - centerX) = dy / dx
      // Solving for y when x = intersectX: y = centerY + dy * (intersectX - centerX) / dx
      const intersectY = Math.abs(dx) > 0.001
        ? centerY + dy * (intersectX - centerX) / dx
        : centerY;

      const normalAngle = side < 0 ? Math.PI : 0;

      return {
        x: intersectX + side * offset,
        y: intersectY,
        angle: normalAngle,
      };
    }
  }
}

/**
 * Calculate the intersection point between a line and a node shape
 * Returns the intersection point and the normal angle at that point
 */
function getNodeIntersection(
  intersectionNode: Node,
  targetNode: Node,
  intersectionShape: NodeShape = 'rectangle',
  offset: number = 2
): { x: number; y: number; angle: number } {
  // Use positionAbsolute for correct positioning of nodes inside groups
  // positionAbsolute accounts for parent group offset, while position is relative
  // @ts-expect-error - internals.positionAbsolute exists at runtime but not in public types
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute ?? intersectionNode.position;
  // @ts-expect-error - internals.positionAbsolute exists at runtime but not in public types
  const targetPosition = targetNode.internals?.positionAbsolute ?? targetNode.position;

  // Use measured dimensions from React Flow (stored in node.measured)
  // If undefined, node hasn't been measured yet - return center
  const intersectionNodeWidth = intersectionNode.measured?.width ?? intersectionNode.width;
  const intersectionNodeHeight = intersectionNode.measured?.height ?? intersectionNode.height;
  const targetNodeWidth = targetNode.measured?.width ?? targetNode.width;
  const targetNodeHeight = targetNode.measured?.height ?? targetNode.height;

  if (!intersectionNodeWidth || !intersectionNodeHeight || !targetNodeWidth || !targetNodeHeight) {
    const centerX = intersectionNodePosition.x + (intersectionNodeWidth ?? 0) / 2;
    const centerY = intersectionNodePosition.y + (intersectionNodeHeight ?? 0) / 2;
    return { x: centerX, y: centerY, angle: 0 };
  }

  // Calculate centers
  const intersectionCenterX = intersectionNodePosition.x + intersectionNodeWidth / 2;
  const intersectionCenterY = intersectionNodePosition.y + intersectionNodeHeight / 2;
  const targetCenterX = targetPosition.x + targetNodeWidth / 2;
  const targetCenterY = targetPosition.y + targetNodeHeight / 2;

  // Handle different shapes
  if (intersectionShape === 'circle') {
    // Use minimum dimension as radius for perfect circle
    const radius = Math.min(intersectionNodeWidth, intersectionNodeHeight) / 2;
    return getCircleIntersection(
      intersectionCenterX,
      intersectionCenterY,
      radius,
      targetCenterX,
      targetCenterY,
      offset
    );
  } else if (intersectionShape === 'pill') {
    // Pill shape has rounded caps and straight sides
    return getPillIntersection(
      intersectionCenterX,
      intersectionCenterY,
      intersectionNodeWidth,
      intersectionNodeHeight,
      targetCenterX,
      targetCenterY,
      offset
    );
  } else if (intersectionShape === 'ellipse') {
    // For ellipse, use width/height as radii
    const radiusX = intersectionNodeWidth / 2;
    const radiusY = intersectionNodeHeight / 2;
    return getEllipseIntersection(
      intersectionCenterX,
      intersectionCenterY,
      radiusX,
      radiusY,
      targetCenterX,
      targetCenterY,
      offset
    );
  } else {
    // Rectangle and roundedRectangle use the original algorithm with offset
    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    const x2 = intersectionCenterX;
    const y2 = intersectionCenterY;
    const x1 = targetCenterX;
    const y1 = targetCenterY;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    // Calculate normal angle for rectangle edges
    const dx = x - x2;
    const dy = y - y2;
    const angle = Math.atan2(dy, dx);

    // Apply offset
    const offsetX = x + Math.cos(angle) * offset;
    const offsetY = y + Math.sin(angle) * offset;

    return { x: offsetX, y: offsetY, angle };
  }
}

/**
 * Calculate the parameters for a floating edge between two nodes
 * Returns source/target coordinates with angles for smooth bezier curves
 */
export function getFloatingEdgeParams(
  sourceNode: Node,
  targetNode: Node,
  sourceShape: NodeShape = 'rectangle',
  targetShape: NodeShape = 'rectangle'
) {
  const sourceIntersection = getNodeIntersection(sourceNode, targetNode, sourceShape);
  const targetIntersection = getNodeIntersection(targetNode, sourceNode, targetShape);

  // Calculate control point distance based on distance between nodes
  const distance = Math.sqrt(
    Math.pow(targetIntersection.x - sourceIntersection.x, 2) +
    Math.pow(targetIntersection.y - sourceIntersection.y, 2)
  );
  // Use 40% of distance for more pronounced curves, with reasonable limits
  const controlPointDistance = Math.min(Math.max(distance * 0.4, 40), 150);

  // Calculate control points using the normal angles
  const sourceControlX = sourceIntersection.x + Math.cos(sourceIntersection.angle) * controlPointDistance;
  const sourceControlY = sourceIntersection.y + Math.sin(sourceIntersection.angle) * controlPointDistance;
  const targetControlX = targetIntersection.x + Math.cos(targetIntersection.angle) * controlPointDistance;
  const targetControlY = targetIntersection.y + Math.sin(targetIntersection.angle) * controlPointDistance;

  return {
    sx: sourceIntersection.x,
    sy: sourceIntersection.y,
    tx: targetIntersection.x,
    ty: targetIntersection.y,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
    sourceAngle: sourceIntersection.angle,
    targetAngle: targetIntersection.angle,
  };
}

/**
 * Creates a new relation/edge with default properties
 */
export const createEdge = (
  source: string,
  target: string,
  type: string,
  label?: string
): Relation => {
  return {
    id: generateEdgeId(source, target),
    source,
    target,
    type: 'custom', // Using custom edge component
    data: {
      label,
      type,
    },
  };
};

/**
 * Validates edge data
 */
export const validateEdgeData = (data: RelationData): boolean => {
  return !!data.type;
};
