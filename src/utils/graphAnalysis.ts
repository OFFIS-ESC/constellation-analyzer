import type { Actor, Relation } from '../types';

/**
 * Graph Analysis Utilities
 *
 * Pure functions for calculating graph metrics and statistics.
 * Used for the Graph Metrics panel when no node/edge is selected.
 */

export interface ActorDegree {
  actorId: string;
  actorLabel: string;
  degree: number;
}

export interface GraphMetrics {
  // Basic counts
  actorCount: number;
  relationCount: number;

  // Density metrics
  density: number; // 0.0 to 1.0
  averageConnections: number;

  // Top actors
  mostConnectedActors: ActorDegree[];

  // Graph structure
  isolatedActorCount: number;
  connectedComponentCount: number;

  // Breakdown by type (optional enhancement)
  actorsByType: Map<string, number>;
  relationsByType: Map<string, number>;
}

/**
 * Calculate the degree (number of connections) for each actor
 */
export function calculateActorDegrees(nodes: Actor[], edges: Relation[]): ActorDegree[] {
  const degreeMap = new Map<string, number>();

  // Initialize all nodes with degree 0
  nodes.forEach(node => {
    degreeMap.set(node.id, 0);
  });

  // Count connections for each node
  edges.forEach(edge => {
    const sourceDegree = degreeMap.get(edge.source) || 0;
    const targetDegree = degreeMap.get(edge.target) || 0;

    degreeMap.set(edge.source, sourceDegree + 1);
    degreeMap.set(edge.target, targetDegree + 1);
  });

  // Convert to array with labels
  return nodes.map(node => ({
    actorId: node.id,
    actorLabel: node.data?.label || node.id,
    degree: degreeMap.get(node.id) || 0,
  }));
}

/**
 * Calculate graph density
 * Density = actual_edges / max_possible_edges
 * For directed graph: max = n * (n - 1)
 * For undirected graph: max = n * (n - 1) / 2
 *
 * We treat this as undirected since edges can be traversed both ways.
 */
export function calculateDensity(nodeCount: number, edgeCount: number): number {
  if (nodeCount <= 1) return 0;

  const maxPossibleEdges = (nodeCount * (nodeCount - 1)) / 2;
  return edgeCount / maxPossibleEdges;
}

/**
 * Find connected components using Depth-First Search (DFS)
 * Returns the number of disconnected subgraphs
 */
export function findConnectedComponents(nodes: Actor[], edges: Relation[]): number {
  if (nodes.length === 0) return 0;

  // Build adjacency list
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(node => {
    adjacency.set(node.id, new Set());
  });

  edges.forEach(edge => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  // DFS to mark visited nodes
  const visited = new Set<string>();
  let componentCount = 0;

  const dfs = (nodeId: string) => {
    visited.add(nodeId);
    const neighbors = adjacency.get(nodeId) || new Set();

    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        dfs(neighborId);
      }
    });
  };

  // Find all components
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
      componentCount++;
    }
  });

  return componentCount;
}

/**
 * Count actors by type
 */
export function countActorsByType(nodes: Actor[]): Map<string, number> {
  const counts = new Map<string, number>();

  nodes.forEach(node => {
    const type = node.data?.type || 'unknown';
    counts.set(type, (counts.get(type) || 0) + 1);
  });

  return counts;
}

/**
 * Count relations by type
 */
export function countRelationsByType(edges: Relation[]): Map<string, number> {
  const counts = new Map<string, number>();

  edges.forEach(edge => {
    const type = edge.data?.type || 'unknown';
    counts.set(type, (counts.get(type) || 0) + 1);
  });

  return counts;
}

/**
 * Calculate all graph metrics at once
 * Main entry point for the GraphMetrics component
 */
export function calculateGraphMetrics(nodes: Actor[], edges: Relation[]): GraphMetrics {
  const actorDegrees = calculateActorDegrees(nodes, edges);

  // Sort by degree descending and take top 5
  const mostConnected = [...actorDegrees]
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);

  // Count isolated actors (degree = 0)
  const isolatedCount = actorDegrees.filter(ad => ad.degree === 0).length;

  // Calculate density
  const density = calculateDensity(nodes.length, edges.length);

  // Calculate average connections
  const totalConnections = actorDegrees.reduce((sum, ad) => sum + ad.degree, 0);
  const averageConnections = nodes.length > 0 ? totalConnections / nodes.length : 0;

  // Find connected components
  const componentCount = findConnectedComponents(nodes, edges);

  // Count by type
  const actorsByType = countActorsByType(nodes);
  const relationsByType = countRelationsByType(edges);

  return {
    actorCount: nodes.length,
    relationCount: edges.length,
    density,
    averageConnections,
    mostConnectedActors: mostConnected,
    isolatedActorCount: isolatedCount,
    connectedComponentCount: componentCount,
    actorsByType,
    relationsByType,
  };
}
