import { useState, useEffect, KeyboardEvent } from 'react';
import { useBibliographyStore } from '../../stores/bibliographyStore';
import { useBibliographyWithHistory } from '../../hooks/useBibliographyWithHistory';
import { useToastStore } from '../../stores/toastStore';
import type { CSLReference } from '../../types/bibliography';

interface EditReferenceInlineProps {
  referenceId: string;
  onCancel: () => void;
}

const EditReferenceInline = ({ referenceId, onCancel }: EditReferenceInlineProps) => {
  const { getReferenceById } = useBibliographyStore();
  const { updateReference } = useBibliographyWithHistory();
  const { showToast } = useToastStore();

  const reference = getReferenceById(referenceId);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CSLReference['type']>('article-journal');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [journal, setJournal] = useState('');
  const [volume, setVolume] = useState('');
  const [issue, setIssue] = useState('');
  const [pages, setPages] = useState('');
  const [doi, setDoi] = useState('');
  const [url, setUrl] = useState('');
  const [abstract, setAbstract] = useState('');
  const [note, setNote] = useState('');

  // Load reference data
  useEffect(() => {
    if (reference) {
      setTitle(reference.title || '');
      setType(reference.type || 'article-journal');

      // Parse authors
      if (reference.author) {
        const authorStr = reference.author
          .map(a => {
            if (a.literal) return a.literal;
            return [a.given, a.family].filter(Boolean).join(' ');
          })
          .join(', ');
        setAuthors(authorStr);
      }

      // Parse year
      if (reference.issued?.['date-parts']?.[0]?.[0]) {
        setYear(reference.issued['date-parts'][0][0].toString());
      }

      setJournal(reference['container-title'] || '');
      setVolume(reference.volume?.toString() || '');
      setIssue(reference.issue?.toString() || '');
      setPages(reference.page || '');
      setDoi(reference.DOI || '');
      setUrl(reference.URL || '');
      setAbstract(reference.abstract || '');
      setNote(reference.note || '');
    }
  }, [reference]);

  const handleSave = () => {
    if (!title.trim()) {
      showToast('Title is required', 'error');
      return;
    }

    const updates: Partial<CSLReference> = {
      title: title.trim(),
      type,
    };

    // Parse authors
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
      updates.author = authorList;
    }

    // Parse year
    if (year.trim()) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        updates.issued = { 'date-parts': [[yearNum]] };
      }
    }

    // Add other fields if present
    if (journal.trim()) updates['container-title'] = journal.trim();
    if (volume.trim()) updates.volume = volume.trim();
    if (issue.trim()) updates.issue = issue.trim();
    if (pages.trim()) updates.page = pages.trim();
    if (doi.trim()) updates.DOI = doi.trim();
    if (url.trim()) updates.URL = url.trim();
    if (abstract.trim()) updates.abstract = abstract.trim();
    if (note.trim()) updates.note = note.trim();

    updateReference(referenceId, updates);
    showToast('Reference updated successfully', 'success');
    onCancel();
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

  if (!reference) {
    return (
      <div className="w-full p-6 text-center text-gray-500">
        Reference not found
      </div>
    );
  }

  const isMac = navigator.platform.includes('Mac');

  return (
    <div className="w-full p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col min-h-full">
          <div className="flex-1 mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Reference</h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
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

            {/* Authors */}
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

            {/* Year, Volume, Issue, Pages */}
            <div className="grid grid-cols-4 gap-3">
              <div>
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Volume
                </label>
                <input
                  type="text"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="42"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Issue
                </label>
                <input
                  type="text"
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Pages
                </label>
                <input
                  type="text"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="123-145"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Journal/Container Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Journal / Publication
              </label>
              <input
                type="text"
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Journal of Example Studies"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* DOI and URL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  DOI
                </label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="10.1234/example"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Abstract */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Abstract
              </label>
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Brief summary of the work..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Description/Note */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description / Notes
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Additional information about this reference..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-gray-200 space-y-3">
            <button
              onClick={handleSave}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>

            <button
              onClick={onCancel}
              className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>

            <p className="text-xs text-center text-gray-500">
              Press{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                {isMac ? '⌘' : 'Ctrl'}+Enter
              </kbd>{' '}
              to save,{' '}
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Esc
              </kbd>{' '}
              to cancel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditReferenceInline;
