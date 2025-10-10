import type { Actor, ActorData, NodeTypeConfig } from '../types';

/**
 * Generates a unique ID for nodes
 */
export const generateNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Creates a new actor/node with default properties
 *
 * @param typeId - The node type ID
 * @param position - The position {x, y} to place the node
 * @param nodeTypeConfig - Optional node type config to get proper label
 * @param customLabel - Optional custom label to override default
 */
export const createNode = (
  typeId: string,
  position: { x: number; y: number },
  nodeTypeConfig?: NodeTypeConfig,
  customLabel?: string
): Actor => {
  // Determine the label: custom > config label > fallback
  const label = customLabel || nodeTypeConfig?.label || `New ${typeId}`;

  return {
    id: generateNodeId(),
    type: 'custom', // Using custom node component
    position,
    data: {
      label,
      type: typeId,
    },
  };
};

/**
 * Validates node data
 */
export const validateNodeData = (data: ActorData): boolean => {
  return !!(data.label && data.type);
};
