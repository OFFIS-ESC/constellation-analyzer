import DeleteIcon from "@mui/icons-material/Delete";
import type { TangibleConfig, LabelConfig } from "../../types";
import type { ConstellationState } from "../../types/timeline";

interface Props {
  tangibles: TangibleConfig[];
  labels: LabelConfig[];
  states: ConstellationState[];
  onEdit: (tangible: TangibleConfig) => void;
  onDelete: (id: string) => void;
}

const TangibleManagementList = ({
  tangibles,
  states,
  onEdit,
  onDelete,
}: Props) => {
  if (tangibles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No tangibles yet.</p>
        <p className="text-xs mt-1">Add your first tangible above.</p>
      </div>
    );
  }

  const getModeDisplay = (tangible: TangibleConfig) => {
    switch (tangible.mode) {
      case "filter": {
        const labelCount = tangible.filterLabels?.length || 0;
        return `Filter (${labelCount} label${labelCount !== 1 ? "s" : ""})`;
      }
      case "state": {
        const state = states.find((s) => s.id === tangible.stateId);
        return `State: ${state?.label || "Unknown"}`;
      }
      case "stateDial": {
        const dialState = states.find((s) => s.id === tangible.stateId);
        return `State Dial: ${dialState?.label || "Unknown"}`;
      }
      default:
        return tangible.mode;
    }
  };

  return (
    <div className="space-y-2">
      {tangibles.map((tangible) => (
        <div
          key={tangible.id}
          className="group bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          onClick={() => onEdit(tangible)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onEdit(tangible);
            }
          }}
          aria-label={`Edit ${tangible.name}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {tangible.name}
              </h4>
              {tangible.hardwareId && (
                <p className="text-xs text-gray-600 mt-1">
                  Hardware:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    {tangible.hardwareId}
                  </code>
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {getModeDisplay(tangible)}
              </p>
              {tangible.description && (
                <p className="text-xs text-gray-400 mt-1 italic truncate">
                  {tangible.description}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tangible.id);
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label={`Delete ${tangible.name}`}
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TangibleManagementList;
