import { useState, useEffect, KeyboardEvent } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import TangibleForm from './TangibleForm';
import type { TangibleConfig, TangibleMode, LabelConfig, ConstellationState } from '../../types';

interface Props {
  tangible: TangibleConfig;
  labels: LabelConfig[];
  states: ConstellationState[];
  onSave: (
    id: string,
    updates: {
      name: string;
      mode: TangibleMode;
      description?: string;
      hardwareId?: string;
      filterLabels?: string[];
      stateId?: string;
    }
  ) => void;
  onCancel: () => void;
}

const EditTangibleInline = ({ tangible, labels, states, onSave, onCancel }: Props) => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<TangibleMode>('filter');
  const [description, setDescription] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [stateId, setStateId] = useState('');

  // Sync state with tangible prop
  useEffect(() => {
    if (tangible) {
      setName(tangible.name);
      setMode(tangible.mode);
      setDescription(tangible.description || '');
      setHardwareId(tangible.hardwareId || '');
      setFilterLabels(tangible.filterLabels || []);
      setStateId(tangible.stateId || '');
    }
  }, [tangible]);

  const handleSave = () => {
    if (!name.trim()) return;

    // Validate mode-specific fields
    if (mode === 'filter' && filterLabels.length === 0) {
      alert('Filter mode requires at least one label');
      return;
    }
    if ((mode === 'state' || mode === 'stateDial') && !stateId) {
      alert('State mode requires a state selection');
      return;
    }

    onSave(tangible.id, {
      name: name.trim(),
      mode,
      description: description.trim() || undefined,
      hardwareId: hardwareId.trim() || undefined,
      filterLabels: mode === 'filter' ? filterLabels : undefined,
      stateId: (mode === 'state' || mode === 'stateDial') ? stateId : undefined,
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
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
          filterLabels={filterLabels}
          stateId={stateId}
          labels={labels}
          states={states}
          onNameChange={setName}
          onModeChange={setMode}
          onDescriptionChange={setDescription}
          onHardwareIdChange={setHardwareId}
          onFilterLabelsChange={setFilterLabels}
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
            {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter
          </kbd>{' '}
          to save, <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">Esc</kbd> to cancel
        </div>
      </div>
    </div>
  );
};

export default EditTangibleInline;
