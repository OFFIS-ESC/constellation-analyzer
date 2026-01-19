import { useState, useEffect, KeyboardEvent } from "react";
import SaveIcon from "@mui/icons-material/Save";
import TangibleForm from "./TangibleForm";
import type { TangibleConfig, TangibleMode, LabelConfig, FilterConfig, NodeTypeConfig, EdgeTypeConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";
import { migrateTangibleConfig } from "../../utils/tangibleMigration";

interface Props {
  tangible: TangibleConfig;
  labels: LabelConfig[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  states: ConstellationState[];
  onSave: (
    id: string,
    updates: {
      name: string;
      mode: TangibleMode;
      description?: string;
      hardwareId?: string;
      filters?: FilterConfig;
      stateId?: string;
    },
  ) => void;
  onCancel: () => void;
}

const EditTangibleInline = ({
  tangible,
  labels,
  nodeTypes,
  edgeTypes,
  states,
  onSave,
  onCancel,
}: Props) => {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<TangibleMode>("filter");
  const [description, setDescription] = useState("");
  const [hardwareId, setHardwareId] = useState("");
  const [filters, setFilters] = useState<FilterConfig>({
    labels: [],
    actorTypes: [],
    relationTypes: [],
    combineMode: 'OR'
  });
  const [stateId, setStateId] = useState("");

  // Sync state with tangible prop
  useEffect(() => {
    if (tangible) {
      // Apply migration for backward compatibility
      const migratedTangible = migrateTangibleConfig(tangible);

      setName(migratedTangible.name);
      setMode(migratedTangible.mode);
      setDescription(migratedTangible.description || "");
      setHardwareId(migratedTangible.hardwareId || "");
      setFilters(migratedTangible.filters || {
        labels: [],
        actorTypes: [],
        relationTypes: [],
        combineMode: 'OR'
      });
      // Ensure combineMode is set (default to OR for backward compatibility)
      if (migratedTangible.filters && !migratedTangible.filters.combineMode) {
        setFilters({
          ...migratedTangible.filters,
          combineMode: 'OR'
        });
      }
      setStateId(migratedTangible.stateId || "");
    }
  }, [tangible]);

  const handleSave = () => {
    if (!name.trim()) return;

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

    onSave(tangible.id, {
      name: name.trim(),
      mode,
      description: description.trim() || undefined,
      hardwareId: hardwareId.trim() || undefined,
      filters: mode === "filter" ? filters : undefined,
      stateId: mode === "state" || mode === "stateDial" ? stateId : undefined,
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="flex flex-col min-h-full" onKeyDown={handleKeyDown}>
      {/* Form Fields */}
      <div className="flex-1 mb-6">
        <TangibleForm
          name={name}
          mode={mode}
          description={description}
          hardwareId={hardwareId}
          filters={filters}
          stateId={stateId}
          labels={labels}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          states={states}
          onNameChange={setName}
          onModeChange={setMode}
          onDescriptionChange={setDescription}
          onHardwareIdChange={setHardwareId}
          onFiltersChange={setFilters}
          onStateIdChange={setStateId}
        />
      </div>

      {/* Actions */}
      <div className="pt-6 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <SaveIcon fontSize="small" />
            Save Changes
          </button>
        </div>

        {/* Keyboard Shortcut Hint */}
        <div className="text-xs text-gray-500 text-center">
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
          </kbd>{" "}
          to save,{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
            Esc
          </kbd>{" "}
          to cancel
        </div>
      </div>
    </div>
  );
};

export default EditTangibleInline;
