/**
 * Bibliography Types
 *
 * Type definitions for the bibliography/reference management system.
 * Based on CSL-JSON format (Citation Style Language) for compatibility with citation.js
 */

// Standard CSL-JSON reference types
export type ReferenceType =
  | 'article-journal'
  | 'article-magazine'
  | 'article-newspaper'
  | 'book'
  | 'chapter'
  | 'paper-conference'
  | 'report'
  | 'thesis'
  | 'webpage'
  | 'interview'
  | 'manuscript'
  | 'personal_communication'
  | 'entry-encyclopedia'
  | 'entry-dictionary';

/**
 * Standard CSL-JSON reference structure
 * This is what citation.js expects and produces
 */
export interface CSLReference {
  id: string;
  type: ReferenceType;
  title?: string;
  author?: Array<{ family?: string; given?: string; literal?: string }>;
  issued?: { 'date-parts': [[number, number?, number?]] };
  'container-title'?: string;
  publisher?: string;
  'publisher-place'?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  DOI?: string;
  ISBN?: string;
  ISSN?: string;
  URL?: string;
  PMID?: string;
  abstract?: string;
  note?: string;
  keyword?: string;
  accessed?: { 'date-parts': [[number, number?, number?]] };
  interviewer?: Array<{ family?: string; given?: string; literal?: string }>;
  interviewee?: Array<{ family?: string; given?: string; literal?: string }>;
  'container-author'?: Array<{ family?: string; given?: string; literal?: string }>;
  'collection-title'?: string;
  edition?: string | number;
  genre?: string;
  // CSL-JSON is extensible - allow additional fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * App-specific metadata (NOT part of CSL-JSON)
 * Stored separately from the Cite instance
 */
export interface ReferenceAppMetadata {
  id: string;  // Matches CSL reference ID
  tags?: string[];
  favorite?: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Combined reference for UI display
 * Merges CSL data + app metadata
 */
export interface BibliographyReference extends CSLReference {
  _app?: ReferenceAppMetadata;
}

/**
 * Bibliography settings per document
 */
export interface BibliographySettings {
  defaultStyle: string;  // CSL style ID (e.g., "apa", "chicago")
  sortOrder: 'author' | 'year' | 'title';
}

/**
 * Complete bibliography data structure for persistence
 */
export interface Bibliography {
  // CSL-JSON array (can be loaded directly into Cite)
  references: CSLReference[];
  // App-specific metadata (stored separately)
  metadata: Record<string, ReferenceAppMetadata>;
  // Settings
  settings: BibliographySettings;
}
