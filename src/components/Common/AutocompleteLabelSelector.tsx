import { useState, useRef, useEffect } from 'react';
import { useGraphStore } from '../../stores/graphStore';
import { useGraphWithHistory } from '../../hooks/useGraphWithHistory';
import LabelBadge from './LabelBadge';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

/**
 * AutocompleteLabelSelector - Text input with autocomplete dropdown for label selection
 *
 * Features:
 * - Type to search/filter available labels
 * - Quick create new label with typed name and random color
 * - Multi-select with badge display
 * - Keyboard navigation (arrow keys, enter, escape)
 */

interface Props {
  value: string[]; // Selected label IDs
  onChange: (labelIds: string[]) => void;
  scope: 'actors' | 'relations';
}

// Generate random pastel color for new labels
const generateRandomColor = () => {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue}, 70%, 65%)`;
};

const AutocompleteLabelSelector = ({ value, onChange, scope }: Props) => {
  const labels = useGraphStore((state) => state.labels);
  const { addLabel } = useGraphWithHistory();

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter labels by scope and search text
  const availableLabels = labels.filter(
    (label) => (label.appliesTo === scope || label.appliesTo === 'both') && !value.includes(label.id)
  );

  const filteredLabels = inputValue.trim()
    ? availableLabels.filter((label) =>
        label.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : availableLabels;

  // Check if input matches an existing label exactly
  const exactMatch = filteredLabels.find(
    (label) => label.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  // Show "Create new" option if there's input text and no exact match
  const showCreateOption = inputValue.trim() && !exactMatch;

  // Combined options: filtered labels + create option
  const totalOptions = filteredLabels.length + (showCreateOption ? 1 : 0);

  // Get selected label configs
  const selectedLabels = value
    .map((id) => labels.find((l) => l.id === id))
    .filter((label): label is NonNullable<typeof label> => label !== undefined);

  // Handle selecting an existing label
  const handleSelectLabel = (labelId: string) => {
    if (!value.includes(labelId)) {
      onChange([...value, labelId]);
    }
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  // Handle creating a new label
  const handleCreateLabel = () => {
    const name = inputValue.trim();
    if (!name) return;

    // Generate label ID from name (same logic as LabelConfig)
    const id = name.toLowerCase().replace(/\s+/g, '-');

    // Check if ID already exists
    if (labels.some((l) => l.id === id)) {
      // If label already exists, just select it
      onChange([...value, id]);
      setInputValue('');
      setIsOpen(false);
      setHighlightedIndex(0);
      return;
    }

    // Create new label (default to 'both' so it can be used anywhere)
    const newLabel = {
      id,
      name,
      color: generateRandomColor(),
      appliesTo: 'both' as const,
    };

    addLabel(newLabel);
    onChange([...value, id]);
    setInputValue('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  // Handle removing a selected label
  const handleRemoveLabel = (labelId: string) => {
    onChange(value.filter((id) => id !== labelId));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case 'Enter':
        e.preventDefault();
        if (totalOptions > 0) {
          if (showCreateOption && highlightedIndex === filteredLabels.length) {
            handleCreateLabel();
          } else if (highlightedIndex < filteredLabels.length) {
            handleSelectLabel(filteredLabels[highlightedIndex].id);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setInputValue('');
        setHighlightedIndex(0);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue]);

  return (
    <div className="relative">
      {/* Selected labels */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedLabels.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-1 group"
            >
              <LabelBadge
                name={label.name}
                color={label.color}
                size="sm"
              />
              <button
                onClick={() => handleRemoveLabel(label.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1"
                title="Remove label"
              >
                <CloseIcon sx={{ fontSize: 14 }} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Type to search or create labels..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Dropdown */}
      {isOpen && (filteredLabels.length > 0 || showCreateOption) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto"
        >
          {/* Existing labels */}
          {filteredLabels.map((label, index) => (
            <button
              key={label.id}
              onClick={() => handleSelectLabel(label.id)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                index === highlightedIndex ? 'bg-gray-100' : ''
              }`}
            >
              <LabelBadge
                name={label.name}
                color={label.color}
                size="sm"
              />
            </button>
          ))}

          {/* Create new label option */}
          {showCreateOption && (
            <button
              onClick={handleCreateLabel}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex items-center gap-2 border-t border-gray-200 ${
                highlightedIndex === filteredLabels.length ? 'bg-blue-50' : ''
              }`}
            >
              <AddIcon fontSize="small" className="text-blue-600" />
              <span className="text-blue-600 font-medium">
                Create "{inputValue.trim()}"
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteLabelSelector;
