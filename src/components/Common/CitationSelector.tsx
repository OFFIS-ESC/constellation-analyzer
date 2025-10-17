import { useState, useRef, useEffect } from 'react';
import { useBibliographyStore } from '../../stores/bibliographyStore';
import { formatShortCitation } from '../../utils/bibliography/formatting';
import CloseIcon from '@mui/icons-material/Close';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import type { BibliographyReference } from '../../types/bibliography';

interface CitationSelectorProps {
  value: string[];
  onChange: (citationIds: string[]) => void;
  onOpenBibliography?: () => void;
}

const CitationSelector = ({ value, onChange, onOpenBibliography }: CitationSelectorProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { getReferences } = useBibliographyStore();

  const allReferences = getReferences();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter references by search query
  const filteredReferences = allReferences.filter(ref => {
    const query = inputValue.toLowerCase();
    const title = (ref.title || '').toLowerCase();
    const authors = ref.author?.map(a =>
      a.literal || `${a.given || ''} ${a.family || ''}`.trim()
    ).join(' ').toLowerCase() || '';
    const year = ref.issued?.['date-parts']?.[0]?.[0]?.toString() || '';

    return title.includes(query) || authors.includes(query) || year.includes(query);
  });

  // Get selected references
  const selectedReferences = value
    .map(id => allReferences.find(ref => ref.id === id))
    .filter((ref): ref is BibliographyReference => ref !== undefined);

  const handleToggleReference = (refId: string) => {
    if (value.includes(refId)) {
      onChange(value.filter(id => id !== refId));
    } else {
      onChange([...value, refId]);
    }
  };

  const handleRemoveReference = (refId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(id => id !== refId));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key !== 'Escape') {
      setIsOpen(true);
      return;
    }

    const totalOptions = filteredReferences.length;
    if (totalOptions === 0) return;

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
        if (highlightedIndex >= 0 && highlightedIndex < totalOptions) {
          handleToggleReference(filteredReferences[highlightedIndex].id);
          setInputValue('');
          setHighlightedIndex(0);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setInputValue('');
        inputRef.current?.blur();
        break;
    }
  };

  // Reset highlighted index when filtered references change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Citations Display */}
      {selectedReferences.length > 0 && (
        <div className="mb-2 space-y-1">
          {selectedReferences.map(ref => (
            <div
              key={ref.id}
              className="flex items-start justify-between gap-2 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 line-clamp-1">
                  {ref.title || 'Untitled'}
                </div>
                <div className="text-gray-600 text-xs">
                  {formatShortCitation(ref)}
                </div>
              </div>
              <button
                onClick={(e) => handleRemoveReference(ref.id, e)}
                className="flex-shrink-0 p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                aria-label="Remove citation"
              >
                <CloseIcon sx={{ fontSize: 14 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text Input Field */}
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
        placeholder="Type to search citations..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 flex flex-col">
          {/* Reference List */}
          <div className="flex-1 overflow-y-auto">
            {filteredReferences.length === 0 ? (
              <div className="p-4 text-center">
                {allReferences.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">No references yet.</p>
                    {onOpenBibliography && (
                      <button
                        onClick={() => {
                          onOpenBibliography();
                          setIsOpen(false);
                          setInputValue('');
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                      >
                        <MenuBookIcon sx={{ fontSize: 16 }} />
                        Add References
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No matching references.</p>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredReferences.map((ref, index) => {
                  const isSelected = value.includes(ref.id);
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <button
                      key={ref.id}
                      onClick={() => {
                        handleToggleReference(ref.id);
                        setInputValue('');
                        setHighlightedIndex(0);
                      }}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        isHighlighted ? 'bg-gray-100' : isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by button onClick
                          className="mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {ref.title || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatShortCitation(ref)}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {allReferences.length > 0 && onOpenBibliography && (
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => {
                  onOpenBibliography();
                  setIsOpen(false);
                  setInputValue('');
                }}
                className="w-full px-2 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
              >
                <MenuBookIcon sx={{ fontSize: 14 }} />
                Manage Bibliography
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitationSelector;
