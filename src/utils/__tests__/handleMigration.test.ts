import { describe, it, expect } from 'vitest';
import { migrateRelationHandles, migrateRelationHandlesArray } from '../handleMigration';
import type { SerializedRelation } from '../../stores/persistence/types';

describe('handleMigration', () => {
  describe('migrateRelationHandles', () => {
    it('should migrate old "top" source handle by removing handles', () => {
      const oldFormat: SerializedRelation = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'top',
        targetHandle: 'bottom',
      };

      const result = migrateRelationHandles(oldFormat);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
      expect(result.id).toBe('edge-1');
      expect(result.source).toBe('node-1');
      expect(result.target).toBe('node-2');
    });

    it('should migrate old "right" source handle', () => {
      const oldFormat: SerializedRelation = {
        id: 'edge-2',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'right',
        targetHandle: 'left',
      };

      const result = migrateRelationHandles(oldFormat);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should migrate old "bottom" source handle', () => {
      const oldFormat: SerializedRelation = {
        id: 'edge-3',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'bottom',
        targetHandle: 'top',
      };

      const result = migrateRelationHandles(oldFormat);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should migrate old "left" source handle', () => {
      const oldFormat: SerializedRelation = {
        id: 'edge-4',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'left',
        targetHandle: 'right',
      };

      const result = migrateRelationHandles(oldFormat);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should migrate when only source handle is old format', () => {
      const mixed: SerializedRelation = {
        id: 'edge-5',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'top',
      };

      const result = migrateRelationHandles(mixed);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should migrate when only target handle is old format', () => {
      const mixed: SerializedRelation = {
        id: 'edge-6',
        source: 'node-1',
        target: 'node-2',
        targetHandle: 'bottom',
      };

      const result = migrateRelationHandles(mixed);

      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should leave relations with undefined handles unchanged', () => {
      const newFormat: SerializedRelation = {
        id: 'edge-7',
        source: 'node-1',
        target: 'node-2',
      };

      const result = migrateRelationHandles(newFormat);

      expect(result).toEqual(newFormat);
      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should leave relations with null handles unchanged', () => {
      const newFormat: SerializedRelation = {
        id: 'edge-8',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: null,
        targetHandle: null,
      };

      const result = migrateRelationHandles(newFormat);

      expect(result).toEqual(newFormat);
      expect(result.sourceHandle).toBeNull();
      expect(result.targetHandle).toBeNull();
    });

    it('should leave relations with custom handle IDs unchanged', () => {
      const customHandles: SerializedRelation = {
        id: 'edge-9',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'custom-source-1',
        targetHandle: 'custom-target-1',
      };

      const result = migrateRelationHandles(customHandles);

      expect(result).toEqual(customHandles);
      expect(result.sourceHandle).toBe('custom-source-1');
      expect(result.targetHandle).toBe('custom-target-1');
    });

    it('should preserve type and data fields', () => {
      const withData: SerializedRelation = {
        id: 'edge-10',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'custom-edge',
        data: {
          label: 'Test Edge',
          description: 'Test description',
        },
      };

      const result = migrateRelationHandles(withData);

      expect(result.type).toBe('custom-edge');
      expect(result.data).toEqual({
        label: 'Test Edge',
        description: 'Test description',
      });
      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });

    it('should be idempotent (running twice produces same result)', () => {
      const oldFormat: SerializedRelation = {
        id: 'edge-11',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'top',
        targetHandle: 'bottom',
      };

      const firstMigration = migrateRelationHandles(oldFormat);
      const secondMigration = migrateRelationHandles(firstMigration);

      expect(firstMigration).toEqual(secondMigration);
      expect(secondMigration.sourceHandle).toBeUndefined();
      expect(secondMigration.targetHandle).toBeUndefined();
    });

    it('should handle mixed old and custom handles', () => {
      const mixed: SerializedRelation = {
        id: 'edge-12',
        source: 'node-1',
        target: 'node-2',
        sourceHandle: 'top', // Old format
        targetHandle: 'custom-target', // Custom handle
      };

      const result = migrateRelationHandles(mixed);

      // Should migrate because sourceHandle is old format (removes both handles)
      expect(result.sourceHandle).toBeUndefined();
      expect(result.targetHandle).toBeUndefined();
    });
  });

  describe('migrateRelationHandlesArray', () => {
    it('should migrate an array of relations', () => {
      const relations: SerializedRelation[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'right',
          targetHandle: 'left',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
          // Already new format (undefined)
        },
        {
          id: 'edge-3',
          source: 'node-3',
          target: 'node-4',
          sourceHandle: 'custom-handle',
          targetHandle: 'custom-target',
        },
      ];

      const result = migrateRelationHandlesArray(relations);

      expect(result).toHaveLength(3);
      // First should be migrated (old format removed)
      expect(result[0].sourceHandle).toBeUndefined();
      expect(result[0].targetHandle).toBeUndefined();
      // Second should remain unchanged
      expect(result[1]).toEqual(relations[1]);
      // Third should remain unchanged (custom handles)
      expect(result[2]).toEqual(relations[2]);
    });

    it('should handle empty array', () => {
      const result = migrateRelationHandlesArray([]);
      expect(result).toEqual([]);
    });

    it('should handle array with all old format relations', () => {
      const relations: SerializedRelation[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          sourceHandle: 'top',
          targetHandle: 'bottom',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
          sourceHandle: 'right',
          targetHandle: 'left',
        },
      ];

      const result = migrateRelationHandlesArray(relations);

      expect(result).toHaveLength(2);
      result.forEach((relation) => {
        expect(relation.sourceHandle).toBeUndefined();
        expect(relation.targetHandle).toBeUndefined();
      });
    });

    it('should handle array with all new format relations', () => {
      const relations: SerializedRelation[] = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
        },
      ];

      const result = migrateRelationHandlesArray(relations);

      expect(result).toEqual(relations);
    });
  });
});
