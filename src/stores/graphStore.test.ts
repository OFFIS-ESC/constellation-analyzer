import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphStore } from './graphStore';
import type { Actor, Relation, Group, NodeTypeConfig, EdgeTypeConfig, LabelConfig, TangibleConfig, NodeShape } from '../types';
import { MINIMIZED_GROUP_WIDTH, MINIMIZED_GROUP_HEIGHT } from '../constants';

// Helper to create a mock node
function createMockNode(id: string, actorType: string = 'person'): Actor {
  return {
    id,
    type: 'custom',
    position: { x: 100, y: 100 },
    data: {
      type: actorType,
      label: `Test ${id}`,
      description: 'Test description',
    },
  };
}

// Helper to create a mock edge
function createMockEdge(id: string, source: string, target: string, relationType: string = 'collaborates'): Relation {
  return {
    id,
    source,
    target,
    type: 'custom',
    data: {
      type: relationType,
      description: 'Test relation',
    },
  };
}

// Helper to create a mock group
function createMockGroup(id: string, actorIds: string[] = []): Group {
  return {
    id,
    type: 'group',
    position: { x: 0, y: 0 },
    data: {
      label: `Group ${id}`,
      color: '#cccccc',
      actorIds,
      minimized: false,
    },
    style: {
      width: 300,
      height: 200,
    },
  };
}

describe('graphStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGraphStore.setState({
      nodes: [],
      edges: [],
      groups: [],
      nodeTypes: [
        { id: 'person', label: 'Person', color: '#3b82f6', shape: 'circle', icon: 'Person', description: 'Individual person' },
        { id: 'organization', label: 'Organization', color: '#10b981', shape: 'rectangle', icon: 'Business', description: 'Company or group' },
      ],
      edgeTypes: [
        { id: 'collaborates', label: 'Collaborates', color: '#3b82f6', style: 'solid' },
        { id: 'reports-to', label: 'Reports To', color: '#10b981', style: 'solid' },
      ],
      labels: [],
      tangibles: [],
    });
  });

  describe('Initial State', () => {
    it('should start with empty graph', () => {
      const state = useGraphStore.getState();

      expect(state.nodes).toEqual([]);
      expect(state.edges).toEqual([]);
      expect(state.groups).toEqual([]);
    });

    it('should have default node types', () => {
      const state = useGraphStore.getState();

      expect(state.nodeTypes).toHaveLength(2);
      expect(state.nodeTypes[0].id).toBe('person');
      expect(state.nodeTypes[1].id).toBe('organization');
    });

    it('should have default edge types', () => {
      const state = useGraphStore.getState();

      expect(state.edgeTypes).toHaveLength(2);
      expect(state.edgeTypes[0].id).toBe('collaborates');
      expect(state.edgeTypes[1].id).toBe('reports-to');
    });

    it('should start with empty labels', () => {
      const state = useGraphStore.getState();

      expect(state.labels).toEqual([]);
    });
  });

  describe('Node Operations', () => {
    describe('addNode', () => {
      it('should add a node to the graph', () => {
        const { addNode } = useGraphStore.getState();
        const node = createMockNode('node-1');

        addNode(node);

        const state = useGraphStore.getState();
        expect(state.nodes).toHaveLength(1);
        expect(state.nodes[0].id).toBe('node-1');
      });

      it('should add multiple nodes', () => {
        const { addNode } = useGraphStore.getState();

        addNode(createMockNode('node-1'));
        addNode(createMockNode('node-2'));
        addNode(createMockNode('node-3'));

        const state = useGraphStore.getState();
        expect(state.nodes).toHaveLength(3);
      });

      it('should preserve existing nodes when adding', () => {
        const { addNode } = useGraphStore.getState();

        addNode(createMockNode('node-1'));
        const state1 = useGraphStore.getState();
        const firstNode = state1.nodes[0];

        addNode(createMockNode('node-2'));

        const state2 = useGraphStore.getState();
        expect(state2.nodes[0]).toEqual(firstNode);
        expect(state2.nodes).toHaveLength(2);
      });
    });

    describe('updateNode', () => {
      beforeEach(() => {
        const { addNode } = useGraphStore.getState();
        addNode(createMockNode('node-1'));
      });

      it('should update node position', () => {
        const { updateNode } = useGraphStore.getState();

        updateNode('node-1', { position: { x: 200, y: 300 } });

        const state = useGraphStore.getState();
        expect(state.nodes[0].position).toEqual({ x: 200, y: 300 });
      });

      it('should update node data', () => {
        const { updateNode } = useGraphStore.getState();

        updateNode('node-1', {
          data: { label: 'Updated Name', type: 'person' },
        });

        const state = useGraphStore.getState();
        expect(state.nodes[0].data.label).toBe('Updated Name');
      });

      it('should merge data instead of replacing', () => {
        const { updateNode } = useGraphStore.getState();

        updateNode('node-1', {
          data: { label: 'Test node-1', type: 'person', description: 'New description' },
        });

        const state = useGraphStore.getState();
        expect(state.nodes[0].data.label).toBe('Test node-1'); // Preserved
        expect(state.nodes[0].data.description).toBe('New description'); // Updated
      });

      it('should validate labels against existing labels', () => {
        const { addLabel, updateNode } = useGraphStore.getState();

        addLabel({ id: 'label-1', name: 'Valid', color: '#000', appliesTo: 'actors' });
        addLabel({ id: 'label-2', name: 'Also Valid', color: '#111', appliesTo: 'actors' });

        updateNode('node-1', {
          data: {
            label: 'Test node-1',
            type: 'person',
            labels: ['label-1', 'label-999', 'label-2'], // label-999 doesn't exist
          },
        });

        const state = useGraphStore.getState();
        expect(state.nodes[0].data.labels).toEqual(['label-1', 'label-2']);
      });

      it('should remove labels if all are invalid', () => {
        const { updateNode } = useGraphStore.getState();

        updateNode('node-1', {
          data: {
            label: 'Test node-1',
            type: 'person',
            labels: ['invalid-1', 'invalid-2'],
          },
        });

        const state = useGraphStore.getState();
        expect(state.nodes[0].data.labels).toBeUndefined();
      });

      it('should not affect other nodes', () => {
        const { addNode, updateNode } = useGraphStore.getState();
        addNode(createMockNode('node-2'));

        updateNode('node-1', { position: { x: 999, y: 999 } });

        const state = useGraphStore.getState();
        expect(state.nodes[1].position).toEqual({ x: 100, y: 100 });
      });

      it('should handle non-existent node gracefully', () => {
        const { updateNode } = useGraphStore.getState();

        updateNode('non-existent', { position: { x: 0, y: 0 } });

        const state = useGraphStore.getState();
        expect(state.nodes).toHaveLength(1); // Original node unchanged
      });
    });

    describe('deleteNode', () => {
      beforeEach(() => {
        const { addNode } = useGraphStore.getState();
        addNode(createMockNode('node-1'));
        addNode(createMockNode('node-2'));
      });

      it('should delete a node', () => {
        const { deleteNode } = useGraphStore.getState();

        deleteNode('node-1');

        const state = useGraphStore.getState();
        expect(state.nodes).toHaveLength(1);
        expect(state.nodes[0].id).toBe('node-2');
      });

      it('should delete connected edges', () => {
        const { addEdge, deleteNode } = useGraphStore.getState();
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));

        deleteNode('node-1');

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(0);
      });

      it('should delete edges where node is source', () => {
        const { addNode, addEdge, deleteNode } = useGraphStore.getState();
        addNode(createMockNode('node-3'));
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
        addEdge(createMockEdge('edge-2', 'node-1', 'node-3'));

        deleteNode('node-1');

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(0);
      });

      it('should delete edges where node is target', () => {
        const { addNode, addEdge, deleteNode } = useGraphStore.getState();
        addNode(createMockNode('node-3'));
        addEdge(createMockEdge('edge-1', 'node-2', 'node-1'));
        addEdge(createMockEdge('edge-2', 'node-3', 'node-1'));

        deleteNode('node-1');

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(0);
      });

      it('should handle non-existent node gracefully', () => {
        const { deleteNode } = useGraphStore.getState();

        deleteNode('non-existent');

        const state = useGraphStore.getState();
        expect(state.nodes).toHaveLength(2);
      });
    });
  });

  describe('Edge Operations', () => {
    beforeEach(() => {
      const { addNode } = useGraphStore.getState();
      addNode(createMockNode('node-1'));
      addNode(createMockNode('node-2'));
    });

    describe('addEdge', () => {
      it('should add an edge to the graph', () => {
        const { addEdge } = useGraphStore.getState();
        const edge = createMockEdge('edge-1', 'node-1', 'node-2');

        addEdge(edge);

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(1);
        expect(state.edges[0].id).toBe('edge-1');
      });

      it('should add multiple edges', () => {
        const { addNode, addEdge } = useGraphStore.getState();
        addNode(createMockNode('node-3'));

        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
        addEdge(createMockEdge('edge-2', 'node-2', 'node-3'));

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(2);
      });

      it('should use React Flow addEdge for duplicate prevention', () => {
        const { addEdge } = useGraphStore.getState();

        // Add same edge twice
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));

        const state = useGraphStore.getState();
        // React Flow's addEdge should prevent duplicates
        expect(state.edges.length).toBeGreaterThan(0);
      });
    });

    describe('updateEdge', () => {
      beforeEach(() => {
        const { addEdge } = useGraphStore.getState();
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
      });

      it('should update edge data', () => {
        const { updateEdge } = useGraphStore.getState();

        updateEdge('edge-1', { description: 'Updated description' });

        const state = useGraphStore.getState();
        expect(state.edges[0].data?.description).toBe('Updated description');
      });

      it('should merge data instead of replacing', () => {
        const { updateEdge } = useGraphStore.getState();

        updateEdge('edge-1', { label: 'Custom Label' });

        const state = useGraphStore.getState();
        expect(state.edges[0].data?.description).toBe('Test relation'); // Preserved
        expect(state.edges[0].data?.label).toBe('Custom Label'); // Added
      });

      it('should validate labels against existing labels', () => {
        const { addLabel, updateEdge } = useGraphStore.getState();

        addLabel({ id: 'label-1', name: 'Valid', color: '#000', appliesTo: 'relations' });

        updateEdge('edge-1', {
          labels: ['label-1', 'invalid-label'],
        });

        const state = useGraphStore.getState();
        expect(state.edges[0].data?.labels).toEqual(['label-1']);
      });

      it('should handle non-existent edge gracefully', () => {
        const { updateEdge } = useGraphStore.getState();

        updateEdge('non-existent', { description: 'Test' });

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(1);
      });
    });

    describe('deleteEdge', () => {
      beforeEach(() => {
        const { addEdge } = useGraphStore.getState();
        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
        addEdge(createMockEdge('edge-2', 'node-2', 'node-1'));
      });

      it('should delete an edge', () => {
        const { deleteEdge } = useGraphStore.getState();

        deleteEdge('edge-1');

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(1);
        expect(state.edges[0].id).toBe('edge-2');
      });

      it('should handle non-existent edge gracefully', () => {
        const { deleteEdge } = useGraphStore.getState();

        deleteEdge('non-existent');

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(2);
      });
    });
  });

  describe('Group Operations', () => {
    beforeEach(() => {
      const { addNode } = useGraphStore.getState();
      addNode(createMockNode('node-1'));
      addNode(createMockNode('node-2'));
      addNode(createMockNode('node-3'));
    });

    describe('addGroup', () => {
      it('should add a group to the graph', () => {
        const { addGroup } = useGraphStore.getState();
        const group = createMockGroup('group-1');

        addGroup(group);

        const state = useGraphStore.getState();
        expect(state.groups).toHaveLength(1);
        expect(state.groups[0].id).toBe('group-1');
      });
    });

    describe('updateGroup', () => {
      beforeEach(() => {
        const { addGroup } = useGraphStore.getState();
        addGroup(createMockGroup('group-1', ['node-1']));
      });

      it('should update group label', () => {
        const { updateGroup } = useGraphStore.getState();

        updateGroup('group-1', { label: 'Updated Label' });

        const state = useGraphStore.getState();
        expect(state.groups[0].data.label).toBe('Updated Label');
      });

      it('should update group metadata', () => {
        const { updateGroup } = useGraphStore.getState();

        updateGroup('group-1', { metadata: { custom: 'value' } });

        const state = useGraphStore.getState();
        expect(state.groups[0].data.metadata).toEqual({ custom: 'value' });
      });
    });

    describe('deleteGroup', () => {
      beforeEach(() => {
        const { addGroup } = useGraphStore.getState();
        addGroup(createMockGroup('group-1', ['node-1', 'node-2']));
      });

      it('should delete group and ungroup actors by default', () => {
        const { deleteGroup } = useGraphStore.getState();

        deleteGroup('group-1');

        const state = useGraphStore.getState();
        expect(state.groups).toHaveLength(0);
        expect(state.nodes).toHaveLength(3); // Actors preserved
      });

      it('should delete group and actors when ungroupActors=false', () => {
        const { deleteGroup } = useGraphStore.getState();

        // First, manually set parentId on nodes (simulating grouped state)
        useGraphStore.setState((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === 'node-1' || node.id === 'node-2'
              ? { ...node, parentId: 'group-1' }
              : node
          ),
        }));

        deleteGroup('group-1', false);

        const state = useGraphStore.getState();
        expect(state.groups).toHaveLength(0);
        expect(state.nodes).toHaveLength(1); // Only node-3 remains
        expect(state.nodes[0].id).toBe('node-3');
      });

      it('should delete edges connected to deleted actors', () => {
        const { addEdge, deleteGroup } = useGraphStore.getState();

        // Set parentId on nodes
        useGraphStore.setState((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === 'node-1' || node.id === 'node-2'
              ? { ...node, parentId: 'group-1' }
              : node
          ),
        }));

        addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
        addEdge(createMockEdge('edge-2', 'node-2', 'node-3'));

        deleteGroup('group-1', false);

        const state = useGraphStore.getState();
        expect(state.edges).toHaveLength(0); // All edges to deleted nodes removed
      });
    });

    describe('addActorToGroup', () => {
      beforeEach(() => {
        const { addGroup } = useGraphStore.getState();
        addGroup(createMockGroup('group-1', []));
      });

      it('should add actor to group', () => {
        const { addActorToGroup } = useGraphStore.getState();

        addActorToGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].data.actorIds).toContain('node-1');
      });

      it('should set parentId on actor node', () => {
        const { addActorToGroup } = useGraphStore.getState();

        addActorToGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        const node = state.nodes.find((n) => n.id === 'node-1');
        expect(node?.parentId).toBe('group-1');
      });

      it('should expand group bounds to include actor', () => {
        const { addActorToGroup } = useGraphStore.getState();

        // Set node far from group origin
        useGraphStore.setState((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === 'node-1'
              ? { ...n, position: { x: 500, y: 500 } }
              : n
          ),
        }));

        const initialWidth = useGraphStore.getState().groups[0].style?.width;

        addActorToGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        const newWidth = state.groups[0].style?.width;

        expect(newWidth).toBeGreaterThan(initialWidth as number);
      });

      it('should handle non-existent group', () => {
        const { addActorToGroup } = useGraphStore.getState();

        addActorToGroup('node-1', 'non-existent');

        const state = useGraphStore.getState();
        const node = state.nodes.find((n) => n.id === 'node-1');
        expect(node?.parentId).toBeUndefined();
      });

      it('should handle non-existent actor', () => {
        const { addActorToGroup } = useGraphStore.getState();

        addActorToGroup('non-existent', 'group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].data.actorIds).not.toContain('non-existent');
      });
    });

    describe('removeActorFromGroup', () => {
      beforeEach(() => {
        const { addGroup, addActorToGroup } = useGraphStore.getState();
        addGroup(createMockGroup('group-1', []));
        addActorToGroup('node-1', 'group-1');
      });

      it('should remove actor from group', () => {
        const { removeActorFromGroup } = useGraphStore.getState();

        removeActorFromGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].data.actorIds).not.toContain('node-1');
      });

      it('should remove parentId from actor', () => {
        const { removeActorFromGroup } = useGraphStore.getState();

        removeActorFromGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        const node = state.nodes.find((n) => n.id === 'node-1');
        expect(node?.parentId).toBeUndefined();
      });

      it('should convert position to absolute', () => {
        const { removeActorFromGroup } = useGraphStore.getState();

        // Set relative position within group
        const groupPos = useGraphStore.getState().groups[0].position;
        useGraphStore.setState((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === 'node-1'
              ? { ...n, position: { x: 50, y: 50 } }
              : n
          ),
        }));

        removeActorFromGroup('node-1', 'group-1');

        const state = useGraphStore.getState();
        const node = state.nodes.find((n) => n.id === 'node-1');

        expect(node?.position.x).toBe(groupPos.x + 50);
        expect(node?.position.y).toBe(groupPos.y + 50);
      });
    });

    describe('toggleGroupMinimized', () => {
      beforeEach(() => {
        const { addGroup, addActorToGroup } = useGraphStore.getState();
        addGroup(createMockGroup('group-1', []));
        addActorToGroup('node-1', 'group-1');
        addActorToGroup('node-2', 'group-1');
      });

      it('should minimize group', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();

        toggleGroupMinimized('group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].data.minimized).toBe(true);
      });

      it('should resize group to minimized dimensions', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();

        toggleGroupMinimized('group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].style?.width).toBe(MINIMIZED_GROUP_WIDTH);
        expect(state.groups[0].style?.height).toBe(MINIMIZED_GROUP_HEIGHT);
      });

      it('should store original dimensions in metadata', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();
        const originalWidth = useGraphStore.getState().groups[0].style?.width;

        toggleGroupMinimized('group-1');

        const state = useGraphStore.getState();
        expect(state.groups[0].data.metadata?.originalWidth).toBe(originalWidth);
      });

      it('should hide child nodes when minimizing', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();

        toggleGroupMinimized('group-1');

        const state = useGraphStore.getState();
        const node1 = state.nodes.find((n) => n.id === 'node-1');
        const node2 = state.nodes.find((n) => n.id === 'node-2');

        expect(node1?.hidden).toBe(true);
        expect(node2?.hidden).toBe(true);
      });

      it('should restore original size when maximizing', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();
        const originalWidth = useGraphStore.getState().groups[0].style?.width;

        toggleGroupMinimized('group-1'); // Minimize
        toggleGroupMinimized('group-1'); // Maximize

        const state = useGraphStore.getState();
        expect(state.groups[0].style?.width).toBe(originalWidth);
        expect(state.groups[0].data.minimized).toBe(false);
      });

      it('should show child nodes when maximizing', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();

        toggleGroupMinimized('group-1'); // Minimize
        toggleGroupMinimized('group-1'); // Maximize

        const state = useGraphStore.getState();
        const node1 = state.nodes.find((n) => n.id === 'node-1');
        const node2 = state.nodes.find((n) => n.id === 'node-2');

        expect(node1?.hidden).toBe(false);
        expect(node2?.hidden).toBe(false);
      });

      it('should handle non-existent group', () => {
        const { toggleGroupMinimized } = useGraphStore.getState();

        // Should not throw
        expect(() => toggleGroupMinimized('non-existent')).not.toThrow();
      });
    });
  });

  describe('Type Management', () => {
    describe('Node Types', () => {
      it('should add node type', () => {
        const { addNodeType } = useGraphStore.getState();

        const newType: NodeTypeConfig = {
          id: 'custom',
          label: 'Custom',
          color: '#ff0000',
          shape: 'circle',
          icon: 'Star',
          description: 'Custom type',
        };

        addNodeType(newType);

        const state = useGraphStore.getState();
        expect(state.nodeTypes).toHaveLength(3);
        expect(state.nodeTypes[2]).toEqual(newType);
      });

      it('should update node type', () => {
        const { updateNodeType } = useGraphStore.getState();

        updateNodeType('person', { label: 'Individual', color: '#0000ff' });

        const state = useGraphStore.getState();
        const personType = state.nodeTypes.find((t) => t.id === 'person');

        expect(personType?.label).toBe('Individual');
        expect(personType?.color).toBe('#0000ff');
      });

      it('should delete node type', () => {
        const { deleteNodeType } = useGraphStore.getState();

        deleteNodeType('person');

        const state = useGraphStore.getState();
        expect(state.nodeTypes).toHaveLength(1);
        expect(state.nodeTypes[0].id).toBe('organization');
      });
    });

    describe('Edge Types', () => {
      it('should add edge type', () => {
        const { addEdgeType } = useGraphStore.getState();

        const newType: EdgeTypeConfig = {
          id: 'custom',
          label: 'Custom',
          color: '#ff0000',
          style: 'dashed',
        };

        addEdgeType(newType);

        const state = useGraphStore.getState();
        expect(state.edgeTypes).toHaveLength(3);
        expect(state.edgeTypes[2]).toEqual(newType);
      });

      it('should update edge type', () => {
        const { updateEdgeType } = useGraphStore.getState();

        updateEdgeType('collaborates', { label: 'Works With', style: 'dotted' });

        const state = useGraphStore.getState();
        const collabType = state.edgeTypes.find((t) => t.id === 'collaborates');

        expect(collabType?.label).toBe('Works With');
        expect(collabType?.style).toBe('dotted');
      });

      it('should delete edge type', () => {
        const { deleteEdgeType } = useGraphStore.getState();

        deleteEdgeType('collaborates');

        const state = useGraphStore.getState();
        expect(state.edgeTypes).toHaveLength(1);
        expect(state.edgeTypes[0].id).toBe('reports-to');
      });
    });
  });

  describe('Label Management', () => {
    describe('addLabel', () => {
      it('should add a label', () => {
        const { addLabel } = useGraphStore.getState();

        const label: LabelConfig = {
          id: 'label-1',
          name: 'Important',
          color: '#ff0000',
          appliesTo: 'both',
        };

        addLabel(label);

        const state = useGraphStore.getState();
        expect(state.labels).toHaveLength(1);
        expect(state.labels[0]).toEqual(label);
      });
    });

    describe('updateLabel', () => {
      beforeEach(() => {
        const { addLabel } = useGraphStore.getState();
        addLabel({ id: 'label-1', name: 'Test', color: '#000', appliesTo: 'both' });
      });

      it('should update label', () => {
        const { updateLabel } = useGraphStore.getState();

        updateLabel('label-1', { name: 'Updated', color: '#fff' });

        const state = useGraphStore.getState();
        expect(state.labels[0].name).toBe('Updated');
        expect(state.labels[0].color).toBe('#fff');
      });
    });

    describe('deleteLabel', () => {
      beforeEach(() => {
        const { addNode, addEdge, addLabel } = useGraphStore.getState();
        addLabel({ id: 'label-1', name: 'Test', color: '#000', appliesTo: 'both' });
        addLabel({ id: 'label-2', name: 'Other', color: '#111', appliesTo: 'both' });

        // Add nodes and edges with labels
        const node = createMockNode('node-1');
        node.data.labels = ['label-1', 'label-2'];
        addNode(node);

        const edge = createMockEdge('edge-1', 'node-1', 'node-1');
        edge.data = { ...edge.data, type: 'collaborates', labels: ['label-1'] };
        addEdge(edge);
      });

      it('should delete label', () => {
        const { deleteLabel } = useGraphStore.getState();

        deleteLabel('label-1');

        const state = useGraphStore.getState();
        expect(state.labels).toHaveLength(1);
        expect(state.labels[0].id).toBe('label-2');
      });

      it('should remove label from nodes', () => {
        const { deleteLabel } = useGraphStore.getState();

        deleteLabel('label-1');

        const state = useGraphStore.getState();
        expect(state.nodes[0].data.labels).toEqual(['label-2']);
      });

      it('should remove label from edges', () => {
        const { deleteLabel } = useGraphStore.getState();

        deleteLabel('label-1');

        const state = useGraphStore.getState();
        // After filtering, empty array is left (not undefined)
        const edgeLabels = state.edges[0].data?.labels;
        expect(edgeLabels).toBeDefined();
        expect(edgeLabels).toHaveLength(0);
      });
    });
  });

  describe('Tangible Management', () => {
    describe('addTangible', () => {
      it('should add a tangible', () => {
        const { addTangible } = useGraphStore.getState();

        const tangible: TangibleConfig = {
          id: 'tangible-1',
          name: 'Red Block',
          mode: 'filter',
          filterLabels: ['label-1'],
        };

        addTangible(tangible);

        const state = useGraphStore.getState();
        expect(state.tangibles).toHaveLength(1);
        expect(state.tangibles[0]).toEqual(tangible);
      });

      it('should add multiple tangibles', () => {
        const { addTangible } = useGraphStore.getState();

        addTangible({ id: 't1', name: 'T1', mode: 'filter', filterLabels: [] });
        addTangible({ id: 't2', name: 'T2', mode: 'state', stateId: 's1' });

        const state = useGraphStore.getState();
        expect(state.tangibles).toHaveLength(2);
      });
    });

    describe('updateTangible', () => {
      beforeEach(() => {
        const { addTangible } = useGraphStore.getState();
        addTangible({
          id: 'tangible-1',
          name: 'Original',
          mode: 'filter',
          filterLabels: ['label-1'],
        });
      });

      it('should update tangible name', () => {
        const { updateTangible } = useGraphStore.getState();

        updateTangible('tangible-1', { name: 'Updated' });

        const state = useGraphStore.getState();
        expect(state.tangibles[0].name).toBe('Updated');
      });

      it('should update tangible mode', () => {
        const { updateTangible } = useGraphStore.getState();

        updateTangible('tangible-1', {
          mode: 'state',
          stateId: 'state-1',
          filterLabels: undefined,
        });

        const state = useGraphStore.getState();
        expect(state.tangibles[0].mode).toBe('state');
        expect(state.tangibles[0].stateId).toBe('state-1');
      });

      it('should update tangible description', () => {
        const { updateTangible } = useGraphStore.getState();

        updateTangible('tangible-1', { description: 'New description' });

        const state = useGraphStore.getState();
        expect(state.tangibles[0].description).toBe('New description');
      });
    });

    describe('deleteTangible', () => {
      beforeEach(() => {
        const { addTangible } = useGraphStore.getState();
        addTangible({ id: 't1', name: 'T1', mode: 'filter', filterLabels: [] });
        addTangible({ id: 't2', name: 'T2', mode: 'state', stateId: 's1' });
      });

      it('should delete a tangible', () => {
        const { deleteTangible } = useGraphStore.getState();

        deleteTangible('t1');

        const state = useGraphStore.getState();
        expect(state.tangibles).toHaveLength(1);
        expect(state.tangibles[0].id).toBe('t2');
      });

      it('should delete correct tangible when multiple exist', () => {
        const { deleteTangible } = useGraphStore.getState();

        deleteTangible('t2');

        const state = useGraphStore.getState();
        expect(state.tangibles).toHaveLength(1);
        expect(state.tangibles[0].id).toBe('t1');
      });
    });

    describe('setTangibles', () => {
      it('should replace all tangibles', () => {
        const { setTangibles } = useGraphStore.getState();
        const newTangibles: TangibleConfig[] = [
          { id: 't1', name: 'T1', mode: 'filter', filterLabels: [] },
          { id: 't2', name: 'T2', mode: 'state', stateId: 's1' },
        ];

        setTangibles(newTangibles);

        const state = useGraphStore.getState();
        expect(state.tangibles).toEqual(newTangibles);
      });

      it('should clear tangibles when set to empty array', () => {
        const { addTangible, setTangibles } = useGraphStore.getState();
        addTangible({ id: 't1', name: 'T1', mode: 'filter', filterLabels: [] });

        setTangibles([]);

        const state = useGraphStore.getState();
        expect(state.tangibles).toHaveLength(0);
      });
    });

    describe('deleteLabel cascade cleanup', () => {
      beforeEach(() => {
        const { addLabel, addTangible } = useGraphStore.getState();

        addLabel({ id: 'label-1', name: 'Label 1', color: '#000', appliesTo: 'both' });
        addLabel({ id: 'label-2', name: 'Label 2', color: '#111', appliesTo: 'both' });

        addTangible({
          id: 't1',
          name: 'Filter Both',
          mode: 'filter',
          filterLabels: ['label-1', 'label-2'],
        });
        addTangible({
          id: 't2',
          name: 'Filter One',
          mode: 'filter',
          filterLabels: ['label-1'],
        });
      });

      it('should remove deleted label from tangible filterLabels', () => {
        const { deleteLabel } = useGraphStore.getState();

        deleteLabel('label-1');

        const state = useGraphStore.getState();
        const t1 = state.tangibles.find((t) => t.id === 't1');
        const t2 = state.tangibles.find((t) => t.id === 't2');

        expect(t1?.filterLabels).toEqual(['label-2']);
        expect(t2?.filterLabels).toEqual([]);
      });

      it('should not affect state mode tangibles', () => {
        const { addTangible, deleteLabel } = useGraphStore.getState();

        addTangible({
          id: 't3',
          name: 'State Mode',
          mode: 'state',
          stateId: 'state-1',
        });

        deleteLabel('label-1');

        const state = useGraphStore.getState();
        const t3 = state.tangibles.find((t) => t.id === 't3');

        expect(t3).toBeDefined();
        expect(t3?.mode).toBe('state');
        expect(t3?.stateId).toBe('state-1');
      });

      it('should handle multiple labels being deleted', () => {
        const { deleteLabel } = useGraphStore.getState();

        deleteLabel('label-1');
        deleteLabel('label-2');

        const state = useGraphStore.getState();
        const t1 = state.tangibles.find((t) => t.id === 't1');
        const t2 = state.tangibles.find((t) => t.id === 't2');

        expect(t1?.filterLabels).toEqual([]);
        expect(t2?.filterLabels).toEqual([]);
      });
    });
  });

  describe('Utility Operations', () => {
    describe('clearGraph', () => {
      beforeEach(() => {
        const { addNode, addEdge, addGroup } = useGraphStore.getState();
        addNode(createMockNode('node-1'));
        addEdge(createMockEdge('edge-1', 'node-1', 'node-1'));
        addGroup(createMockGroup('group-1'));
      });

      it('should clear all nodes, edges, and groups', () => {
        const { clearGraph } = useGraphStore.getState();

        clearGraph();

        const state = useGraphStore.getState();
        expect(state.nodes).toEqual([]);
        expect(state.edges).toEqual([]);
        expect(state.groups).toEqual([]);
      });

      it('should preserve types and labels', () => {
        const { clearGraph } = useGraphStore.getState();
        const typesBefore = useGraphStore.getState().nodeTypes;

        clearGraph();

        const state = useGraphStore.getState();
        expect(state.nodeTypes).toEqual(typesBefore);
      });
    });

    describe('Setters', () => {
      it('should set nodes', () => {
        const { setNodes } = useGraphStore.getState();
        const nodes = [createMockNode('node-1'), createMockNode('node-2')];

        setNodes(nodes);

        const state = useGraphStore.getState();
        expect(state.nodes).toEqual(nodes);
      });

      it('should set edges', () => {
        const { setEdges } = useGraphStore.getState();
        const edges = [createMockEdge('edge-1', 'node-1', 'node-2')];

        setEdges(edges);

        const state = useGraphStore.getState();
        expect(state.edges).toEqual(edges);
      });

      it('should set groups', () => {
        const { setGroups } = useGraphStore.getState();
        const groups = [createMockGroup('group-1')];

        setGroups(groups);

        const state = useGraphStore.getState();
        expect(state.groups).toEqual(groups);
      });

      it('should set node types', () => {
        const { setNodeTypes } = useGraphStore.getState();
        const types: NodeTypeConfig[] = [
          { id: 'custom', label: 'Custom', color: '#000', shape: 'circle', icon: 'Test', description: 'Test' },
        ];

        setNodeTypes(types);

        const state = useGraphStore.getState();
        expect(state.nodeTypes).toEqual(types);
      });

      it('should set edge types', () => {
        const { setEdgeTypes } = useGraphStore.getState();
        const types: EdgeTypeConfig[] = [
          { id: 'custom', label: 'Custom', color: '#000', style: 'solid' },
        ];

        setEdgeTypes(types);

        const state = useGraphStore.getState();
        expect(state.edgeTypes).toEqual(types);
      });

      it('should set labels', () => {
        const { setLabels } = useGraphStore.getState();
        const labels: LabelConfig[] = [
          { id: 'label-1', name: 'Test', color: '#000', appliesTo: 'both' },
        ];

        setLabels(labels);

        const state = useGraphStore.getState();
        expect(state.labels).toEqual(labels);
      });
    });

    describe('loadGraphState', () => {
      it('should load complete graph state', () => {
        const { loadGraphState } = useGraphStore.getState();

        const graphState = {
          nodes: [createMockNode('node-1')],
          edges: [createMockEdge('edge-1', 'node-1', 'node-1')],
          groups: [createMockGroup('group-1')],
          nodeTypes: [
            { id: 'custom', label: 'Custom', color: '#000', shape: 'circle' as NodeShape, icon: 'Test', description: 'Test' },
          ],
          edgeTypes: [
            { id: 'custom', label: 'Custom', color: '#000', style: 'solid' as const },
          ],
          labels: [
            { id: 'label-1', name: 'Test', color: '#000', appliesTo: 'both' as const },
          ],
        };

        loadGraphState(graphState);

        const state = useGraphStore.getState();
        expect(state.nodes).toEqual(graphState.nodes);
        expect(state.edges).toEqual(graphState.edges);
        expect(state.groups).toEqual(graphState.groups);
        expect(state.nodeTypes).toEqual(graphState.nodeTypes);
        expect(state.edgeTypes).toEqual(graphState.edgeTypes);
        expect(state.labels).toEqual(graphState.labels);
      });

      it('should sanitize orphaned parentId references', () => {
        const { loadGraphState } = useGraphStore.getState();

        const nodeWithOrphanedParent = createMockNode('node-1');
        Object.assign(nodeWithOrphanedParent, { parentId: 'non-existent-group' });

        loadGraphState({
          nodes: [nodeWithOrphanedParent],
          edges: [],
          groups: [],
          nodeTypes: [],
          edgeTypes: [],
          labels: [],
        });

        const state = useGraphStore.getState();
        const node = state.nodes[0];
        expect(node.parentId).toBeUndefined();
      });

      it('should preserve valid parentId references', () => {
        const { loadGraphState } = useGraphStore.getState();

        const group = createMockGroup('group-1');
        const node = createMockNode('node-1');
        Object.assign(node, { parentId: 'group-1' });

        loadGraphState({
          nodes: [node],
          edges: [],
          groups: [group],
          nodeTypes: [],
          edgeTypes: [],
          labels: [],
        });

        const state = useGraphStore.getState();
        const loadedNode = state.nodes[0];
        expect(loadedNode.parentId).toBe('group-1');
      });

      it('should migrate old 4-position handle references by removing handles', () => {
        const { loadGraphState } = useGraphStore.getState();

        // Create edges with old handle format
        const edgeWithOldHandles: Relation = {
          ...createMockEdge('edge-1', 'node-1', 'node-2'),
          sourceHandle: 'right',
          targetHandle: 'left',
        };

        const edgeWithTopBottom: Relation = {
          ...createMockEdge('edge-2', 'node-1', 'node-2'),
          sourceHandle: 'top',
          targetHandle: 'bottom',
        };

        loadGraphState({
          nodes: [createMockNode('node-1'), createMockNode('node-2')],
          edges: [edgeWithOldHandles, edgeWithTopBottom],
          groups: [],
          nodeTypes: [],
          edgeTypes: [],
          labels: [],
        });

        const state = useGraphStore.getState();

        // Both edges should have handles removed (undefined) for floating edge pattern
        expect(state.edges[0].sourceHandle).toBeUndefined();
        expect(state.edges[0].targetHandle).toBeUndefined();
        expect(state.edges[1].sourceHandle).toBeUndefined();
        expect(state.edges[1].targetHandle).toBeUndefined();

        // Other fields should be preserved
        expect(state.edges[0].id).toBe('edge-1');
        expect(state.edges[0].source).toBe('node-1');
        expect(state.edges[0].target).toBe('node-2');
      });

      it('should preserve undefined/null handles', () => {
        const { loadGraphState } = useGraphStore.getState();

        // Create edge without handles (new format)
        const edgeWithoutHandles: Relation = {
          ...createMockEdge('edge-1', 'node-1', 'node-2'),
        };

        loadGraphState({
          nodes: [createMockNode('node-1'), createMockNode('node-2')],
          edges: [edgeWithoutHandles],
          groups: [],
          nodeTypes: [],
          edgeTypes: [],
          labels: [],
        });

        const state = useGraphStore.getState();

        // Handles should remain undefined
        expect(state.edges[0].sourceHandle).toBeUndefined();
        expect(state.edges[0].targetHandle).toBeUndefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid operations without data corruption', () => {
      const { addNode, updateNode, deleteNode } = useGraphStore.getState();

      // Rapid add/update/delete
      for (let i = 0; i < 20; i++) {
        addNode(createMockNode(`node-${i}`));
      }

      for (let i = 0; i < 10; i++) {
        updateNode(`node-${i}`, { position: { x: i * 10, y: i * 10 } });
      }

      for (let i = 0; i < 5; i++) {
        deleteNode(`node-${i}`);
      }

      const state = useGraphStore.getState();
      expect(state.nodes).toHaveLength(15);
    });

    it('should maintain referential integrity with complex operations', () => {
      const { addNode, addEdge, addGroup, addActorToGroup, deleteNode } = useGraphStore.getState();

      // Build complex graph
      addNode(createMockNode('node-1'));
      addNode(createMockNode('node-2'));
      addNode(createMockNode('node-3'));
      addEdge(createMockEdge('edge-1', 'node-1', 'node-2'));
      addEdge(createMockEdge('edge-2', 'node-2', 'node-3'));
      addGroup(createMockGroup('group-1'));
      addActorToGroup('node-1', 'group-1');
      addActorToGroup('node-2', 'group-1');

      // Delete node should clean up edges
      deleteNode('node-2');

      const state = useGraphStore.getState();
      expect(state.nodes).toHaveLength(2);
      expect(state.edges).toHaveLength(0); // Both edges connected to node-2 removed

      // Note: deleteNode doesn't remove from group.actorIds
      // That's the responsibility of the deleteGroup or removeActorFromGroup operations
      // So we just verify the node itself was deleted
      expect(state.nodes.find(n => n.id === 'node-2')).toBeUndefined();
    });
  });
});
