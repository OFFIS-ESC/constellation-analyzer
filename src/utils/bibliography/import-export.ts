// @ts-expect-error - citation.js doesn't have TypeScript definitions
import { Cite } from '@citation-js/core';
import type { CSLReference } from '../../types/bibliography';

/**
 * Import from various formats using citation.js
 */
export const importFromFile = async (
  content: string,
  format: 'bibtex' | 'ris' | 'json'
): Promise<CSLReference[]> => {
  try {
    const cite = await Cite.async(content);
    return cite.data as CSLReference[];
  } catch (error) {
    throw new Error(`Failed to import ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export to various formats using citation.js
 */
export const exportToFormat = (
  refs: CSLReference[],
  format: 'bibtex' | 'ris' | 'json'
): string => {
  try {
    const cite = new Cite(refs);

    switch (format) {
      case 'bibtex':
        return cite.format('bibtex');
      case 'ris':
        return cite.format('ris');
      case 'json':
        return JSON.stringify(cite.data, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Failed to export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export formatted bibliography as HTML
 */
export const exportFormattedBibliography = (
  refs: CSLReference[],
  style: string = 'apa'
): string => {
  try {
    const cite = new Cite(refs);
    const bibliography = cite.format('bibliography', {
      format: 'html',
      template: style,
      lang: 'en-US',
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bibliography</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      max-width: 800px;
      margin: 2em auto;
      line-height: 1.6;
    }
    h1 { text-align: center; }
    .csl-entry {
      margin-bottom: 1em;
      padding-left: 2em;
      text-indent: -2em;
    }
  </style>
</head>
<body>
  <h1>Bibliography</h1>
  ${bibliography}
</body>
</html>`;
  } catch (error) {
    throw new Error(`Failed to generate HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Detect format of input string
 */
export const detectFormat = (content: string): 'bibtex' | 'ris' | 'json' | 'unknown' => {
  const trimmed = content.trim();

  if (trimmed.startsWith('@')) return 'bibtex';
  if (trimmed.startsWith('TY  -')) return 'ris';
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      return 'unknown';
    }
  }

  return 'unknown';
};
