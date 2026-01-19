import { useState, useRef, KeyboardEvent } from "react";
import TangibleForm from "./TangibleForm";
import type { TangibleMode, LabelConfig, FilterConfig, NodeTypeConfig, EdgeTypeConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";

interface Props {
  labels: LabelConfig[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  states: ConstellationState[];
  onAdd: (tangible: {
    name: string;
    mode: TangibleMode;
    description: string;
    hardwareId?: string;
    filters?: FilterConfig;
    stateId?: string;
  }) => void;
}

const QuickAddTangibleForm = ({ labels, nodeTypes, edgeTypes, states, onAdd }: Props) => {
  const [name, setName] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [mode, setMode] = useState<TangibleMode>("filter");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<FilterConfig>({
    labels: [],
    actorTypes: [],
    relationTypes: [],
    combineMode: 'OR' // Default to OR for tangibles
  });
  const [stateId, setStateId] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    // Validate mode-specific fields
    if (mode === "filter") {
      const hasFilters =
        (filters.labels && filters.labels.length > 0) ||
        (filters.actorTypes && filters.actorTypes.length > 0) ||
        (filters.relationTypes && filters.relationTypes.length > 0);

      if (!hasFilters) {
        alert("Filter mode requires at least one filter (labels, actor types, or relation types)");
        return;
      }
    }
    if ((mode === "state" || mode === "stateDial") && !stateId) {
      alert("State mode requires a state selection");
      return;
    }

    onAdd({
      name: name.trim(),
      mode,
      description,
      hardwareId: hardwareId.trim() || undefined,
      filters: mode === "filter" ? filters : undefined,
      stateId: mode === "state" || mode === "stateDial" ? stateId : undefined,
    });

    // Reset form
    setName("");
    setHardwareId("");
    setMode("filter");
    setDescription("");
    setFilters({
      labels: [],
      actorTypes: [],
      relationTypes: [],
      combineMode: 'OR'
    });
    setStateId("");

    nameInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setName("");
      setHardwareId("");
      setMode("filter");
      setDescription("");
      setFilters({
        labels: [],
        actorTypes: [],
        relationTypes: [],
        combineMode: 'OR'
      });
      setStateId("");
      nameInputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-3" onKeyDown={handleKeyDown}>
      <TangibleForm
        name={name}
        hardwareId={hardwareId}
        mode={mode}
        description={description}
        filters={filters}
        stateId={stateId}
        labels={labels}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        states={states}
        onNameChange={setName}
        onHardwareIdChange={setHardwareId}
        onModeChange={setMode}
        onDescriptionChange={setDescription}
        onFiltersChange={setFilters}
        onStateIdChange={setStateId}
      />

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Add tangible"
      >
        Add Tangible
      </button>

      {/* Keyboard Shortcuts Hint */}
      {name && (
        <div className="text-xs text-gray-500 italic">
          Press Enter to add, Escape to cancel
        </div>
      )}
    </div>
  );
};

export default QuickAddTangibleForm;
