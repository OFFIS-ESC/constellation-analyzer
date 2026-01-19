import type { TangibleMode, LabelConfig, FilterConfig, NodeTypeConfig, EdgeTypeConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";

interface Props {
  name: string;
  mode: TangibleMode;
  description: string;
  hardwareId: string;
  /**
   * @deprecated Use filters instead. Kept for backward compatibility.
   */
  filterLabels?: string[];
  filters: FilterConfig;
  stateId: string;
  labels: LabelConfig[];
  nodeTypes: NodeTypeConfig[];
  edgeTypes: EdgeTypeConfig[];
  states: ConstellationState[];
  onNameChange: (value: string) => void;
  onModeChange: (value: TangibleMode) => void;
  onDescriptionChange: (value: string) => void;
  onHardwareIdChange: (value: string) => void;
  /**
   * @deprecated Use onFiltersChange instead. Kept for backward compatibility.
   */
  onFilterLabelsChange?: (value: string[]) => void;
  onFiltersChange: (value: FilterConfig) => void;
  onStateIdChange: (value: string) => void;
}

const TangibleForm = ({
  name,
  mode,
  description,
  hardwareId,
  filters,
  stateId,
  labels,
  nodeTypes,
  edgeTypes,
  states,
  onNameChange,
  onModeChange,
  onDescriptionChange,
  onHardwareIdChange,
  onFiltersChange,
  onStateIdChange,
}: Props) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="e.g., Red Block"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Hardware ID (optional)
          </label>
          <input
            type="text"
            value={hardwareId}
            onChange={(e) => onHardwareIdChange(e.target.value)}
            placeholder="e.g., token-001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-500">
          Hardware ID maps this configuration to a physical token or device
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Mode *
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onModeChange("filter")}
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center ${
              mode === "filter"
                ? "bg-blue-500 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">Filter</div>
            <div className="text-xs opacity-80">Apply filters</div>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("state")}
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center ${
              mode === "state"
                ? "bg-blue-500 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">State</div>
            <div className="text-xs opacity-80">Timeline state</div>
          </button>
          <button
            type="button"
            onClick={() => onModeChange("stateDial")}
            className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center ${
              mode === "stateDial"
                ? "bg-blue-500 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="font-medium">State Dial</div>
            <div className="text-xs opacity-80">Deferred</div>
          </button>
        </div>
      </div>

      {/* Mode-specific fields */}
      {mode === "filter" && (
        <div className="space-y-3">
          {/* Filter Combine Mode */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Combine Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, combineMode: 'OR' })}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center ${
                  (filters.combineMode || 'OR') === 'OR'
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">OR</div>
                <div className="text-xs opacity-80">Match ANY</div>
              </button>
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, combineMode: 'AND' })}
                className={`flex-1 px-3 py-2 text-sm rounded-md border transition-colors text-center ${
                  filters.combineMode === 'AND'
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">AND</div>
                <div className="text-xs opacity-80">Match ALL</div>
              </button>
            </div>
          </div>

          {/* Filter by Labels */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter by Labels (optional)
            </label>
            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
              {labels.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No labels available
                </p>
              ) : (
                labels.map((label) => (
                  <label
                    key={label.id}
                    className="flex items-center py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.labels?.includes(label.id) || false}
                      onChange={(e) => {
                        const currentLabels = filters.labels || [];
                        if (e.target.checked) {
                          onFiltersChange({
                            ...filters,
                            labels: [...currentLabels, label.id],
                          });
                        } else {
                          onFiltersChange({
                            ...filters,
                            labels: currentLabels.filter((id) => id !== label.id),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm text-gray-700">{label.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Filter by Actor Types */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter by Actor Types (optional)
            </label>
            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
              {nodeTypes.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No actor types available
                </p>
              ) : (
                nodeTypes.map((nodeType) => (
                  <label
                    key={nodeType.id}
                    className="flex items-center py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.actorTypes?.includes(nodeType.id) || false}
                      onChange={(e) => {
                        const currentActorTypes = filters.actorTypes || [];
                        if (e.target.checked) {
                          onFiltersChange({
                            ...filters,
                            actorTypes: [...currentActorTypes, nodeType.id],
                          });
                        } else {
                          onFiltersChange({
                            ...filters,
                            actorTypes: currentActorTypes.filter((id) => id !== nodeType.id),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: nodeType.color }}
                    />
                    <span className="text-sm text-gray-700">{nodeType.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Filter by Relation Types */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Filter by Relation Types (optional)
            </label>
            <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
              {edgeTypes.length === 0 ? (
                <p className="text-xs text-gray-500 italic">
                  No relation types available
                </p>
              ) : (
                edgeTypes.map((edgeType) => (
                  <label
                    key={edgeType.id}
                    className="flex items-center py-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.relationTypes?.includes(edgeType.id) || false}
                      onChange={(e) => {
                        const currentRelationTypes = filters.relationTypes || [];
                        if (e.target.checked) {
                          onFiltersChange({
                            ...filters,
                            relationTypes: [...currentRelationTypes, edgeType.id],
                          });
                        } else {
                          onFiltersChange({
                            ...filters,
                            relationTypes: currentRelationTypes.filter((id) => id !== edgeType.id),
                          });
                        }
                      }}
                      className="mr-2"
                    />
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: edgeType.color }}
                    />
                    <span className="text-sm text-gray-700">{edgeType.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {(mode === "state" || mode === "stateDial") && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Timeline State *
          </label>
          <select
            value={stateId}
            onChange={(e) => onStateIdChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a state...</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Brief description of this tangible"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default TangibleForm;
