import { useRef, useState, type ReactNode } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import TitleIcon from '@mui/icons-material/Title';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import MarkdownContent from './MarkdownContent';
import { applyMarkdownFormat, type MarkdownFormat } from '../../utils/markdown';

const FORMATS: { format: MarkdownFormat; title: string; icon: ReactNode }[] = [
  { format: 'bold', title: 'Bold', icon: <FormatBoldIcon sx={{ fontSize: 16 }} /> },
  { format: 'italic', title: 'Italic', icon: <FormatItalicIcon sx={{ fontSize: 16 }} /> },
  { format: 'heading', title: 'Heading', icon: <TitleIcon sx={{ fontSize: 16 }} /> },
  { format: 'quote', title: 'Quote', icon: <FormatQuoteIcon sx={{ fontSize: 16 }} /> },
];

interface MarkdownFieldProps {
  label: string;
  value: string;
  /** Called on every keystroke and toolbar action */
  onChange: (value: string) => void;
  /** Called when the user is done for now: leaving the field, previewing, closing the dialog */
  onCommit: () => void;
  placeholder?: string;
}

/**
 * Multi-line Markdown editor for the properties panels: a textarea with a small
 * format toolbar, a preview, and a larger dialog for long text.
 */
const MarkdownField = ({ label, value, onChange, onCommit, placeholder }: MarkdownFieldProps) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inlineRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (format: MarkdownFormat) => {
    const textarea = isExpanded ? dialogRef.current : inlineRef.current;
    if (!textarea) return;
    const edit = applyMarkdownFormat(value, textarea.selectionStart, textarea.selectionEnd, format);
    onChange(edit.text);
    // After React has written the new value, which would reset the selection.
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    });
  };

  const renderToolbar = (inDialog: boolean) => (
    <div className="flex items-center gap-0.5">
      {!isPreview &&
        FORMATS.map(({ format, title, icon }) => (
          <Tooltip key={format} title={title}>
            {/* preventDefault keeps focus and selection in the textarea */}
            <IconButton
              size="small"
              aria-label={title}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyFormat(format)}
              sx={{ padding: '2px' }}
            >
              {icon}
            </IconButton>
          </Tooltip>
        ))}
      <Tooltip title={isPreview ? 'Edit' : 'Preview'}>
        <IconButton
          size="small"
          aria-label={isPreview ? 'Edit' : 'Preview'}
          onClick={() => {
            if (!isPreview) onCommit();
            setIsPreview(!isPreview);
          }}
          sx={{ padding: '2px' }}
        >
          {isPreview ? <EditIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      {!inDialog && (
        <Tooltip title="Open larger editor">
          <IconButton
            size="small"
            aria-label="Open larger editor"
            onClick={() => setIsExpanded(true)}
            sx={{ padding: '2px' }}
          >
            <OpenInFullIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );

  const renderBody = (rows: number, ref: React.RefObject<HTMLTextAreaElement>) =>
    isPreview ? (
      <div className="w-full px-3 py-2 text-sm border border-gray-200 rounded bg-gray-50 min-h-[4rem] text-gray-800">
        {value.trim() ? <MarkdownContent source={value} /> : <span className="text-gray-400 italic">Nothing to preview</span>}
      </div>
    ) : (
      <textarea
        ref={ref}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onCommit}
        aria-label={label}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    );

  const closeDialog = () => {
    onCommit();
    setIsExpanded(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-700">{label}</label>
        {renderToolbar(false)}
      </div>
      {renderBody(5, inlineRef)}

      <Dialog open={isExpanded} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem' }}>
          <div className="flex items-center justify-between">
            <span>{label}</span>
            {renderToolbar(true)}
          </div>
        </DialogTitle>
        <DialogContent>{renderBody(20, dialogRef)}</DialogContent>
        <DialogActions>
          <button
            onClick={closeDialog}
            className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Done
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MarkdownField;
