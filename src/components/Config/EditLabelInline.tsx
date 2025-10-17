import { useState, useEffect, KeyboardEvent } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import LabelForm from './LabelForm';
import type { LabelConfig, LabelScope } from '../../types';

/**
 * EditLabelInline - Inline edit view that replaces the right column
 *
 * Features:
 * - Replaces management list in right column when editing
 * - Reuses LabelForm
 * - Save/Cancel actions
 * - Keyboard accessible (Cmd/Ctrl+Enter to save, Escape to cancel)
 */

interface Props {
  label: LabelConfig;
  onSave: (
    id: string,
    updates: {
      name: string;
      color: string;
      appliesTo: LabelScope;
      description?: string;
    }
  ) => void;
  onCancel: () => void;
}

const EditLabelInline = ({ label, onSave, onCancel }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [appliesTo, setAppliesTo] = useState<LabelScope>('both');
  const [description, setDescription] = useState('');

  // Sync state with label prop
  useEffect(() => {
    if (label) {
      setName(label.name);
      setColor(label.color);
      setAppliesTo(label.appliesTo);
      setDescription(label.description || '');
    }
  }, [label]);

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    onSave(label.id, {
      name: name.trim(),
      color,
      appliesTo,
      description: description.trim() || undefined,
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
        <LabelForm
          name={name}
          color={color}
          appliesTo={appliesTo}
          description={description}
          onNameChange={setName}
          onColorChange={setColor}
          onAppliesToChange={setAppliesTo}
          onDescriptionChange={setDescription}
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

export default EditLabelInline;
