import type { TangibleMode, LabelConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";

interface Props {
  name: string;
  mode: TangibleMode;
  description: string;
  hardwareId: string;
  filterLabels: string[];
  stateId: string;
  labels: LabelConfig[];
  states: ConstellationState[];
  onNameChange: (value: string) => void;
  onModeChange: (value: TangibleMode) => void;
  onDescriptionChange: (value: string) => void;
  onHardwareIdChange: (value: string) => void;
  onFilterLabelsChange: (value: string[]) => void;
  onStateIdChange: (value: string) => void;
}

const TangibleForm = ({
  name,
  mode,
  description,
  hardwareId,
  filterLabels,
  stateId,
  labels,
  states,
  onNameChange,
  onModeChange,
  onDescriptionChange,
  onHardwareIdChange,
  onFilterLabelsChange,
  onStateIdChange,
}: Props) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Red Block, Filter Card"
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
          placeholder="e.g., token-001, device-a"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Maps this configuration to a physical token or device
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Mode *
        </label>
        <div className="space-y-2">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="filter"
              checked={mode === "filter"}
              onChange={(e) => onModeChange(e.target.value as TangibleMode)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Filter mode (activate label filters)
            </span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="state"
              checked={mode === "state"}
              onChange={(e) => onModeChange(e.target.value as TangibleMode)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              State mode (switch to timeline state)
            </span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="stateDial"
              checked={mode === "stateDial"}
              onChange={(e) => onModeChange(e.target.value as TangibleMode)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              State dial mode (clock-like, deferred)
            </span>
          </label>
        </div>
      </div>

      {/* Mode-specific fields */}
      {mode === "filter" && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Filter Labels * (select one or more)
          </label>
          <div className="border border-gray-300 rounded-md p-2 max-h-40 overflow-y-auto">
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
                    checked={filterLabels.includes(label.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onFilterLabelsChange([...filterLabels, label.id]);
                      } else {
                        onFilterLabelsChange(
                          filterLabels.filter((id) => id !== label.id),
                        );
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
