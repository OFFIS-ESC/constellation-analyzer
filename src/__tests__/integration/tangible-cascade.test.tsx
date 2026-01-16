import { describe, it, expect, beforeEach } from "vitest";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useTimelineStore } from "../../stores/timelineStore";
import { useGraphStore } from "../../stores/graphStore";
import { resetWorkspaceStore } from "../../test-utils/test-helpers";
import type { LabelConfig } from "../../types";

describe("Tangible Cascade Cleanup Integration Tests", () => {
  let documentId: string;

  beforeEach(() => {
    localStorage.clear();
    resetWorkspaceStore();
    documentId = useWorkspaceStore.getState().createDocument("Test Doc");
  });

  describe("Label deletion cascade", () => {
    it("should remove deleted label from tangible filterLabels", () => {
      const { addLabelToDocument, deleteLabelFromDocument } =
        useWorkspaceStore.getState();

      // Add labels
      const label1: LabelConfig = {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      };
      const label2: LabelConfig = {
        id: "label-2",
        name: "Label 2",
        color: "#111",
        appliesTo: "both",
      };

      addLabelToDocument(documentId, label1);
      addLabelToDocument(documentId, label2);

      // Add tangible with both labels
      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "Filter Tangible",
        mode: "filter",
        filterLabels: ["label-1", "label-2"],
      });

      // Delete label-1
      deleteLabelFromDocument(documentId, "label-1");

      // Check tangible only has label-2
      const doc = useWorkspaceStore.getState().documents.get(documentId);
      const tangible = doc?.tangibles?.[0];

      expect(tangible?.filterLabels).toEqual(["label-2"]);
    });

    it("should not delete tangible when label is removed from filterLabels", () => {
      const { addLabelToDocument, deleteLabelFromDocument } =
        useWorkspaceStore.getState();

      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "Filter Tangible",
        mode: "filter",
        filterLabels: ["label-1"],
      });

      deleteLabelFromDocument(documentId, "label-1");

      const doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(1);
      expect(doc?.tangibles?.[0].filterLabels).toEqual([]);
    });

    it("should not affect state mode tangibles when label is deleted", () => {
      const { addLabelToDocument, deleteLabelFromDocument } =
        useWorkspaceStore.getState();

      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      const timelineStore = useTimelineStore.getState();
      const stateId = timelineStore.createState("Test State", undefined, false);

      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "State Tangible",
        mode: "state",
        stateId: stateId,
      });

      deleteLabelFromDocument(documentId, "label-1");

      const doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(1);
      expect(doc?.tangibles?.[0].mode).toBe("state");
      expect(doc?.tangibles?.[0].stateId).toBe(stateId);
    });
  });

  describe("State deletion cascade", () => {
    it("should delete tangible when referenced state is deleted", () => {
      const timelineStore = useTimelineStore.getState();

      // Create a new state
      const stateId = timelineStore.createState("Test State", undefined, false);

      // Add tangible referencing this state
      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "State Tangible",
        mode: "state",
        stateId: stateId,
      });

      // Verify tangible exists
      let doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(1);

      // Switch to root state (can't delete current state)
      const timeline = timelineStore.timelines.get(documentId);
      timelineStore.switchToState(timeline!.rootStateId);

      // Delete the state
      timelineStore.deleteState(stateId);

      // Tangible should be deleted
      doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(0);
    });

    it("should delete stateDial tangibles when state is deleted", () => {
      const timelineStore = useTimelineStore.getState();

      const stateId = timelineStore.createState("Dial State", undefined, false);

      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "Dial Tangible",
        mode: "stateDial",
        stateId: stateId,
      });

      const timeline = timelineStore.timelines.get(documentId);
      timelineStore.switchToState(timeline!.rootStateId);
      timelineStore.deleteState(stateId);

      const doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(0);
    });

    it("should not delete filter mode tangibles when state is deleted", () => {
      const timelineStore = useTimelineStore.getState();

      const stateId = timelineStore.createState("Test State", undefined, false);

      const { addLabelToDocument, addTangibleToDocument } =
        useWorkspaceStore.getState();

      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "Filter Tangible",
        mode: "filter",
        filterLabels: ["label-1"],
      });

      const timeline = timelineStore.timelines.get(documentId);
      timelineStore.switchToState(timeline!.rootStateId);
      timelineStore.deleteState(stateId);

      const doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(1);
    });

    it("should handle multiple tangibles referencing same state", () => {
      const timelineStore = useTimelineStore.getState();

      const stateId = timelineStore.createState(
        "Shared State",
        undefined,
        false,
      );

      const { addTangibleToDocument } = useWorkspaceStore.getState();
      addTangibleToDocument(documentId, {
        name: "State Tangible 1",
        mode: "state",
        stateId: stateId,
        id: "", // Placeholder, will be auto-generated
      });
      addTangibleToDocument(documentId, {
        name: "State Tangible 2",
        mode: "state",
        stateId: stateId,
        id: "", // Placeholder, will be auto-generated
      });
      addTangibleToDocument(documentId, {
        name: "Different State",
        mode: "state",
        stateId: "other-state",
        id: "", // Placeholder, will be auto-generated
      });

      const timeline = timelineStore.timelines.get(documentId);
      timelineStore.switchToState(timeline!.rootStateId);
      timelineStore.deleteState(stateId);

      const doc = useWorkspaceStore.getState().documents.get(documentId);
      // Only tangible with ID 'different-state' (auto-generated from name) should remain
      expect(doc?.tangibles).toHaveLength(1);
    });
  });

  describe("Document loading and persistence", () => {
    it("should sync tangibles to graphStore when added to active document", () => {
      const { addTangibleToDocument, addLabelToDocument } =
        useWorkspaceStore.getState();

      // Add label first (required for filter mode)
      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      // Add tangibles to the active document
      addTangibleToDocument(documentId, {
        name: "Test Tangible 1",
        mode: "filter",
        filterLabels: ["label-1"],
        hardwareId: "token-001",
        id: "",
      });
      addTangibleToDocument(documentId, {
        name: "Test Tangible 2",
        mode: "filter",
        filterLabels: ["label-1"],
        hardwareId: "token-002",
        id: "",
      });

      // Tangibles should be in graphStore (synced by addTangibleToDocument)
      const graphTangibles = useGraphStore.getState().tangibles;
      expect(graphTangibles).toHaveLength(2);
      expect(graphTangibles[0].name).toBe("Test Tangible 1");
      expect(graphTangibles[1].name).toBe("Test Tangible 2");
    });

    it("should persist tangibles in document storage", () => {
      const { addTangibleToDocument, addLabelToDocument, saveDocument } =
        useWorkspaceStore.getState();

      // Add label first (required for filter mode)
      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      // Add tangible
      addTangibleToDocument(documentId, {
        name: "Persistent Tangible",
        mode: "filter",
        filterLabels: ["label-1"],
        hardwareId: "token-persistent",
        id: "",
      });

      // Save document (though addTangibleToDocument already saves to storage)
      saveDocument(documentId);

      // Verify tangible is persisted in document
      const doc = useWorkspaceStore.getState().documents.get(documentId);
      expect(doc?.tangibles).toHaveLength(1);
      expect(doc?.tangibles?.[0].hardwareId).toBe("token-persistent");
      expect(doc?.tangibles?.[0].name).toBe("Persistent Tangible");

      // Verify tangible is also in graphStore (synced by addTangibleToDocument)
      const graphTangibles = useGraphStore.getState().tangibles;
      expect(graphTangibles).toHaveLength(1);
      expect(graphTangibles[0].hardwareId).toBe("token-persistent");
    });

    it("should mark document as dirty when tangible is added", () => {
      const { addTangibleToDocument, addLabelToDocument } =
        useWorkspaceStore.getState();

      // Add label first
      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      // Clear dirty flag set by label addition
      const metadata = useWorkspaceStore
        .getState()
        .documentMetadata.get(documentId);
      if (metadata) {
        metadata.isDirty = false;
      }

      // Add tangible
      addTangibleToDocument(documentId, {
        name: "Test Tangible",
        mode: "filter",
        filterLabels: ["label-1"],
        id: "",
      });

      // Document should be marked as dirty
      const updatedMetadata = useWorkspaceStore
        .getState()
        .documentMetadata.get(documentId);
      expect(updatedMetadata?.isDirty).toBe(true);
    });
  });

  describe("Cross-store synchronization", () => {
    it("should sync tangibles to graphStore when label is deleted", () => {
      const {
        addLabelToDocument,
        deleteLabelFromDocument,
        addTangibleToDocument,
      } = useWorkspaceStore.getState();

      addLabelToDocument(documentId, {
        id: "label-1",
        name: "Label 1",
        color: "#000",
        appliesTo: "both",
      });

      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "Filter Tangible",
        mode: "filter",
        filterLabels: ["label-1"],
      });

      // Before deletion
      let graphState = useGraphStore.getState();
      expect(graphState.tangibles[0].filterLabels).toEqual(["label-1"]);

      // Delete label
      deleteLabelFromDocument(documentId, "label-1");

      // After deletion - graphStore should be synced
      graphState = useGraphStore.getState();
      expect(graphState.tangibles[0].filterLabels).toEqual([]);
    });

    it("should remove tangibles from graphStore when state is deleted", () => {
      const timelineStore = useTimelineStore.getState();
      const { addTangibleToDocument } = useWorkspaceStore.getState();

      const stateId = timelineStore.createState("Test State", undefined, false);

      addTangibleToDocument(documentId, {
        id: "tangible-1",
        name: "State Tangible",
        mode: "state",
        stateId: stateId,
      });

      // Before deletion
      let graphState = useGraphStore.getState();
      expect(graphState.tangibles).toHaveLength(1);

      // Delete state
      const timeline = timelineStore.timelines.get(documentId);
      timelineStore.switchToState(timeline!.rootStateId);
      timelineStore.deleteState(stateId);

      // After deletion - graphStore should be synced
      graphState = useGraphStore.getState();
      expect(graphState.tangibles).toHaveLength(0);
    });
  });
});
