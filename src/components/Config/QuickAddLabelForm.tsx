import { useState, useRef, KeyboardEvent } from 'react';
import LabelForm from './LabelForm';
import type { LabelScope } from '../../types';

/**
 * QuickAddLabelForm - Streamlined form for quickly adding new labels
 *
 * Features:
 * - Quick add with name, color, and scope
 * - Keyboard accessible (Enter to submit, Escape to cancel)
 * - Focus management
 * - Rejections from onAdd surface inline on the name field; the form keeps its
 *   contents so the user can correct the name instead of retyping everything
 */

interface Props {
  /** Returns an error message when the label was rejected, nothing on success */
  onAdd: (label: {
    name: string;
    color: string;
    appliesTo: LabelScope;
    description: string;
  }) => string | null | void;
}

const QuickAddLabelForm = ({ onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [appliesTo, setAppliesTo] = useState<LabelScope>('both');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      setNameError('Name is required');
      nameInputRef.current?.focus();
      return;
    }

    const error = onAdd({ name: name.trim(), color, appliesTo, description });
    if (error) {
      setNameError(error);
      nameInputRef.current?.focus();
      return;
    }

    // Reset form
    setName('');
    setColor('#6366f1');
    setAppliesTo('both');
    setDescription('');
    setNameError(null);

    // Focus back to name input for quick subsequent additions
    nameInputRef.current?.focus();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(null);
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
      setAppliesTo('both');
      setDescription('');
      setNameError(null);
      nameInputRef.current?.blur();
    }
  };

  return (
    <div className="space-y-3" onKeyDown={handleKeyDown}>
      <LabelForm
        name={name}
        color={color}
        appliesTo={appliesTo}
        description={description}
        onNameChange={handleNameChange}
        onColorChange={setColor}
        onAppliesToChange={setAppliesTo}
        onDescriptionChange={setDescription}
        nameInputRef={nameInputRef}
        nameError={nameError}
      />

      <button
        onClick={handleSubmit}
        className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Add label"
      >
        Add Label
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

export default QuickAddLabelForm;
