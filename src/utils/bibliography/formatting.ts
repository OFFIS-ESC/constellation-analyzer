// @ts-expect-error - citation.js doesn't have TypeScript definitions
import { Cite } from '@citation-js/core';
import type { CSLReference } from '../../types/bibliography';

/**
 * Format a single reference using citation.js
 */
export const formatReference = (
  ref: CSLReference,
  style: string = 'apa',
  format: 'html' | 'text' = 'text'
): string => {
  try {
    const cite = new Cite(ref);
    return cite.format('bibliography', {
      format,
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Formatting error:', error);
    return `[Error formatting reference: ${ref.title}]`;
  }
};

/**
 * Format short citation for lists (Author, Year)
 * Uses citation.js citation format
 */
export const formatShortCitation = (
  ref: CSLReference,
  style: string = 'apa'
): string => {
  try {
    const cite = new Cite(ref);
    // Use citation format (in-text) instead of bibliography
    return cite.format('citation', {
      format: 'text',
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    // Fallback to simple format
    const author = ref.author?.[0];
    const authorStr = author?.family || author?.literal || 'Unknown';
    const year = ref.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
    return `${authorStr} (${year})`;
  }
};

/**
 * Format full bibliography for multiple references
 */
export const formatBibliography = (
  refs: CSLReference[],
  style: string = 'apa',
  format: 'html' | 'text' = 'html'
): string => {
  try {
    const cite = new Cite(refs);
    return cite.format('bibliography', {
      format,
      template: style,
      lang: 'en-US',
    });
  } catch (error) {
    console.error('Bibliography formatting error:', error);
    return '[Error formatting bibliography]';
  }
};

/**
 * Get list of available citation styles
 * Citation.js supports 10,000+ styles via CSL
 */
export const getAvailableStyles = (): Array<{ id: string; label: string }> => {
  // Common styles for social sciences
  return [
    { id: 'apa', label: 'APA 7th Edition' },
    { id: 'chicago-author-date', label: 'Chicago Author-Date' },
    { id: 'chicago-note-bibliography', label: 'Chicago Notes' },
    { id: 'mla', label: 'MLA 9th Edition' },
    { id: 'harvard1', label: 'Harvard' },
    { id: 'vancouver', label: 'Vancouver' },
    { id: 'american-sociological-association', label: 'ASA' },
    { id: 'american-political-science-association', label: 'APSA' },
  ];
};
