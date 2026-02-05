import type { Relation, RelationData, NodeShape } from '../types';
import type { Node } from '@xyflow/react';
import { ROUNDED_RECTANGLE_RADIUS } from '../constants';

/**
 * Generates a unique ID for edges using crypto.randomUUID()
 * Format: edge_<source>_<target>_<uuid> for guaranteed uniqueness and readability
 */
export const generateEdgeId = (source: string, target: string): string => {
  return `edge_${source}_${target}_${crypto.randomUUID()}`;
};

/**
 * Edge group information for parallel edges
 */
export interface EdgeGroup {
  edges: Relation[];
  sourceId: string;
  targetId: string;
}

/**
 * Base offset for parallel edges (in pixels)
 */
const BASE_EDGE_OFFSET = 80; // Increased for better visibility with multiple edges

/**
 * Calculate the perpendicular offset for a parallel edge
 * Returns a 2D vector that is perpendicular to the line between source and target
 */
export function calculatePerpendicularOffset(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  offsetMagnitude: number
): { x: number; y: number } {
  // Calculate direction vector from source to target
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Handle zero-distance case
  if (distance === 0) {
    return { x: offsetMagnitude, y: 0 };
  }

  // Normalize direction vector
  const nx = dx / distance;
  const ny = dy / distance;

  // Perpendicular vector (rotate 90 degrees counterclockwise)
  const perpX = -ny;
  const perpY = nx;

  // Scale by offset magnitude
  return {
    x: perpX * offsetMagnitude,
    y: perpY * offsetMagnitude,
  };
}

/**
 * Calculate edge offset for a parallel edge within a group
 * @param edgeIndex - Index of this edge within the parallel group (0-based)
 * @param totalEdges - Total number of parallel edges
 * @returns Offset multiplier (-1, 0, +1, etc.)
 */
export function calculateEdgeOffsetMultiplier(
  edgeIndex: number,
  totalEdges: number
): number {
  // For single edge, no offset
  if (totalEdges === 1) {
    return 0;
  }

  // For 2 edges: offset by ±0.5 (one above, one below center)
  if (totalEdges === 2) {
    return edgeIndex === 0 ? -0.5 : 0.5;
  }

  // For 3+ edges: distribute evenly around center
  // Center edge(s) get offset 0, others get ±1, ±2, etc.
  const middle = (totalEdges - 1) / 2;
  return edgeIndex - middle;
}

/**
 * Group edges by their source-target pairs (bidirectional)
 * Edges between A-B and B-A are grouped together
 */
export function groupParallelEdges(edges: Relation[]): Map<string, EdgeGroup> {
  const groups = new Map<string, EdgeGroup>();

  edges.forEach((edge) => {
    // Create normalized key (alphabetically sorted endpoints)
    // Use <-> separator to avoid conflicts with underscores in node IDs
    const [normalizedSource, normalizedTarget] = [edge.source, edge.target].sort();
    const key = `${normalizedSource}<->${normalizedTarget}`;

    if (!groups.has(key)) {
      groups.set(key, {
        edges: [],
        sourceId: normalizedSource,  // Store normalized source
        targetId: normalizedTarget,   // Store normalized target
      });
    }

    groups.get(key)!.edges.push(edge);
  });

  // Filter to only return groups with 2+ edges (parallel edges)
  const parallelGroups = new Map<string, EdgeGroup>();
  groups.forEach((group, key) => {
    if (group.edges.length >= 2) {
      parallelGroups.set(key, group);
    }
  });

  return parallelGroups;
}

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
  // Guard against zero radius
  if (radius === 0) {
    return { x: centerX + offset, y: centerY, angle: 0 };
  }

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
  // Guard against zero radii
  if (radiusX === 0 || radiusY === 0) {
    return { x: centerX + offset, y: centerY, angle: 0 };
  }

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
      let intersectX = Math.abs(dy) > 0.001
        ? centerX + dx * (intersectY - centerY) / dy
        : centerX;

      // Clamp intersection to the straight horizontal segment between the caps
      intersectX = Math.min(Math.max(intersectX, leftCapX), rightCapX);

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
      let intersectY = Math.abs(dx) > 0.001
        ? centerY + dy * (intersectX - centerX) / dx
        : centerY;

      // Clamp intersection to the straight vertical segment between the caps
      intersectY = Math.min(Math.max(intersectY, topCapY), bottomCapY);

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
 * Calculate intersection point with a rounded rectangle
 * Handles corners as circular arcs with specified radius
 */
function getRoundedRectangleIntersection(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  targetX: number,
  targetY: number,
  cornerRadius: number = ROUNDED_RECTANGLE_RADIUS,
  offset: number = 2
): { x: number; y: number; angle: number } {
  const w = width / 2;
  const h = height / 2;

  // Calculate basic rectangle intersection first
  const dx = targetX - centerX;
  const dy = targetY - centerY;

  const xx1 = dx / (2 * w) - dy / (2 * h);
  const yy1 = dx / (2 * w) + dy / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + centerX;
  const y = h * (-xx3 + yy3) + centerY;

  // Determine which edge the intersection is on
  const leftEdge = centerX - w;
  const rightEdge = centerX + w;
  const topEdge = centerY - h;
  const bottomEdge = centerY + h;

  // Check if intersection is near a corner (within corner radius distance from corner)
  const isNearTopLeft = x < leftEdge + cornerRadius && y < topEdge + cornerRadius;
  const isNearTopRight = x > rightEdge - cornerRadius && y < topEdge + cornerRadius;
  const isNearBottomLeft = x < leftEdge + cornerRadius && y > bottomEdge - cornerRadius;
  const isNearBottomRight = x > rightEdge - cornerRadius && y > bottomEdge - cornerRadius;

  if (isNearTopLeft) {
    // Top-left corner - circular arc
    const cornerCenterX = leftEdge + cornerRadius;
    const cornerCenterY = topEdge + cornerRadius;
    return getCircleIntersection(cornerCenterX, cornerCenterY, cornerRadius, targetX, targetY, offset);
  } else if (isNearTopRight) {
    // Top-right corner - circular arc
    const cornerCenterX = rightEdge - cornerRadius;
    const cornerCenterY = topEdge + cornerRadius;
    return getCircleIntersection(cornerCenterX, cornerCenterY, cornerRadius, targetX, targetY, offset);
  } else if (isNearBottomLeft) {
    // Bottom-left corner - circular arc
    const cornerCenterX = leftEdge + cornerRadius;
    const cornerCenterY = bottomEdge - cornerRadius;
    return getCircleIntersection(cornerCenterX, cornerCenterY, cornerRadius, targetX, targetY, offset);
  } else if (isNearBottomRight) {
    // Bottom-right corner - circular arc
    const cornerCenterX = rightEdge - cornerRadius;
    const cornerCenterY = bottomEdge - cornerRadius;
    return getCircleIntersection(cornerCenterX, cornerCenterY, cornerRadius, targetX, targetY, offset);
  }

  // Straight edge - use rectangle calculation
  const angle = Math.atan2(y - centerY, x - centerX);
  const offsetX = x + Math.cos(angle) * offset;
  const offsetY = y + Math.sin(angle) * offset;

  return { x: offsetX, y: offsetY, angle };
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
  } else if (intersectionShape === 'roundedRectangle') {
    // Rounded rectangle with circular corner arcs
    return getRoundedRectangleIntersection(
      intersectionCenterX,
      intersectionCenterY,
      intersectionNodeWidth,
      intersectionNodeHeight,
      targetCenterX,
      targetCenterY,
      ROUNDED_RECTANGLE_RADIUS,
      offset
    );
  } else {
    // Rectangle uses the original algorithm with offset
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
 * @param sourceNode - Source node
 * @param targetNode - Target node
 * @param sourceShape - Shape of source node
 * @param targetShape - Shape of target node
 * @param offsetMultiplier - Multiplier for perpendicular offset (0 = no offset, ±1 = BASE_EDGE_OFFSET)
 * @param parallelGroupKey - Normalized key for parallel group (for consistent offset direction)
 */
export function getFloatingEdgeParams(
  sourceNode: Node,
  targetNode: Node,
  sourceShape: NodeShape = 'rectangle',
  targetShape: NodeShape = 'rectangle',
  offsetMultiplier: number = 0,
  parallelGroupKey?: string
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

  // Calculate perpendicular offset if needed
  let perpOffset = { x: 0, y: 0 };
  if (offsetMultiplier !== 0) {
    const offsetMagnitude = offsetMultiplier * BASE_EDGE_OFFSET;

    // For parallel edges with a group key, calculate perpendicular based on normalized direction
    // The offsetMultiplier already accounts for edge direction (assigned in GraphEditor)
    let refSourceX = sourceIntersection.x;
    let refSourceY = sourceIntersection.y;
    let refTargetX = targetIntersection.x;
    let refTargetY = targetIntersection.y;

    // Always use the normalized direction for perpendicular calculation
    if (parallelGroupKey) {
      const [normalizedSourceId, normalizedTargetId] = parallelGroupKey.split('<->');

      // Find the actual node positions for the normalized direction
      if (sourceNode.id === normalizedSourceId && targetNode.id === normalizedTargetId) {
        // This edge goes in normalized direction - use as-is
      } else if (sourceNode.id === normalizedTargetId && targetNode.id === normalizedSourceId) {
        // This edge goes in reverse direction - flip reference to use normalized direction
        [refSourceX, refSourceY, refTargetX, refTargetY] = [refTargetX, refTargetY, refSourceX, refSourceY];
      }
    }

    perpOffset = calculatePerpendicularOffset(
      refSourceX,
      refSourceY,
      refTargetX,
      refTargetY,
      offsetMagnitude
    );
  }

  // For parallel edges, use minimal endpoint offset to keep edges close to nodes
  // The control points will create the visual separation
  const endpointOffsetFactor = 0.1; // Minimal offset (10% of full offset)
  const sourceEndpointOffset = offsetMultiplier !== 0 ? {
    x: perpOffset.x * endpointOffsetFactor,
    y: perpOffset.y * endpointOffsetFactor,
  } : { x: 0, y: 0 };
  const targetEndpointOffset = offsetMultiplier !== 0 ? {
    x: perpOffset.x * endpointOffsetFactor,
    y: perpOffset.y * endpointOffsetFactor,
  } : { x: 0, y: 0 };

  // Calculate control points using the normal angles, with perpendicular offset applied
  const sourceControlX = sourceIntersection.x + Math.cos(sourceIntersection.angle) * controlPointDistance + perpOffset.x;
  const sourceControlY = sourceIntersection.y + Math.sin(sourceIntersection.angle) * controlPointDistance + perpOffset.y;
  const targetControlX = targetIntersection.x + Math.cos(targetIntersection.angle) * controlPointDistance + perpOffset.x;
  const targetControlY = targetIntersection.y + Math.sin(targetIntersection.angle) * controlPointDistance + perpOffset.y;

  return {
    sx: sourceIntersection.x + sourceEndpointOffset.x,
    sy: sourceIntersection.y + sourceEndpointOffset.y,
    tx: targetIntersection.x + targetEndpointOffset.x,
    ty: targetIntersection.y + targetEndpointOffset.y,
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
