import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useBibliographyWithHistory } from '../../hooks/useBibliographyWithHistory';
import { useBibliographyStore } from '../../stores/bibliographyStore';
import { useToastStore } from '../../stores/toastStore';
import { isValidCitationInput, getInputTypeHint } from '../../utils/bibliography/smart-parser';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import type { CSLReference } from '../../types/bibliography';

const QuickAddReferenceForm = () => {
  const [smartInput, setSmartInput] = useState('');
  const [manualEntry, setManualEntry] = useState(false);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [type, setType] = useState<CSLReference['type']>('article-journal');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const smartInputRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { addReference } = useBibliographyWithHistory();
  const { parseInput } = useBibliographyStore();
  const { showToast } = useToastStore();

  // Auto-focus appropriate field
  useEffect(() => {
    if (manualEntry) {
      titleInputRef.current?.focus();
    } else {
      smartInputRef.current?.focus();
    }
  }, [manualEntry]);

  const resetForm = () => {
    setSmartInput('');
    setTitle('');
    setAuthors('');
    setYear('');
    setType('article-journal');
    setDescription('');
    setManualEntry(false);
  };

  const handleSmartAdd = async () => {
    if (!smartInput.trim()) return;

    setIsProcessing(true);
    try {
      // Use citation.js to parse the input
      const parsed = await parseInput(smartInput.trim());

      if (parsed.length > 0) {
        // Add all parsed references
        parsed.forEach(ref => addReference(ref));
        showToast(
          parsed.length === 1
            ? 'Reference added successfully'
            : `${parsed.length} references added successfully`,
          'success'
        );
        resetForm();
        smartInputRef.current?.focus();
      } else {
        showToast('Could not parse citation data', 'error');
      }
    } catch (error) {
      console.error('Parse error:', error);
      showToast('Failed to parse input. Try manual entry instead.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    const ref: Partial<CSLReference> = {
      type,
      title: title.trim(),
    };

    // Parse authors (simplified - split by comma or "and")
    if (authors.trim()) {
      const authorList = authors
        .split(/,| and /i)
        .map(name => {
          const parts = name.trim().split(' ');
          if (parts.length >= 2) {
            return {
              given: parts.slice(0, -1).join(' '),
              family: parts[parts.length - 1],
            };
          }
          return { literal: name.trim() };
        });
      ref.author = authorList;
    }

    // Parse year
    if (year.trim()) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        ref.issued = { 'date-parts': [[yearNum]] };
      }
    }

    // Add description/note if present
    if (description.trim()) {
      ref.note = description.trim();
    }

    addReference(ref);
    showToast('Reference added successfully', 'success');
    resetForm();
    titleInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (manualEntry) {
        handleManualAdd();
      } else {
        handleSmartAdd();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      resetForm();
    }
  };

  const inputTypeHint = smartInput.trim() ? getInputTypeHint(smartInput) : null;
  const isValidInput = smartInput.trim() ? isValidCitationInput(smartInput) : false;
  const hasManualContent = title.trim() || authors.trim() || year.trim() || description.trim();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Add Reference</h3>

        {/* Toggle between Smart and Manual */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setManualEntry(false)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              !manualEntry
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AutoAwesomeIcon className="text-sm mr-1" />
            Smart Import
          </button>
          <button
            onClick={() => setManualEntry(true)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              manualEntry
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AddIcon className="text-sm mr-1" />
            Manual Entry
          </button>
        </div>
      </div>

      {!manualEntry ? (
        // Smart Import Mode
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              DOI, URL, BibTeX, or PubMed ID
            </label>
            <textarea
              ref={smartInputRef}
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste DOI (10.1234/example), URL, BibTeX entry, or PubMed ID..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            {inputTypeHint && (
              <p className={`text-xs mt-1 ${isValidInput ? 'text-green-600' : 'text-orange-600'}`}>
                Detected: {inputTypeHint}
              </p>
            )}
          </div>

          <button
            onClick={handleSmartAdd}
            disabled={!smartInput.trim() || isProcessing}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isProcessing ? 'Processing...' : 'Import Reference'}
          </button>

          {smartInput.trim() && (
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
              </kbd> to add
            </p>
          )}
        </div>
      ) : (
        // Manual Entry Mode
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter reference title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Authors
            </label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., John Doe, Jane Smith"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="2024"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CSLReference['type'])}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="article-journal">Journal Article</option>
                <option value="book">Book</option>
                <option value="chapter">Book Chapter</option>
                <option value="paper-conference">Conference Paper</option>
                <option value="thesis">Thesis</option>
                <option value="report">Report</option>
                <option value="webpage">Web Page</option>
                <option value="article-newspaper">Newspaper Article</option>
                <option value="interview">Interview</option>
                <option value="no-type">Other</option>
              </select>
            </div>
          </div>

          {/* Description/Note */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Additional information about this reference..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleManualAdd}
            disabled={!title.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Reference
          </button>

          {hasManualContent && (
            <p className="text-xs text-gray-500">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
              </kbd> to add
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default QuickAddReferenceForm;
