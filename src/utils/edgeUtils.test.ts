import { describe, it, expect } from 'vitest';
import {
  calculateEdgeOffsetMultiplier,
  calculatePerpendicularOffset,
  groupParallelEdges,
  generateEdgeId,
} from './edgeUtils';
import type { Relation } from '../types';

describe('edgeUtils', () => {
  describe('generateEdgeId', () => {
    it('should generate unique IDs for same source/target', () => {
      const id1 = generateEdgeId('node-1', 'node-2');
      const id2 = generateEdgeId('node-1', 'node-2');

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^edge_node-1_node-2_[0-9a-f-]{36}$/);
      expect(id2).toMatch(/^edge_node-1_node-2_[0-9a-f-]{36}$/);
    });

    it('should include source and target in ID for readability', () => {
      const id = generateEdgeId('actor-123', 'actor-456');

      expect(id).toContain('actor-123');
      expect(id).toContain('actor-456');
    });
  });

  describe('calculateEdgeOffsetMultiplier', () => {
    it('should return 0 for single edge', () => {
      expect(calculateEdgeOffsetMultiplier(0, 1)).toBe(0);
    });

    it('should return ±0.5 for 2 edges', () => {
      expect(calculateEdgeOffsetMultiplier(0, 2)).toBe(-0.5);
      expect(calculateEdgeOffsetMultiplier(1, 2)).toBe(0.5);
    });

    it('should return -1, 0, 1 for 3 edges', () => {
      expect(calculateEdgeOffsetMultiplier(0, 3)).toBe(-1);
      expect(calculateEdgeOffsetMultiplier(1, 3)).toBe(0);
      expect(calculateEdgeOffsetMultiplier(2, 3)).toBe(1);
    });

    it('should return -1.5, -0.5, 0.5, 1.5 for 4 edges', () => {
      expect(calculateEdgeOffsetMultiplier(0, 4)).toBe(-1.5);
      expect(calculateEdgeOffsetMultiplier(1, 4)).toBe(-0.5);
      expect(calculateEdgeOffsetMultiplier(2, 4)).toBe(0.5);
      expect(calculateEdgeOffsetMultiplier(3, 4)).toBe(1.5);
    });

    it('should return -2, -1, 0, 1, 2 for 5 edges', () => {
      expect(calculateEdgeOffsetMultiplier(0, 5)).toBe(-2);
      expect(calculateEdgeOffsetMultiplier(1, 5)).toBe(-1);
      expect(calculateEdgeOffsetMultiplier(2, 5)).toBe(0);
      expect(calculateEdgeOffsetMultiplier(3, 5)).toBe(1);
      expect(calculateEdgeOffsetMultiplier(4, 5)).toBe(2);
    });

    it('should distribute symmetrically around center for any count', () => {
      // Test with 6 edges
      const offsets = [0, 1, 2, 3, 4, 5].map(i => calculateEdgeOffsetMultiplier(i, 6));
      const sum = offsets.reduce((a, b) => a + b, 0);

      // Sum should be 0 (symmetric distribution)
      expect(sum).toBe(0);
    });
  });

  describe('calculatePerpendicularOffset', () => {
    it('should calculate perpendicular for horizontal line (should be vertical)', () => {
      const result = calculatePerpendicularOffset(0, 0, 100, 0, 50);

      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(50, 10);
    });

    it('should calculate perpendicular for vertical line (should be horizontal)', () => {
      const result = calculatePerpendicularOffset(0, 0, 0, 100, 50);

      expect(result.x).toBeCloseTo(-50, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });

    it('should calculate perpendicular for diagonal line (45 degrees)', () => {
      const result = calculatePerpendicularOffset(0, 0, 100, 100, 50);

      // For 45° line, perpendicular should be at -45°
      // Components should be equal in magnitude, opposite signs
      expect(Math.abs(result.x)).toBeCloseTo(Math.abs(result.y), 5);
      expect(result.x).toBeLessThan(0);
      expect(result.y).toBeGreaterThan(0);
    });

    it('should handle zero-distance case', () => {
      const result = calculatePerpendicularOffset(50, 50, 50, 50, 30);

      expect(result.x).toBeCloseTo(30, 10);
      expect(result.y).toBeCloseTo(0, 10);
    });

    it('should handle negative offset magnitude', () => {
      const result = calculatePerpendicularOffset(0, 0, 100, 0, -50);

      expect(result.x).toBeCloseTo(0, 10);
      expect(result.y).toBeCloseTo(-50, 10);
    });

    it('should scale proportionally with magnitude', () => {
      const result1 = calculatePerpendicularOffset(0, 0, 100, 0, 25);
      const result2 = calculatePerpendicularOffset(0, 0, 100, 0, 50);

      expect(result2.y).toBe(result1.y * 2);
    });

    it('should produce unit vector when magnitude is line length', () => {
      const distance = Math.sqrt(100 * 100 + 100 * 100); // ~141.42
      const result = calculatePerpendicularOffset(0, 0, 100, 100, distance);

      // Perpendicular should have same length as the line
      const resultLength = Math.sqrt(result.x * result.x + result.y * result.y);
      expect(resultLength).toBeCloseTo(distance, 5);
    });
  });

  describe('groupParallelEdges', () => {
    const createMockEdge = (id: string, source: string, target: string): Relation => ({
      id,
      source,
      target,
      type: 'custom',
      data: { type: 'default' },
    });

    it('should return empty map when no parallel edges exist', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n2', 'n3'),
        createMockEdge('e3', 'n3', 'n4'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(0);
    });

    it('should group two edges in same direction', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n1', 'n2'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group.edges).toHaveLength(2);
      expect(group.sourceId).toBe('n1');
      expect(group.targetId).toBe('n2');
    });

    it('should group bidirectional edges (A→B and B→A)', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n2', 'n1'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group.edges).toHaveLength(2);
      // Should use normalized (sorted) IDs
      expect([group.sourceId, group.targetId].sort()).toEqual(['n1', 'n2']);
    });

    it('should handle multiple parallel groups', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n1', 'n2'),
        createMockEdge('e3', 'n3', 'n4'),
        createMockEdge('e4', 'n4', 'n3'),
        createMockEdge('e5', 'n5', 'n6'), // Not parallel
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(2);
    });

    it('should use <-> separator to handle node IDs with underscores', () => {
      const edges = [
        createMockEdge('e1', 'node_1_abc', 'node_2_def'),
        createMockEdge('e2', 'node_1_abc', 'node_2_def'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(1);
      const key = Array.from(result.keys())[0];
      expect(key).toContain('<->');
      expect(key.split('<->')).toHaveLength(2);
    });

    it('should handle three parallel edges in same direction', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n1', 'n2'),
        createMockEdge('e3', 'n1', 'n2'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group.edges).toHaveLength(3);
    });

    it('should handle mixed bidirectional parallel edges', () => {
      const edges = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n1', 'n2'),
        createMockEdge('e3', 'n2', 'n1'),
        createMockEdge('e4', 'n2', 'n1'),
      ];

      const result = groupParallelEdges(edges);

      expect(result.size).toBe(1);
      const group = Array.from(result.values())[0];
      expect(group.edges).toHaveLength(4);
    });

    it('should normalize group key regardless of edge direction', () => {
      const edges1 = [
        createMockEdge('e1', 'n1', 'n2'),
        createMockEdge('e2', 'n1', 'n2'),
      ];

      const edges2 = [
        createMockEdge('e1', 'n2', 'n1'),
        createMockEdge('e2', 'n2', 'n1'),
      ];

      const result1 = groupParallelEdges(edges1);
      const result2 = groupParallelEdges(edges2);

      const key1 = Array.from(result1.keys())[0];
      const key2 = Array.from(result2.keys())[0];

      expect(key1).toBe(key2); // Should produce same normalized key
    });
  });
});
