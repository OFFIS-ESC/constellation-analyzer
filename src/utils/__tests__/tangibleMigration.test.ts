import { describe, it, expect } from 'vitest';
import { migrateTangibleConfig, migrateTangibleConfigs } from '../tangibleMigration';
import type { TangibleConfig } from '../../types';

describe('tangibleMigration', () => {
  describe('migrateTangibleConfig', () => {
    it('should migrate old filterLabels to new filters.labels format', () => {
      const oldFormat: TangibleConfig = {
        id: 'test-1',
        name: 'Test Tangible',
        mode: 'filter',
        filterLabels: ['label-1', 'label-2'],
      };

      const result = migrateTangibleConfig(oldFormat);

      expect(result.filters).toEqual({
        labels: ['label-1', 'label-2'],
      });
      // Original filterLabels should still be present for compatibility
      expect(result.filterLabels).toEqual(['label-1', 'label-2']);
    });

    it('should leave tangibles with filters unchanged', () => {
      const newFormat: TangibleConfig = {
        id: 'test-2',
        name: 'Test Tangible',
        mode: 'filter',
        filters: {
          labels: ['label-1'],
          actorTypes: ['type-1'],
          relationTypes: ['rel-1'],
        },
      };

      const result = migrateTangibleConfig(newFormat);

      expect(result).toEqual(newFormat);
    });

    it('should handle tangibles with no filters', () => {
      const noFilters: TangibleConfig = {
        id: 'test-3',
        name: 'Test Tangible',
        mode: 'state',
        stateId: 'state-1',
      };

      const result = migrateTangibleConfig(noFilters);

      expect(result).toEqual(noFilters);
    });

    it('should handle tangibles with empty filterLabels', () => {
      const emptyFilters: TangibleConfig = {
        id: 'test-4',
        name: 'Test Tangible',
        mode: 'filter',
        filterLabels: [],
      };

      const result = migrateTangibleConfig(emptyFilters);

      expect(result).toEqual(emptyFilters);
    });

    it('should handle tangibles with all three filter types', () => {
      const allFilters: TangibleConfig = {
        id: 'test-5',
        name: 'Test Tangible',
        mode: 'filter',
        filters: {
          labels: ['label-1', 'label-2'],
          actorTypes: ['type-1', 'type-2'],
          relationTypes: ['rel-1', 'rel-2'],
        },
      };

      const result = migrateTangibleConfig(allFilters);

      expect(result).toEqual(allFilters);
    });

    it('should migrate only if filters is not present', () => {
      const withBoth: TangibleConfig = {
        id: 'test-6',
        name: 'Test Tangible',
        mode: 'filter',
        filterLabels: ['label-1', 'label-2'],
        filters: {
          labels: ['label-3'],
        },
      };

      const result = migrateTangibleConfig(withBoth);

      // Should use existing filters, not migrate from filterLabels
      expect(result.filters).toEqual({
        labels: ['label-3'],
      });
    });
  });

  describe('migrateTangibleConfigs', () => {
    it('should migrate an array of tangibles', () => {
      const tangibles: TangibleConfig[] = [
        {
          id: 'test-1',
          name: 'Old Format',
          mode: 'filter',
          filterLabels: ['label-1'],
        },
        {
          id: 'test-2',
          name: 'New Format',
          mode: 'filter',
          filters: {
            labels: ['label-2'],
          },
        },
        {
          id: 'test-3',
          name: 'State Mode',
          mode: 'state',
          stateId: 'state-1',
        },
      ];

      const result = migrateTangibleConfigs(tangibles);

      expect(result).toHaveLength(3);
      expect(result[0].filters).toEqual({ labels: ['label-1'] });
      expect(result[1].filters).toEqual({ labels: ['label-2'] });
      expect(result[2]).toEqual(tangibles[2]);
    });

    it('should handle empty array', () => {
      const result = migrateTangibleConfigs([]);
      expect(result).toEqual([]);
    });
  });
});
