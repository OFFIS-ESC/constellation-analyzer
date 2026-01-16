import { useState, useRef, KeyboardEvent } from 'react';
import TangibleForm from './TangibleForm';
import type { TangibleMode, LabelConfig, ConstellationState } from '../../types';

interface Props {
  labels: LabelConfig[];
  states: ConstellationState[];
  onAdd: (tangible: {
    name: string;
    mode: TangibleMode;
    description: string;
    hardwareId?: string;
    filterLabels?: string[];
    stateId?: string;
  }) => void;
}

const QuickAddTangibleForm = ({ labels, states, onAdd }: Props) => {
  const [name, setName] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [mode, setMode] = useState<TangibleMode>('filter');
  const [description, setDescription] = useState('');
  const [filterLabels, setFilterLabels] = useState<string[]>([]);
  const [stateId, setStateId] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    // Validate mode-specific fields
    if (mode === 'filter' && filterLabels.length === 0) {
      alert('Filter mode requires at least one label');
      return;
    }
    if ((mode === 'state' || mode === 'stateDial') && !stateId) {
      alert('State mode requires a state selection');
      return;
    }

    onAdd({
      name: name.trim(),
      mode,
      description,
      hardwareId: hardwareId.trim() || undefined,
      filterLabels: mode === 'filter' ? filterLabels : undefined,
      stateId: (mode === 'state' || mode === 'stateDial') ? stateId : undefined,
    });

    // Reset form
    setName('');
    setHardwareId('');
    setMode('filter');
    setDescription('');
    setFilterLabels([]);
    setStateId('');

    nameInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setName('');
      setHardwareId('');
      setMode('filter');
      setDescription('');
      setFilterLabels([]);
      setStateId('');
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
        filterLabels={filterLabels}
        stateId={stateId}
        labels={labels}
        states={states}
        onNameChange={setName}
        onHardwareIdChange={setHardwareId}
        onModeChange={setMode}
        onDescriptionChange={setDescription}
        onFilterLabelsChange={setFilterLabels}
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
