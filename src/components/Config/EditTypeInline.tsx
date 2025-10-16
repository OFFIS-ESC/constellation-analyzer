import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import TypeFormFields from './TypeFormFields';
import type { NodeTypeConfig, NodeShape } from '../../types';

/**
 * EditTypeInline - Inline edit view that replaces the right column
 *
 * Features:
 * - Replaces management list in right column when editing
 * - Reuses TypeFormFields
 * - Save/Cancel actions
 * - Keyboard accessible (Cmd/Ctrl+Enter to save, Escape to cancel)
 */

interface Props {
  type: NodeTypeConfig;
  onSave: (
    id: string,
    updates: {
      label: string;
      color: string;
      shape: NodeShape;
      icon?: string;
      description?: string;
    }
  ) => void;
  onCancel: () => void;
}

const EditTypeInline = ({ type, onSave, onCancel }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [shape, setShape] = useState<NodeShape>('rectangle');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync state with type prop
  useEffect(() => {
    if (type) {
      setName(type.label);
      setColor(type.color);
      setShape(type.shape || 'rectangle');
      setIcon(type.icon || '');
      setDescription(type.description || '');
    }
  }, [type]);

  const handleSave = () => {
    if (!name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    onSave(type.id, {
      label: name.trim(),
      color,
      shape,
      icon: icon || undefined,
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
    <div className="flex flex-col min-h-full">
      {/* Form Fields */}
      <div className="flex-1 mb-6">
        <TypeFormFields
          name={name}
          color={color}
          shape={shape}
          icon={icon}
          description={description}
          onNameChange={setName}
          onColorChange={setColor}
          onShapeChange={setShape}
          onIconChange={setIcon}
          onDescriptionChange={setDescription}
          onKeyDown={handleKeyDown}
          nameInputRef={nameInputRef}
          autoFocusName={true}
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

export default EditTypeInline;
