// @ts-expect-error - citation.js doesn't have TypeScript definitions
import { Cite } from '@citation-js/core';
import type { CSLReference } from '../../types/bibliography';

/**
 * Parse any citation input using citation.js
 * Handles: DOI, URL, BibTeX, RIS, ISBN, PubMed ID, etc.
 */
export const parseSmartInput = async (input: string): Promise<CSLReference[]> => {
  try {
    const cite = await Cite.async(input);
    return cite.data as CSLReference[];
  } catch (error) {
    throw new Error(`Could not parse input: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if input looks like it can be parsed
 */
export const isValidCitationInput = (input: string): boolean => {
  const trimmed = input.trim();

  // DOI patterns
  if (/^(https?:\/\/)?(dx\.)?doi\.org\/10\.\d{4,}/i.test(trimmed)) return true;
  if (/^10\.\d{4,}\/.+/.test(trimmed)) return true;

  // URL patterns
  if (/^https?:\/\/.+/.test(trimmed)) return true;

  // BibTeX patterns
  if (/^@\w+\{/.test(trimmed)) return true;

  // PubMed ID
  if (/^PMID:\s*\d+/i.test(trimmed)) return true;

  // ISBN
  if (/^ISBN[:\s]*[\d-]+/i.test(trimmed)) return true;

  return false;
};

/**
 * Get input type hint for user
 */
export const getInputTypeHint = (input: string): string => {
  const trimmed = input.trim();

  if (/^10\.\d{4,}\//.test(trimmed)) return 'DOI';
  if (/^https?:\/\//.test(trimmed)) return 'URL';
  if (/^@\w+\{/.test(trimmed)) return 'BibTeX';
  if (/^PMID:/i.test(trimmed)) return 'PubMed ID';
  if (/^ISBN/i.test(trimmed)) return 'ISBN';

  return 'Unknown';
};
