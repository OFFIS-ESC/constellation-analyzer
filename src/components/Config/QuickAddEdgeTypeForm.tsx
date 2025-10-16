import { useState, useRef, KeyboardEvent } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EdgeTypeFormFields from './EdgeTypeFormFields';
import type { EdgeDirectionality } from '../../types';

/**
 * QuickAddEdgeTypeForm - Quick add form for new relation types
 *
 * Features:
 * - Compact form using EdgeTypeFormFields
 * - Keyboard accessible (Cmd/Ctrl+Enter to add)
 * - Auto-clears after successful add
 * - Focus management
 */

interface Props {
  onAdd: (data: {
    label: string;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
    defaultDirectionality: EdgeDirectionality;
  }) => void;
}

const QuickAddEdgeTypeForm = ({ onAdd }: Props) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [style, setStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [defaultDirectionality, setDefaultDirectionality] = useState<EdgeDirectionality>('directed');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!name.trim()) {
      nameInputRef.current?.focus();
      return;
    }

    onAdd({
      label: name.trim(),
      color,
      style,
      defaultDirectionality,
    });

    // Reset form
    setName('');
    setColor('#6366f1');
    setStyle('solid');
    setDefaultDirectionality('directed');
    nameInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Add New Relation Type</h3>

      <EdgeTypeFormFields
        name={name}
        color={color}
        style={style}
        defaultDirectionality={defaultDirectionality}
        onNameChange={setName}
        onColorChange={setColor}
        onStyleChange={setStyle}
        onDefaultDirectionalityChange={setDefaultDirectionality}
        onKeyDown={handleKeyDown}
        nameInputRef={nameInputRef}
        autoFocusName={false}
      />

      <button
        onClick={handleAdd}
        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
      >
        <AddIcon fontSize="small" />
        Add Relation Type
      </button>

      <div className="text-xs text-gray-500 text-center mt-2">
        <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
          {navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter
        </kbd>{' '}
        to add
      </div>
    </div>
  );
};

export default QuickAddEdgeTypeForm;
