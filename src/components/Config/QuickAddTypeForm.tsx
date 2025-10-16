import { useState, useRef, KeyboardEvent } from 'react';
import TypeFormFields from './TypeFormFields';
import type { NodeShape } from '../../types';

/**
 * QuickAddTypeForm - Streamlined form for quickly adding new actor types
 *
 * Features:
 * - One-line quick add (name + color + button)
 * - Progressive disclosure for advanced options
 * - Keyboard accessible (Enter to submit, Escape to cancel)
 * - Focus management
 */

interface Props {
  onAdd: (type: {
    name: string;
    color: string;
    shape: NodeShape;
    icon: string;
    description: string;
  }) => void;
}

const QuickAddTypeForm = ({ onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [shape, setShape] = useState<NodeShape>('rectangle');
  const [icon, setIcon] = useState('');
  const [description, setDescription] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    onAdd({ name: name.trim(), color, shape, icon, description });

    // Reset form
    setName('');
    setColor('#6366f1');
    setShape('rectangle');
    setIcon('');
    setDescription('');

    // Focus back to name input for quick subsequent additions
    nameInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      // Reset form
      setName('');
      setColor('#6366f1');
      setShape('rectangle');
      setIcon('');
      setDescription('');
      nameInputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-3">
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
        autoFocusName={false}
        showAdvancedByDefault={false}
      />

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Add actor type"
      >
        Add Type
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

export default QuickAddTypeForm;
