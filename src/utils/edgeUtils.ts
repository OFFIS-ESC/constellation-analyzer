import type { Relation, RelationData } from '../types';
import type { Node } from '@xyflow/react';
import { Position } from '@xyflow/react';

/**
 * Generates a unique ID for edges
 */
export const generateEdgeId = (source: string, target: string): string => {
  return `edge_${source}_${target}_${Date.now()}`;
};

/**
 * Calculate the intersection point between a line and a rectangle
 * Used for floating edges to connect at the closest point on the node
 */
function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
  // Use positionAbsolute for correct positioning of nodes inside groups
  // positionAbsolute accounts for parent group offset, while position is relative
  // @ts-ignore - internals.positionAbsolute exists at runtime but not in public types
  const intersectionNodePosition = intersectionNode.internals?.positionAbsolute ?? intersectionNode.position;
  // @ts-ignore - internals.positionAbsolute exists at runtime but not in public types
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
    return { x: centerX, y: centerY };
  }

  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNodeWidth / 2;
  const y1 = targetPosition.y + targetNodeHeight / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

/**
 * Get the position (top, right, bottom, left) of the handle based on the intersection point
 */
function getEdgePosition(node: Node, intersectionPoint: { x: number; y: number }) {
  // Use positionAbsolute for correct positioning of nodes inside groups
  // @ts-ignore - internals.positionAbsolute exists at runtime but not in public types
  const nodePosition = node.internals?.positionAbsolute ?? node.position;
  const nx = Math.round(nodePosition.x);
  const ny = Math.round(nodePosition.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  // Use measured dimensions from React Flow (stored in node.measured)
  // If not available, default to Top
  const width = node.measured?.width ?? node.width;
  const height = node.measured?.height ?? node.height;

  if (!width || !height) {
    return Position.Top;
  }

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

/**
 * Calculate the parameters for a floating edge between two nodes
 * Returns source/target coordinates and positions for dynamic edge routing
 */
export function getFloatingEdgeParams(sourceNode: Node, targetNode: Node) {
  const sourceIntersectionPoint = getNodeIntersection(sourceNode, targetNode);
  const targetIntersectionPoint = getNodeIntersection(targetNode, sourceNode);

  const sourcePos = getEdgePosition(sourceNode, sourceIntersectionPoint);
  const targetPos = getEdgePosition(targetNode, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
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
