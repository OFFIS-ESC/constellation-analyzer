import { useState, useRef, KeyboardEvent } from "react";
import { useTuioStore } from "../../stores/tuioStore";
import TangibleForm from "./TangibleForm";
import { validateTangibleForm, type TangibleFormErrors } from "./tangibleValidation";
import type { TangibleMode, LabelConfig, FilterConfig, NodeTypeConfig, EdgeTypeConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";

interface Props {
  labels: LabelConfig[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  states: ConstellationState[];
  /**
   * Returns an error message when the tangible was rejected, nothing on
   * success. Rejections are shown inline on the hardware ID field, the only
   * constraint the form cannot check for itself.
   */
  onAdd: (tangible: {
    name: string;
    mode: TangibleMode;
    description: string;
    hardwareId?: string;
    filters?: FilterConfig;
    stateId?: string;
  }) => string | null | void;
}

const QuickAddTangibleForm = ({ labels, nodeTypes, edgeTypes, states, onAdd }: Props) => {
  // Get the last detected tangible ID from TUIO store
  const activeTangibles = useTuioStore((state) => state.activeTangibles);
  const suggestedHardwareId = activeTangibles.size > 0
    ? Array.from(activeTangibles.keys()).pop()
    : undefined;
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
  const [errors, setErrors] = useState<TangibleFormErrors>({});

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const validation = validateTangibleForm({ name, mode, filters, stateId });
    if (validation) {
      setErrors(validation);
      if (validation.name) nameInputRef.current?.focus();
      return;
    }

    const error = onAdd({
      name: name.trim(),
      mode,
      description,
      hardwareId: hardwareId.trim() || undefined,
      filters: mode === "filter" ? filters : undefined,
      stateId: mode === "state" || mode === "stateDial" ? stateId : undefined,
    });
    if (error) {
      setErrors({ hardwareId: error });
      return;
    }

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
    setErrors({});

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
      setErrors({});
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
        suggestedHardwareId={suggestedHardwareId}
        onNameChange={(value) => {
          setName(value);
          setErrors((prev) => ({ ...prev, name: undefined }));
        }}
        onHardwareIdChange={(value) => {
          setHardwareId(value);
          setErrors((prev) => ({ ...prev, hardwareId: undefined }));
        }}
        onModeChange={setMode}
        onDescriptionChange={setDescription}
        onFiltersChange={(value) => {
          setFilters(value);
          setErrors((prev) => ({ ...prev, filters: undefined }));
        }}
        onStateIdChange={(value) => {
          setStateId(value);
          setErrors((prev) => ({ ...prev, state: undefined }));
        }}
        nameInputRef={nameInputRef}
        nameError={errors.name}
        hardwareIdError={errors.hardwareId}
        filtersError={errors.filters}
        stateError={errors.state}
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
