/**
 * Helpers for the Markdown used in actor and relation descriptions.
 *
 * Descriptions hold interview quotes, so rendering must never quietly change
 * the words. The stored text is always the source as typed.
 */

// A star between two letters or digits is German gender notation (Kolleg*innen),
// not emphasis. Markdown would otherwise pair two of them and swallow the stars.
const INTRAWORD_ASTERISK = /(?<=[\p{L}\p{N}])\*(?=[\p{L}\p{N}])/gu;

/** Prepares description source for the Markdown parser. */
export function prepareMarkdown(source: string): string {
  return source.replace(INTRAWORD_ASTERISK, '\\*');
}

export type MarkdownFormat = 'bold' | 'italic' | 'heading' | 'quote';

export interface MarkdownEdit {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

const INLINE_MARKERS: Partial<Record<MarkdownFormat, string>> = { bold: '**', italic: '*' };
const LINE_PREFIXES: Partial<Record<MarkdownFormat, string>> = { heading: '## ', quote: '> ' };

/**
 * Applies a toolbar format to the selected text: wraps it for bold and italic,
 * prefixes every touched line for headings and quotes. Applying the same format
 * again removes it.
 */
export function applyMarkdownFormat(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: MarkdownFormat,
): MarkdownEdit {
  const marker = INLINE_MARKERS[format];
  if (marker) {
    const selected = text.slice(selectionStart, selectionEnd);
    const before = text.slice(selectionStart - marker.length, selectionStart);
    const after = text.slice(selectionEnd, selectionEnd + marker.length);
    // `*` is also part of `**`, so italic only unwraps a marker of exactly its size.
    const isWrapped =
      before === marker &&
      after === marker &&
      (format !== 'italic' ||
        (text[selectionStart - marker.length - 1] !== '*' && text[selectionEnd + marker.length] !== '*'));

    if (isWrapped) {
      return {
        text: text.slice(0, selectionStart - marker.length) + selected + text.slice(selectionEnd + marker.length),
        selectionStart: selectionStart - marker.length,
        selectionEnd: selectionEnd - marker.length,
      };
    }
    return {
      text: text.slice(0, selectionStart) + marker + selected + marker + text.slice(selectionEnd),
      selectionStart: selectionStart + marker.length,
      selectionEnd: selectionEnd + marker.length,
    };
  }

  const prefix = LINE_PREFIXES[format] as string;
  const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
  // A selection ending right after a line break does not touch the next line.
  const lastTouched = selectionEnd > selectionStart && text[selectionEnd - 1] === '\n' ? selectionEnd - 1 : selectionEnd;
  const nextBreak = text.indexOf('\n', lastTouched);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;

  const lines = text.slice(lineStart, lineEnd).split('\n');
  const contentLines = lines.filter((line) => line.trim() !== '');
  const isApplied = contentLines.length > 0 && contentLines.every((line) => line.startsWith(prefix));
  const replaced = lines
    .map((line) => {
      if (isApplied) return line.startsWith(prefix) ? line.slice(prefix.length) : line;
      return line.trim() === '' && lines.length > 1 ? line : prefix + line;
    })
    .join('\n');

  const firstLineShift = isApplied ? -prefix.length : prefix.length;
  const newStart = Math.max(lineStart, selectionStart + firstLineShift);
  return {
    text: text.slice(0, lineStart) + replaced + text.slice(lineEnd),
    selectionStart: newStart,
    selectionEnd: Math.max(newStart, selectionEnd + (replaced.length - (lineEnd - lineStart))),
  };
}
