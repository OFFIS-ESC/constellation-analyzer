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
  const {
    width: intersectionNodeWidth,
    height: intersectionNodeHeight,
    position: intersectionNodePosition,
  } = intersectionNode;
  const targetPosition = targetNode.position;

  const w = (intersectionNodeWidth ?? 0) / 2;
  const h = (intersectionNodeHeight ?? 0) / 2;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + (targetNode.width ?? 0) / 2;
  const y1 = targetPosition.y + (targetNode.height ?? 0) / 2;

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
  const n = { ...node.position, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  const width = node.width ?? 0;
  const height = node.height ?? 0;

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
